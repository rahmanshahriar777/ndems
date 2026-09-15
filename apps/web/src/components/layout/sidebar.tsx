'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Building2,
  Clock,
  CalendarDays,
  Banknote,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { SystemRole } from '@ems/shared';
import { Logo } from '../ui/logo';
import { AvatarModal } from '../profile/avatar-modal';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user, logout, hasRole } = useAuth();
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Employees', href: '/employees', icon: Users },
    { label: 'Departments', href: '/organization/departments', icon: Building2 },
    { label: 'Attendance', href: '/attendance', icon: Clock },
    { label: 'Leaves', href: '/leaves', icon: CalendarDays },
    { label: 'Payroll', href: '/payroll', icon: Banknote },
    { label: 'Performance', href: '/performance', icon: TrendingUp },
    { label: 'AI Assistant', href: '/ai-assistant', icon: Sparkles },
  ];

  if (hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN, SystemRole.AUDITOR)) {
    navItems.push({
      label: 'Audit Trail',
      href: '/admin/audit-logs',
      icon: ShieldCheck,
    });
  }

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col justify-between p-4 shrink-0">
      <div>
        {/* Logo */}
        <div className="px-2 py-3 mb-4 border-b border-slate-200 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-90 transition">
            <Logo size="md" priority />
          </Link>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold">
            EMS
          </span>
        </div>

        {/* Navigation Items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-primary-500/15 text-primary-300 border border-primary-500/30 shadow-glow'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-primary-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* User Footer Profile */}
      <div className="pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(true)}
            title="Click to change your profile picture"
            className="flex items-center gap-2.5 overflow-hidden text-left hover:opacity-80 transition group flex-1"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Avatar"
                className="w-8 h-8 rounded-full object-cover border border-slate-300 group-hover:border-primary-500 shrink-0 shadow-xs"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-xs font-semibold text-primary-700 shrink-0">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
            <div className="truncate flex-1">
              <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-primary-700">
                {user ? `${user.firstName || ''} ${user.lastName || ''}` : 'Loading...'}
              </p>
              <p className="text-[10px] text-slate-500 font-mono">
                {user?.roles?.[0] || 'EMPLOYEE'} • Photo
              </p>
            </div>
          </button>
          <button
            onClick={() => logout()}
            title="Logout"
            className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-500 transition ml-1"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />
    </aside>
  );
};
