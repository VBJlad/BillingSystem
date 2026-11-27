// Connection Issues & Affected Customers domain operations

export function createIssueRecord(issues, payload) {
  const maxNum = issues.reduce((acc, i) => {
    const match = i.issue_id.match(/ISS-\d+-(\d+)/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);
  const year = new Date().getFullYear();

  return {
    issue_id: `ISS-${year}-${String(maxNum + 1).padStart(3, '0')}`,
    location_id: payload.location_id,
    issue_title: payload.issue_title.trim(),
    description: (payload.description || '').trim(),
    issue_status: 'Ongoing',
    reported_at: payload.reported_at || new Date().toISOString(),
    resolved_at: null,
    remarks: (payload.remarks || '').trim(),
  };
}

export function buildAffectedCustomerRecords(existingAffected, issueId, customerIds) {
  const maxNum = existingAffected.reduce((acc, a) => {
    const match = a.id.match(/IAC-(\d+)/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 0);

  const uniqueIds = Array.from(new Set(customerIds));
  const now = new Date().toISOString();
  let counter = maxNum;

  return uniqueIds
    .filter(
      (cid) =>
        !existingAffected.some((a) => a.issue_id === issueId && a.customer_id === cid)
    )
    .map((cid) => {
      counter += 1;
      return {
        id: `IAC-${String(counter).padStart(3, '0')}`,
        issue_id: issueId,
        customer_id: cid,
        added_at: now,
      };
    });
}
