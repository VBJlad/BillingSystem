import React, { useState, useMemo } from 'react';
import {
  Download,
  FileText,
  FileSpreadsheet,
  Wallet,
  AlertCircle,
  MapPin,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import { getLocationStats } from '../services/locationService';
import {
  MONTH_NAMES,
  getBillingMonthKey,
  formatBillingMonth,
  formatCurrency,
  formatCurrencyShort,
  formatDate,
  isBillOverdue,
  exportToCSV,
} from '../utils/formatters';

const REPORT_TABS = [
  { id: 'monthly', label: 'Monthly Billing Report', icon: FileSpreadsheet },
  { id: 'collections', label: 'Payment Collection Report', icon: Wallet },
  { id: 'outstanding', label: 'Outstanding Balance Report', icon: AlertCircle },
  { id: 'location', label: 'Location Customer Report', icon: MapPin },
  { id: 'customer', label: 'Customer Billing History', icon: Users },
  { id: 'issue', label: 'Connection Issue Report', icon: AlertTriangle },
];

export default function Reports() {
  const { customers, locations, plans, bills, issues, issueAffected, settings } = useApp();
  const sym = settings.currency_symbol;

  const [reportTab, setReportTab] = useState('monthly');
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(10); // Nov 2026
  const [selectedYear, setSelectedYear] = useState(2026);
  const [locationFilter, setLocationFilter] = useState('All');

  const selectedMonthKey = getBillingMonthKey(selectedYear, selectedMonthIdx);
  const locMap = useMemo(() => new Map(locations.map((l) => [l.location_id, l])), [locations]);
  const planMap = useMemo(() => new Map(plans.map((p) => [p.plan_id, p])), [plans]);
  const custMap = useMemo(() => new Map(customers.map((c) => [c.customer_id, c])), [customers]);

  // Scoped bills for the selected Month & Location
  const monthScopedBills = useMemo(() => {
    return bills
      .filter((b) => b.billing_month === selectedMonthKey)
      .map((b) => {
        const c = custMap.get(b.customer_id);
        const loc = c ? locMap.get(c.location_id) : null;
        const plan = c ? planMap.get(c.plan_id) : null;
        return {
          ...b,
          customer_name: c?.full_name || 'Unknown',
          location_id: c?.location_id || '',
          location_name: loc?.location_name || 'Unassigned',
          plan_name: plan?.plan_name || '—',
          overdue: isBillOverdue(b),
        };
      })
      .filter((r) => (locationFilter === 'All' ? true : r.location_id === locationFilter))
      .sort((a, b) => a.customer_name.localeCompare(b.customer_name));
  }, [bills, selectedMonthKey, custMap, locMap, planMap, locationFilter]);

  // 1. Monthly Billing Summary + Yearly Breakdown
  const monthlySummary = useMemo(() => {
    const paid = monthScopedBills.filter((b) => b.payment_status === 'Paid');
    const unpaid = monthScopedBills.filter((b) => b.payment_status === 'Unpaid');
    const collected = paid.reduce((s, b) => s + Number(b.amount_due), 0);
    const outstanding = unpaid.reduce((s, b) => s + Number(b.amount_due), 0);
    const totalAmount = collected + outstanding;
    return {
      totalBilled: monthScopedBills.length,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      collected,
      outstanding,
      totalAmount,
      rate: totalAmount > 0 ? Math.round((collected / totalAmount) * 100) : 0,
    };
  }, [monthScopedBills]);

  const yearlyBreakdown = useMemo(() => {
    const map = new Map();
    for (const bill of bills) {
      if (!bill.billing_month.startsWith(String(selectedYear))) continue;
      if (locationFilter !== 'All') {
        const c = custMap.get(bill.customer_id);
        if (!c || c.location_id !== locationFilter) continue;
      }
      const row = map.get(bill.billing_month) || {
        billing_month: bill.billing_month,
        total: 0,
        paidCount: 0,
        unpaidCount: 0,
        collected: 0,
        outstanding: 0,
      };
      row.total += 1;
      if (bill.payment_status === 'Paid') {
        row.paidCount += 1;
        row.collected += Number(bill.amount_due);
      } else {
        row.unpaidCount += 1;
        row.outstanding += Number(bill.amount_due);
      }
      map.set(bill.billing_month, row);
    }
    return Array.from(map.values()).sort((a, b) => b.billing_month.localeCompare(a.billing_month));
  }, [bills, selectedYear, locationFilter, custMap]);

  // 2. Payment Collection Report (Paid bills in selected period)
  const collectionRows = useMemo(
    () =>
      monthScopedBills
        .filter((b) => b.payment_status === 'Paid')
        .sort((a, b) => (b.date_paid || '').localeCompare(a.date_paid || '')),
    [monthScopedBills]
  );

  // 3. Outstanding Balance Report (All Unpaid bills in selected year or month)
  const outstandingRows = useMemo(() => {
    return bills
      .filter(
        (b) => b.payment_status === 'Unpaid' && b.billing_month.startsWith(String(selectedYear))
      )
      .map((b) => {
        const c = custMap.get(b.customer_id);
        const loc = c ? locMap.get(c.location_id) : null;
        return {
          ...b,
          customer_name: c?.full_name || 'Unknown',
          contact_number: c?.contact_number || '—',
          location_id: c?.location_id || '',
          location_name: loc?.location_name || 'Unassigned',
          overdue: isBillOverdue(b),
        };
      })
      .filter((r) => (locationFilter === 'All' ? true : r.location_id === locationFilter))
      .sort((a, b) => a.due_date.localeCompare(b.due_date));
  }, [bills, selectedYear, custMap, locMap, locationFilter]);

  // 4. Location Customer Report
  const locationReportRows = useMemo(() => {
    return locations
      .filter((l) => (locationFilter === 'All' ? true : l.location_id === locationFilter))
      .map((l) => ({
        location_id: l.location_id,
        location_name: l.location_name,
        status: l.status,
        ...getLocationStats(l.location_id, customers, bills, issues, selectedMonthKey),
      }));
  }, [locations, locationFilter, customers, bills, issues, selectedMonthKey]);

  // 6. Connection Issue Report
  const issueReportRows = useMemo(() => {
    return issues
      .filter((i) => {
        if (locationFilter !== 'All' && i.location_id !== locationFilter) return false;
        if (i.reported_at && !i.reported_at.startsWith(String(selectedYear))) return false;
        return true;
      })
      .map((i) => ({
        ...i,
        location_name: locMap.get(i.location_id)?.location_name || i.location_id,
        affected_count: issueAffected.filter((a) => a.issue_id === i.issue_id).length,
      }))
      .sort((a, b) => (b.reported_at || '').localeCompare(a.reported_at || ''));
  }, [issues, issueAffected, locationFilter, selectedYear, locMap]);

  const handleExportCSV = () => {
    if (reportTab === 'monthly') {
      exportToCSV(
        `monthly-billing-report-${selectedYear}.csv`,
        ['Billing Month', 'Customers Billed', 'Paid Bills', 'Unpaid Bills', 'Collected', 'Outstanding'],
        yearlyBreakdown.map((r) => [
          formatBillingMonth(r.billing_month),
          r.total,
          r.paidCount,
          r.unpaidCount,
          r.collected,
          r.outstanding,
        ])
      );
    } else if (reportTab === 'collections') {
      exportToCSV(
        `payment-collection-report-${selectedMonthKey.slice(0, 7)}.csv`,
        ['Bill ID', 'Customer Name', 'Location', 'Plan', 'Amount Paid', 'Date Paid'],
        collectionRows.map((r) => [
          r.bill_id,
          r.customer_name,
          r.location_name,
          r.plan_name,
          r.amount_due,
          r.date_paid || '',
        ])
      );
    } else if (reportTab === 'outstanding') {
      exportToCSV(
        `outstanding-balance-report-${selectedYear}.csv`,
        ['Customer Name', 'Contact', 'Location', 'Billing Month', 'Amount Due', 'Due Date', 'Overdue'],
        outstandingRows.map((r) => [
          r.customer_name,
          r.contact_number,
          r.location_name,
          formatBillingMonth(r.billing_month),
          r.amount_due,
          r.due_date,
          r.overdue ? 'Yes' : 'No',
        ])
      );
    } else if (reportTab === 'location') {
      exportToCSV(
        `location-customer-report-${selectedMonthKey.slice(0, 7)}.csv`,
        ['Location', 'Total Customers', 'Active', 'Inactive', 'Paid', 'Unpaid', 'Active Issues', 'Collected'],
        locationReportRows.map((r) => [
          r.location_name,
          r.totalCustomers,
          r.activeCustomers,
          r.inactiveCustomers,
          r.paidCount,
          r.unpaidCount,
          r.ongoingIssues,
          r.totalCollected,
        ])
      );
    } else if (reportTab === 'customer') {
      exportToCSV(
        `customer-billing-history-${selectedMonthKey.slice(0, 7)}.csv`,
        ['Customer ID', 'Customer Name', 'Location', 'Plan', 'Amount Due', 'Status', 'Due Date', 'Date Paid'],
        monthScopedBills.map((r) => [
          r.customer_id,
          r.customer_name,
          r.location_name,
          r.plan_name,
          r.amount_due,
          r.payment_status,
          r.due_date,
          r.date_paid || 'Not yet paid',
        ])
      );
    } else {
      exportToCSV(
        `connection-issue-report-${selectedYear}.csv`,
        ['Issue ID', 'Issue Title', 'Location', 'Affected Customers', 'Date Reported', 'Status', 'Date Resolved'],
        issueReportRows.map((r) => [
          r.issue_id,
          r.issue_title,
          r.location_name,
          r.affected_count,
          r.reported_at?.slice(0, 10) || '',
          r.issue_status,
          r.resolved_at?.slice(0, 10) || 'Ongoing',
        ])
      );
    }
  };

  const activeTabMeta = REPORT_TABS.find((t) => t.id === reportTab);

  return (
    <div className="space-y-6">
      {/* Page Heading + Export CSV / PDF */}
      <div className="no-print flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Reports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Generate billing, collection, outstanding balance, location, and connection issue
            reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-xs transition hover:bg-slate-50"
          >
            <Download className="h-3.5 w-3.5 text-blue-700" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-800"
          >
            <FileText className="h-3.5 w-3.5" />
            Export PDF
          </button>
        </div>
      </div>

      {/* Category Tabs + Filters */}
      <div className="no-print space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          {REPORT_TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setReportTab(t.id)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                  reportTab === t.id
                    ? 'bg-blue-50 text-blue-700 ring-1 ring-inset ring-blue-700/20'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 border-t border-slate-100 pt-3 text-xs">
          <span className="font-medium text-slate-500">Filters:</span>
          {reportTab !== 'issue' && reportTab !== 'outstanding' && (
            <select
              value={selectedMonthIdx}
              onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-800"
            >
              {MONTH_NAMES.map((m, idx) => (
                <option key={m} value={idx}>
                  {m}
                </option>
              ))}
            </select>
          )}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-800"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700"
          >
            <option value="All">All Locations</option>
            {locations.map((l) => (
              <option key={l.location_id} value={l.location_id}>
                {l.location_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Printable Report Header */}
      <div className="hidden print:block border-b border-slate-300 pb-3">
        <h1 className="text-lg font-bold text-slate-900">
          {settings.business_name || settings.isp_name} — {activeTabMeta?.label}
        </h1>
        <p className="text-xs text-slate-500">
          Period: {formatBillingMonth(selectedMonthKey)} · Location:{' '}
          {locationFilter === 'All' ? 'All Locations' : locMap.get(locationFilter)?.location_name}
        </p>
      </div>

      {/* 1. Monthly Billing Report */}
      {reportTab === 'monthly' && (
        <div className="space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
            <h3 className="text-sm font-semibold text-slate-900">
              {formatBillingMonth(selectedMonthKey)} Overview
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-5">
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-3.5">
                <p className="text-xs text-slate-500">Customers Billed</p>
                <p className="mt-1 tabular-nums text-xl font-semibold text-slate-900">
                  {monthlySummary.totalBilled}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-3.5">
                <p className="text-xs text-slate-500">Paid Bills</p>
                <p className="mt-1 tabular-nums text-xl font-semibold text-emerald-700">
                  {monthlySummary.paidCount}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-3.5">
                <p className="text-xs text-slate-500">Unpaid Bills</p>
                <p className="mt-1 tabular-nums text-xl font-semibold text-amber-600">
                  {monthlySummary.unpaidCount}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-3.5">
                <p className="text-xs text-slate-500">Total Collected</p>
                <p className="mt-1 tabular-nums text-lg font-semibold text-emerald-700">
                  {formatCurrency(monthlySummary.collected, sym)}
                </p>
              </div>
              <div className="rounded-lg border border-slate-200/80 bg-slate-50/70 p-3.5">
                <p className="text-xs text-slate-500">Outstanding Balance</p>
                <p className="mt-1 tabular-nums text-lg font-semibold text-rose-600">
                  {formatCurrency(monthlySummary.outstanding, sym)}
                </p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-slate-500">Collection Rate</span>
                <span className="tabular-nums font-semibold text-slate-900">
                  {monthlySummary.rate}%
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-700"
                  style={{ width: `${monthlySummary.rate}%` }}
                />
              </div>
            </div>
          </div>

          <DataTable
            columns={[
              {
                key: 'billing_month',
                label: 'Billing Month',
                render: (r) => (
                  <span className="font-semibold text-slate-900">
                    {formatBillingMonth(r.billing_month)}
                  </span>
                ),
              },
              { key: 'total', label: 'Customers Billed' },
              {
                key: 'paidCount',
                label: 'Paid',
                render: (r) => <span className="font-semibold text-emerald-700">{r.paidCount}</span>,
              },
              {
                key: 'unpaidCount',
                label: 'Unpaid',
                render: (r) => <span className="font-semibold text-amber-600">{r.unpaidCount}</span>,
              },
              {
                key: 'collected',
                label: 'Collected',
                render: (r) => (
                  <span className="tabular-nums font-semibold text-emerald-700">
                    {formatCurrency(r.collected, sym)}
                  </span>
                ),
              },
              {
                key: 'outstanding',
                label: 'Outstanding',
                render: (r) => (
                  <span className="tabular-nums font-semibold text-rose-600">
                    {formatCurrency(r.outstanding, sym)}
                  </span>
                ),
              },
            ]}
            data={yearlyBreakdown}
            keyField="billing_month"
          />
        </div>
      )}

      {/* 2. Payment Collection Report */}
      {reportTab === 'collections' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
            <div>
              <p className="text-xs text-slate-500">
                Total Collections — {formatBillingMonth(selectedMonthKey)}
              </p>
              <p className="mt-0.5 tabular-nums text-2xl font-semibold text-emerald-700">
                {formatCurrency(
                  collectionRows.reduce((s, r) => s + Number(r.amount_due), 0),
                  sym
                )}
              </p>
            </div>
            <span className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
              {collectionRows.length} paid receipt(s)
            </span>
          </div>

          <DataTable
            columns={[
              {
                key: 'bill_id',
                label: 'Bill ID',
                render: (r) => <span className="font-mono text-xs text-slate-500">{r.bill_id}</span>,
              },
              {
                key: 'customer_name',
                label: 'Customer',
                render: (r) => <span className="font-semibold text-slate-900">{r.customer_name}</span>,
              },
              { key: 'location_name', label: 'Location' },
              { key: 'plan_name', label: 'Internet Plan' },
              {
                key: 'amount_due',
                label: 'Amount Collected',
                render: (r) => (
                  <span className="tabular-nums font-bold text-emerald-700">
                    {formatCurrencyShort(r.amount_due, sym)}
                  </span>
                ),
              },
              {
                key: 'date_paid',
                label: 'Date Paid',
                render: (r) => <span className="text-xs text-slate-600">{formatDate(r.date_paid)}</span>,
              },
            ]}
            data={collectionRows}
            keyField="bill_id"
            emptyTitle="No collections recorded for this period"
            emptyDescription="Select another billing month or location filter."
          />
        </div>
      )}

      {/* 3. Outstanding Balance Report */}
      {reportTab === 'outstanding' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-xs">
            <div>
              <p className="text-xs text-slate-500">Total Unpaid Receivables ({selectedYear})</p>
              <p className="mt-0.5 tabular-nums text-2xl font-semibold text-rose-600">
                {formatCurrency(
                  outstandingRows.reduce((s, r) => s + Number(r.amount_due), 0),
                  sym
                )}
              </p>
            </div>
            <span className="rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">
              {outstandingRows.filter((r) => r.overdue).length} overdue · {outstandingRows.length}{' '}
              total unpaid
            </span>
          </div>

          <DataTable
            columns={[
              {
                key: 'customer_name',
                label: 'Customer',
                render: (r) => (
                  <div>
                    <p className="font-semibold text-slate-900">{r.customer_name}</p>
                    <p className="text-[11px] text-slate-400">{r.contact_number}</p>
                  </div>
                ),
              },
              { key: 'location_name', label: 'Location' },
              {
                key: 'billing_month',
                label: 'Billing Month',
                render: (r) => (
                  <span className="text-xs font-medium">{formatBillingMonth(r.billing_month)}</span>
                ),
              },
              {
                key: 'amount_due',
                label: 'Amount Due',
                render: (r) => (
                  <span className="tabular-nums font-bold text-slate-900">
                    {formatCurrencyShort(r.amount_due, sym)}
                  </span>
                ),
              },
              {
                key: 'due_date',
                label: 'Due Date',
                render: (r) => (
                  <span className={`text-xs ${r.overdue ? 'font-semibold text-rose-600' : ''}`}>
                    {formatDate(r.due_date)}
                  </span>
                ),
              },
              {
                key: 'status',
                label: 'Status',
                render: (r) => <StatusBadge status={r.overdue ? 'Overdue' : 'Unpaid'} size="xs" />,
              },
            ]}
            data={outstandingRows}
            keyField="bill_id"
            emptyTitle="Zero outstanding balances"
            emptyDescription="All generated bills for the selected filter are fully settled."
          />
        </div>
      )}

      {/* 4. Location Customer Report */}
      {reportTab === 'location' && (
        <DataTable
          columns={[
            {
              key: 'location_name',
              label: 'Location Name',
              render: (r) => (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{r.location_name}</span>
                  <StatusBadge status={r.status} size="xs" />
                </div>
              ),
            },
            { key: 'totalCustomers', label: 'Total Customers' },
            {
              key: 'activeCustomers',
              label: 'Active',
              render: (r) => <span className="font-semibold text-emerald-700">{r.activeCustomers}</span>,
            },
            { key: 'inactiveCustomers', label: 'Inactive' },
            {
              key: 'paidCount',
              label: `Paid (${MONTH_NAMES[selectedMonthIdx].slice(0, 3)})`,
              render: (r) => <span className="font-semibold text-emerald-700">{r.paidCount}</span>,
            },
            {
              key: 'unpaidCount',
              label: `Unpaid (${MONTH_NAMES[selectedMonthIdx].slice(0, 3)})`,
              render: (r) => <span className="font-semibold text-amber-600">{r.unpaidCount}</span>,
            },
            {
              key: 'totalCollected',
              label: 'Collected',
              render: (r) => (
                <span className="tabular-nums font-semibold text-slate-900">
                  {formatCurrencyShort(r.totalCollected, sym)}
                </span>
              ),
            },
            {
              key: 'ongoingIssues',
              label: 'Active Issues',
              render: (r) =>
                r.ongoingIssues > 0 ? (
                  <StatusBadge
                    status="Ongoing"
                    label={`${r.ongoingIssues} Ongoing`}
                    size="xs"
                  />
                ) : (
                  <span className="text-xs text-slate-400">0</span>
                ),
            },
          ]}
          data={locationReportRows}
          keyField="location_id"
        />
      )}

      {/* 5. Customer Billing History */}
      {reportTab === 'customer' && (
        <DataTable
          columns={[
            {
              key: 'customer_id',
              label: 'Customer ID',
              render: (r) => <span className="font-mono text-xs text-slate-500">{r.customer_id}</span>,
            },
            {
              key: 'customer_name',
              label: 'Customer Name',
              render: (r) => <span className="font-semibold text-slate-900">{r.customer_name}</span>,
            },
            { key: 'location_name', label: 'Location' },
            { key: 'plan_name', label: 'Internet Plan' },
            {
              key: 'amount_due',
              label: 'Amount Due',
              render: (r) => (
                <span className="tabular-nums font-bold text-slate-900">
                  {formatCurrencyShort(r.amount_due, sym)}
                </span>
              ),
            },
            {
              key: 'payment_status',
              label: 'Payment Status',
              render: (r) => (
                <StatusBadge status={r.overdue ? 'Overdue' : r.payment_status} size="xs" />
              ),
            },
            {
              key: 'due_date',
              label: 'Due Date',
              render: (r) => <span className="text-xs">{formatDate(r.due_date)}</span>,
            },
            {
              key: 'date_paid',
              label: 'Date Paid',
              render: (r) => (
                <span className="text-xs text-slate-500">
                  {r.date_paid ? formatDate(r.date_paid) : '—'}
                </span>
              ),
            },
          ]}
          data={monthScopedBills}
          keyField="bill_id"
          emptyTitle="No customer billing history for this period"
          emptyDescription="Select another billing month or clear location filters."
        />
      )}

      {/* 6. Connection Issue Report */}
      {reportTab === 'issue' && (
        <DataTable
          columns={[
            {
              key: 'issue_id',
              label: 'Issue ID',
              render: (r) => <span className="font-mono text-xs text-slate-500">{r.issue_id}</span>,
            },
            {
              key: 'issue_title',
              label: 'Issue Title',
              cellClassName: 'max-w-xs whitespace-normal',
              render: (r) => <span className="font-semibold text-slate-900">{r.issue_title}</span>,
            },
            { key: 'location_name', label: 'Affected Location' },
            {
              key: 'affected_count',
              label: 'Affected Customers',
              render: (r) => <span className="tabular-nums font-bold">{r.affected_count}</span>,
            },
            {
              key: 'reported_at',
              label: 'Date Reported',
              render: (r) => <span className="text-xs">{formatDate(r.reported_at)}</span>,
            },
            {
              key: 'issue_status',
              label: 'Status',
              render: (r) => <StatusBadge status={r.issue_status} size="xs" />,
            },
            {
              key: 'resolved_at',
              label: 'Date Resolved',
              render: (r) => (
                <span className="text-xs text-slate-500">
                  {r.resolved_at ? formatDate(r.resolved_at) : 'Unresolved'}
                </span>
              ),
            },
          ]}
          data={issueReportRows}
          keyField="issue_id"
          emptyTitle={`No connection issues recorded in ${selectedYear}`}
          emptyDescription="Adjust the year or location filter."
        />
      )}
    </div>
  );
}
