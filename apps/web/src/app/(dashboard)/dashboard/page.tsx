'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  CalendarDays,
  Banknote,
  TrendingUp,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { StatCard } from '../../../components/ui/stat-card';
import { useAuth } from '../../../context/auth-context';
import { api } from '../../../lib/api-client';
import { formatDhakaTime } from '../../../lib/date-utils';
import { Logo } from '../../../components/ui/logo';

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    headcount: 4,
    presentToday: 3,
    pendingLeaves: 1,
    payrollStatus: 'Approved (Aug)',
  });
  const [clockStatus, setClockStatus] = useState<'IDLE' | 'CLOCKED_IN' | 'CLOCKED_OUT'>('IDLE');
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeString(formatDhakaTime());
    }, 1000);
    setTimeString(formatDhakaTime());

    // Fetch live dashboard metrics
    api.get('/employees?limit=1')
      .then((res) => {
        if (res?.meta?.total) {
          setStats((prev) => ({ ...prev, headcount: res.meta.total }));
        }
      })
      .catch(() => {});

    api.get('/leave-requests?status=PENDING')
      .then((res) => {
        if (Array.isArray(res)) {
          setStats((prev) => ({ ...prev, pendingLeaves: res.length }));
        }
      })
      .catch(() => {});

    return () => clearInterval(timer);
  }, []);

  const handleClockAction = async () => {
    try {
      if (clockStatus === 'CLOCKED_IN') {
        await api.post('/attendance/clock-out', { notes: 'Clock out from dashboard' });
        setClockStatus('CLOCKED_OUT');
      } else {
        await api.post('/attendance/clock-in', { notes: 'Clock in from dashboard' });
        setClockStatus('CLOCKED_IN');
      }
    } catch {
      // Toggle for demo if backend was already clocked
      setClockStatus(clockStatus === 'CLOCKED_IN' ? 'CLOCKED_OUT' : 'CLOCKED_IN');
    }
  };

  return (
    <DashboardLayout title="Executive Workforce Dashboard">
      {/* Welcome banner with Company Logo */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200/80 bg-gradient-to-r from-slate-50/80 via-white to-primary-50/30 relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-2 rounded-2xl bg-white border border-slate-200 shadow-sm shrink-0">
            <Logo size="md" priority />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-800">
                Welcome back, {user?.firstName || 'Colleague'}! 👋
              </span>
              <span className="px-2 py-0.5 rounded-full bg-primary-100 text-primary-700 text-[10px] font-mono uppercase font-bold border border-primary-200">
                {user?.roles?.[0] || 'EMPLOYEE'}
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Neoteric Digital EMS &bull; All enterprise operations active and nominal.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-right font-mono text-xs shadow-sm">
            <span className="text-slate-500 block text-[10px] uppercase font-sans">Dhaka Time (UTC+6)</span>
            <span className="text-slate-800 font-bold">{timeString || '--:--:--'}</span>
          </div>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Headcount"
          value={stats.headcount}
          subtitle="Active workforce members"
          icon={Users}
          color="primary"
          trend={{ value: '12%', isPositive: true }}
        />
        <StatCard
          title="Attendance Today"
          value="96.2%"
          subtitle="On-time shift arrival rate"
          icon={Clock}
          color="emerald"
          trend={{ value: '3.1%', isPositive: true }}
        />
        <StatCard
          title="Pending Leaves"
          value={stats.pendingLeaves}
          subtitle="Awaiting manager approval"
          icon={CalendarDays}
          color="amber"
        />
        <StatCard
          title="Monthly Payroll"
          value="BDT 38,000"
          subtitle={stats.payrollStatus}
          icon={Banknote}
          color="cyan"
          trend={{ value: 'On schedule', isPositive: true }}
        />
      </div>

      {/* Interactive Middle Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Widget */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Clock className="w-4 h-4 text-emerald-400" />
              Daily Time Clock
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Shift: 09:00 - 18:00 (Dhaka UTC+6)</span>
          </div>

          <div className="p-5 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-3">
            <div className="text-3xl font-bold font-mono tracking-wider text-slate-100">
              {timeString || '09:00:00 AM'}
            </div>
            <div className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
              Asia/Dhaka (UTC+6:00)
            </div>
            <p className="text-xs text-slate-400">
              {clockStatus === 'CLOCKED_IN'
                ? '🟢 Active Session — Working on Core Tasks'
                : clockStatus === 'CLOCKED_OUT'
                ? '🔴 Shift Concluded for Today'
                : '⚪ Ready to begin your working hours'}
            </p>
          </div>

          <button
            onClick={handleClockAction}
            className={`w-full py-3 rounded-xl font-semibold text-xs transition shadow-sm flex items-center justify-center gap-2 ${
              clockStatus === 'CLOCKED_IN'
                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>
              {clockStatus === 'CLOCKED_IN' ? 'Clock Out Now' : 'Clock In for Today'}
            </span>
          </button>
        </div>

        {/* Quick Actions Panel */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Quick Actions & Workforce Overview
              </h3>
              <span className="text-[10px] font-mono uppercase bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/20">
                Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Quick access to common workforce management tasks and operational metrics.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                <Users className="w-5 h-5 text-primary-400 mx-auto" />
                <span className="text-xs font-semibold text-slate-200 block">Employees</span>
                <span className="text-[11px] text-slate-500">Directory & profiles</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                <CalendarDays className="w-5 h-5 text-amber-400 mx-auto" />
                <span className="text-xs font-semibold text-slate-200 block">Leave Requests</span>
                <span className="text-[11px] text-slate-500">Apply & approve</span>
              </div>
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-center space-y-1">
                <Banknote className="w-5 h-5 text-emerald-400 mx-auto" />
                <span className="text-xs font-semibold text-slate-200 block">Payroll</span>
                <span className="text-[11px] text-slate-500">Payslips & reports</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}


