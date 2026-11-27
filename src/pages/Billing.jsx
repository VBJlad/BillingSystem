import React, { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  PlusCircle,
  CheckCircle2,
  RotateCcw,
  Calendar,
  AlertCircle,
  Wallet,
  Receipt,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import SearchBar from '../components/common/SearchBar';
import StatusBadge from '../components/common/StatusBadge';
import DataTable from '../components/common/DataTable';
import Modal from '../components/common/Modal';
import PaymentDialog from '../components/billing/PaymentDialog';
import { previewMonthlyBillGeneration } from '../services/billingService';
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

export default function Billing() {
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    bills,
    customers,
    locations,
    paymentLogs,
    settings,
    generateMonthlyBills,
    updateBillPaymentStatus,
  } = useApp();

  const initialTab = searchParams.get('tab') || 'all';
  const [activeTab, setActiveTab] = useState(initialTab); // all | paid | unpaid | overdue | history
  const [selectedMonthIdx, setSelectedMonthIdx] = useState(10); // Nov 2026
  const [selectedYear, setSelectedYear] = useState(2026);
  const [showAllMonths, setShowAllMonths] = useState(false);
  const [locationFilter, setLocationFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [search, setSearch] = useState('');

  const [genOpen, setGenOpen] = useState(false);
  const [genMonthIdx, setGenMonthIdx] = useState(11); // December 2026
  const [genYear, setGenYear] = useState(2026);

  const [paymentModal, setPaymentModal] = useState({
    open: false,
    bill: null,
    customerName: '',
    targetStatus: 'Paid',
  });

  const sym = settings.currency_symbol;
  const selectedMonthKey = getBillingMonthKey(selectedYear, selectedMonthIdx);
  const genMonthKey = getBillingMonthKey(genYear, genMonthIdx);

  const customerMap = useMemo(
    () => new Map(customers.map((c) => [c.customer_id, c])),
    [customers]
  );
  const locationMap = useMemo(
    () => new Map(locations.map((l) => [l.location_id, l])),
    [locations]
  );

  const enrichedBills = useMemo(() => {
    return bills
      .map((bill) => {
        const customer = customerMap.get(bill.customer_id);
        const location = customer ? locationMap.get(customer.location_id) : null;
        return {
          ...bill,
          customerName: customer?.full_name || 'Unknown Customer',
          locationId: customer?.location_id || '',
          locationName: location?.location_name || 'Unassigned',
          overdue: isBillOverdue(bill),
        };
      })
      .sort((a, b) => {
        const monthCmp = b.billing_month.localeCompare(a.billing_month);
        if (monthCmp !== 0) return monthCmp;
        return a.customerName.localeCompare(b.customerName);
      });
  }, [bills, customerMap, locationMap]);

  const periodScopedBills = useMemo(() => {
    const q = search.trim().toLowerCase();
    return enrichedBills.filter((b) => {
      if (!showAllMonths && b.billing_month !== selectedMonthKey) return false;
      if (locationFilter !== 'All' && b.locationId !== locationFilter) return false;
      if (statusFilter === 'Paid' && b.payment_status !== 'Paid') return false;
      if (statusFilter === 'Unpaid' && b.payment_status !== 'Unpaid') return false;
      if (statusFilter === 'Overdue' && !b.overdue) return false;
      if (q) {
        const match =
          b.customerName.toLowerCase().includes(q) ||
          b.customer_id.toLowerCase().includes(q) ||
          b.bill_id.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [enrichedBills, showAllMonths, selectedMonthKey, locationFilter, statusFilter, search]);

  const tabBills = useMemo(() => {
    if (activeTab === 'paid') return periodScopedBills.filter((b) => b.payment_status === 'Paid');
    if (activeTab === 'unpaid')
      return periodScopedBills.filter((b) => b.payment_status === 'Unpaid');
    if (activeTab === 'overdue') return periodScopedBills.filter((b) => b.overdue);
    return periodScopedBills;
  }, [periodScopedBills, activeTab]);

  const summary = useMemo(() => {
    const paid = periodScopedBills.filter((b) => b.payment_status === 'Paid');
    const unpaid = periodScopedBills.filter((b) => b.payment_status === 'Unpaid');
    const overdue = unpaid.filter((b) => b.overdue);
    const totalBilledAmount = periodScopedBills.reduce((s, b) => s + Number(b.amount_due), 0);
    const collectedAmount = paid.reduce((s, b) => s + Number(b.amount_due), 0);
    const unpaidAmount = unpaid.reduce((s, b) => s + Number(b.amount_due), 0);
    const overdueAmount = overdue.reduce((s, b) => s + Number(b.amount_due), 0);
    return {
      total: periodScopedBills.length,
      paidCount: paid.length,
      unpaidCount: unpaid.length,
      overdueCount: overdue.length,
      totalBilledAmount,
      collectedAmount,
      unpaidAmount,
      overdueAmount,
    };
  }, [periodScopedBills]);

  const enrichedLogs = useMemo(() => {
    const billMap = new Map(enrichedBills.map((b) => [b.bill_id, b]));
    const q = search.trim().toLowerCase();
    return paymentLogs
      .map((log) => ({
        ...log,
        bill: billMap.get(log.bill_id) || null,
      }))
      .filter((log) => {
        if (locationFilter !== 'All' && log.bill?.locationId !== locationFilter) return false;
        if (q) {
          return (
            (log.bill?.customerName || '').toLowerCase().includes(q) ||
            log.bill_id.toLowerCase().includes(q) ||
            (log.remarks || '').toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.changed_at.localeCompare(a.changed_at));
  }, [paymentLogs, enrichedBills, locationFilter, search]);

  const generationPreview = useMemo(
    () => previewMonthlyBillGeneration(customers, bills, genMonthKey),
    [customers, bills, genMonthKey]
  );

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'all' ? {} : { tab });
  };

  // Exact Page 8 Table Columns: Customer ID, Customer Name, Location, Billing Month, Amount Due, Due Date, Payment Status, Date Paid, Actions
  const billColumns = [
    {
      key: 'customer_id',
      label: 'Customer ID',
      render: (b) => <span className="font-mono text-xs text-slate-500">{b.customer_id}</span>,
    },
    {
      key: 'customerName',
      label: 'Customer Name',
      render: (b) => (
        <Link
          to={`/customers/${b.customer_id}`}
          className="font-semibold text-slate-900 hover:text-blue-700 hover:underline"
        >
          {b.customerName}
        </Link>
      ),
    },
    {
      key: 'locationName',
      label: 'Location',
      render: (b) => <span className="text-xs text-slate-600">{b.locationName}</span>,
    },
    {
      key: 'billing_month',
      label: 'Billing Month',
      render: (b) => (
        <span className="text-xs font-medium text-slate-800">
          {formatBillingMonth(b.billing_month)}
        </span>
      ),
    },
    {
      key: 'amount_due',
      label: 'Amount Due',
      render: (b) => (
        <span className="tabular-nums text-xs font-bold text-slate-900">
          {formatCurrencyShort(b.amount_due, sym)}
        </span>
      ),
    },
    {
      key: 'due_date',
      label: 'Due Date',
      render: (b) => (
        <span className={`text-xs font-medium ${b.overdue ? 'text-rose-600' : 'text-slate-600'}`}>
          {formatDate(b.due_date)}
        </span>
      ),
    },
    {
      key: 'payment_status',
      label: 'Payment Status',
      render: (b) => (
        <div className="flex items-center gap-1.5">
          {b.overdue && <StatusBadge status="Overdue" size="xs" />}
          <StatusBadge status={b.payment_status} size="xs" />
        </div>
      ),
    },
    {
      key: 'date_paid',
      label: 'Date Paid',
      render: (b) => (
        <span className="text-xs text-slate-500">
          {b.date_paid ? formatDate(b.date_paid) : '—'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: 'Actions',
      headerClassName: 'text-right',
      cellClassName: 'text-right',
      render: (b) =>
        b.payment_status === 'Paid' ? (
          <button
            type="button"
            onClick={() =>
              setPaymentModal({
                open: true,
                bill: b,
                customerName: b.customerName,
                targetStatus: 'Unpaid',
              })
            }
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
          >
            <RotateCcw className="h-3 w-3" />
            Mark Unpaid
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              setPaymentModal({
                open: true,
                bill: b,
                customerName: b.customerName,
                targetStatus: 'Paid',
              })
            }
            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-3 w-3" />
            Mark Paid
          </button>
        ),
    },
  ];

  const logColumns = [
    {
      key: 'log_id',
      label: 'Log ID',
      render: (l) => <span className="font-mono text-xs text-slate-500">{l.log_id}</span>,
    },
    {
      key: 'customer',
      label: 'Customer & Bill',
      render: (l) => (
        <div>
          {l.bill ? (
            <Link
              to={`/customers/${l.bill.customer_id}`}
              className="font-semibold text-slate-900 hover:text-blue-700 hover:underline"
            >
              {l.bill.customerName}
            </Link>
          ) : (
            <span className="font-semibold text-slate-700">{l.bill_id}</span>
          )}
          <p className="text-[11px] text-slate-400">
            {l.bill
              ? `${formatBillingMonth(l.bill.billing_month)} · ${formatCurrencyShort(l.bill.amount_due, sym)}`
              : l.bill_id}
          </p>
        </div>
      ),
    },
    {
      key: 'transition',
      label: 'Status Change',
      render: (l) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge status={l.previous_status} size="xs" />
          <span className="text-slate-400">→</span>
          <StatusBadge status={l.new_status} size="xs" />
        </div>
      ),
    },
    {
      key: 'changed_at',
      label: 'Timestamp',
      render: (l) => <span className="text-xs text-slate-500">{formatDateTime(l.changed_at)}</span>,
    },
    {
      key: 'remarks',
      label: 'Remarks',
      cellClassName: 'max-w-xs whitespace-normal',
      render: (l) => <span className="text-xs text-slate-600">{l.remarks || '—'}</span>,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Heading */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            Billing Management
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Generate monthly bills, record manual payments, and review payment audit history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setGenOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-blue-800"
        >
          <PlusCircle className="h-4 w-4" />
          Generate Monthly Bills
        </button>
      </div>

      {/* 4 Summary Cards: Total Billed, Total Collected, Total Unpaid, Overdue Amount */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Billed</span>
            <Receipt className="h-4 w-4 text-blue-700" />
          </div>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-slate-900">
            {formatCurrency(summary.totalBilledAmount, sym)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{summary.total} bill(s) in period</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Collected</span>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-emerald-700">
            {formatCurrency(summary.collectedAmount, sym)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{summary.paidCount} paid bill(s)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Total Unpaid</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-amber-600">
            {formatCurrency(summary.unpaidAmount, sym)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{summary.unpaidCount} unpaid bill(s)</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Overdue Amount</span>
            <AlertCircle className="h-4 w-4 text-rose-600" />
          </div>
          <p className="mt-2 tabular-nums text-2xl font-semibold text-rose-600">
            {formatCurrency(summary.overdueAmount, sym)}
          </p>
          <p className="mt-0.5 text-[11px] text-slate-400">{summary.overdueCount} past due date</p>
        </div>
      </div>

      {/* Filters & Quick Tabs */}
      <div className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {[
              { id: 'all', label: `All Bills (${summary.total})` },
              { id: 'paid', label: `Paid (${summary.paidCount})` },
              { id: 'unpaid', label: `Unpaid (${summary.unpaidCount})` },
              { id: 'overdue', label: `Overdue (${summary.overdueCount})` },
              { id: 'history', label: `Payment History (${enrichedLogs.length})` },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleTabChange(t.id)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === t.id
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search customer or bill ID..."
            className="w-full lg:w-64"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500">
            <Calendar className="h-3.5 w-3.5" />
            <span>Period:</span>
          </div>
          <select
            disabled={showAllMonths}
            value={selectedMonthIdx}
            onChange={(e) => setSelectedMonthIdx(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-800 disabled:opacity-50"
          >
            {MONTH_NAMES.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            disabled={showAllMonths}
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 font-medium text-slate-800 disabled:opacity-50"
          >
            {[2025, 2026, 2027].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
          <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showAllMonths}
              onChange={(e) => setShowAllMonths(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-blue-700"
            />
            All Months
          </label>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700"
          >
            <option value="All">All Locations</option>
            {locations.map((l) => (
              <option key={l.location_id} value={l.location_id}>
                {l.location_name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-slate-700"
          >
            <option value="All">Payment Status: All</option>
            <option value="Paid">Paid</option>
            <option value="Unpaid">Unpaid</option>
            <option value="Overdue">Overdue</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {activeTab === 'history' ? (
        <DataTable
          columns={logColumns}
          data={enrichedLogs}
          keyField="log_id"
          emptyTitle="No payment history logs found"
          emptyDescription="Payment status confirmations and Paid → Unpaid reversions will be listed here."
        />
      ) : (
        <DataTable
          columns={billColumns}
          data={tabBills}
          keyField="bill_id"
          emptyTitle="No billing records found"
          emptyDescription="Try another billing month or click 'Generate Monthly Bills' to create bills for active customers."
        />
      )}

      {/* Generate Monthly Bills Modal */}
      <Modal
        open={genOpen}
        onClose={() => setGenOpen(false)}
        title="Generate Monthly Bills"
        subtitle="Generates Unpaid monthly bills for active customers while preventing duplicates."
        maxWidth="max-w-lg"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">
                Billing Month
              </label>
              <select
                value={genMonthIdx}
                onChange={(e) => setGenMonthIdx(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {MONTH_NAMES.map((m, idx) => (
                  <option key={m} value={idx}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Year</label>
              <select
                value={genYear}
                onChange={(e) => setGenYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900"
              >
                {[2025, 2026, 2027].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs">
            <p className="font-semibold text-slate-800">
              Preview for {formatBillingMonth(genMonthKey)}
            </p>
            <dl className="mt-2.5 space-y-1.5">
              <div className="flex justify-between">
                <dt className="text-slate-500">New bills to generate (Active customers)</dt>
                <dd className="font-bold text-blue-700">
                  {generationPreview.eligible.length} customer(s)
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Already billed (duplicate prevention)</dt>
                <dd className="font-semibold text-slate-700">
                  {generationPreview.skippedDuplicate.length} skipped
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-slate-500">Not yet installed in this period</dt>
                <dd className="font-semibold text-slate-700">
                  {generationPreview.skippedNotInstalled.length} skipped
                </dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2">
                <dt className="font-semibold text-slate-700">Projected Billing Total</dt>
                <dd className="tabular-nums font-bold text-slate-900">
                  {formatCurrency(
                    generationPreview.eligible.reduce((s, c) => s + Number(c.monthly_rate), 0),
                    sym
                  )}
                </dd>
              </div>
            </dl>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={() => setGenOpen(false)}
              className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={generationPreview.eligible.length === 0}
              onClick={() => {
                const count = generateMonthlyBills(genMonthKey);
                if (count > 0) {
                  setSelectedMonthIdx(genMonthIdx);
                  setSelectedYear(genYear);
                  setShowAllMonths(false);
                }
                setGenOpen(false);
              }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Generate {generationPreview.eligible.length} Bill(s)
            </button>
          </div>
        </div>
      </Modal>

      {/* Payment Confirmation Dialog */}
      <PaymentDialog
        open={paymentModal.open}
        onClose={() => setPaymentModal((prev) => ({ ...prev, open: false }))}
        bill={paymentModal.bill}
        customerName={paymentModal.customerName}
        targetStatus={paymentModal.targetStatus}
        currencySymbol={sym}
        onConfirm={({ billId, newStatus, datePaid, remarks }) =>
          updateBillPaymentStatus(billId, { newStatus, datePaid, remarks })
        }
      />
    </div>
  );
}
