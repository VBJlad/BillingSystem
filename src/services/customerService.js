// Customer domain operations (mock-backed, structured for future Supabase integration)

export function generateNextCustomerId(customers) {
  const maxNum = customers.reduce((acc, c) => {
    const match = c.customer_id.match(/CUST-(\d+)/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 1000);
  return `CUST-${maxNum + 1}`;
}

export function createCustomerRecord(customers, payload) {
  const now = new Date().toISOString();
  return {
    customer_id: generateNextCustomerId(customers),
    location_id: payload.location_id,
    plan_id: payload.plan_id,
    monthly_rate: Number(payload.monthly_rate),
    full_name: payload.full_name.trim(),
    contact_number: payload.contact_number.trim(),
    address: payload.address.trim(),
    installation_date: payload.installation_date,
    billing_day: Number(payload.billing_day),
    connection_status: payload.connection_status || 'Connected',
    account_status: payload.account_status || 'Active',
    remarks: (payload.remarks || '').trim(),
    created_at: now,
    updated_at: now,
  };
}

export function updateCustomerRecord(customers, customerId, updates) {
  const now = new Date().toISOString();
  return customers.map((c) =>
    c.customer_id === customerId
      ? {
          ...c,
          ...updates,
          full_name: (updates.full_name ?? c.full_name).trim(),
          contact_number: (updates.contact_number ?? c.contact_number).trim(),
          address: (updates.address ?? c.address).trim(),
          remarks: (updates.remarks ?? c.remarks ?? '').trim(),
          monthly_rate:
            updates.monthly_rate !== undefined ? Number(updates.monthly_rate) : c.monthly_rate,
          billing_day:
            updates.billing_day !== undefined ? Number(updates.billing_day) : c.billing_day,
          updated_at: now,
        }
      : c
  );
}
