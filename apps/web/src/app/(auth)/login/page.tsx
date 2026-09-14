'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../../context/auth-context';
import { Logo } from '../../../components/ui/logo';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('superadmin@ems.local');
  const [password, setPassword] = useState('Password123!');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        {/* Header with Logo */}
        <div className="text-center space-y-3 flex flex-col items-center">
          <Link href="/" className="inline-block hover:opacity-90 transition mb-2">
            <Logo size="xl" priority />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 tracking-tight">Enterprise Portal Sign In</h2>
            <p className="text-xs text-slate-400 mt-1">Neoteric Digital Employee Management System</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card p-8 rounded-2xl border border-white/10 shadow-2xl">
          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@ems.local"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm text-slate-100 placeholder:text-slate-500 transition outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/[0.04] border border-white/10 focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm text-slate-100 placeholder:text-slate-500 transition outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-sm font-semibold shadow-glow transition flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Demo account quick selector */}
          <div className="mt-6 pt-5 border-t border-white/5 space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quick Fill Demo Accounts</p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => quickFill('superadmin@ems.local')}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-300 text-left truncate"
              >
                👑 Super Admin
              </button>
              <button
                type="button"
                onClick={() => quickFill('hradmin@ems.local')}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-300 text-left truncate"
              >
                📋 HR Manager
              </button>
              <button
                type="button"
                onClick={() => quickFill('manager@ems.local')}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-300 text-left truncate"
              >
                👔 Shahriar (Manager)
              </button>
              <button
                type="button"
                onClick={() => quickFill('employee@ems.local')}
                className="px-2.5 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 text-slate-300 text-left truncate"
              >
                💼 Nadia (Employee)
              </button>
            </div>
          </div>
        </div>

        {/* Security watermark */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>AES-256 Encrypted &bull; RBAC Protected &bull; ISO 27001 Ready</span>
        </div>

        <p className="text-center text-xs text-slate-500">
          Need a new account?{' '}
          <Link href="/register" className="text-primary-400 hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}
