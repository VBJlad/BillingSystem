import { computeDueDate } from '../utils/formatters';

// Billing & Payment Logs domain operations (mock-backed, ready for Supabase RPC / transactions)

export function createMonthlyBillRecord(customer, billingMonthStr, existingBills) {
  const duplicate = existingBills.some(
    (b) => b.customer_id === customer.customer_id && b.billing_month === billingMonthStr
  );
  if (duplicate) return null;

  const ym = billingMonthStr.slice(0, 7).replace('-', '');
  const custSuffix = customer.customer_id.replace('CUST-', '');
  const now = new Date().toISOString();

  return {
    bill_id: `BILL-${ym}-${custSuffix}`,
    customer_id: customer.customer_id,
    billing_month: billingMonthStr,
    amount_due: Number(customer.monthly_rate), // Independent of future plan price edits
    due_date: computeDueDate(billingMonthStr, customer.billing_day),
    payment_status: 'Unpaid',
    date_paid: null,
    created_at: now,
    updated_at: now,
  };
}

export function previewMonthlyBillGeneration(customers, existingBills, billingMonthStr) {
  const activeCustomers = customers.filter((c) => c.account_status === 'Active');
  const [billYear, billMonth] = billingMonthStr.split('-').map(Number);
  const billEndOfMonth = new Date(billYear, billMonth, 0).toISOString().slice(0, 10);

  const eligible = [];
  const skippedDuplicate = [];
  const skippedNotInstalled = [];

  for (const customer of activeCustomers) {
    const exists = existingBills.some(
      (b) => b.customer_id === customer.customer_id && b.billing_month === billingMonthStr
    );
    if (exists) {
      skippedDuplicate.push(customer);
      continue;
    }
    if (customer.installation_date && customer.installation_date > billEndOfMonth) {
      skippedNotInstalled.push(customer);
      continue;
    }
    eligible.push(customer);
  }

  return { eligible, skippedDuplicate, skippedNotInstalled };
}

export function createPaymentLogRecord(logs, { bill_id, admin_id, previous_status, new_status, remarks }) {
  const maxNum = logs.reduce((acc, l) => {
    const match = l.log_id.match(/LOG-(\d+)/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);

  return {
    log_id: `LOG-${String(maxNum + 1).padStart(3, '0')}`,
    bill_id,
    admin_id,
    previous_status,
    new_status,
    changed_at: new Date().toISOString(),
    remarks: (remarks || '').trim(),
  };
}
