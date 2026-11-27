import React from 'react';
import { Calendar, CheckCircle2, RotateCcw, Clock } from 'lucide-react';
import StatusBadge from '../common/StatusBadge';
import {
  formatBillingMonth,
  formatCurrencyShort,
  formatDateLong,
  isBillOverdue,
} from '../../utils/formatters';

export default function BillingCard({ bill, currencySymbol = '₱', onAction }) {
  const isPaid = bill.payment_status === 'Paid';
  const overdue = isBillOverdue(bill);

  return (
    <div
      className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition hover:shadow-md ${
        overdue
          ? 'border-rose-200 ring-1 ring-rose-100'
          : isPaid
          ? 'border-emerald-200/80'
          : 'border-slate-200'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="text-base font-bold text-slate-900">
              {formatBillingMonth(bill.billing_month)}
            </h4>
            <p className="font-mono text-[11px] text-slate-400">{bill.bill_id}</p>
          </div>
          <div className="flex items-center gap-1.5">
            {overdue && <StatusBadge status="Overdue" size="xs" />}
            <StatusBadge status={bill.payment_status} size="xs" />
          </div>
        </div>

        <div className="mt-4 space-y-2 rounded-xl bg-slate-50 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Amount Due</span>
            <span className="text-base font-bold text-slate-900">
              {formatCurrencyShort(bill.amount_due, currencySymbol)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-500">
              <Calendar className="h-3.5 w-3.5" /> Due Date
            </span>
            <span className={`font-medium ${overdue ? 'text-rose-600' : 'text-slate-800'}`}>
              {formatDateLong(bill.due_date)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-slate-500">
              <Clock className="h-3.5 w-3.5" /> Date Paid
            </span>
            <span className={`font-medium ${isPaid ? 'text-emerald-700' : 'text-slate-400'}`}>
              {isPaid && bill.date_paid ? formatDateLong(bill.date_paid) : 'Not yet paid'}
            </span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-1">
        {isPaid ? (
          <button
            type="button"
            onClick={() => onAction(bill, 'Unpaid')}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-amber-300 hover:bg-amber-50 hover:text-amber-800"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Mark as Unpaid
          </button>
        ) : (
          <button
            type="button"
            onClick={() => onAction(bill, 'Paid')}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white shadow-xs transition hover:bg-emerald-700"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Mark as Paid
          </button>
        )}
      </div>
    </div>
  );
}
