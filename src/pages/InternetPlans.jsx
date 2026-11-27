import React, { useState, useMemo } from 'react';
import { Plus, Wifi, Edit3, Archive, RotateCcw, Users, LayoutGrid, List } from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { formatCurrencyShort } from '../utils/formatters';

export default function InternetPlans() {
  const { plans, customers, settings, addPlan, editPlan, togglePlanStatus } = useApp();
  const sym = settings.currency_symbol;

  const [viewMode, setViewMode] = useState('cards'); // cards | table
  const [statusFilter, setStatusFilter] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  const [form, setForm] = useState({
    plan_name: '',
    speed_mbps: '',
    monthly_price: '',
    description: '',
    status: 'Active',
  });
  const [error, setError] = useState('');

  const enrichedPlans = useMemo(() => {
    return plans
      .filter((p) => (statusFilter === 'All' ? true : p.status === statusFilter))
      .map((p) => ({
        ...p,
        assignedCount: customers.filter((c) => c.plan_id === p.plan_id).length,
        activeAssignedCount: customers.filter(
          (c) => c.plan_id === p.plan_id && c.account_status === 'Active'
        ).length,
      }));
  }, [plans, customers, statusFilter]);

  const openAdd = () => {
    setEditingPlan(null);
    setError('');
    setForm({
      plan_name: '',
      speed_mbps: '',
      monthly_price: '',
      description: '',
      status: 'Active',
    });
    setModalOpen(true);
  };

  const openEdit = (plan) => {
    setEditingPlan(plan);
    setError('');
    setForm({
      plan_name: plan.plan_name,
      speed_mbps: String(plan.speed_mbps),
      monthly_price: String(plan.monthly_price),
      description: plan.description || '',
      status: plan.status,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.plan_name.trim()) return setError('Plan Name is required.');
    if (!form.speed_mbps || Number(form.speed_mbps) <= 0) {
      return setError('Internet Speed (Mbps) must be positive.');
    }
    if (!form.monthly_price || Number(form.monthly_price) <= 0) {
      return setError('Monthly Price must be greater than zero.');
    }

    if (editingPlan) {
      editPlan(editingPlan.plan_id, form);
    } else {
      addPlan(form);
    }
    setModalOpen(false);
  };

  const tableColumns = [
    {
      key: 'plan_name',
      label: 'Plan Name',
      render: (p) => (
        <div>
          <p className="font-semibold text-slate-900">{p.plan_name}</p>
          <p className="font-mono text-[11px] text-slate-400">{p.plan_id}</p>
        </div>
      ),
    },
    {
      key: 'speed_mbps',
      label: 'Internet Speed',
      render: (p) => <span className="font-semibold text-blue-700">{p.speed_mbps} Mbps</span>,
    },
    {
      key: 'monthly_price',
      label: 'Monthly Price',
      render: (p) => (
        <span className="tabular-nums font-bold text-slate-900">
          {formatCurrencyShort(p.monthly_price, sym)}
        </span>
      ),
    },
    {
      key: 'description',
      label: 'Description',
      cellClassName: 'max-w-xs whitespace-normal',
      render: (p) => <span className="text-xs text-slate-600">{p.description || '—'}</span>,
    },
    {
      key: 'assignedCount',
      label: 'Assigned Customers',
      render: (p) => (
        <span className="tabular-nums text-xs font-semibold text-slate-800">
          {p.assignedCount}{' '}
          <span className="font-normal text-slate-400">({p.activeAssignedCount} active)</span>
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Plan Status',
      render: (p) => <StatusBadge status={p.status} size="xs" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => openEdit(p)}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => setArchiveTarget(p)}
            className="rounded-md border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            {p.status === 'Active' ? 'Archive' : 'Restore'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Internet Plans</h2>
          <p className="mt-1 text-sm text-slate-500">
            Configure fiber packages and pricing. Historical monthly bills always keep their
            original recorded rates.
          </p>
        </div>

        <button
          type="button"
          onClick={openAdd}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Plan
        </button>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs">
        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
          {['All', 'Active', 'Inactive'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === tab
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'Inactive' ? 'Archived' : tab}
            </button>
          ))}
        </div>

        <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          <button
            type="button"
            onClick={() => setViewMode('cards')}
            aria-label="Card view"
            className={`rounded-md p-1.5 ${
              viewMode === 'cards' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode('table')}
            aria-label="Table view"
            className={`rounded-md p-1.5 ${
              viewMode === 'table' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500'
            }`}
          >
            <List className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'table' ? (
        <DataTable columns={tableColumns} data={enrichedPlans} keyField="plan_id" />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {enrichedPlans.map((plan) => {
            const isArchived = plan.status === 'Inactive';
            return (
              <div
                key={plan.plan_id}
                className={`flex flex-col justify-between rounded-xl border bg-white p-5 shadow-xs transition hover:border-slate-300 ${
                  isArchived ? 'border-slate-200/70 opacity-75' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                          isArchived ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        <Wifi className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">{plan.plan_name}</h3>
                        <p className="font-mono text-[11px] text-slate-400">{plan.plan_id}</p>
                      </div>
                    </div>
                    <StatusBadge status={plan.status} size="xs" />
                  </div>

                  <div className="mt-4 flex items-baseline justify-between rounded-lg border border-slate-200/80 bg-slate-50/70 px-4 py-3">
                    <div>
                      <span className="tabular-nums text-2xl font-semibold text-slate-900">
                        {formatCurrencyShort(plan.monthly_price, sym)}
                      </span>
                      <span className="text-xs text-slate-500"> /mo</span>
                    </div>
                    <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                      {plan.speed_mbps} Mbps
                    </span>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-slate-500">
                    {plan.description || 'No description provided.'}
                  </p>

                  <p className="mt-3.5 inline-flex items-center gap-1.5 text-xs text-slate-500">
                    <Users className="h-3.5 w-3.5 text-slate-400" />
                    <strong className="text-slate-900">{plan.assignedCount}</strong> assigned
                    customers ({plan.activeAssignedCount} active)
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-end gap-2 border-t border-slate-100 pt-3.5">
                  <button
                    type="button"
                    onClick={() => openEdit(plan)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    Edit Plan
                  </button>
                  <button
                    type="button"
                    onClick={() => setArchiveTarget(plan)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    {isArchived ? (
                      <>
                        <RotateCcw className="h-3.5 w-3.5" />
                        Restore
                      </>
                    ) : (
                      <>
                        <Archive className="h-3.5 w-3.5" />
                        Archive Plan
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingPlan ? 'Edit Internet Plan' : 'Add Internet Plan'}
        subtitle="Configure bandwidth tier and monthly subscription price."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Plan Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={form.plan_name}
              onChange={(e) => setForm({ ...form, plan_name: e.target.value })}
              placeholder="e.g., Family Fiber 100"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Internet Speed (Mbps) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                value={form.speed_mbps}
                onChange={(e) => setForm({ ...form, speed_mbps: e.target.value })}
                placeholder="100"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Monthly Price ({sym}) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={form.monthly_price}
                onChange={(e) => setForm({ ...form, monthly_price: e.target.value })}
                placeholder="1499"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Package highlights or ideal usage..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive (Archived)</option>
            </select>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800"
            >
              {editingPlan ? 'Save Changes' : 'Save Plan'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(archiveTarget)}
        onClose={() => setArchiveTarget(null)}
        onConfirm={() => archiveTarget && togglePlanStatus(archiveTarget.plan_id)}
        variant={archiveTarget?.status === 'Active' ? 'danger' : 'success'}
        title={archiveTarget?.status === 'Active' ? 'Archive Plan?' : 'Restore Plan?'}
        confirmLabel={archiveTarget?.status === 'Active' ? 'Archive Plan' : 'Restore'}
        message={
          archiveTarget?.status === 'Active'
            ? `Archive "${archiveTarget?.plan_name}"? Discontinued plans retain all historical billing references.`
            : `Restore "${archiveTarget?.plan_name}" as an active plan for subscriber assignment?`
        }
      />
    </div>
  );
}
