// Internet Plans domain operations

export function createPlanRecord(plans, payload) {
  const maxNum = plans.reduce((acc, p) => {
    const match = p.plan_id.match(/PLN-(\d+)/);
    return match ? Math.max(acc, Number(match[1])) : acc;
  }, 100);

  return {
    plan_id: `PLN-${maxNum + 1}`,
    plan_name: payload.plan_name.trim(),
    speed_mbps: Number(payload.speed_mbps),
    monthly_price: Number(payload.monthly_price),
    description: (payload.description || '').trim(),
    status: payload.status || 'Active',
    created_at: new Date().toISOString(),
  };
}

export function updatePlanRecord(plans, planId, updates) {
  return plans.map((p) =>
    p.plan_id === planId
      ? {
          ...p,
          ...updates,
          plan_name: (updates.plan_name ?? p.plan_name).trim(),
          speed_mbps: updates.speed_mbps !== undefined ? Number(updates.speed_mbps) : p.speed_mbps,
          monthly_price:
            updates.monthly_price !== undefined ? Number(updates.monthly_price) : p.monthly_price,
          description: (updates.description ?? p.description).trim(),
        }
      : p
  );
}
