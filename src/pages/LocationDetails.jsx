import React, { useState, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit3,
  Archive,
  RotateCcw,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Wifi,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import SearchBar from '../components/common/SearchBar';
import LocationForm from '../components/locations/LocationForm';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getLocationStats } from '../services/locationService';
import {
  MONTH_NAMES,
  getBillingMonthKey,
  formatCurrencyShort,
  formatDate,
  isBillOverdue,
} from '../utils/formatters';

export default function LocationDetails() {
  const { locationId } = useParams();
  const navigate = useNavigate();
  const {
    locations,
    customers,
    plans,
    bills,
    issues,
    issueAffected,
    settings,
    editLocation,
    toggleLocationStatus,
  } = useApp();

  const location = locations.find((l) => l.location_id === locationId);
  const [search, setSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [connectionFilter, setConnectionFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(10); // Nov 2026
  const [editOpen, setEditOpen] = useState(false);
  const [confirmArchive, setConfirmArchive] = useState(false);

  const selectedMonthKey = getBillingMonthKey(selectedYear, selectedMonthIdx);
  const sym = settings.currency_symbol;

  const allLocationCustomers = useMemo(
    () => customers.filter((c) => c.location_id === locationId),
    [customers, locationId]
  );

  const enrichedCustomers = useMemo(() => {
    const planMap = new Map(plans.map((p) => [p.plan_id, p]));
    return allLocationCustomers.map((c) => {
      const monthBill = bills.find(
        (b) => b.customer_id === c.customer_id && b.billing_month === selectedMonthKey
      );
      return {
        ...c,
        plan: planMap.get(c.plan_id) || null,
        monthBill,
        paymentStatus: monthBill?.payment_status || null,
        isOverdue: monthBill ? isBillOverdue(monthBill) : false,
      };
    });
  }, [allLocationCustomers, plans, bills, selectedMonthKey]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = enrichedCustomers.filter((c) => {
      if (paymentFilter !== 'All' && c.paymentStatus !== paymentFilter) return false;
      if (connectionFilter !== 'All' && c.connection_status !== connectionFilter) return false;
      if (q) {
        const hit =
          c.full_name.toLowerCase().includes(q) ||
          c.customer_id.toLowerCase().includes(q) ||
          c.contact_number.toLowerCase().includes(q);
        if (!hit) return false;
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortBy === 'name_asc') return a.full_name.localeCompare(b.full_name);
      if (sortBy === 'name_desc') return b.full_name.localeCompare(a.full_name);
      if (sortBy === 'date_desc') return (b.created_at || '').localeCompare(a.created_at || '');
      if (sortBy === 'date_asc') return (a.created_at || '').localeCompare(b.created_at || '');
      return 0;
    });

    return list;
  }, [enrichedCustomers, search, paymentFilter, connectionFilter, sortBy]);

  const locationIssues = useMemo(
    () => issues.filter((i) => i.location_id === locationId),
    [issues, locationId]
  );
  const ongoingIssues = locationIssues.filter((i) => i.issue_status === 'Ongoing');

  if (!location) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
        <p className="text-sm font-semibold text-slate-900">Location not found</p>
        <Link
          to="/locations"
          className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:underline"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Locations
        </Link>
      </div>
    );
  }

  const stats = getLocationStats(locationId, customers, bills, issues, selectedMonthKey);
  const connectedCount = allLocationCustomers.filter((c) => c.connection_status === 'Connected').length;
  const issueConnCount = allLocationCustomers.filter((c) => c.connection_status === 'Issue').length;
  const disconnectedCount = allLocationCustomers.filter(
    (c) => c.connection_status === 'Disconnected'
  ).length;
  const totalConn = Math.max(allLocationCustomers.length, 1);

  const columns = [
    {
      key: 'customer_id',
      label: 'Customer ID',
      render: (c) => <span className="font-mono text-xs text-slate-500">{c.customer_id}</span>,
    },
    {
      key: 'full_name',
      label: 'Customer Name',
      render: (c) => (
        <div>
          <p className="font-semibold text-slate-900">{c.full_name}</p>
          <p className="text-[11px] text-slate-400">{c.address}</p>
        </div>
      ),
    },
    {
      key: 'contact_number',
      label: 'Contact Number',
      render: (c) => <span className="text-xs text-slate-600">{c.contact_number}</span>,
    },
    {
      key: 'plan',
      label: 'Internet Plan',
      render: (c) => (
        <span className="text-xs font-medium text-slate-700">
          {c.plan ? `${c.plan.plan_name} (${c.plan.speed_mbps} Mbps)` : '—'}
        </span>
      ),
    },
    {
      key: 'monthly_rate',
      label: 'Monthly Rate',
      render: (c) => (
        <span className="tabular-nums text-xs font-semibold text-slate-900">
          {formatCurrencyShort(c.monthly_rate, sym)}
        </span>
      ),
    },
    {
      key: 'payment',
      label: 'Payment Status',
      render: (c) =>
        c.paymentStatus ? (
          <StatusBadge
            status={c.isOverdue ? 'Overdue' : c.paymentStatus}
            size="xs"
          />
        ) : (
          <span className="text-xs text-slate-400">No bill</span>
        ),
    },
    {
      key: 'connection_status',
      label: 'Connection Status',
      render: (c) => <StatusBadge status={c.connection_status} size="xs" />,
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (c) => (
        <Link
          to={`/customers/${c.customer_id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
        >
          Profile
          <ExternalLink className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-xs sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            to="/locations"
            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-blue-700"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Locations
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              {location.location_name}
            </h2>
            <StatusBadge status={location.status} />
          </div>
          <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-500">
            {location.description}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Coverage: {location.address}
            {location.remarks ? ` · ${location.remarks}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Edit3 className="h-3.5 w-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => setConfirmArchive(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
          >
            {location.status === 'Active' ? (
              <>
                <Archive className="h-3.5 w-3.5" />
                Archive
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Reactivate
              </>
            )}
          </button>
          <Link
            to={`/customers/new?locationId=${location.location_id}`}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Customers</span>
            <Users className="h-4 w-4 text-blue-700" />
          </div>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-slate-900">
            {stats.totalCustomers}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{stats.activeCustomers} active</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Paid Customers</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-emerald-700">
            {stats.paidCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {MONTH_NAMES[selectedMonthIdx]} {selectedYear}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Unpaid Customers</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-amber-600">
            {stats.unpaidCount}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {formatCurrencyShort(stats.outstandingBalance, sym)} balance
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Active Connection Issues</span>
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
          <p
            className={`mt-2 tabular-nums text-2xl font-semibold ${
              stats.ongoingIssues > 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {stats.ongoingIssues}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">
            {locationIssues.length} historical record(s)
          </p>
        </div>
      </div>

      {/* Location Connection Overview */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-blue-700" />
            <h3 className="text-sm font-semibold text-slate-900">Location Connection Overview</h3>
          </div>
          <Link to="/issues" className="text-xs font-semibold text-blue-700 hover:underline">
            Manage Issues
          </Link>
        </div>

        {/* Stacked Health Bar */}
        <div className="mt-4">
          <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
            {connectedCount > 0 && (
              <div
                style={{ width: `${(connectedCount / totalConn) * 100}%` }}
                className="bg-emerald-500"
              />
            )}
            {issueConnCount > 0 && (
              <div
                style={{ width: `${(issueConnCount / totalConn) * 100}%` }}
                className="bg-rose-500"
              />
            )}
            {disconnectedCount > 0 && (
              <div
                style={{ width: `${(disconnectedCount / totalConn) * 100}%` }}
                className="bg-slate-400"
              />
            )}
          </div>
          <div className="mt-2.5 flex flex-wrap items-center gap-5 text-xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Connected: <strong className="text-slate-900">{connectedCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-rose-500" />
              Experiencing Issue: <strong className="text-slate-900">{issueConnCount}</strong>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400" />
              Disconnected: <strong className="text-slate-900">{disconnectedCount}</strong>
            </span>
          </div>
        </div>

        {ongoingIssues.length > 0 && (
          <div className="mt-4 space-y-2 border-t border-slate-100 pt-3.5">
            {ongoingIssues.map((iss) => {
              const affectedCount = issueAffected.filter((a) => a.issue_id === iss.issue_id).length;
              return (
                <div
                  key={iss.issue_id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-200/80 bg-rose-50/40 px-3.5 py-2.5 text-xs"
                >
                  <div>
                    <span className="font-semibold text-slate-900">{iss.issue_title}</span>
                    <span className="ml-2 text-slate-500">
                      · {affectedCount} affected customer{affectedCount === 1 ? '' : 's'} · Reported{' '}
                      {formatDate(iss.reported_at)}
                    </span>
                  </div>
                  <StatusBadge status="Ongoing" size="xs" />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Customer Management Section */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Subscribers in {location.location_name}
              </h3>
              <p className="text-xs text-slate-500">
                Click any subscriber row to view billing cards and payment history.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedMonthIdx}
                onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
              >
                {MONTH_NAMES.map((m, i) => (
                  <option key={m} value={i}>
                    {m}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-700"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3">
            <SearchBar
              value={search}
              onChange={setSearch}
              placeholder="Search customer by name, ID, or phone..."
              className="w-full sm:w-64"
            />
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700"
            >
              <option value="All">Payment: All</option>
              <option value="Paid">Paid</option>
              <option value="Unpaid">Unpaid</option>
            </select>
            <select
              value={connectionFilter}
              onChange={(e) => setConnectionFilter(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700"
            >
              <option value="All">Connection: All</option>
              <option value="Connected">Connected</option>
              <option value="Issue">Issue</option>
              <option value="Disconnected">Disconnected</option>
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="ml-auto rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700"
            >
              <option value="name_asc">Sort: Name (A–Z)</option>
              <option value="name_desc">Sort: Name (Z–A)</option>
              <option value="date_desc">Sort: Date Added (Newest)</option>
              <option value="date_asc">Sort: Date Added (Oldest)</option>
            </select>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredCustomers}
          keyField="customer_id"
          onRowClick={(c) => navigate(`/customers/${c.customer_id}`)}
          emptyTitle="No customers match your filters"
          emptyDescription="Add a new customer under this location or adjust your search criteria."
        />
      </div>

      <LocationForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        initialData={location}
        onSubmit={(payload) => editLocation(location.location_id, payload)}
      />

      <ConfirmDialog
        open={confirmArchive}
        onClose={() => setConfirmArchive(false)}
        onConfirm={() => toggleLocationStatus(location.location_id)}
        variant={location.status === 'Active' ? 'danger' : 'success'}
        title={location.status === 'Active' ? 'Archive Location?' : 'Reactivate Location?'}
        confirmLabel={location.status === 'Active' ? 'Archive' : 'Reactivate'}
        message={
          location.status === 'Active'
            ? `Archive "${location.location_name}"? Existing customers and billing records will remain safely stored.`
            : `Reactivate "${location.location_name}" for active service management?`
        }
      />
    </div>
  );
}
