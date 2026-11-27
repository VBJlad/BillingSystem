import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Users,
  UserCheck,
  UserX,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import {
  formatCurrencyShort,
  isBillOverdue,
  getBillingMonthKey,
  MONTH_NAMES,
} from '../utils/formatters';

const PAGE_SIZE = 10;

export default function Customers() {
  const navigate = useNavigate();
  const { customers, locations, plans, bills, settings } = useApp();

  const [search, setSearch] = useState('');
  const [locationFilter, setLocationFilter] = useState('All');
  const [planFilter, setPlanFilter] = useState('All');
  const [paymentFilter, setPaymentFilter] = useState('All');
  const [connectionFilter, setConnectionFilter] = useState('All');
  const [accountFilter, setAccountFilter] = useState('All');
  const [sortBy, setSortBy] = useState('name_asc');
  const [billingMonthIdx, setBillingMonthIdx] = useState(10); // Nov 2026
  const [billingYear, setBillingYear] = useState(2026);
  const [page, setPage] = useState(1);

  const selectedMonthKey = getBillingMonthKey(billingYear, billingMonthIdx);
  const sym = settings.currency_symbol;

  const summary = useMemo(() => {
    const total = customers.length;
    const active = customers.filter((c) => c.account_status === 'Active').length;
    return { total, active, inactive: total - active };
  }, [customers]);

  const enrichedCustomers = useMemo(() => {
    const locMap = new Map(locations.map((l) => [l.location_id, l]));
    const planMap = new Map(plans.map((p) => [p.plan_id, p]));

    return customers.map((c) => {
      const monthBill = bills.find(
        (b) => b.customer_id === c.customer_id && b.billing_month === selectedMonthKey
      );
      return {
        ...c,
        locationName: locMap.get(c.location_id)?.location_name || 'Unassigned',
        plan: planMap.get(c.plan_id) || null,
        currentPaymentStatus: monthBill?.payment_status || null,
        monthBillOverdue: monthBill ? isBillOverdue(monthBill) : false,
      };
    });
  }, [customers, locations, plans, bills, selectedMonthKey]);

  const filteredCustomers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = enrichedCustomers.filter((c) => {
      if (locationFilter !== 'All' && c.location_id !== locationFilter) return false;
      if (planFilter !== 'All' && c.plan_id !== planFilter) return false;
      if (connectionFilter !== 'All' && c.connection_status !== connectionFilter) return false;
      if (accountFilter !== 'All' && c.account_status !== accountFilter) return false;
      if (paymentFilter === 'Overdue' && !c.monthBillOverdue) return false;
      if (
        (paymentFilter === 'Paid' || paymentFilter === 'Unpaid') &&
        c.currentPaymentStatus !== paymentFilter
      ) {
        return false;
      }
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
  }, [
    enrichedCustomers,
    search,
    locationFilter,
    planFilter,
    connectionFilter,
    accountFilter,
    paymentFilter,
    sortBy,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    search,
    locationFilter,
    planFilter,
    paymentFilter,
    connectionFilter,
    accountFilter,
    sortBy,
    billingMonthIdx,
    billingYear,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredCustomers.length / PAGE_SIZE));
  const paginatedCustomers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredCustomers.slice(start, start + PAGE_SIZE);
  }, [filteredCustomers, page]);

  const hasActiveFilters =
    search ||
    locationFilter !== 'All' ||
    planFilter !== 'All' ||
    paymentFilter !== 'All' ||
    connectionFilter !== 'All' ||
    accountFilter !== 'All';

  const resetFilters = () => {
    setSearch('');
    setLocationFilter('All');
    setPlanFilter('All');
    setPaymentFilter('All');
    setConnectionFilter('All');
    setAccountFilter('All');
  };

  const columns = [
    {
      key: 'customer_id',
      label: 'Customer ID',
      render: (c) => <span className="font-mono text-xs text-slate-500">{c.customer_id}</span>,
    },
    {
      key: 'full_name',
      label: 'Customer Name',
      render: (c) => <span className="font-semibold text-slate-900">{c.full_name}</span>,
    },
    {
      key: 'locationName',
      label: 'Location',
      render: (c) => <span className="text-xs font-medium text-slate-700">{c.locationName}</span>,
    },
    {
      key: 'contact_number',
      label: 'Contact Number',
      render: (c) => <span className="text-xs text-slate-600">{c.contact_number}</span>,
    },
    {
      key: 'plan',
      label: 'Internet Plan',
      render: (c) => <span className="text-xs text-slate-700">{c.plan?.plan_name || '—'}</span>,
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
        c.currentPaymentStatus ? (
          <StatusBadge
            status={c.monthBillOverdue ? 'Overdue' : c.currentPaymentStatus}
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
      key: 'account_status',
      label: 'Account Status',
      render: (c) => <StatusBadge status={c.account_status} size="xs" />,
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
          View
          <ExternalLink className="h-3 w-3" />
        </Link>
      ),
    },
  ];

  const startIdx = filteredCustomers.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const endIdx = Math.min(page * PAGE_SIZE, filteredCustomers.length);

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Customers</h2>
          <p className="mt-1 text-sm text-slate-500">
            Manage and organize all registered internet subscribers.
          </p>
        </div>

        <Link
          to="/customers/new"
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          Add Customer
        </Link>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <p className="text-xs font-medium text-slate-500">Total Customers</p>
            <p className="mt-1 tabular-nums text-2xl font-semibold text-slate-900">
              {summary.total}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
            <Users className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <p className="text-xs font-medium text-slate-500">Active Customers</p>
            <p className="mt-1 tabular-nums text-2xl font-semibold text-emerald-700">
              {summary.active}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
            <UserCheck className="h-4 w-4" />
          </span>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div>
            <p className="text-xs font-medium text-slate-500">Inactive Customers</p>
            <p className="mt-1 tabular-nums text-2xl font-semibold text-slate-700">
              {summary.inactive}
            </p>
          </div>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
            <UserX className="h-4 w-4" />
          </span>
        </div>
      </div>

      {/* Search + Filters + Sorting */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by customer name, ID, or contact number..."
            className="w-full sm:max-w-sm"
          />

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-500">Billing period:</span>
            <select
              value={billingMonthIdx}
              onChange={(e) => setBillingMonthIdx(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={billingYear}
              onChange={(e) => setBillingYear(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-medium text-slate-800"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="All">All Locations</option>
            {locations.map((l) => (
              <option key={l.location_id} value={l.location_id}>
                {l.location_name}
              </option>
            ))}
          </select>

          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="All">All Internet Plans</option>
            {plans.map((p) => (
              <option key={p.plan_id} value={p.plan_id}>
                {p.plan_name}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="All">Payment: All</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
          </select>

          <select
            value={connectionFilter}
            onChange={(e) => setConnectionFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="All">Connection: All</option>
            <option value="Connected">Connected</option>
            <option value="Issue">Issue</option>
            <option value="Disconnected">Disconnected</option>
          </select>

          <select
            value={accountFilter}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700"
          >
            <option value="All">Account: All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700"
            >
              <option value="name_asc">Sort: Name A–Z</option>
              <option value="name_desc">Sort: Name Z–A</option>
              <option value="date_desc">Sort: Recently Added</option>
              <option value="date_asc">Sort: Oldest Added</option>
            </select>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetFilters}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={paginatedCustomers}
        keyField="customer_id"
        onRowClick={(c) => navigate(`/customers/${c.customer_id}`)}
        emptyTitle="No matching customers"
        emptyDescription="Clear active filters or register a new subscriber using the Add Customer button."
      />

      {/* Pagination Bar */}
      {filteredCustomers.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500 shadow-xs sm:flex-row">
          <p>
            Showing <strong className="text-slate-900">{startIdx}</strong>–
            <strong className="text-slate-900">{endIdx}</strong> of{' '}
            <strong className="text-slate-900">{filteredCustomers.length}</strong> customers
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                type="button"
                onClick={() => setPage(pageNum)}
                className={`h-7 min-w-7 rounded-lg px-2 font-semibold transition ${
                  pageNum === page
                    ? 'bg-blue-700 text-white'
                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
