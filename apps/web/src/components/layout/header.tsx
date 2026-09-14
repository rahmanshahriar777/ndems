'use client';

import React, { useState, useEffect } from 'react';
import { Bell, Clock, Camera } from 'lucide-react';
import { useAuth } from '../../context/auth-context';
import { api } from '../../lib/api-client';
import { formatDhakaTime } from '../../lib/date-utils';
import { AvatarModal } from '../profile/avatar-modal';

export const Header: React.FC<{ title?: string }> = ({ title }) => {
  const { user } = useAuth();
  const [clocking, setClocking] = useState(false);
  const [clockMessage, setClockMessage] = useState<string | null>(null);
  const [dhakaTime, setDhakaTime] = useState<string>('');
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

  useEffect(() => {
    const updateTime = () => setDhakaTime(formatDhakaTime());
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickClockIn = async () => {
    setClocking(true);
    try {
      await api.post('/attendance/clock-in', { notes: 'Quick clock in from header' });
      setClockMessage('Clocked in!');
      setTimeout(() => setClockMessage(null), 3000);
    } catch (err: any) {
      setClockMessage(err.message || 'Already clocked in');
      setTimeout(() => setClockMessage(null), 3000);
    } finally {
      setClocking(false);
    }
  };

  return (
    <>
      <header className="h-16 border-b border-slate-200 px-6 flex items-center justify-between bg-white/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-slate-800">{title || 'Overview'}</h1>
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-[11px] font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live Platform
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Dhaka Time (UTC+6) Clock */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700 shadow-sm">
            <Clock className="w-3.5 h-3.5 text-primary-600 animate-spin-slow" />
            <span className="font-bold">{dhakaTime || '--:--:--'}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary-100 text-primary-700 font-sans font-semibold">
              Dhaka UTC+6
            </span>
          </div>

          {/* Quick Clock in action */}
          {user?.employeeId && (
            <button
              onClick={handleQuickClockIn}
              disabled={clocking}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary-600/10 hover:bg-primary-600/20 text-primary-700 border border-primary-500/30 text-xs font-medium transition shadow-sm"
            >
              <Clock className="w-3.5 h-3.5 text-primary-600" />
              <span>{clockMessage || (clocking ? 'Clocking...' : 'Quick Clock In')}</span>
            </button>
          )}

          {/* Notification Bell */}
          <button
            title="Notifications"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 border border-transparent hover:border-slate-200 transition relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-500" />
          </button>

          {/* Active Role Pill */}
          <div className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-700 text-xs font-mono font-medium">
            {user?.roles?.[0] || 'EMPLOYEE'}
          </div>

          {/* Employee Avatar & Photo Settings Button */}
          <button
            type="button"
            onClick={() => setIsAvatarModalOpen(true)}
            title="Change your profile picture"
            className="group relative flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full bg-slate-50 hover:bg-primary-50/60 border border-slate-200 hover:border-primary-300 transition shadow-2xs"
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Your Avatar"
                className="w-7 h-7 rounded-full object-cover border border-slate-300 group-hover:border-primary-500 shadow-xs"
              />
            ) : (
              <div className="w-7 h-7 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {user?.firstName?.[0] || 'U'}
              </div>
            )}
            <span className="text-xs font-semibold text-slate-700 group-hover:text-primary-700">
              {user?.firstName || 'Profile'}
            </span>
            <span className="w-4 h-4 rounded-full bg-slate-200 group-hover:bg-primary-600 text-slate-500 group-hover:text-white flex items-center justify-center transition">
              <Camera className="w-2.5 h-2.5" />
            </span>
          </button>
        </div>
      </header>

      {/* Avatar Settings Modal */}
      <AvatarModal
        isOpen={isAvatarModalOpen}
        onClose={() => setIsAvatarModalOpen(false)}
      />
    </>
  );
};
