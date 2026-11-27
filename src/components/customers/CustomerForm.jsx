import React, { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import { useApp } from '../../context/AppContext';
import { getTodayISO, formatCurrencyShort, formatBillingMonth } from '../../utils/formatters';

export default function CustomerForm({
  open,
  onClose,
  onSubmit,
  initialData = null,
  defaultLocationId = '',
}) {
  const { locations, plans, settings } = useApp();
  const activeLocations = locations.filter(
    (l) => l.status === 'Active' || (initialData && l.location_id === initialData.location_id)
  );
  const activePlans = plans.filter(
    (p) => p.status === 'Active' || (initialData && p.plan_id === initialData.plan_id)
  );

  const today = getTodayISO();
  const currentMonthKey = `${today.slice(0, 7)}-01`;

  const [form, setForm] = useState({
    full_name: '',
    contact_number: '',
    address: '',
    location_id: '',
    plan_id: '',
    monthly_rate: '',
    installation_date: today,
    billing_day: settings.default_billing_day || 15,
    connection_status: 'Connected',
    account_status: 'Active',
    remarks: '',
  });
  const [generateFirstBill, setGenerateFirstBill] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (initialData) {
      setForm({
        full_name: initialData.full_name || '',
        contact_number: initialData.contact_number || '',
        address: initialData.address || '',
        location_id: initialData.location_id || '',
        plan_id: initialData.plan_id || '',
        monthly_rate: String(initialData.monthly_rate ?? ''),
        installation_date: initialData.installation_date || today,
        billing_day: initialData.billing_day || 15,
        connection_status: initialData.connection_status || 'Connected',
        account_status: initialData.account_status || 'Active',
        remarks: initialData.remarks || '',
      });
      setGenerateFirstBill(false);
    } else {
      const firstLoc = defaultLocationId || activeLocations[0]?.location_id || '';
      const firstPlan = activePlans[0] || null;
      setForm({
        full_name: '',
        contact_number: '',
        address: '',
        location_id: firstLoc,
        plan_id: firstPlan?.plan_id || '',
        monthly_rate: firstPlan ? String(firstPlan.monthly_price) : '',
        installation_date: today,
        billing_day: settings.default_billing_day || 15,
        connection_status: 'Connected',
        account_status: 'Active',
        remarks: '',
      });
      setGenerateFirstBill(true);
    }
  }, [open, initialData, defaultLocationId]);

  const handlePlanChange = (planId) => {
    const selectedPlan = plans.find((p) => p.plan_id === planId);
    setForm((prev) => ({
      ...prev,
      plan_id: planId,
      monthly_rate: selectedPlan ? String(selectedPlan.monthly_price) : prev.monthly_rate,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.full_name.trim()) return setError('Full name is required.');
    if (!form.contact_number.trim()) return setError('Contact number is required.');
    if (!form.address.trim()) return setError('Installation address is required.');
    if (!form.location_id) return setError('Please assign a service location.');
    if (!form.plan_id) return setError('Please select an internet plan.');
    if (!form.monthly_rate || Number(form.monthly_rate) <= 0) {
      return setError('Monthly rate must be greater than zero.');
    }
    const day = Number(form.billing_day);
    if (!day || day < 1 || day > 31) {
      return setError('Billing day must be between 1 and 31.');
    }

    onSubmit(form, {
      generateFirstBill: !initialData && generateFirstBill && form.account_status === 'Active',
      firstBillMonth: currentMonthKey,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initialData ? `Edit Customer (${initialData.customer_id})` : 'Register New Customer'}
      subtitle={
        initialData
          ? 'Update personal details or service configuration.'
          : 'Manually enter subscriber details and assign location and internet plan.'
      }
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
            {error}
          </div>
        )}

        {/* Personal Information */}
        <div>
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Personal Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="e.g., Juan Dela Cruz"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Contact Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.contact_number}
                onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                placeholder="e.g., 0917-123-4567"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Complete Installation Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="House/Lot No., Street, Subdivision/Barangay"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Service Information */}
        <div className="border-t border-slate-100 pt-4">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
            Service Information
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Assigned Service Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.location_id}
                onChange={(e) => setForm({ ...form, location_id: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select location...</option>
                {activeLocations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.location_name} {loc.status === 'Inactive' ? '(Inactive)' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Internet Plan <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.plan_id}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="">Select plan...</option>
                {activePlans.map((plan) => (
                  <option key={plan.plan_id} value={plan.plan_id}>
                    {plan.plan_name} — {plan.speed_mbps} Mbps (
                    {formatCurrencyShort(plan.monthly_price, settings.currency_symbol)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Agreed Monthly Rate ({settings.currency_symbol}){' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.monthly_rate}
                onChange={(e) => setForm({ ...form, monthly_rate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Installation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={form.installation_date}
                onChange={(e) => setForm({ ...form, installation_date: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Monthly Billing Day (1–31) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.billing_day}
                onChange={(e) => setForm({ ...form, billing_day: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Connection Status
              </label>
              <select
                value={form.connection_status}
                onChange={(e) => setForm({ ...form, connection_status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Connected">Connected</option>
                <option value="Disconnected">Disconnected</option>
                <option value="Issue">Issue</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Account Status
              </label>
              <select
                value={form.account_status}
                onChange={(e) => setForm({ ...form, account_status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold text-slate-700">
                Additional Remarks
              </label>
              <textarea
                rows={2}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Optional customer notes, NAP box port, or payment preference..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {!initialData && form.account_status === 'Active' && (
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={generateFirstBill}
                onChange={(e) => setGenerateFirstBill(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              <span>
                <strong className="text-slate-900">
                  Generate first monthly bill ({formatBillingMonth(currentMonthKey)})
                </strong>
                <span className="block text-slate-500">
                  Automatically creates an Unpaid billing record using the agreed monthly rate and
                  billing day.
                </span>
              </span>
            </label>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-xs hover:bg-blue-700"
          >
            {initialData ? 'Save Changes' : 'Confirm Registration'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
