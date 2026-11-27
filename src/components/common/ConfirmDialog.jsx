import React from 'react';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  details = null,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'primary', // 'primary' | 'danger' | 'success'
}) {
  const styles = {
    primary: {
      icon: Info,
      iconBg: 'bg-blue-50 text-blue-600',
      btn: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
    danger: {
      icon: AlertTriangle,
      iconBg: 'bg-rose-50 text-rose-600',
      btn: 'bg-rose-600 hover:bg-rose-700 text-white',
    },
    success: {
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600',
      btn: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    },
  };
  const current = styles[variant] || styles.primary;
  const Icon = current.icon;

  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-3.5">
        <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${current.iconBg}`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 text-sm text-slate-600">
          {message && <p className="leading-relaxed">{message}</p>}
          {details && <div className="mt-3">{details}</div>}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => {
            onConfirm?.();
            onClose?.();
          }}
          className={`rounded-lg px-4 py-2 text-sm font-medium shadow-xs transition ${current.btn}`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
