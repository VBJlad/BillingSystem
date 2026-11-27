export const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function formatCurrency(amount, symbol = '₱') {
  const num = Number(amount || 0);
  return `${symbol}${num.toLocaleString('en-PH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatCurrencyShort(amount, symbol = '₱') {
  const num = Number(amount || 0);
  const hasDecimals = num % 1 !== 0;
  return `${symbol}${num.toLocaleString('en-PH', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const normalized = dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateLong(dateStr) {
  if (!dateStr) return '—';
  const normalized = dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr;
  const date = new Date(normalized);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatBillingMonth(billingMonthStr) {
  if (!billingMonthStr) return '—';
  const [year, month] = billingMonthStr.split('-').map(Number);
  if (!year || !month) return billingMonthStr;
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

export function getBillingMonthKey(year, monthIndexZeroBased) {
  const m = String(monthIndexZeroBased + 1).padStart(2, '0');
  return `${year}-${m}-01`;
}

export function getTodayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function isBillOverdue(bill, referenceDateStr = getTodayISO()) {
  if (!bill || bill.payment_status === 'Paid') return false;
  if (!bill.due_date) return false;
  return bill.due_date < referenceDateStr;
}

export function computeDueDate(billingMonthStr, billingDay) {
  const [year, month] = billingMonthStr.split('-').map(Number);
  const lastDayOfMonth = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(Math.max(1, Number(billingDay) || 15), lastDayOfMonth);
  return `${year}-${String(month).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

export function exportToCSV(filename, headers, rows) {
  const escapeCell = (val) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escapeCell).join(','),
    ...rows.map((row) => row.map(escapeCell).join(',')),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
