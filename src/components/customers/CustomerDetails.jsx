import React from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Phone,
  MapPin,
  Wifi,
  Calendar,
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import { formatCurrencyShort, formatDate } from '../../utils/formatters';

export default function CustomerDetailsPanel({
  customer,
  location,
  plan,
  ongoingIssues = [],
  pastIssues = [],
  currencySymbol = '₱',
  onTransferLocation,
  onChangePlan,
  onChangeConnectionStatus,
}) {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* Personal Information Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-blue-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Personal Information
            </h3>
          </div>
        </div>
        <dl className="mt-4 space-y-3 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Full Name</dt>
            <dd className="text-right font-semibold text-slate-900">{customer.full_name}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="flex items-center gap-1 text-slate-500">
              <Phone className="h-3.5 w-3.5" /> Contact Number
            </dt>
            <dd className="font-medium text-slate-800">{customer.contact_number}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Complete Address</dt>
            <dd className="mt-0.5 font-medium text-slate-800">{customer.address}</dd>
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
            <dt className="flex items-center gap-1 text-slate-500">
              <MapPin className="h-3.5 w-3.5" /> Assigned Location
            </dt>
            <dd className="flex items-center gap-2">
              {location ? (
                <Link
                  to={`/locations/${location.location_id}`}
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {location.location_name}
                </Link>
              ) : (
                <span className="text-slate-400">Unassigned</span>
              )}
              {onTransferLocation && (
                <button
                  type="button"
                  onClick={onTransferLocation}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  <ArrowRightLeft className="h-3 w-3" />
                  Transfer
                </button>
              )}
            </dd>
          </div>
          {customer.remarks && (
            <div className="rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
              <span className="font-semibold text-slate-700">Remarks:</span> {customer.remarks}
            </div>
          )}
        </dl>
      </div>

      {/* Internet Subscription Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Wifi className="h-4 w-4 text-blue-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Internet Subscription
            </h3>
          </div>
          {onChangePlan && (
            <button
              type="button"
              onClick={onChangePlan}
              className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700"
            >
              <Sliders className="h-3 w-3" />
              Change Plan
            </button>
          )}
        </div>
        <dl className="mt-4 space-y-3 text-xs">
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Internet Plan</dt>
            <dd className="font-semibold text-slate-900">{plan?.plan_name || 'Unknown Plan'}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Internet Speed</dt>
            <dd className="font-semibold text-blue-700">
              {plan ? `${plan.speed_mbps} Mbps` : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Monthly Rate</dt>
            <dd className="tabular-nums text-sm font-bold text-slate-900">
              {formatCurrencyShort(customer.monthly_rate, currencySymbol)}
              <span className="text-[11px] font-normal text-slate-400"> /mo</span>
            </dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="flex items-center gap-1 text-slate-500">
              <Calendar className="h-3.5 w-3.5" /> Installation Date
            </dt>
            <dd className="font-medium text-slate-800">{formatDate(customer.installation_date)}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-slate-500">Billing Day</dt>
            <dd className="font-semibold text-slate-800">Every Day {customer.billing_day}</dd>
          </div>
        </dl>
      </div>

      {/* Connection Information Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-blue-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
              Connection Information
            </h3>
          </div>
          <StatusBadge status={customer.connection_status} size="xs" />
        </div>

        <div className="mt-4 space-y-3.5 text-xs">
          {onChangeConnectionStatus && (
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-slate-500">
                Connection Status
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {['Connected', 'Issue', 'Disconnected'].map((status) => {
                  const active = customer.connection_status === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      onClick={() => onChangeConnectionStatus(status)}
                      className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition ${
                        active
                          ? status === 'Connected'
                            ? 'border-emerald-600 bg-emerald-600 text-white'
                            : status === 'Issue'
                            ? 'border-rose-600 bg-rose-600 text-white'
                            : 'border-slate-700 bg-slate-700 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {status}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <p className="font-semibold text-slate-700">Current Issue</p>
            {ongoingIssues.length > 0 ? (
              <div className="mt-2 space-y-2">
                {ongoingIssues.map((iss) => (
                  <div
                    key={iss.issue_id}
                    className="rounded-lg border border-rose-200 bg-rose-50/60 p-2.5"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-rose-800">
                      <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{iss.issue_title}</span>
                    </div>
                    <p className="mt-0.5 text-[11px] text-rose-700">
                      Reported {formatDate(iss.reported_at)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-1 flex items-center gap-1.5 text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                No ongoing connection issues
              </p>
            )}
          </div>

          <div className="border-t border-slate-100 pt-3">
            <p className="font-semibold text-slate-700">Connection History</p>
            {pastIssues.length === 0 ? (
              <p className="mt-1 text-slate-400">No resolved issue history on record.</p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
                {pastIssues.slice(0, 3).map((iss) => (
                  <li
                    key={iss.issue_id}
                    className="flex items-center justify-between gap-2 text-[11px] text-slate-600"
                  >
                    <span className="truncate">{iss.issue_title}</span>
                    <span className="shrink-0 text-slate-400">{formatDate(iss.resolved_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
