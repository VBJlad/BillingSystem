import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  AlertTriangle,
  CheckCircle2,
  Users,
  MapPin,
  Edit3,
  RotateCcw,
  UserCheck,
  Eye,
  Clock,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import { formatDate, formatDateTime, getTodayISO } from '../utils/formatters';

export default function ConnectionIssues() {
  const {
    issues,
    issueAffected,
    locations,
    customers,
    addConnectionIssue,
    editConnectionIssue,
    setIssueAffectedCustomers,
    resolveConnectionIssue,
    reopenConnectionIssue,
  } = useApp();

  const [tab, setTab] = useState('all'); // all | ongoing | resolved
  const [locationFilter, setLocationFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Add / Edit Issue modal
  const [createOpen, setCreateOpen] = useState(false);
  const [editingIssue, setEditingIssue] = useState(null);
  const [issueForm, setIssueForm] = useState({
    location_id: '',
    issue_title: '',
    description: '',
    reported_date: getTodayISO(),
    remarks: '',
  });
  const [selectedAffectedIds, setSelectedAffectedIds] = useState([]);
  const [syncCustomerStatus, setSyncCustomerStatus] = useState(true);
  const [formError, setFormError] = useState('');

  // View Details modal
  const [detailIssueId, setDetailIssueId] = useState(null);

  // Manage Affected Customers modal
  const [manageAffectedIssue, setManageAffectedIssue] = useState(null);
  const [managedCustomerIds, setManagedCustomerIds] = useState([]);
  const [syncManagedStatus, setSyncManagedStatus] = useState(true);

  // Resolve modal
  const [resolveTarget, setResolveTarget] = useState(null);
  const [resolveRemarks, setResolveRemarks] = useState('');
  const [restoreOnResolve, setRestoreOnResolve] = useState(true);

  const locationMap = useMemo(
    () => new Map(locations.map((l) => [l.location_id, l])),
    [locations]
  );
  const customerMap = useMemo(
    () => new Map(customers.map((c) => [c.customer_id, c])),
    [customers]
  );

  // 4 Summary KPIs
  const summary = useMemo(() => {
    const ongoing = issues.filter((i) => i.issue_status === 'Ongoing');
    const resolved = issues.filter((i) => i.issue_status === 'Resolved');
    const ongoingIds = new Set(ongoing.map((i) => i.issue_id));
    const currentlyAffectedCustomers = new Set(
      issueAffected.filter((a) => ongoingIds.has(a.issue_id)).map((a) => a.customer_id)
    ).size;
    return {
      total: issues.length,
      ongoing: ongoing.length,
      resolved: resolved.length,
      affectedCustomers: currentlyAffectedCustomers,
    };
  }, [issues, issueAffected]);

  const enrichedIssues = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues
      .map((i) => {
        const affectedLinks = issueAffected.filter((a) => a.issue_id === i.issue_id);
        return {
          ...i,
          locationName: locationMap.get(i.location_id)?.location_name || i.location_id,
          affectedCount: affectedLinks.length,
          affectedCustomers: affectedLinks
            .map((a) => customerMap.get(a.customer_id))
            .filter(Boolean),
        };
      })
      .filter((i) => {
        if (tab === 'ongoing' && i.issue_status !== 'Ongoing') return false;
        if (tab === 'resolved' && i.issue_status !== 'Resolved') return false;
        if (locationFilter !== 'All' && i.location_id !== locationFilter) return false;
        if (q) {
          return (
            i.issue_title.toLowerCase().includes(q) ||
            i.issue_id.toLowerCase().includes(q) ||
            i.locationName.toLowerCase().includes(q) ||
            (i.description || '').toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.issue_status !== b.issue_status) return a.issue_status === 'Ongoing' ? -1 : 1;
        return (b.reported_at || '').localeCompare(a.reported_at || '');
      });
  }, [issues, issueAffected, locationMap, customerMap, tab, locationFilter, search]);

  const detailIssue = useMemo(() => {
    if (!detailIssueId) return null;
    const found = issues.find((i) => i.issue_id === detailIssueId);
    if (!found) return null;
    const links = issueAffected.filter((a) => a.issue_id === found.issue_id);
    return {
      ...found,
      locationName: locationMap.get(found.location_id)?.location_name || found.location_id,
      affectedCustomers: links.map((a) => customerMap.get(a.customer_id)).filter(Boolean),
      locationTotalCustomers: customers.filter((c) => c.location_id === found.location_id).length,
    };
  }, [detailIssueId, issues, issueAffected, locationMap, customerMap, customers]);

  const activeLocations = locations.filter((l) => l.status === 'Active');

  const openCreateModal = () => {
    setEditingIssue(null);
    setFormError('');
    setIssueForm({
      location_id: activeLocations[0]?.location_id || '',
      issue_title: '',
      description: '',
      reported_date: getTodayISO(),
      remarks: '',
    });
    setSelectedAffectedIds([]);
    setSyncCustomerStatus(true);
    setCreateOpen(true);
  };

  const openEditModal = (issue) => {
    setEditingIssue(issue);
    setFormError('');
    setIssueForm({
      location_id: issue.location_id,
      issue_title: issue.issue_title,
      description: issue.description || '',
      reported_date: (issue.reported_at || getTodayISO()).slice(0, 10),
      remarks: issue.remarks || '',
    });
    setCreateOpen(true);
  };

  const openManageAffected = (issue) => {
    const currentIds = issueAffected
      .filter((a) => a.issue_id === issue.issue_id)
      .map((a) => a.customer_id);
    setManageAffectedIssue(issue);
    setManagedCustomerIds(currentIds);
    setSyncManagedStatus(issue.issue_status === 'Ongoing');
  };

  const openResolveModal = (issue) => {
    setResolveTarget(issue);
    setResolveRemarks(issue.remarks || '');
    setRestoreOnResolve(true);
  };

  const createLocationCustomers = useMemo(
    () => customers.filter((c) => c.location_id === issueForm.location_id),
    [customers, issueForm.location_id]
  );

  const manageLocationCustomers = useMemo(() => {
    if (!manageAffectedIssue) return [];
    return customers.filter((c) => c.location_id === manageAffectedIssue.location_id);
  }, [customers, manageAffectedIssue]);

  const toggleId = (list, setList, id) => {
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const handleCreateOrEditSubmit = (e) => {
    e.preventDefault();
    if (!issueForm.location_id) return setFormError('Please select a location.');
    if (!issueForm.issue_title.trim()) return setFormError('Issue title is required.');

    const reportedIso = issueForm.reported_date
      ? new Date(`${issueForm.reported_date}T09:00:00`).toISOString()
      : new Date().toISOString();

    if (editingIssue) {
      editConnectionIssue(editingIssue.issue_id, {
        issue_title: issueForm.issue_title,
        description: issueForm.description,
        remarks: issueForm.remarks,
        reported_at: reportedIso,
      });
    } else {
      addConnectionIssue(
        {
          location_id: issueForm.location_id,
          issue_title: issueForm.issue_title,
          description: issueForm.description,
          reported_at: reportedIso,
          remarks: issueForm.remarks,
        },
        selectedAffectedIds,
        syncCustomerStatus
      );
    }
    setCreateOpen(false);
  };

  // Exact Page 10 Table Columns: Issue ID, Issue Title, Location, Affected Customers, Date Reported, Issue Status, Actions
  const columns = [
    {
      key: 'issue_id',
      label: 'Issue ID',
      render: (i) => <span className="font-mono text-xs text-slate-500">{i.issue_id}</span>,
    },
    {
      key: 'issue_title',
      label: 'Issue Title',
      cellClassName: 'max-w-xs whitespace-normal',
      render: (i) => (
        <div>
          <p className="font-semibold text-slate-900">{i.issue_title}</p>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-400">{i.description}</p>
        </div>
      ),
    },
    {
      key: 'locationName',
      label: 'Location',
      render: (i) => (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-slate-700">
          <MapPin className="h-3.5 w-3.5 text-slate-400" />
          {i.locationName}
        </span>
      ),
    },
    {
      key: 'affectedCount',
      label: 'Affected Customers',
      render: (i) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            openManageAffected(i);
          }}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-700 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
        >
          <Users className="h-3.5 w-3.5 text-slate-400" />
          {i.affectedCount} customer{i.affectedCount === 1 ? '' : 's'}
        </button>
      ),
    },
    {
      key: 'reported_at',
      label: 'Date Reported',
      render: (i) => <span className="text-xs text-slate-600">{formatDate(i.reported_at)}</span>,
    },
    {
      key: 'issue_status',
      label: 'Issue Status',
      render: (i) => <StatusBadge status={i.issue_status} size="xs" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (i) => (
        <div
          className="flex items-center justify-end gap-1.5"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => setDetailIssueId(i.issue_id)}
            className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <Eye className="h-3 w-3" />
            Details
          </button>
          {i.issue_status === 'Ongoing' ? (
            <button
              type="button"
              onClick={() => openResolveModal(i)}
              className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3 w-3" />
              Resolve
            </button>
          ) : (
            <button
              type="button"
              onClick={() => reopenConnectionIssue(i.issue_id)}
              className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-3 w-3" />
              Reopen
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Connection Issues
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor and manage internet service problems across your locations.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add New Issue
        </button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Issues</span>
            <Clock className="h-4 w-4 text-slate-400" />
          </div>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-slate-900">{summary.total}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Ongoing Issues</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-rose-600">
            {summary.ongoing}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Resolved Issues</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-emerald-700">
            {summary.resolved}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Affected Customers</span>
            <Users className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-slate-900">
            {summary.affectedCustomers}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">From ongoing incidents</p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-3.5 shadow-xs lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
            {[
              { id: 'all', label: `All (${summary.total})` },
              { id: 'ongoing', label: `Ongoing (${summary.ongoing})` },
              { id: 'resolved', label: `Resolved (${summary.resolved})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  tab === t.id
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700"
          >
            <option value="All">All Locations</option>
            {locations.map((l) => (
              <option key={l.location_id} value={l.location_id}>
                {l.location_name}
              </option>
            ))}
          </select>
        </div>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search issue title, ID, or location..."
          className="w-full lg:w-72"
        />
      </div>

      {/* Issues Table */}
      <DataTable
        columns={columns}
        data={enrichedIssues}
        keyField="issue_id"
        onRowClick={(i) => setDetailIssueId(i.issue_id)}
        emptyTitle="No connection issues found"
        emptyDescription="Click 'Add New Issue' to report a location incident and select affected subscribers."
      />

      {/* Issue Details Modal */}
      <Modal
        open={Boolean(detailIssue)}
        onClose={() => setDetailIssueId(null)}
        title={detailIssue?.issue_title || 'Issue Details'}
        subtitle={
          detailIssue
            ? `${detailIssue.issue_id} · ${detailIssue.locationName}`
            : ''
        }
        maxWidth="max-w-xl"
      >
        {detailIssue && (
          <div className="space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <StatusBadge status={detailIssue.issue_status} />
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setDetailIssueId(null);
                    openEditModal(detailIssue);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setDetailIssueId(null);
                    openManageAffected(detailIssue);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <Users className="h-3.5 w-3.5 text-blue-700" />
                  Edit Affected
                </button>
                {detailIssue.issue_status === 'Ongoing' && (
                  <button
                    type="button"
                    onClick={() => {
                      setDetailIssueId(null);
                      openResolveModal(detailIssue);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-semibold text-white hover:bg-emerald-700"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Resolve Issue
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <p className="leading-relaxed text-slate-700">
                {detailIssue.description || 'No description provided.'}
              </p>
              {detailIssue.remarks && (
                <p className="border-t border-slate-200 pt-2 text-slate-600">
                  <strong>Remarks:</strong> {detailIssue.remarks}
                </p>
              )}
              <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-2 text-[11px] text-slate-500">
                <span>Reported: {formatDateTime(detailIssue.reported_at)}</span>
                {detailIssue.resolved_at && (
                  <span className="text-emerald-700">
                    Resolved: {formatDateTime(detailIssue.resolved_at)}
                  </span>
                )}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Affected Customers ({detailIssue.affectedCustomers.length} of{' '}
                {detailIssue.locationTotalCustomers} in {detailIssue.locationName})
              </p>
              {detailIssue.affectedCustomers.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-200 p-4 text-center text-slate-400">
                  No specific customers selected yet.
                </p>
              ) : (
                <div className="space-y-1.5">
                  {detailIssue.affectedCustomers.map((c) => (
                    <Link
                      key={c.customer_id}
                      to={`/customers/${c.customer_id}`}
                      onClick={() => setDetailIssueId(null)}
                      className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 hover:border-blue-300 hover:bg-blue-50/40"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{c.full_name}</p>
                        <p className="text-[11px] text-slate-400">{c.address}</p>
                      </div>
                      <StatusBadge status={c.connection_status} size="xs" />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add / Edit Connection Issue Modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title={editingIssue ? `Edit Issue (${editingIssue.issue_id})` : 'Add Connection Issue'}
        subtitle={
          editingIssue
            ? 'Update issue details and remarks.'
            : 'Log an area incident and manually select only the affected customers in that location.'
        }
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateOrEditSubmit} className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              {formError}
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Issue Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={issueForm.issue_title}
              onChange={(e) => setIssueForm({ ...issueForm, issue_title: e.target.value })}
              placeholder="e.g., NAP Box KS-03 Overhead Fiber Cut"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {!editingIssue && (
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-700">
                  Location <span className="text-rose-500">*</span>
                </label>
                <select
                  value={issueForm.location_id}
                  onChange={(e) => {
                    setIssueForm({ ...issueForm, location_id: e.target.value });
                    setSelectedAffectedIds([]);
                  }}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">Select location...</option>
                  {activeLocations.map((l) => (
                    <option key={l.location_id} value={l.location_id}>
                      {l.location_name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Date Reported <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={issueForm.reported_date}
                onChange={(e) => setIssueForm({ ...issueForm, reported_date: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">Description</label>
            <textarea
              rows={3}
              value={issueForm.description}
              onChange={(e) => setIssueForm({ ...issueForm, description: e.target.value })}
              placeholder="Describe the fiber cut, equipment fault, or outage scope..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          {/* Select Specific Affected Customers */}
          {!editingIssue && issueForm.location_id && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <div className="mb-2.5 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">
                    Select Affected Customers ({selectedAffectedIds.length} of{' '}
                    {createLocationCustomers.length} selected)
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Only selected subscribers will be marked affected; others in this location stay
                    unaffected.
                  </p>
                </div>
                {createLocationCustomers.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        setSelectedAffectedIds(createLocationCustomers.map((c) => c.customer_id))
                      }
                      className="font-semibold text-blue-700 hover:underline"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={() => setSelectedAffectedIds([])}
                      className="text-slate-500 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>

              {createLocationCustomers.length === 0 ? (
                <p className="text-xs text-slate-400">
                  No customers currently assigned to this location.
                </p>
              ) : (
                <div className="max-h-44 space-y-1.5 overflow-y-auto pr-1">
                  {createLocationCustomers.map((c) => {
                    const checked = selectedAffectedIds.includes(c.customer_id);
                    return (
                      <label
                        key={c.customer_id}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-xs transition ${
                          checked
                            ? 'border-rose-300 bg-rose-50/70'
                            : 'border-slate-200 bg-white hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() =>
                              toggleId(selectedAffectedIds, setSelectedAffectedIds, c.customer_id)
                            }
                            className="h-4 w-4 rounded border-slate-300 text-rose-600"
                          />
                          <span>
                            <strong className="text-slate-900">{c.full_name}</strong>
                            <span className="ml-2 font-mono text-[11px] text-slate-400">
                              {c.customer_id}
                            </span>
                          </span>
                        </span>
                        <StatusBadge status={c.connection_status} size="xs" />
                      </label>
                    );
                  })}
                </div>
              )}

              <label className="mt-3 flex cursor-pointer items-center gap-2 text-xs text-slate-700">
                <input
                  type="checkbox"
                  checked={syncCustomerStatus}
                  onChange={(e) => setSyncCustomerStatus(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-blue-700"
                />
                <span>
                  Set selected customers&apos; Connection Status to <strong>Issue</strong> (billing
                  &amp; payment status remain independent)
                </span>
              </label>
            </div>
          )}

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">Remarks</label>
            <input
              type="text"
              value={issueForm.remarks}
              onChange={(e) => setIssueForm({ ...issueForm, remarks: e.target.value })}
              placeholder="e.g., Technician dispatched; estimated repair 2 hours"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800"
            >
              Save Issue
            </button>
          </div>
        </form>
      </Modal>

      {/* Manage Affected Customers Modal */}
      <Modal
        open={Boolean(manageAffectedIssue)}
        onClose={() => setManageAffectedIssue(null)}
        title="Manage Affected Customers"
        subtitle={
          manageAffectedIssue
            ? `${manageAffectedIssue.issue_title} (${
                locationMap.get(manageAffectedIssue.location_id)?.location_name || ''
              })`
            : ''
        }
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-700">
              {managedCustomerIds.length} of {manageLocationCustomers.length} selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setManagedCustomerIds(manageLocationCustomers.map((c) => c.customer_id))
                }
                className="font-semibold text-blue-700 hover:underline"
              >
                Select All
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => setManagedCustomerIds([])}
                className="text-slate-500 hover:underline"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {manageLocationCustomers.map((c) => {
              const checked = managedCustomerIds.includes(c.customer_id);
              return (
                <label
                  key={c.customer_id}
                  className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-xs transition ${
                    checked
                      ? 'border-rose-300 bg-rose-50/70'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        toggleId(managedCustomerIds, setManagedCustomerIds, c.customer_id)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-rose-600"
                    />
                    <div>
                      <p className="font-semibold text-slate-900">{c.full_name}</p>
                      <p className="text-[11px] text-slate-400">{c.address}</p>
                    </div>
                  </span>
                  <StatusBadge status={c.connection_status} size="xs" />
                </label>
              );
            })}
          </div>

          <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={syncManagedStatus}
              onChange={(e) => setSyncManagedStatus(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-700"
            />
            <span>Sync customer Connection Status (Issue / Connected) with this list</span>
          </label>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setManageAffectedIssue(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                setIssueAffectedCustomers(
                  manageAffectedIssue.issue_id,
                  managedCustomerIds,
                  syncManagedStatus
                );
                setManageAffectedIssue(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-800"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Save Affected List
            </button>
          </div>
        </div>
      </Modal>

      {/* Resolve Issue Modal */}
      <Modal
        open={Boolean(resolveTarget)}
        onClose={() => setResolveTarget(null)}
        title="Resolve Connection Issue"
        subtitle="Marks this incident as Resolved and records the resolution date."
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 text-xs">
            <p className="font-semibold text-slate-900">{resolveTarget?.issue_title}</p>
            <p className="mt-0.5 text-slate-600">
              Location: {locationMap.get(resolveTarget?.location_id)?.location_name}
            </p>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Resolution Remarks
            </label>
            <textarea
              rows={3}
              value={resolveRemarks}
              onChange={(e) => setResolveRemarks(e.target.value)}
              placeholder="e.g., Re-spliced drop wire and restored optical signal to -18 dBm."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900"
            />
          </div>

          <label className="flex cursor-pointer items-start gap-2.5 rounded-lg bg-slate-50 p-3 text-xs text-slate-700">
            <input
              type="checkbox"
              checked={restoreOnResolve}
              onChange={(e) => setRestoreOnResolve(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-emerald-600"
            />
            <span>
              Restore affected customers&apos; Connection Status to <strong>Connected</strong> (if
              not impacted by another ongoing issue).
            </span>
          </label>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setResolveTarget(null)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                resolveConnectionIssue(resolveTarget.issue_id, {
                  remarks: resolveRemarks,
                  restoreCustomerStatus: restoreOnResolve,
                });
                setResolveTarget(null);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Confirm Resolved
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
