import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  MapPin,
  Users,
  Receipt,
  AlertTriangle,
  Wifi,
  BarChart3,
  Settings,
  LogOut,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

const MAIN_NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/locations', label: 'Locations', icon: MapPin },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/billing', label: 'Billing Management', icon: Receipt },
  { to: '/issues', label: 'Connection Issues', icon: AlertTriangle, showBadge: true },
  { to: '/plans', label: 'Internet Plans', icon: Wifi },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
];

export default function Sidebar({ mobileOpen, onClose }) {
  const { settings, admin, issues, logout } = useApp();
  const ongoingIssueCount = issues.filter((i) => i.issue_status === 'Ongoing').length;

  const content = (
    <div className="flex h-full flex-col border-r border-slate-200 bg-white text-slate-600">
      {/* Brand header */}
      <div className="flex h-16 items-center justify-between border-b border-slate-200/80 px-5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-700 text-white shadow-xs">
            <Wifi className="h-4 w-4 stroke-[2.25]" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-900">
              {settings.isp_name || 'ISP Billing CMS'}
            </p>
            <p className="truncate text-[11px] text-slate-400">
              {settings.business_name || 'Admin Console'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        <p className="px-2.5 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
          Workspace
        </p>
        {MAIN_NAV.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={onClose}
              className={({ isActive }) =>
                `group flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span>{item.label}</span>
                  </span>
                  {item.showBadge && ongoingIssueCount > 0 && (
                    <span className="rounded-full bg-rose-50 px-1.5 py-0.5 text-[11px] font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
                      {ongoingIssueCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Section: Settings, Admin Profile, Logout */}
      <div className="border-t border-slate-200/80 p-3 space-y-1">
        <NavLink
          to="/settings"
          onClick={onClose}
          className={({ isActive }) =>
            `group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition ${
              isActive
                ? 'bg-blue-50 text-blue-700 font-semibold'
                : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Settings
                className={`h-4 w-4 shrink-0 ${
                  isActive ? 'text-blue-700' : 'text-slate-400 group-hover:text-slate-600'
                }`}
              />
              <span>Settings</span>
            </>
          )}
        </NavLink>

        <div className="mt-2 flex items-center gap-2.5 rounded-lg border border-slate-200/80 bg-slate-50/70 px-2.5 py-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xs font-semibold text-white">
            {(admin.full_name || admin.username || 'A').slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-semibold text-slate-900">
              {admin.full_name || admin.username}
            </p>
            <p className="truncate text-[11px] text-slate-500">Administrator</p>
          </div>
          <button
            type="button"
            onClick={logout}
            title="Sign Out"
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-white hover:text-rose-600 hover:shadow-xs"
            aria-label="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="no-print hidden w-64 shrink-0 lg:block">{content}</aside>

      {mobileOpen && (
        <div className="no-print fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[1px]"
            onClick={onClose}
          />
          <aside className="relative z-10 w-64 max-w-[82vw] shadow-2xl">{content}</aside>
        </div>
      )}
    </>
  );
}
