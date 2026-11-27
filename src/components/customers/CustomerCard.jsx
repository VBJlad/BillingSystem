import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, MapPin, Wifi, Calendar, ArrowRight } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatCurrencyShort } from '../../utils/formatters';

export default function CustomerCard({
  customer,
  locationName,
  plan,
  currentBillStatus,
  isOverdue,
  currencySymbol = '₱',
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition hover:border-blue-300 hover:shadow-md">
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              to={`/customers/${customer.customer_id}`}
              className="block truncate text-base font-semibold text-slate-900 hover:text-blue-600"
            >
              {customer.full_name}
            </Link>
            <p className="text-xs font-mono text-slate-400">{customer.customer_id}</p>
          </div>
          <StatusBadge status={customer.account_status} size="xs" />
        </div>

        <div className="mt-3.5 space-y-2 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate font-medium text-slate-700">{locationName || 'Unassigned'}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>{customer.contact_number}</span>
          </div>
          <div className="flex items-center gap-2">
            <Wifi className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span className="truncate">
              {plan ? `${plan.plan_name} (${plan.speed_mbps} Mbps)` : 'No Plan'} ·{' '}
              <strong className="text-slate-800">
                {formatCurrencyShort(customer.monthly_rate, currencySymbol)}/mo
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            <span>Due every day {customer.billing_day} of month</span>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Connection:</span>
            <StatusBadge status={customer.connection_status} size="xs" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-slate-400">Billing:</span>
            {currentBillStatus ? (
              <StatusBadge
                status={isOverdue ? 'Overdue' : currentBillStatus}
                size="xs"
              />
            ) : (
              <span className="text-[11px] font-medium text-slate-400">No bill yet</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Link
          to={`/customers/${customer.customer_id}`}
          className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-blue-50 hover:text-blue-700"
        >
          Open Profile
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  );
}
