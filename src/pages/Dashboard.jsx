import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  UserCheck,
  CheckCircle2,
  Clock,
  Wallet,
  AlertCircle,
  AlertTriangle,
  ArrowUpRight,
  Calendar,
  MapPin,
  Plus,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/common/StatusBadge';
import {
  MONTH_NAMES,
  getBillingMonthKey,
  formatBillingMonth,
  formatCurrency,
  formatCurrencyShort,
  formatDate,
  formatDateTime,
  isBillOverdue,
} from '../utils/formatters';

export default function Dashboard() {
  const {
    customers,
    locations,
    plans,
    bills,
    paymentLogs,
    issues,
    issueAffected,
    settings,
  } = useApp();

  const [selectedYear, setSelectedYear] = useState(2026);
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(10); // November 2026
  const [hoveredBar, setHoveredBar] = useState(null);

  const selectedMonthKey = getBillingMonthKey(selectedYear, selectedMonthIdx);
  const sym = settings.currency_symbol;

  const locMap = useMemo(() => new Map(locations.map((l) => [l.location_id, l])), [locations]);
  const custMap = useMemo(() => new Map(customers.map((c) => [c.customer_id, c])), [customers]);
  const planMap = useMemo(() => new Map(plans.map((p) => [p.plan_id, p])), [plans]);
  const billMap = useMemo(() => new Map(bills.map((b) => [b.bill_id, b])), [bills]);

  // 6 Core Summary KPIs
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const activeCustomers = customers.filter((c) => c.account_status === 'Active').length;
    const monthBills = bills.filter((b) => b.billing_month === selectedMonthKey);
    const paidBills = monthBills.filter((b) => b.payment_status === 'Paid');
    const unpaidBills = monthBills.filter((b) => b.payment_status === 'Unpaid');
    const overdueBills = unpaidBills.filter((b) => isBillOverdue(b));

    const totalCollections = paidBills.reduce((s, b) => s + Number(b.amount_due), 0);
    const outstandingBalance = unpaidBills.reduce((s, b) => s + Number(b.amount_due), 0);
    const totalBilled = totalCollections + outstandingBalance;

    return {
      totalCustomers,
      activeCustomers,
      inactiveCustomers: totalCustomers - activeCustomers,
      paidCount: paidBills.length,
      unpaidCount: unpaidBills.length,
      overdueCount: overdueBills.length,
      totalCollections,
      outstandingBalance,
      totalBilled,
      paidPct: totalBilled > 0 ? Math.round((totalCollections / totalBilled) * 100) : 0,
    };
  }, [customers, bills, selectedMonthKey]);

  // Monthly Collections Chart (6-month window ending in selected month)
  const monthlySeries = useMemo(() => {
    const series = [];
    for (let offset = 5; offset >= 0; offset -= 1) {
      const d = new Date(selectedYear, selectedMonthIdx - offset, 1);
      const key = getBillingMonthKey(d.getFullYear(), d.getMonth());
      const mBills = bills.filter((b) => b.billing_month === key);
      const collected = mBills
        .filter((b) => b.payment_status === 'Paid')
        .reduce((s, b) => s + Number(b.amount_due), 0);
      const unpaid = mBills
        .filter((b) => b.payment_status === 'Unpaid')
        .reduce((s, b) => s + Number(b.amount_due), 0);
      series.push({
        key,
        label: MONTH_NAMES[d.getMonth()].slice(0, 3),
        fullLabel: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        collected,
        unpaid,
        total: collected + unpaid,
      });
    }
    const maxVal = Math.max(...series.map((s) => s.total), 1000);
    return { series, maxVal };
  }, [bills, selectedYear, selectedMonthIdx]);

  // Customer Distribution by Location
  const locationDistribution = useMemo(() => {
    const activeLocs = locations.filter((l) => l.status === 'Active');
    const rows = activeLocs.map((loc) => {
      const locCusts = customers.filter((c) => c.location_id === loc.location_id);
      const activeCount = locCusts.filter((c) => c.account_status === 'Active').length;
      const issueCount = issues.filter(
        (i) => i.location_id === loc.location_id && i.issue_status === 'Ongoing'
      ).length;
      return {
        ...loc,
        total: locCusts.length,
        activeCount,
        issueCount,
      };
    });
    const maxCount = Math.max(...rows.map((r) => r.total), 1);
    return { rows, maxCount };
  }, [locations, customers, issues]);

  // Recent Payment Activity (latest 5)
  const recentPayments = useMemo(() => {
    return [...paymentLogs]
      .sort((a, b) => b.changed_at.localeCompare(a.changed_at))
      .slice(0, 5)
      .map((log) => {
        const bill = billMap.get(log.bill_id);
        const customer = bill ? custMap.get(bill.customer_id) : null;
        return { ...log, bill, customer };
      });
  }, [paymentLogs, billMap, custMap]);

  // Recent Customer Registrations (latest 5)
  const recentCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
      .slice(0, 5);
  }, [customers]);

  // Active Connection Issues
  const activeIssues = useMemo(
    () => issues.filter((i) => i.issue_status === 'Ongoing'),
    [issues]
  );

  // Donut Chart Geometry
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const paidStroke = (stats.paidPct / 100) * circumference;

  const summaryCards = [
    {
      label: 'Total Customers',
      value: stats.totalCustomers,
      meta: `${stats.inactiveCustomers} inactive archived`,
      icon: Users,
      tone: 'text-blue-700 bg-blue-50',
    },
    {
      label: 'Active Customers',
      value: stats.activeCustomers,
      meta: 'Eligible for monthly billing',
      icon: UserCheck,
      tone: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Paid This Month',
      value: stats.paidCount,
      meta: `${stats.paidPct}% of billed total`,
      icon: CheckCircle2,
      tone: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Unpaid This Month',
      value: stats.unpaidCount,
      meta: stats.overdueCount > 0 ? `${stats.overdueCount} overdue past due` : 'None overdue',
      icon: Clock,
      tone: stats.unpaidCount > 0 ? 'text-amber-700 bg-amber-50' : 'text-slate-600 bg-slate-100',
    },
    {
      label: 'Total Collections',
      value: formatCurrency(stats.totalCollections, sym),
      meta: formatBillingMonth(selectedMonthKey),
      icon: Wallet,
      tone: 'text-emerald-700 bg-emerald-50',
    },
    {
      label: 'Outstanding Balance',
      value: formatCurrency(stats.outstandingBalance, sym),
      meta: `${stats.unpaidCount} pending bill${stats.unpaidCount === 1 ? '' : 's'}`,
      icon: AlertCircle,
      tone:
        stats.outstandingBalance > 0 ? 'text-rose-700 bg-rose-50' : 'text-slate-600 bg-slate-100',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Heading + Period Filter + Quick Add */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Dashboard</h2>
          <p className="mt-1 text-sm text-slate-500">
            Monitor your internet business at a glance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 shadow-xs">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedMonthIdx}
              onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
              aria-label="Filter month"
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {MONTH_NAMES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <span className="text-slate-300">/</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Filter year"
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none"
            >
              {[2025, 2026, 2027].map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <Link
            to="/customers/new"
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-800"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Customer
          </Link>
        </div>
      </div>

      {/* 6 Summary KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs transition hover:border-slate-300"
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-medium text-slate-500">{card.label}</p>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${card.tone}`}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
              </div>
              <p className="mt-2.5 truncate tabular-nums text-xl font-semibold tracking-tight text-slate-900">
                {card.value}
              </p>
              <p className="mt-1 truncate text-[11px] text-slate-400">{card.meta}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row: Monthly Collections Chart + Paid vs Unpaid Donut */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Monthly Collections Chart */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Monthly Collections</h3>
              <p className="text-xs text-slate-500">
                Collected revenue versus unpaid dues across the last 6 billing months
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-medium text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-blue-700" />
                Collected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-xs bg-amber-300" />
                Unpaid
              </span>
            </div>
          </div>

          <div className="mt-6">
            <div className="grid h-52 grid-cols-6 items-end gap-3 border-b border-slate-200/80 pb-2 sm:gap-5">
              {monthlySeries.series.map((item) => {
                const collectedPct = Math.round((item.collected / monthlySeries.maxVal) * 100);
                const unpaidPct = Math.round((item.unpaid / monthlySeries.maxVal) * 100);
                const isSelected = item.key === selectedMonthKey;
                const isHovered = hoveredBar === item.key;

                return (
                  <div
                    key={item.key}
                    onMouseEnter={() => setHoveredBar(item.key)}
                    onMouseLeave={() => setHoveredBar(null)}
                    className="relative flex h-full flex-col items-center justify-end"
                  >
                    {isHovered && (
                      <div className="pointer-events-none absolute -top-2 z-10 -translate-y-full whitespace-nowrap rounded-lg border border-slate-200 bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg">
                        <p className="font-semibold">{item.fullLabel}</p>
                        <p className="text-emerald-300">
                          Paid: {formatCurrencyShort(item.collected, sym)}
                        </p>
                        {item.unpaid > 0 && (
                          <p className="text-amber-300">
                            Unpaid: {formatCurrencyShort(item.unpaid, sym)}
                          </p>
                        )}
                      </div>
                    )}

                    <div className="flex h-44 w-full max-w-12 flex-col justify-end gap-0.5">
                      {item.unpaid > 0 && (
                        <div
                          style={{ height: `${Math.max(unpaidPct, 4)}%` }}
                          className="w-full rounded-t-md bg-amber-300 transition-all"
                        />
                      )}
                      <div
                        style={{ height: `${Math.max(collectedPct, item.collected > 0 ? 6 : 2)}%` }}
                        className={`w-full transition-all ${
                          item.unpaid > 0 ? 'rounded-b-xs' : 'rounded-t-md'
                        } ${isSelected ? 'bg-blue-700' : 'bg-blue-600/80 hover:bg-blue-700'}`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-2 grid grid-cols-6 gap-3 text-center sm:gap-5">
              {monthlySeries.series.map((item) => (
                <div key={item.key}>
                  <p
                    className={`text-xs font-medium ${
                      item.key === selectedMonthKey ? 'font-semibold text-blue-700' : 'text-slate-500'
                    }`}
                  >
                    {item.label}
                  </p>
                  <p className="tabular-nums text-[10px] text-slate-400">
                    {formatCurrencyShort(item.collected, sym)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Paid vs Unpaid Billing Chart */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Paid vs. Unpaid Billing</h3>
            <p className="text-xs text-slate-500">{formatBillingMonth(selectedMonthKey)}</p>
          </div>

          <div className="my-5 flex items-center justify-center">
            <div className="relative h-36 w-36">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 140 140">
                <circle
                  cx="70"
                  cy="70"
                  r={radius}
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="14"
                />
                {stats.totalBilled > 0 && (
                  <>
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke="#fbbf24"
                      strokeWidth="14"
                      strokeDasharray={circumference}
                      strokeDashoffset={0}
                    />
                    <circle
                      cx="70"
                      cy="70"
                      r={radius}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="14"
                      strokeLinecap="round"
                      strokeDasharray={`${paidStroke} ${circumference}`}
                    />
                  </>
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="tabular-nums text-2xl font-bold text-slate-900">
                  {stats.paidPct}%
                </span>
                <span className="text-[11px] text-slate-400">Collected</span>
              </div>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                Paid ({stats.paidCount})
              </span>
              <span className="tabular-nums font-semibold text-slate-900">
                {formatCurrency(stats.totalCollections, sym)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-2 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                Unpaid ({stats.unpaidCount})
              </span>
              <span className="tabular-nums font-semibold text-slate-900">
                {formatCurrency(stats.outstandingBalance, sym)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Middle Row: Customer Distribution by Location + Active Connection Issues */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Customer Distribution by Location */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Customer Distribution by Location
              </h3>
              <p className="text-xs text-slate-500">
                Subscriber footprint across active service areas
              </p>
            </div>
            <Link
              to="/locations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
            >
              Manage Locations
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-4">
            {locationDistribution.rows.map((loc) => {
              const pct = Math.round((loc.total / locationDistribution.maxCount) * 100);
              return (
                <div key={loc.location_id}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <Link
                      to={`/locations/${loc.location_id}`}
                      className="flex items-center gap-2 font-semibold text-slate-800 hover:text-blue-700"
                    >
                      <MapPin className="h-3.5 w-3.5 text-slate-400" />
                      {loc.location_name}
                      {loc.issueCount > 0 && (
                        <StatusBadge
                          status="Ongoing"
                          label={`${loc.issueCount} Issue`}
                          size="xs"
                        />
                      )}
                    </Link>
                    <span className="tabular-nums text-slate-500">
                      <strong className="text-slate-900">{loc.total}</strong> customers (
                      {loc.activeCount} active)
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-blue-700 transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Connection Issues */}
        <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Active Connection Issues</h3>
              <p className="text-xs text-slate-500">{activeIssues.length} ongoing incident(s)</p>
            </div>
            <Link
              to="/issues"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
            >
              View All
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {activeIssues.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-emerald-200 bg-emerald-50/40 p-6 text-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-600" />
              <p className="mt-2 text-xs font-semibold text-emerald-900">All Areas Online</p>
              <p className="mt-0.5 text-[11px] text-emerald-700">No ongoing service incidents.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeIssues.map((issue) => {
                const loc = locMap.get(issue.location_id);
                const affectedCount = issueAffected.filter(
                  (a) => a.issue_id === issue.issue_id
                ).length;
                return (
                  <div
                    key={issue.issue_id}
                    className="rounded-lg border border-rose-200/80 bg-rose-50/40 p-3.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-900">{issue.issue_title}</p>
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-600" />
                    </div>
                    <p className="mt-1 text-[11px] text-slate-600">
                      {loc?.location_name || issue.location_id} ·{' '}
                      <strong className="text-rose-700">{affectedCount} affected</strong>
                    </p>
                    <p className="mt-1 text-[11px] text-slate-400">
                      Reported {formatDate(issue.reported_at)}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bottom Row: Recent Payment Activity + Recent Customer Registrations */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Recent Payment Activity */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Payment Activity</h3>
              <p className="text-xs text-slate-500">Latest confirmed payments and status updates</p>
            </div>
            <Link
              to="/billing?tab=history"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
            >
              View History
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentPayments.map((log) => (
              <div
                key={log.log_id}
                className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <Link
                    to={log.customer ? `/customers/${log.customer.customer_id}` : '/billing'}
                    className="block truncate text-xs font-semibold text-slate-900 hover:text-blue-700"
                  >
                    {log.customer?.full_name || log.bill_id}
                  </Link>
                  <p className="truncate text-[11px] text-slate-500">
                    {log.bill ? formatBillingMonth(log.bill.billing_month) : log.bill_id} ·{' '}
                    {formatDateTime(log.changed_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2.5">
                  {log.bill && (
                    <span className="tabular-nums text-xs font-semibold text-slate-800">
                      {formatCurrencyShort(log.bill.amount_due, sym)}
                    </span>
                  )}
                  <StatusBadge status={log.new_status} size="xs" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Customer Registrations */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Recent Customer Registrations
              </h3>
              <p className="text-xs text-slate-500">Most recently onboarded internet subscribers</p>
            </div>
            <Link
              to="/customers"
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:underline"
            >
              All Customers
              <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {recentCustomers.map((c) => {
              const loc = locMap.get(c.location_id);
              const plan = planMap.get(c.plan_id);
              return (
                <div
                  key={c.customer_id}
                  className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <Link
                      to={`/customers/${c.customer_id}`}
                      className="block truncate text-xs font-semibold text-slate-900 hover:text-blue-700"
                    >
                      {c.full_name}
                    </Link>
                    <p className="truncate text-[11px] text-slate-500">
                      {loc?.location_name || 'Unassigned'} · {plan?.plan_name || '—'} · Added{' '}
                      {formatDate(c.installation_date)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums text-xs font-semibold text-slate-800">
                      {formatCurrencyShort(c.monthly_rate, sym)}
                    </span>
                    <StatusBadge status={c.connection_status} size="xs" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
