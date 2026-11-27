import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit3,
  Archive,
  RotateCcw,
  Receipt,
  History,
  ArrowRightLeft,
  Sliders,
  MoreHorizontal,
  LayoutGrid,
  List,
  CheckCircle2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import CustomerDetailsPanel from '../components/customers/CustomerDetails';
import CustomerForm from '../components/customers/CustomerForm';
import BillingCard from '../components/billing/BillingCard';
import PaymentDialog from '../components/billing/PaymentDialog';
import {
  MONTH_NAMES,
  formatBillingMonth,
  formatCurrencyShort,
  formatDate,
  formatDateTime,
  isBillOverdue,
} from '../utils/formatters';

export default function CustomerDetails() {
  const { customerId } = useParams();
  const {
    customers,
    locations,
    plans,
    bills,
    paymentLogs,
    issues,
    issueAffected,
    settings,
    editCustomer,
    transferCustomerLocation,
    changeCustomerPlan,
    updateCustomerConnectionStatus,
    toggleCustomerAccountStatus,
    updateBillPaymentStatus,
  } = useApp();

  const customer = customers.find((c) => c.customer_id === customerId);
  const sym = settings.currency_symbol;

  const [moreOpen, setMoreOpen] = useState(false);
  const moreRef = useRef(null);
  const [editOpen, setEditOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferLocId, setTransferLocId] = useState('');
  const [planOpen, setPlanOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [customRate, setCustomRate] = useState('');
  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [paymentModal, setPaymentModal] = useState({ open: false, bill: null, targetStatus: 'Paid' });

  const [billView, setBillView] = useState('cards'); // cards | table
  const [historyYearFilter, setHistoryYearFilter] = useState('All');
  const [historyMonthFilter, setHistoryMonthFilter] = useState('All');

  useEffect(() => {
    const close = (e) => {
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const customerBills = useMemo(() => {
    return bills
      .filter((b) => b.customer_id === customerId)
      .sort((a, b) => b.billing_month.localeCompare(a.billing_month));
  }, [bills, customerId]);

  const filteredBills = useMemo(() => {
    return customerBills.filter((b) => {
      if (historyYearFilter !== 'All' && !b.billing_month.startsWith(historyYearFilter)) {
        return false;
      }
      if (historyMonthFilter !== 'All') {
        const m = Number(b.billing_month.split('-')[1]);
        if (m !== Number(historyMonthFilter)) return false;
      }
      return true;
    });
  }, [customerBills, historyYearFilter, historyMonthFilter]);

  const billYears = useMemo(() => {
    const set = new Set(customerBills.map((b) => b.billing_month.slice(0, 4)));
    return Array.from(set).sort().reverse();
  }, [customerBills]);

  const customerPaymentLogs = useMemo(() => {
    const billIds = new Set(customerBills.map((b) => b.bill_id));
    const billMap = new Map(customerBills.map((b) => [b.bill_id, b]));
    return paymentLogs
      .filter((log) => billIds.has(log.bill_id))
      .map((log) => ({ ...log, bill: billMap.get(log.bill_id) }))
      .sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  }, [paymentLogs, customerBills]);

  const { ongoingIssues, pastIssues } = useMemo(() => {
    const affectedIssueIds = new Set(
      issueAffected.filter((a) => a.customer_id === customerId).map((a) => a.issue_id)
    );
    const matched = issues.filter((i) => affectedIssueIds.has(i.issue_id));
    return {
      ongoingIssues: matched.filter((i) => i.issue_status === 'Ongoing'),
      pastIssues: matched.filter((i) => i.issue_status === 'Resolved'),
    };
  }, [issues, issueAffected, customerId]);

  if (!customer) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-sm font-semibold text-slate-900">Customer record not found</p>
        <Link
          to="/customers"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to All Customers
        </Link>
      </div>
    );
  }

  const location = locations.find((l) => l.location_id === customer.location_id);
  const plan = plans.find((p) => p.plan_id === customer.plan_id);

  const totalPaid = customerBills
    .filter((b) => b.payment_status === 'Paid')
    .reduce((s, b) => s + Number(b.amount_due), 0);
  const totalUnpaid = customerBills
    .filter((b) => b.payment_status === 'Unpaid')
    .reduce((s, b) => s + Number(b.amount_due), 0);

  const openTransfer = () => {
    setTransferLocId(customer.location_id);
    setTransferOpen(true);
  };

  const openPlanChange = () => {
    setSelectedPlanId(customer.plan_id);
    setCustomRate(String(customer.monthly_rate));
    setPlanOpen(true);
  };

  const handlePlanSelect = (pid) => {
    setSelectedPlanId(pid);
    const p = plans.find((x) => x.plan_id === pid);
    if (p) setCustomRate(String(p.monthly_price));
  };

  return (
    <div className="space-y-6">
      {/* Clean Profile Header */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            to="/customers"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            All Customers
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {customer.full_name}
            </h2>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 font-mono text-xs font-medium text-slate-600">
              {customer.customer_id}
            </span>
            <StatusBadge status={customer.account_status} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-800"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit Customer
          </button>

          {/* More Actions Dropdown */}
          <div ref={moreRef} className="relative">
            <button
              type="button"
              onClick={() => setMoreOpen((v) => !v)}
              aria-label="More actions"
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-50"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {moreOpen && (
              <div className="absolute right-0 z-20 mt-1.5 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    openTransfer();
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5 text-slate-400" />
                  Transfer Location
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    openPlanChange();
                  }}
                  className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Sliders className="h-3.5 w-3.5 text-slate-400" />
                  Change Internet Plan
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMoreOpen(false);
                    setArchiveConfirm(true);
                  }}
                  className="flex w-full items-center gap-2 border-t border-slate-100 px-3.5 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50"
                >
                  {customer.account_status === 'Active' ? (
                    <>
                      <Archive className="h-3.5 w-3.5" />
                      Archive Customer
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Reactivate Customer</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3 Info Cards */}
      <CustomerDetailsPanel
        customer={customer}
        location={location}
        plan={plan}
        ongoingIssues={ongoingIssues}
        pastIssues={pastIssues}
        currencySymbol={sym}
        onTransferLocation={openTransfer}
        onChangePlan={openPlanChange}
        onChangeConnectionStatus={(status) =>
          updateCustomerConnectionStatus(customer.customer_id, status)
        }
      />

      {/* Monthly Billing Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-700" />
              <h3 className="text-sm font-semibold text-slate-900">Monthly Billing</h3>
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Total Paid:{' '}
              <strong className="tabular-nums text-emerald-700">
                {formatCurrencyShort(totalPaid, sym)}
              </strong>{' '}
              · Outstanding:{' '}
              <strong
                className={`tabular-nums ${totalUnpaid > 0 ? 'text-rose-600' : 'text-slate-700'}`}
              >
                {formatCurrencyShort(totalUnpaid, sym)}
              </strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={historyMonthFilter}
              onChange={(e) => setHistoryMonthFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Months</option>
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx + 1}>
                  {m}
                </option>
              ))}
            </select>

            <select
              value={historyYearFilter}
              onChange={(e) => setHistoryYearFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="All">All Years</option>
              {billYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>

            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
              <button
                type="button"
                onClick={() => setBillView('cards')}
                aria-label="Cards view"
                className={`rounded-md p-1.5 ${
                  billView === 'cards' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setBillView('table')}
                aria-label="Table view"
                className={`rounded-md p-1.5 ${
                  billView === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
                }`}
              >
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {filteredBills.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-200 py-10 text-center text-xs text-slate-500">
            No monthly billing records match the selected month/year filter.
          </div>
        ) : billView === 'cards' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredBills.map((bill) => (
              <BillingCard
                key={bill.bill_id}
                bill={bill}
                currencySymbol={sym}
                onAction={(targetBill, targetStatus) =>
                  setPaymentModal({ open: true, bill: targetBill, targetStatus })
                }
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Billing Month</th>
                  <th className="px-3 py-2.5">Amount Due</th>
                  <th className="px-3 py-2.5">Due Date</th>
                  <th className="px-3 py-2.5">Payment Status</th>
                  <th className="px-3 py-2.5">Date Paid</th>
                  <th className="px-3 py-2.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBills.map((bill) => {
                  const overdue = isBillOverdue(bill);
                  const isPaid = bill.payment_status === 'Paid';
                  return (
                    <tr key={bill.bill_id} className="hover:bg-slate-50/70">
                      <td className="px-3 py-3 font-semibold text-slate-900">
                        {formatBillingMonth(bill.billing_month)}
                      </td>
                      <td className="px-3 py-3 tabular-nums font-bold text-slate-900">
                        {formatCurrencyShort(bill.amount_due, sym)}
                      </td>
                      <td className={`px-3 py-3 ${overdue ? 'font-medium text-rose-600' : 'text-slate-600'}`}>
                        {formatDate(bill.due_date)}
                      </td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1.5">
                          {overdue && <StatusBadge status="Overdue" size="xs" />}
                          <StatusBadge status={bill.payment_status} size="xs" />
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-500">
                        {bill.date_paid ? formatDate(bill.date_paid) : 'Not yet paid'}
                      </td>
                      <td className="px-3 py-3 text-right">
                        {isPaid ? (
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentModal({ open: true, bill, targetStatus: 'Unpaid' })
                            }
                            className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-amber-300 hover:bg-amber-50"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Mark as Unpaid
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              setPaymentModal({ open: true, bill, targetStatus: 'Paid' })
                            }
                            className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            Mark as Paid
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Payment History Audit Section */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="mb-4 flex items-center gap-2">
          <History className="h-4 w-4 text-blue-700" />
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Payment History</h3>
            <p className="text-xs text-slate-500">
              Complete audit trail of payment confirmations and status reversions.
            </p>
          </div>
        </div>

        {customerPaymentLogs.length === 0 ? (
          <p className="rounded-lg bg-slate-50 p-6 text-center text-xs text-slate-500">
            No payment status updates logged for this customer yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-xs">
              <thead className="bg-slate-50 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-3 py-2.5">Log ID</th>
                  <th className="px-3 py-2.5">Billing Month</th>
                  <th className="px-3 py-2.5">Status Change</th>
                  <th className="px-3 py-2.5">Timestamp</th>
                  <th className="px-3 py-2.5">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customerPaymentLogs.map((log) => (
                  <tr key={log.log_id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-3 font-mono text-slate-500">{log.log_id}</td>
                    <td className="px-3 py-3 font-semibold text-slate-800">
                      {log.bill ? formatBillingMonth(log.bill.billing_month) : log.bill_id}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        <StatusBadge status={log.previous_status} size="xs" />
                        <span className="text-slate-400">→</span>
                        <StatusBadge status={log.new_status} size="xs" />
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-500">{formatDateTime(log.changed_at)}</td>
                    <td className="px-3 py-3 text-slate-600">{log.remarks || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <CustomerForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialData={customer}
        onSubmit={(payload) => editCustomer(customer.customer_id, payload)}
      />

      {/* Transfer Location Modal */}
      <Modal
        open={transferOpen}
        onClose={() => setTransferOpen(false)}
        title="Transfer Customer Location"
        subtitle="Move this subscriber to another active service area without deleting billing history."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Destination Location
            </label>
            <select
              value={transferLocId}
              onChange={(e) => setTransferLocId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {locations
                .filter((l) => l.status === 'Active' || l.location_id === customer.location_id)
                .map((l) => (
                  <option key={l.location_id} value={l.location_id}>
                    {l.location_name}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setTransferOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                transferCustomerLocation(customer.customer_id, transferLocId);
                setTransferOpen(false);
              }}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Confirm Transfer
            </button>
          </div>
        </div>
      </Modal>

      {/* Change Plan Modal */}
      <Modal
        open={planOpen}
        onClose={() => setPlanOpen(false)}
        title="Change Internet Plan"
        subtitle="Future monthly bills will use the updated rate. Historical billing records stay unchanged."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">Internet Plan</label>
            <select
              value={selectedPlanId}
              onChange={(e) => handlePlanSelect(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              {plans
                .filter((p) => p.status === 'Active' || p.plan_id === customer.plan_id)
                .map((p) => (
                  <option key={p.plan_id} value={p.plan_id}>
                    {p.plan_name} — {p.speed_mbps} Mbps ({formatCurrencyShort(p.monthly_price, sym)})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Agreed Monthly Rate ({sym})
            </label>
            <input
              type="number"
              min="1"
              step="0.01"
              value={customRate}
              onChange={(e) => setCustomRate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setPlanOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                changeCustomerPlan(customer.customer_id, selectedPlanId, customRate);
                setPlanOpen(false);
              }}
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              Save Subscription
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Confirmation Dialog */}
      <PaymentDialog
        open={paymentModal.open}
        onClose={() => setPaymentModal((prev) => ({ ...prev, open: false }))}
        bill={paymentModal.bill}
        customerName={customer.full_name}
        targetStatus={paymentModal.targetStatus}
        currencySymbol={sym}
        onConfirm={({ billId, newStatus, datePaid, remarks }) =>
          updateBillPaymentStatus(billId, { newStatus, datePaid, remarks })
        }
      />

      {/* Archive / Reactivate Confirm */}
      <ConfirmDialog
        open={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        onConfirm={() => toggleCustomerAccountStatus(customer.customer_id)}
        variant={customer.account_status === 'Active' ? 'danger' : 'success'}
        title={
          customer.account_status === 'Active' ? 'Archive Customer Account?' : 'Reactivate Customer?'
        }
        confirmLabel={customer.account_status === 'Active' ? 'Archive Customer' : 'Reactivate'}
        message={
          customer.account_status === 'Active'
            ? `Archiving "${customer.full_name}" marks the account Inactive while retaining all historical billing records and payment history.`
            : `Reactivating "${customer.full_name}" restores the account to Active status for future monthly billing.`
        }
      />
    </div>
  );
}
