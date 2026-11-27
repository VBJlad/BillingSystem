import React, { useState, useEffect } from 'react';
import { CheckCircle2, RotateCcw } from 'lucide-react';
import Modal from '../common/Modal';
import {
  formatBillingMonth,
  formatCurrency,
  formatDateLong,
  getTodayISO,
} from '../../utils/formatters';

export default function PaymentDialog({
  open,
  onClose,
  bill,
  customerName,
  targetStatus, // 'Paid' | 'Unpaid'
  currencySymbol = '₱',
  onConfirm,
}) {
  const [datePaid, setDatePaid] = useState(getTodayISO());
  const [remarks, setRemarks] = useState('');

  useEffect(() => {
    if (open) {
      setDatePaid(getTodayISO());
      setRemarks('');
    }
  }, [open, bill, targetStatus]);

  if (!bill) return null;
  const isMarkingPaid = targetStatus === 'Paid';

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm({
      billId: bill.bill_id,
      newStatus: targetStatus,
      datePaid: isMarkingPaid ? datePaid : null,
      remarks,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isMarkingPaid ? 'Confirm Payment' : 'Revert Payment Status'}
      subtitle={
        isMarkingPaid
          ? 'Are you sure you want to mark this bill as paid?'
          : "Are you sure you want to change this bill's status to unpaid?"
      }
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div
          className={`rounded-xl border p-4 text-xs ${
            isMarkingPaid
              ? 'border-emerald-200/90 bg-emerald-50/50'
              : 'border-amber-200/90 bg-amber-50/60'
          }`}
        >
          <dl className="space-y-2">
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Customer Name</dt>
              <dd className="font-semibold text-slate-900">{customerName}</dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Billing Month</dt>
              <dd className="font-semibold text-slate-900">
                {formatBillingMonth(bill.billing_month)}
              </dd>
            </div>
            <div className="flex justify-between gap-2">
              <dt className="text-slate-500">Amount Due</dt>
              <dd className="tabular-nums font-bold text-slate-900">
                {formatCurrency(bill.amount_due, currencySymbol)}
              </dd>
            </div>
            {!isMarkingPaid && bill.date_paid && (
              <div className="flex justify-between gap-2 border-t border-amber-200/70 pt-2">
                <dt className="text-amber-800">Recorded Payment Date</dt>
                <dd className="font-medium text-amber-900">{formatDateLong(bill.date_paid)}</dd>
              </div>
            )}
          </dl>
        </div>

        {isMarkingPaid ? (
          <div>
            <label className="mb-1.5 block text-xs font-medium text-slate-700">
              Payment Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={datePaid}
              onChange={(e) => setDatePaid(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
          </div>
        ) : (
          <p className="rounded-lg border border-slate-200/80 bg-slate-50 px-3.5 py-2.5 text-xs leading-relaxed text-slate-600">
            Reverting this bill clears the current paid date while preserving the previous payment
            record inside the payment history log.
          </p>
        )}

        <div>
          <label className="mb-1.5 block text-xs font-medium text-slate-700">
            Remarks (Optional)
          </label>
          <input
            type="text"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder={
              isMarkingPaid
                ? 'e.g., Paid cash at office — OR #4510'
                : 'e.g., Reverted due to unverified bank transfer'
            }
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white shadow-xs transition ${
              isMarkingPaid
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}
          >
            {isMarkingPaid ? (
              <>
                <CheckCircle2 className="h-3.5 w-3.5" />
                Confirm Payment
              </>
            ) : (
              <>
                <RotateCcw className="h-3.5 w-3.5" />
                Confirm Change
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
