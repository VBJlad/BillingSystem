import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  ChevronRight,
  ChevronDown,
  Settings,
  LogOut,
  MapPin,
  Users,
  AlertTriangle,
  Clock,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { isBillOverdue, formatCurrencyShort } from '../../utils/formatters';

export default function Header({ onOpenMobileMenu }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { admin, locations, customers, bills, issues, settings, logout } = useApp();

  const [globalQuery, setGlobalQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handleOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Build Breadcrumbs + Page Title dynamically
  const { breadcrumbs, pageTitle } = useMemo(() => {
    const path = location.pathname;
    if (path === '/') {
      return { breadcrumbs: [{ label: 'Workspace' }], pageTitle: 'Dashboard' };
    }
    if (path === '/locations') {
      return { breadcrumbs: [{ label: 'Workspace', to: '/' }], pageTitle: 'Locations' };
    }
    if (path.startsWith('/locations/')) {
      const id = path.split('/')[2];
      const loc = locations.find((l) => l.location_id === id);
      return {
        breadcrumbs: [
          { label: 'Workspace', to: '/' },
          { label: 'Locations', to: '/locations' },
        ],
        pageTitle: loc?.location_name || 'Location Details',
      };
    }
    if (path === '/customers') {
      return { breadcrumbs: [{ label: 'Workspace', to: '/' }], pageTitle: 'Customers' };
    }
    if (path === '/customers/new') {
      return {
        breadcrumbs: [
          { label: 'Workspace', to: '/' },
          { label: 'Customers', to: '/customers' },
        ],
        pageTitle: 'Add Customer',
      };
    }
    if (path.startsWith('/customers/')) {
      const id = path.split('/')[2];
      const cust = customers.find((c) => c.customer_id === id);
      return {
        breadcrumbs: [
          { label: 'Workspace', to: '/' },
          { label: 'Customers', to: '/customers' },
        ],
        pageTitle: cust?.full_name || 'Customer Profile',
      };
    }
    const map = {
      '/billing': 'Billing Management',
      '/issues': 'Connection Issues',
      '/plans': 'Internet Plans',
      '/reports': 'Reports',
      '/settings': 'Settings',
    };
    return {
      breadcrumbs: [{ label: 'Workspace', to: '/' }],
      pageTitle: map[path] || 'ISP Billing CMS',
    };
  }, [location.pathname, locations, customers]);

  // Global search results
  const searchResults = useMemo(() => {
    const q = globalQuery.trim().toLowerCase();
    if (!q) return null;
    const matchedCustomers = customers
      .filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.customer_id.toLowerCase().includes(q) ||
          c.contact_number.toLowerCase().includes(q)
      )
      .slice(0, 5);
    const matchedLocations = locations
      .filter((l) => l.location_name.toLowerCase().includes(q))
      .slice(0, 3);
    const matchedIssues = issues
      .filter((i) => i.issue_title.toLowerCase().includes(q) || i.issue_id.toLowerCase().includes(q))
      .slice(0, 3);

    return {
      customers: matchedCustomers,
      locations: matchedLocations,
      issues: matchedIssues,
      total: matchedCustomers.length + matchedLocations.length + matchedIssues.length,
    };
  }, [globalQuery, customers, locations, issues]);

  // Notifications: ongoing issues + overdue bills
  const ongoingIssues = useMemo(
    () => issues.filter((i) => i.issue_status === 'Ongoing'),
    [issues]
  );
  const overdueBills = useMemo(
    () => bills.filter((b) => isBillOverdue(b)),
    [bills]
  );
  const notifCount = ongoingIssues.length + overdueBills.length;

  const handleSelectResult = (to) => {
    setGlobalQuery('');
    setSearchOpen(false);
    navigate(to);
  };

  return (
    <header className="no-print sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xs sm:px-6 lg:px-8">
      {/* Left: Mobile toggle + Breadcrumb + Page title */}
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800 lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <div className="hidden items-center gap-1 text-[11px] font-medium text-slate-400 sm:flex">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={crumb.label + idx}>
                {crumb.to ? (
                  <Link to={crumb.to} className="hover:text-slate-700">
                    {crumb.label}
                  </Link>
                ) : (
                  <span>{crumb.label}</span>
                )}
                <ChevronRight className="h-3 w-3 text-slate-300" />
              </React.Fragment>
            ))}
            <span className="truncate text-slate-600">{pageTitle}</span>
          </div>
          <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
            {pageTitle}
          </h1>
        </div>
      </div>

      {/* Right: Global Search + Notifications + Admin Dropdown */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Global Search */}
        <div ref={searchRef} className="relative hidden md:block">
          <div className="relative w-64 lg:w-80">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={globalQuery}
              onFocus={() => setSearchOpen(true)}
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                setSearchOpen(true);
              }}
              placeholder="Search customers, locations, issues..."
              className="w-full rounded-lg border border-slate-200 bg-slate-50/80 py-1.5 pl-8 pr-8 text-xs text-slate-800 placeholder-slate-400 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600/15"
            />
            {globalQuery && (
              <button
                type="button"
                onClick={() => setGlobalQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {searchOpen && searchResults && (
            <div className="absolute right-0 mt-2 w-96 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              {searchResults.total === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-slate-500">
                  No matches found for &ldquo;{globalQuery}&rdquo;.
                </div>
              ) : (
                <div className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
                  {searchResults.customers.length > 0 && (
                    <div className="p-2">
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Customers
                      </p>
                      {searchResults.customers.map((c) => (
                        <button
                          key={c.customer_id}
                          type="button"
                          onClick={() => handleSelectResult(`/customers/${c.customer_id}`)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-slate-50"
                        >
                          <span className="flex items-center gap-2 font-medium text-slate-900">
                            <Users className="h-3.5 w-3.5 text-slate-400" />
                            {c.full_name}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {c.customer_id}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.locations.length > 0 && (
                    <div className="p-2">
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Locations
                      </p>
                      {searchResults.locations.map((l) => (
                        <button
                          key={l.location_id}
                          type="button"
                          onClick={() => handleSelectResult(`/locations/${l.location_id}`)}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-slate-50"
                        >
                          <span className="flex items-center gap-2 font-medium text-slate-900">
                            <MapPin className="h-3.5 w-3.5 text-blue-600" />
                            {l.location_name}
                          </span>
                          <span className="text-[11px] text-slate-400">{l.status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {searchResults.issues.length > 0 && (
                    <div className="p-2">
                      <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                        Connection Issues
                      </p>
                      {searchResults.issues.map((i) => (
                        <button
                          key={i.issue_id}
                          type="button"
                          onClick={() => handleSelectResult('/issues')}
                          className="flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs hover:bg-slate-50"
                        >
                          <span className="flex items-center gap-2 truncate font-medium text-slate-900">
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-rose-500" />
                            <span className="truncate">{i.issue_title}</span>
                          </span>
                          <span className="ml-2 text-[11px] text-slate-400">{i.issue_status}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v);
              setProfileOpen(false);
            }}
            aria-label="Notifications"
            className="relative rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <Bell className="h-4 w-4" />
            {notifCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-bold text-white">
                {notifCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <p className="text-xs font-semibold text-slate-900">Alerts &amp; Attention Needed</p>
                <span className="text-[11px] text-slate-400">{notifCount} active</span>
              </div>
              <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                {ongoingIssues.map((iss) => (
                  <button
                    key={iss.issue_id}
                    type="button"
                    onClick={() => {
                      setNotifOpen(false);
                      navigate('/issues');
                    }}
                    className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition hover:bg-slate-50"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-600" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900">
                        {iss.issue_title}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Ongoing issue ·{' '}
                        {locations.find((l) => l.location_id === iss.location_id)?.location_name}
                      </p>
                    </div>
                  </button>
                ))}
                {overdueBills.slice(0, 4).map((bill) => {
                  const c = customers.find((x) => x.customer_id === bill.customer_id);
                  return (
                    <button
                      key={bill.bill_id}
                      type="button"
                      onClick={() => {
                        setNotifOpen(false);
                        navigate(`/customers/${bill.customer_id}`);
                      }}
                      className="flex w-full items-start gap-2.5 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900">
                          Overdue: {c?.full_name || bill.customer_id}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {formatCurrencyShort(bill.amount_due, settings.currency_symbol)} · Due{' '}
                          {bill.due_date}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {notifCount === 0 && (
                  <p className="px-4 py-6 text-center text-xs text-slate-500">
                    Everything looks clear. No ongoing issues or overdue bills.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-700 text-[11px] font-semibold text-white">
              {(admin.full_name || admin.username || 'A').slice(0, 2).toUpperCase()}
            </span>
            <span className="hidden max-w-28 truncate font-semibold text-slate-800 sm:inline">
              {admin.full_name || admin.username}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {profileOpen && (
            <div className="absolute right-0 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
              <div className="border-b border-slate-100 px-3.5 py-2.5">
                <p className="truncate text-xs font-semibold text-slate-900">
                  {admin.full_name || admin.username}
                </p>
                <p className="truncate text-[11px] text-slate-400">
                  {admin.email || 'Administrator'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  navigate('/settings');
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-slate-700 hover:bg-slate-50"
              >
                <Settings className="h-3.5 w-3.5 text-slate-400" />
                Account &amp; Settings
              </button>
              <button
                type="button"
                onClick={() => {
                  setProfileOpen(false);
                  logout();
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-left text-xs text-rose-600 hover:bg-rose-50"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
