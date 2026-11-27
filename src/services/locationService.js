// Location domain operations (mock-backed, structured for future Supabase integration)

export function createLocationRecord(locations, payload) {
  const maxNum = locations.reduce((acc, loc) => {
    const match = loc.location_id.match(/LOC-(\d+)/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 100);
  const now = new Date().toISOString();
  return {
    location_id: `LOC-${maxNum + 1}`,
    location_name: payload.location_name.trim(),
    description: (payload.description || '').trim(),
    address: (payload.address || '').trim(),
    remarks: (payload.remarks || '').trim(),
    status: payload.status || 'Active',
    created_at: now,
    updated_at: now,
  };
}

export function updateLocationRecord(locations, locationId, updates) {
  const now = new Date().toISOString();
  return locations.map((loc) =>
    loc.location_id === locationId
      ? {
          ...loc,
          ...updates,
          location_name: (updates.location_name ?? loc.location_name).trim(),
          description: (updates.description ?? loc.description).trim(),
          address: (updates.address ?? loc.address).trim(),
          remarks: (updates.remarks ?? loc.remarks ?? '').trim(),
          updated_at: now,
        }
      : loc
  );
}

export function getLocationStats(locationId, customers, bills, issues, selectedMonth) {
  const locCustomers = customers.filter((c) => c.location_id === locationId);
  const customerIds = new Set(locCustomers.map((c) => c.customer_id));
  const activeCustomers = locCustomers.filter((c) => c.account_status === 'Active').length;
  const inactiveCustomers = locCustomers.length - activeCustomers;

  const monthBills = bills.filter(
    (b) => customerIds.has(b.customer_id) && (!selectedMonth || b.billing_month === selectedMonth)
  );
  const paidBills = monthBills.filter((b) => b.payment_status === 'Paid');
  const unpaidBills = monthBills.filter((b) => b.payment_status === 'Unpaid');
  const totalCollected = paidBills.reduce((sum, b) => sum + Number(b.amount_due), 0);
  const outstandingBalance = unpaidBills.reduce((sum, b) => sum + Number(b.amount_due), 0);

  const ongoingIssues = issues.filter(
    (i) => i.location_id === locationId && i.issue_status === 'Ongoing'
  ).length;

  return {
    totalCustomers: locCustomers.length,
    activeCustomers,
    inactiveCustomers,
    paidCount: paidBills.length,
    unpaidCount: unpaidBills.length,
    totalCollected,
    outstandingBalance,
    ongoingIssues,
  };
}
