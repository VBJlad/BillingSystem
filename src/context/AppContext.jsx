import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  INITIAL_ADMIN,
  INITIAL_SETTINGS,
  INITIAL_LOCATIONS,
  INITIAL_PLANS,
  INITIAL_CUSTOMERS,
  INITIAL_BILLS,
  INITIAL_PAYMENT_LOGS,
  INITIAL_ISSUES,
  INITIAL_ISSUE_AFFECTED,
} from '../data/mockData';
import { createLocationRecord, updateLocationRecord } from '../services/locationService';
import { createCustomerRecord, updateCustomerRecord } from '../services/customerService';
import {
  createMonthlyBillRecord,
  previewMonthlyBillGeneration,
  createPaymentLogRecord,
} from '../services/billingService';
import { createIssueRecord, buildAffectedCustomerRecords } from '../services/issueService';
import { createPlanRecord, updatePlanRecord } from '../services/planService';

const STORAGE_KEY = 'isp_billing_cms_state_v2';
const AUTH_KEY = 'isp_billing_cms_auth_v2';

function getInitialState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.locations && parsed.customers && parsed.bills) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seed data
  }
  return {
    admin: INITIAL_ADMIN,
    settings: INITIAL_SETTINGS,
    locations: INITIAL_LOCATIONS,
    plans: INITIAL_PLANS,
    customers: INITIAL_CUSTOMERS,
    bills: INITIAL_BILLS,
    paymentLogs: INITIAL_PAYMENT_LOGS,
    issues: INITIAL_ISSUES,
    issueAffected: INITIAL_ISSUE_AFFECTED,
  };
}

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [state, setState] = useState(getInitialState);
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try {
      return localStorage.getItem(AUTH_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors
    }
  }, [state]);

  const addToast = useCallback((message, type = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Auth
  const login = useCallback(
    (username, password) => {
      const match =
        username.trim().toLowerCase() === state.admin.username.toLowerCase() &&
        password === state.admin.password_hash;
      if (match) {
        setIsAuthenticated(true);
        try {
          localStorage.setItem(AUTH_KEY, 'true');
        } catch {
          // ignore
        }
        addToast(`Welcome back, ${state.admin.full_name || state.admin.username}!`, 'success');
        return { success: true };
      }
      return { success: false, error: 'Invalid administrator username or password.' };
    },
    [state.admin, addToast]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    try {
      localStorage.removeItem(AUTH_KEY);
    } catch {
      // ignore
    }
    addToast('Signed out of administrator session.', 'info');
  }, [addToast]);

  // Locations
  const addLocation = useCallback(
    (payload) => {
      const newLoc = createLocationRecord(state.locations, payload);
      setState((prev) => ({ ...prev, locations: [...prev.locations, newLoc] }));
      addToast(`Location "${newLoc.location_name}" added.`, 'success');
      return newLoc;
    },
    [state.locations, addToast]
  );

  const editLocation = useCallback(
    (locationId, updates) => {
      setState((prev) => ({
        ...prev,
        locations: updateLocationRecord(prev.locations, locationId, updates),
      }));
      addToast('Location updated successfully.', 'success');
    },
    [addToast]
  );

  const toggleLocationStatus = useCallback(
    (locationId) => {
      const loc = state.locations.find((l) => l.location_id === locationId);
      if (!loc) return;
      const nextStatus = loc.status === 'Active' ? 'Inactive' : 'Active';
      setState((prev) => ({
        ...prev,
        locations: updateLocationRecord(prev.locations, locationId, { status: nextStatus }),
      }));
      addToast(
        `Location "${loc.location_name}" ${nextStatus === 'Inactive' ? 'archived' : 'reactivated'}.`,
        'info'
      );
    },
    [state.locations, addToast]
  );

  // Plans
  const addPlan = useCallback(
    (payload) => {
      const newPlan = createPlanRecord(state.plans, payload);
      setState((prev) => ({ ...prev, plans: [...prev.plans, newPlan] }));
      addToast(`Internet plan "${newPlan.plan_name}" created.`, 'success');
      return newPlan;
    },
    [state.plans, addToast]
  );

  const editPlan = useCallback(
    (planId, updates) => {
      setState((prev) => ({
        ...prev,
        plans: updatePlanRecord(prev.plans, planId, updates),
      }));
      addToast('Internet plan updated. Historical bills retain original amounts.', 'success');
    },
    [addToast]
  );

  const togglePlanStatus = useCallback(
    (planId) => {
      const plan = state.plans.find((p) => p.plan_id === planId);
      if (!plan) return;
      const nextStatus = plan.status === 'Active' ? 'Inactive' : 'Active';
      setState((prev) => ({
        ...prev,
        plans: updatePlanRecord(prev.plans, planId, { status: nextStatus }),
      }));
      addToast(
        `Plan "${plan.plan_name}" ${nextStatus === 'Inactive' ? 'archived' : 'reactivated'}.`,
        'info'
      );
    },
    [state.plans, addToast]
  );

  // Customers
  const addCustomer = useCallback(
    (payload, { generateFirstBill = false, firstBillMonth = null } = {}) => {
      const newCustomer = createCustomerRecord(state.customers, payload);
      setState((prev) => {
        let nextBills = prev.bills;
        if (generateFirstBill && firstBillMonth && newCustomer.account_status === 'Active') {
          const firstBill = createMonthlyBillRecord(newCustomer, firstBillMonth, prev.bills);
          if (firstBill) {
            nextBills = [firstBill, ...prev.bills];
          }
        }
        return {
          ...prev,
          customers: [newCustomer, ...prev.customers],
          bills: nextBills,
        };
      });
      addToast(`Customer "${newCustomer.full_name}" (${newCustomer.customer_id}) registered.`, 'success');
      return newCustomer;
    },
    [state.customers, addToast]
  );

  const editCustomer = useCallback(
    (customerId, updates) => {
      setState((prev) => ({
        ...prev,
        customers: updateCustomerRecord(prev.customers, customerId, updates),
      }));
      addToast('Customer information updated.', 'success');
    },
    [addToast]
  );

  const transferCustomerLocation = useCallback(
    (customerId, newLocationId) => {
      const loc = state.locations.find((l) => l.location_id === newLocationId);
      setState((prev) => ({
        ...prev,
        customers: updateCustomerRecord(prev.customers, customerId, {
          location_id: newLocationId,
        }),
      }));
      addToast(
        `Customer transferred to ${loc ? loc.location_name : 'new location'}. Billing history preserved.`,
        'success'
      );
    },
    [state.locations, addToast]
  );

  const changeCustomerPlan = useCallback(
    (customerId, newPlanId, newMonthlyRate) => {
      const plan = state.plans.find((p) => p.plan_id === newPlanId);
      setState((prev) => ({
        ...prev,
        customers: updateCustomerRecord(prev.customers, customerId, {
          plan_id: newPlanId,
          monthly_rate: Number(newMonthlyRate ?? plan?.monthly_price ?? 0),
        }),
      }));
      addToast(
        `Subscription changed to ${plan ? plan.plan_name : 'new plan'}. Past bills remain unchanged.`,
        'success'
      );
    },
    [state.plans, addToast]
  );

  const updateCustomerConnectionStatus = useCallback(
    (customerId, connectionStatus) => {
      setState((prev) => ({
        ...prev,
        customers: updateCustomerRecord(prev.customers, customerId, {
          connection_status: connectionStatus,
        }),
      }));
      addToast(`Connection status updated to ${connectionStatus}.`, 'info');
    },
    [addToast]
  );

  const toggleCustomerAccountStatus = useCallback(
    (customerId) => {
      const customer = state.customers.find((c) => c.customer_id === customerId);
      if (!customer) return;
      const nextStatus = customer.account_status === 'Active' ? 'Inactive' : 'Active';
      setState((prev) => ({
        ...prev,
        customers: updateCustomerRecord(prev.customers, customerId, {
          account_status: nextStatus,
        }),
      }));
      addToast(
        `Customer "${customer.full_name}" ${
          nextStatus === 'Inactive' ? 'archived (billing history retained)' : 'reactivated'
        }.`,
        'info'
      );
    },
    [state.customers, addToast]
  );

  // Billing
  const generateMonthlyBills = useCallback(
    (billingMonthStr) => {
      const preview = previewMonthlyBillGeneration(state.customers, state.bills, billingMonthStr);
      if (preview.eligible.length === 0) {
        addToast('No new bills to generate for this billing period (duplicates skipped).', 'info');
        return 0;
      }
      setState((prev) => {
        const created = [];
        for (const customer of preview.eligible) {
          const bill = createMonthlyBillRecord(customer, billingMonthStr, [
            ...prev.bills,
            ...created,
          ]);
          if (bill) created.push(bill);
        }
        return {
          ...prev,
          bills: [...created, ...prev.bills],
        };
      });
      addToast(`Generated ${preview.eligible.length} monthly bill(s).`, 'success');
      return preview.eligible.length;
    },
    [state.customers, state.bills, addToast]
  );

  const updateBillPaymentStatus = useCallback(
    (billId, { newStatus, datePaid = null, remarks = '' }) => {
      const targetBill = state.bills.find((b) => b.bill_id === billId);
      if (!targetBill) return;
      const now = new Date().toISOString();

      setState((prev) => {
        const updatedBills = prev.bills.map((b) =>
          b.bill_id === billId
            ? {
                ...b,
                payment_status: newStatus,
                date_paid: newStatus === 'Paid' ? datePaid : null,
                updated_at: now,
              }
            : b
        );
        const logEntry = createPaymentLogRecord(prev.paymentLogs, {
          bill_id: billId,
          admin_id: prev.admin.admin_id,
          previous_status: targetBill.payment_status,
          new_status: newStatus,
          remarks,
        });
        return {
          ...prev,
          bills: updatedBills,
          paymentLogs: [logEntry, ...prev.paymentLogs],
        };
      });
      addToast(
        newStatus === 'Paid'
          ? `Bill marked as Paid (${datePaid}). Audit log saved.`
          : 'Bill reverted to Unpaid. Payment history preserved.',
        newStatus === 'Paid' ? 'success' : 'info'
      );
    },
    [state.bills, addToast]
  );

  // Connection Issues
  const addConnectionIssue = useCallback(
    (payload, affectedCustomerIds = [], markCustomersAsIssue = true) => {
      const newIssue = createIssueRecord(state.issues, payload);
      setState((prev) => {
        const affectedRecords = buildAffectedCustomerRecords(
          prev.issueAffected,
          newIssue.issue_id,
          affectedCustomerIds
        );
        const affectedSet = new Set(affectedCustomerIds);
        const updatedCustomers = markCustomersAsIssue
          ? prev.customers.map((c) =>
              affectedSet.has(c.customer_id)
                ? { ...c, connection_status: 'Issue', updated_at: new Date().toISOString() }
                : c
            )
          : prev.customers;

        return {
          ...prev,
          issues: [newIssue, ...prev.issues],
          issueAffected: [...prev.issueAffected, ...affectedRecords],
          customers: updatedCustomers,
        };
      });
      addToast(`Connection issue "${newIssue.issue_title}" logged.`, 'success');
      return newIssue;
    },
    [state.issues, addToast]
  );

  const editConnectionIssue = useCallback(
    (issueId, updates) => {
      setState((prev) => ({
        ...prev,
        issues: prev.issues.map((i) =>
          i.issue_id === issueId
            ? {
                ...i,
                ...updates,
                issue_title: (updates.issue_title ?? i.issue_title).trim(),
                description: (updates.description ?? i.description).trim(),
                remarks: (updates.remarks ?? i.remarks).trim(),
              }
            : i
        ),
      }));
      addToast('Connection issue updated.', 'success');
    },
    [addToast]
  );

  const setIssueAffectedCustomers = useCallback(
    (issueId, customerIds, syncConnectionStatus = true) => {
      setState((prev) => {
        const previousIds = prev.issueAffected
          .filter((a) => a.issue_id === issueId)
          .map((a) => a.customer_id);
        const remainingOtherIssues = prev.issueAffected.filter((a) => a.issue_id !== issueId);
        const newRecords = buildAffectedCustomerRecords(
          remainingOtherIssues,
          issueId,
          customerIds
        );

        let updatedCustomers = prev.customers;
        if (syncConnectionStatus) {
          const nextSet = new Set(customerIds);
          const removedIds = previousIds.filter((id) => !nextSet.has(id));
          const now = new Date().toISOString();

          updatedCustomers = prev.customers.map((c) => {
            if (nextSet.has(c.customer_id) && c.connection_status !== 'Issue') {
              return { ...c, connection_status: 'Issue', updated_at: now };
            }
            if (removedIds.includes(c.customer_id) && c.connection_status === 'Issue') {
              // Check if still affected by any OTHER ongoing issue
              const otherOngoing = prev.issues.some(
                (iss) =>
                  iss.issue_id !== issueId &&
                  iss.issue_status === 'Ongoing' &&
                  remainingOtherIssues.some(
                    (a) => a.issue_id === iss.issue_id && a.customer_id === c.customer_id
                  )
              );
              if (!otherOngoing) {
                return { ...c, connection_status: 'Connected', updated_at: now };
              }
            }
            return c;
          });
        }

        return {
          ...prev,
          issueAffected: [...remainingOtherIssues, ...newRecords],
          customers: updatedCustomers,
        };
      });
      addToast('Affected customer list updated.', 'success');
    },
    [addToast]
  );

  const resolveConnectionIssue = useCallback(
    (issueId, { remarks, restoreCustomerStatus = true } = {}) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const updatedIssues = prev.issues.map((i) =>
          i.issue_id === issueId
            ? {
                ...i,
                issue_status: 'Resolved',
                resolved_at: now,
                remarks: remarks !== undefined ? remarks.trim() : i.remarks,
              }
            : i
        );

        let updatedCustomers = prev.customers;
        if (restoreCustomerStatus) {
          const affectedIds = new Set(
            prev.issueAffected.filter((a) => a.issue_id === issueId).map((a) => a.customer_id)
          );
          const otherOngoingIds = new Set(
            updatedIssues.filter((i) => i.issue_status === 'Ongoing').map((i) => i.issue_id)
          );
          updatedCustomers = prev.customers.map((c) => {
            if (!affectedIds.has(c.customer_id) || c.connection_status !== 'Issue') return c;
            const stillInAnotherIssue = prev.issueAffected.some(
              (a) => a.customer_id === c.customer_id && otherOngoingIds.has(a.issue_id)
            );
            return stillInAnotherIssue
              ? c
              : { ...c, connection_status: 'Connected', updated_at: now };
          });
        }

        return {
          ...prev,
          issues: updatedIssues,
          customers: updatedCustomers,
        };
      });
      addToast('Connection issue marked as Resolved. History retained.', 'success');
    },
    [addToast]
  );

  const reopenConnectionIssue = useCallback(
    (issueId) => {
      setState((prev) => ({
        ...prev,
        issues: prev.issues.map((i) =>
          i.issue_id === issueId ? { ...i, issue_status: 'Ongoing', resolved_at: null } : i
        ),
      }));
      addToast('Connection issue reopened as Ongoing.', 'info');
    },
    [addToast]
  );

  // Settings & Admin
  const updateAdminAccount = useCallback(
    (updates) => {
      setState((prev) => ({
        ...prev,
        admin: {
          ...prev.admin,
          ...updates,
        },
      }));
      addToast('Administrator account settings saved.', 'success');
    },
    [addToast]
  );

  const updateSystemSettings = useCallback(
    (updates) => {
      setState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...updates,
        },
      }));
      addToast('System preferences saved.', 'success');
    },
    [addToast]
  );

  const resetDemoData = useCallback(() => {
    const fresh = {
      admin: INITIAL_ADMIN,
      settings: INITIAL_SETTINGS,
      locations: INITIAL_LOCATIONS,
      plans: INITIAL_PLANS,
      customers: INITIAL_CUSTOMERS,
      bills: INITIAL_BILLS,
      paymentLogs: INITIAL_PAYMENT_LOGS,
      issues: INITIAL_ISSUES,
      issueAffected: INITIAL_ISSUE_AFFECTED,
    };
    setState(fresh);
    addToast('Demo dataset has been restored to defaults.', 'info');
  }, [addToast]);

  const value = {
    ...state,
    isAuthenticated,
    toasts,
    addToast,
    dismissToast,
    login,
    logout,
    addLocation,
    editLocation,
    toggleLocationStatus,
    addPlan,
    editPlan,
    togglePlanStatus,
    addCustomer,
    editCustomer,
    transferCustomerLocation,
    changeCustomerPlan,
    updateCustomerConnectionStatus,
    toggleCustomerAccountStatus,
    generateMonthlyBills,
    updateBillPaymentStatus,
    addConnectionIssue,
    editConnectionIssue,
    setIssueAffectedCustomers,
    resolveConnectionIssue,
    reopenConnectionIssue,
    updateAdminAccount,
    updateSystemSettings,
    resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
