import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  AlertTriangle,
  Edit3,
  Archive,
  RotateCcw,
  MoreHorizontal,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';

export default function LocationCard({ location, stats, onEdit, onToggleArchive }) {
  const isArchived = location.status === 'Inactive';
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div
      className={`flex flex-col justify-between rounded-xl border bg-white p-5 shadow-xs transition hover:border-slate-300 hover:shadow-sm ${
        isArchived ? 'border-slate-200/70 opacity-75' : 'border-slate-200'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                isArchived ? 'bg-slate-100 text-slate-500' : 'bg-blue-50 text-blue-700'
              }`}
            >
              <MapPin className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <Link
                to={`/locations/${location.location_id}`}
                className="block truncate text-sm font-semibold text-slate-900 hover:text-blue-700"
              >
                {location.location_name}
              </Link>
              <div className="mt-0.5 flex items-center gap-2">
                <StatusBadge status={location.status} size="xs" />
                {stats.ongoingIssues > 0 ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600">
                    <AlertTriangle className="h-3 w-3" />
                    {stats.ongoingIssues} active issue{stats.ongoingIssues > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                    <CheckCircle2 className="h-3 w-3" />
                    Operational
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Three-dot Action Menu */}
          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Location actions"
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 z-20 mt-1 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(location);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <Edit3 className="h-3.5 w-3.5 text-slate-400" />
                  Edit Location
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onToggleArchive(location);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  {isArchived ? (
                    <>
                      <RotateCcw className="h-3.5 w-3.5 text-emerald-600" />
                      Reactivate
                    </>
                  ) : (
                    <>
                      <Archive className="h-3.5 w-3.5 text-rose-500" />
                      Archive Location
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-500">
          {location.description || 'No description provided.'}
        </p>

        {/* Clean 4-metric strip */}
        <div className="mt-4 grid grid-cols-4 divide-x divide-slate-200/80 rounded-lg border border-slate-200/80 bg-slate-50/70 py-2.5 text-center">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Total</p>
            <p className="mt-0.5 tabular-nums text-sm font-semibold text-slate-900">
              {stats.totalCustomers}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Active</p>
            <p className="mt-0.5 tabular-nums text-sm font-semibold text-slate-900">
              {stats.activeCustomers}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Paid</p>
            <p className="mt-0.5 tabular-nums text-sm font-semibold text-emerald-700">
              {stats.paidCount}
            </p>
          </div>
          <div>
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Unpaid</p>
            <p
              className={`mt-0.5 tabular-nums text-sm font-semibold ${
                stats.unpaidCount > 0 ? 'text-amber-600' : 'text-slate-400'
              }`}
            >
              {stats.unpaidCount}
            </p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3.5">
        <span className="truncate text-[11px] text-slate-400">{location.address}</span>
        <Link
          to={`/locations/${location.location_id}`}
          className="ml-2 inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          Manage Location
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
