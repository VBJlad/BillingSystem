import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { CheckCircle2, Info, AlertCircle, X } from 'lucide-react';
import Sidebar from './Sidebar';
import Header from './Header';
import { useApp } from '../../context/AppContext';

export default function MainLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { toasts, dismissToast } = useApp();

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header onOpenMobileMenu={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Toast notifications */}
      <div className="no-print pointer-events-none fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const Icon = isSuccess ? CheckCircle2 : isError ? AlertCircle : Info;
          const color = isSuccess
            ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
            : isError
            ? 'border-rose-200 bg-rose-50 text-rose-900'
            : 'border-blue-200 bg-blue-50 text-blue-900';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto flex max-w-sm items-start gap-2.5 rounded-xl border px-4 py-3 text-sm shadow-lg ${color}`}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <p className="flex-1 text-xs font-medium leading-relaxed">{toast.message}</p>
              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="rounded p-0.5 opacity-60 hover:opacity-100"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
