import React from 'react';

const STATUS_STYLES = {
  Active: {
    bg: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dot: 'bg-emerald-500',
  },
  Inactive: {
    bg: 'bg-slate-100 text-slate-600 ring-slate-500/20',
    dot: 'bg-slate-400',
  },
  Paid: {
    bg: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dot: 'bg-emerald-500',
  },
  Unpaid: {
    bg: 'bg-amber-50 text-amber-700 ring-amber-600/20',
    dot: 'bg-amber-500',
  },
  Overdue: {
    bg: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    dot: 'bg-rose-500',
  },
  Connected: {
    bg: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dot: 'bg-emerald-500',
  },
  Disconnected: {
    bg: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    dot: 'bg-slate-500',
  },
  Issue: {
    bg: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    dot: 'bg-rose-500',
  },
  Ongoing: {
    bg: 'bg-rose-50 text-rose-700 ring-rose-600/20',
    dot: 'bg-rose-500',
  },
  Resolved: {
    bg: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    dot: 'bg-emerald-500',
  },
};

export default function StatusBadge({ status, label, size = 'sm', className = '' }) {
  const style = STATUS_STYLES[status] || {
    bg: 'bg-slate-100 text-slate-700 ring-slate-500/20',
    dot: 'bg-slate-400',
  };
  const sizeClass =
    size === 'xs' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-0.5 text-xs';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ${style.bg} ${sizeClass} ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {label ?? status}
    </span>
  );
}
