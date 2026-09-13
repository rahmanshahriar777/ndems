'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  Users,
  Clock,
  Banknote,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Lock,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/auth-context';
import { Logo } from '../components/ui/logo';

export default function HomePage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const demoAccounts = [
    {
      role: 'Super Administrator',
      email: 'superadmin@ems.local',
      desc: 'Full platform access, audit logs, and system settings',
      badge: 'SUPER_ADMIN',
      badgeColor: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
    },
    {
      role: 'HR Manager',
      email: 'hradmin@ems.local',
      desc: 'Manages departments, employees, leaves, and payroll',
      badge: 'HR_ADMIN',
      badgeColor: 'border-primary-500/30 bg-primary-500/10 text-primary-300',
    },
    {
      role: 'Engineering Manager (Shahriar Rahman)',
      email: 'manager@ems.local',
      desc: 'Direct report approvals, timesheets, and performance reviews',
      badge: 'MANAGER',
      badgeColor: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
    },
    {
      role: 'Senior Employee (Sadia Rahman)',
      email: 'sadia.rahman@ems.local',
      desc: 'Clock in/out, view payslips, apply leaves, and track performance',
      badge: 'EMPLOYEE',
      badgeColor: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
    },
  ];

  const handleQuickLogin = async (email: string) => {
    setLoggingIn(email);
    setError(null);
    try {
      await login(email, 'Password123!');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify API server is running.');
      setLoggingIn(null);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      {/* Top Bar */}
      <header className="px-8 py-4 border-b border-slate-200 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition">
          <Logo size="lg" priority />
        </Link>

        <div className="flex items-center gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-glow transition"
            >
              <span>Go to Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-semibold transition"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="font-semibold text-primary-700">Neoteric Digital</span>
            <span>&bull; Enterprise Workforce Operations</span>
          </div>

          <h2 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-slate-800">
            Workforce Management Platform <br />
            <span className="gradient-text">Engineered for Modern Enterprise</span>
          </h2>

          <p className="text-slate-400 text-base leading-relaxed">
            A comprehensive, production-grade enterprise platform spanning authentication, organizational
            hierarchies, attendance, transaction-safe leave workflows, decimal-safe payroll, and performance management.
          </p>

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium max-w-md mx-auto">
              {error}
            </div>
          )}
        </div>

        {/* Demo Fast Login Cards */}
        <div className="mb-14">
          <p className="text-xs uppercase font-bold tracking-wider text-slate-500 text-center mb-4">
            Select a Demo Persona for Instant One-Click Login
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {demoAccounts.map((account) => (
              <div
                key={account.email}
                className="glass-card p-5 rounded-2xl flex flex-col justify-between border border-white/5 hover:border-primary-500/40 group"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md border ${account.badgeColor}`}>
                      {account.badge}
                    </span>
                    <Lock className="w-3.5 h-3.5 text-slate-500" />
                  </div>

                  <h3 className="text-sm font-bold text-slate-100">{account.role}</h3>
                  <p className="text-xs font-mono text-slate-400 mt-0.5 truncate">{account.email}</p>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{account.desc}</p>
                </div>

                <button
                  onClick={() => handleQuickLogin(account.email)}
                  disabled={loggingIn !== null}
                  className="mt-5 w-full py-2.5 px-3 rounded-xl bg-primary-600/20 hover:bg-primary-600/30 border border-primary-500/30 text-primary-200 text-xs font-semibold flex items-center justify-center gap-2 group-hover:bg-primary-600 group-hover:text-white transition shadow-sm disabled:opacity-50"
                >
                  <span>{loggingIn === account.email ? 'Logging in...' : 'Sign In as ' + account.badge}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Core Capabilities Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="glass-card p-4 rounded-xl border border-white/5 text-center">
            <Users className="w-5 h-5 text-primary-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-200">Employee Management</h4>
            <p className="text-[11px] text-slate-500 mt-1">Hierarchies & directory</p>
          </div>
          <div className="glass-card p-4 rounded-xl border border-white/5 text-center">
            <Clock className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-200">Attendance & Leaves</h4>
            <p className="text-[11px] text-slate-500 mt-1">Clock in/out & approvals</p>
          </div>
          <div className="glass-card p-4 rounded-xl border border-white/5 text-center">
            <Banknote className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-200">Decimal Payroll</h4>
            <p className="text-[11px] text-slate-500 mt-1">Accurate salary & payslips</p>
          </div>
          <div className="glass-card p-4 rounded-xl border border-white/5 text-center">
            <TrendingUp className="w-5 h-5 text-indigo-400 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-200">Performance Reviews</h4>
            <p className="text-[11px] text-slate-500 mt-1">Goals, reviews & ratings</p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 border-t border-slate-200 bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Logo size="sm" />
            <span className="text-xs text-slate-500 font-medium">
              &copy; {new Date().getFullYear()} Neoteric Digital. All rights reserved.
            </span>
          </div>
          <div className="text-xs text-slate-500 font-mono">
            NEO EMS v1.0 &bull; Enterprise Monorepo
          </div>
        </div>
      </footer>
    </div>
  );
}
