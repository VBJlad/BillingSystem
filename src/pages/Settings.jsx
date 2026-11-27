import React, { useState } from 'react';
import { Shield, Sliders, RotateCcw, Database, Save } from 'lucide-react';
import { useApp } from '../context/AppContext';
import ConfirmDialog from '../components/common/ConfirmDialog';

export default function Settings() {
  const { admin, settings, updateAdminAccount, updateSystemSettings, resetDemoData } = useApp();

  const [adminForm, setAdminForm] = useState({
    full_name: admin.full_name || '',
    username: admin.username || '',
    email: admin.email || '',
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [adminError, setAdminError] = useState('');

  const [sysForm, setSysForm] = useState({
    isp_name: settings.isp_name || '',
    business_name: settings.business_name || '',
    currency_symbol: settings.currency_symbol || '₱',
    default_billing_day: settings.default_billing_day || 15,
    contact_hotline: settings.contact_hotline || '',
    business_address: settings.business_address || '',
  });

  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  const handleSaveAdmin = (e) => {
    e.preventDefault();
    setAdminError('');
    if (!adminForm.username.trim()) return setAdminError('Username is required.');

    const updates = {
      full_name: adminForm.full_name.trim(),
      username: adminForm.username.trim(),
      email: adminForm.email.trim(),
    };

    if (adminForm.new_password) {
      if (adminForm.current_password !== admin.password_hash) {
        return setAdminError('Current password is incorrect.');
      }
      if (adminForm.new_password.length < 6) {
        return setAdminError('New password must be at least 6 characters.');
      }
      if (adminForm.new_password !== adminForm.confirm_password) {
        return setAdminError('New password and confirmation do not match.');
      }
      updates.password_hash = adminForm.new_password;
    }

    updateAdminAccount(updates);
    setAdminForm((prev) => ({
      ...prev,
      current_password: '',
      new_password: '',
      confirm_password: '',
    }));
  };

  const handleSaveSystem = (e) => {
    e.preventDefault();
    updateSystemSettings({
      ...sysForm,
      default_billing_day: Number(sysForm.default_billing_day) || 15,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Settings</h2>
        <p className="mt-1 text-sm text-slate-500">
          Manage administrator credentials, ISP business details, and billing defaults.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Admin Account */}
        <form
          onSubmit={handleSaveAdmin}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
        >
          <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Shield className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Administrator Account</h3>
              <p className="text-xs text-slate-500">
                Single-administrator credentials and profile details.
              </p>
            </div>
          </div>

          {adminError && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {adminError}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Full Name</label>
              <input
                type="text"
                value={adminForm.full_name}
                onChange={(e) => setAdminForm({ ...adminForm, full_name: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Username</label>
                <input
                  type="text"
                  value={adminForm.username}
                  onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">Email</label>
                <input
                  type="email"
                  value={adminForm.email}
                  onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 pt-4">
              <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                Change Password (Optional)
              </p>
              <div className="space-y-3">
                <input
                  type="password"
                  placeholder="Current password"
                  value={adminForm.current_password}
                  onChange={(e) => setAdminForm({ ...adminForm, current_password: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <input
                    type="password"
                    placeholder="New password"
                    value={adminForm.new_password}
                    onChange={(e) => setAdminForm({ ...adminForm, new_password: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    value={adminForm.confirm_password}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, confirm_password: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800"
              >
                <Save className="h-3.5 w-3.5" />
                Save Account
              </button>
            </div>
          </div>
        </form>

        {/* System Preferences */}
        <form
          onSubmit={handleSaveSystem}
          className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs"
        >
          <div className="mb-5 flex items-center gap-2.5 border-b border-slate-100 pb-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
              <Sliders className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">System Preferences</h3>
              <p className="text-xs text-slate-500">
                Business identity and default billing parameters.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  CMS Title
                </label>
                <input
                  type="text"
                  value={sysForm.isp_name}
                  onChange={(e) => setSysForm({ ...sysForm, isp_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Business Name
                </label>
                <input
                  type="text"
                  value={sysForm.business_name}
                  onChange={(e) => setSysForm({ ...sysForm, business_name: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  maxLength={4}
                  value={sysForm.currency_symbol}
                  onChange={(e) => setSysForm({ ...sysForm, currency_symbol: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Default Billing Day (1–31)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={sysForm.default_billing_day}
                  onChange={(e) =>
                    setSysForm({ ...sysForm, default_billing_day: e.target.value })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Contact Hotline
              </label>
              <input
                type="text"
                value={sysForm.contact_hotline}
                onChange={(e) => setSysForm({ ...sysForm, contact_hotline: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Business Office Address
              </label>
              <input
                type="text"
                value={sysForm.business_address}
                onChange={(e) => setSysForm({ ...sysForm, business_address: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800"
              >
                <Save className="h-3.5 w-3.5" />
                Save Preferences
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Demo Data Reset */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <Database className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Local Preview Storage</h3>
            <p className="mt-0.5 max-w-2xl text-xs leading-relaxed text-slate-500">
              Your edits are persisted locally in the browser for frontend review before Supabase
              integration. Reset anytime to restore the default sample dataset.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setResetConfirmOpen(true)}
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Demo Data
        </button>
      </div>

      <ConfirmDialog
        open={resetConfirmOpen}
        onClose={() => setResetConfirmOpen(false)}
        onConfirm={resetDemoData}
        variant="danger"
        title="Reset Demo Data?"
        confirmLabel="Restore Defaults"
        message="This will clear any browser edits and restore the sample locations (Kaybagal South, Mendez Crossing, Sungay, Tolentino East), customers, bills, and connection issues."
      />
    </div>
  );
}
