import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wifi, Lock, User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';

export default function Login() {
  const { login, settings } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!username.trim() || !password) {
      setError('Please enter both your username and password.');
      return;
    }
    const res = login(username, password);
    if (res.success) {
      navigate('/', { replace: true });
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col justify-center bg-slate-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[400px]">
        {/* Brand Logo */}
        <div className="mb-7 flex flex-col items-center text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-700 text-white shadow-sm">
            <Wifi className="h-5 w-5 stroke-[2.25]" />
          </div>
          <p className="mt-3 text-sm font-semibold tracking-tight text-slate-900">
            {settings.isp_name || 'ISP Billing CMS'}
          </p>
        </div>

        {/* Clean SaaS Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-7 shadow-xs sm:p-8">
          <div className="mb-6">
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">Welcome Back</h1>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              Sign in with your administrator credentials to manage subscribers, locations, monthly
              billing, and connection issues.
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Username</label>
              <div className="relative">
                <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-700">Password</label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-10 text-sm text-slate-900 transition focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/15"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-600"
                  aria-label="Show or hide password"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
                />
                <span>Remember me</span>
              </label>
              <span className="text-[11px] text-slate-400">Admin access only</span>
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-xs transition hover:bg-blue-800"
            >
              Login
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-slate-400">
          Demo access: <code className="font-mono text-slate-600">admin</code> /{' '}
          <code className="font-mono text-slate-600">admin123</code>
        </p>
      </div>
    </div>
  );
}
