import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, User, Wifi, ShieldCheck, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { generateNextCustomerId } from '../services/customerService';
import { getTodayISO, formatCurrencyShort, formatBillingMonth } from '../utils/formatters';

export default function AddCustomer() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedLocationId = searchParams.get('locationId') || '';

  const { customers, locations, plans, settings, addCustomer } = useApp();

  const activeLocations = useMemo(
    () => locations.filter((l) => l.status === 'Active'),
    [locations]
  );
  const activePlans = useMemo(() => plans.filter((p) => p.status === 'Active'), [plans]);
  const nextCustomerId = useMemo(() => generateNextCustomerId(customers), [customers]);

  const today = getTodayISO();
  const currentMonthKey = `${today.slice(0, 7)}-01`;
  const sym = settings.currency_symbol;

  const initialLocId =
    activeLocations.find((l) => l.location_id === preselectedLocationId)?.location_id ||
    activeLocations[0]?.location_id ||
    '';
  const initialPlan = activePlans[0] || null;

  const [form, setForm] = useState({
    full_name: '',
    contact_number: '',
    address: '',
    location_id: initialLocId,
    plan_id: initialPlan?.plan_id || '',
    monthly_rate: initialPlan ? String(initialPlan.monthly_price) : '',
    installation_date: today,
    billing_day: settings.default_billing_day || 15,
    account_status: 'Active',
    connection_status: 'Connected',
    remarks: '',
  });
  const [generateFirstBill, setGenerateFirstBill] = useState(true);
  const [error, setError] = useState('');

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
    setError('');
    if (!form.full_name.trim()) return setError('Full Name is required.');
    if (!form.contact_number.trim()) return setError('Contact Number is required.');
    if (!form.address.trim()) return setError('Complete Address is required.');
    if (!form.location_id) return setError('Please select a service location.');
    if (!form.plan_id) return setError('Please select an internet plan.');
    if (!form.monthly_rate || Number(form.monthly_rate) <= 0) {
      return setError('Monthly Subscription Rate must be greater than zero.');
    }
    const day = Number(form.billing_day);
    if (!day || day < 1 || day > 31) {
      return setError('Billing Day must be between 1 and 31.');
    }

    const created = addCustomer(form, {
      generateFirstBill: generateFirstBill && form.account_status === 'Active',
      firstBillMonth: currentMonthKey,
    });
    navigate(`/customers/${created.customer_id}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          to={preselectedLocationId ? `/locations/${preselectedLocationId}` : '/customers'}
          className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {preselectedLocationId ? 'Back to Location' : 'Back to Customers'}
        </Link>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
          Add Customer
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Manually register a new internet subscriber and assign their location and subscription
          plan.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-medium text-rose-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* SECTION 1: PERSONAL INFORMATION */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="h-4 w-4 text-blue-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Personal Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Customer ID <span className="text-slate-400">(Auto-generated)</span>
              </label>
              <input
                type="text"
                readOnly
                value={nextCustomerId}
                className="w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-sm font-semibold text-slate-600"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="e.g., Juan Dela Cruz"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Contact Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.contact_number}
                onChange={(e) => setForm({ ...form, contact_number: e.target.value })}
                placeholder="e.g., 0917-123-4567"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Complete Address <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="House/Lot No., Street, Purok/Subdivision, Barangay"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
          </div>
        </section>

        {/* SECTION 2: SERVICE INFORMATION */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <Wifi className="h-4 w-4 text-blue-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Service Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Location <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.location_id}
                onChange={(e) => setForm({ ...form, location_id: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              >
                <option value="">Select service location...</option>
                {activeLocations.map((loc) => (
                  <option key={loc.location_id} value={loc.location_id}>
                    {loc.location_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Internet Plan <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.plan_id}
                onChange={(e) => handlePlanChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              >
                <option value="">Select plan...</option>
                {activePlans.map((plan) => (
                  <option key={plan.plan_id} value={plan.plan_id}>
                    {plan.plan_name} — {plan.speed_mbps} Mbps (
                    {formatCurrencyShort(plan.monthly_price, sym)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Monthly Subscription Rate ({sym}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.monthly_rate}
                onChange={(e) => setForm({ ...form, monthly_rate: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Installation Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={form.installation_date}
                onChange={(e) => setForm({ ...form, installation_date: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Billing Day (1–31) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={form.billing_day}
                onChange={(e) => setForm({ ...form, billing_day: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
          </div>
        </section>

        {/* SECTION 3: ACCOUNT INFORMATION */}
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
            <ShieldCheck className="h-4 w-4 text-blue-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Account Information
            </h3>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Account Status
              </label>
              <select
                value={form.account_status}
                onChange={(e) => setForm({ ...form, account_status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Connection Status
              </label>
              <select
                value={form.connection_status}
                onChange={(e) => setForm({ ...form, connection_status: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                <option value="Connected">Connected</option>
                <option value="Disconnected">Disconnected</option>
                <option value="Issue">Issue</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Additional Remarks
              </label>
              <textarea
                rows={3}
                value={form.remarks}
                onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                placeholder="Optional installation notes, NAP box port, or payment preference..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>
          </div>

          {form.account_status === 'Active' && (
            <label className="mt-4 flex cursor-pointer items-start gap-2.5 rounded-lg border border-blue-100 bg-blue-50/60 p-3 text-xs text-slate-700">
              <input
                type="checkbox"
                checked={generateFirstBill}
                onChange={(e) => setGenerateFirstBill(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700"
              />
              <span>
                <strong className="text-slate-900">
                  Generate first monthly bill ({formatBillingMonth(currentMonthKey)})
                </strong>
                <span className="block text-slate-500">
                  Creates an Unpaid monthly billing record automatically upon saving.
                </span>
              </span>
            </label>
          )}
        </section>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-800"
          >
            <Save className="h-3.5 w-3.5" />
            Save Customer
          </button>
        </div>
      </form>
    </div>
  );
}
