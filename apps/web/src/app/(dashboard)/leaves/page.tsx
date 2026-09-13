'use client';

import React, { useState, useEffect } from 'react';
import { CalendarDays, Plus, Check, X, AlertCircle } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../context/auth-context';
import { SystemRole } from '@ems/shared';

export default function LeavesPage() {
  const { user, hasRole } = useAuth();
  const [balances, setBalances] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Form states
  const [leaveTypeId, setLeaveTypeId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [balRes, reqRes, typesRes] = await Promise.all([
        api.get('/leave-balances').catch(() => []),
        api.get('/leave-requests?all=true').catch(() => []),
        api.get('/leave-types').catch(() => []),
      ]);

      setBalances(balRes || []);
      setLeaveRequests(reqRes || []);
      setLeaveTypes(typesRes || []);
      if (typesRes?.[0]) setLeaveTypeId(typesRes[0].id);
    } catch {
      // Fallback
      setBalances([
        { leaveType: { name: 'Annual Paid Leave' }, allocatedDays: 20, usedDays: 3, remainingDays: 17 },
        { leaveType: { name: 'Sick Leave' }, allocatedDays: 10, usedDays: 0, remainingDays: 10 },
        { leaveType: { name: 'Casual Leave' }, allocatedDays: 5, usedDays: 0, remainingDays: 5 },
      ]);
      setLeaveRequests([
        {
          id: '1',
          employee: { firstName: 'Sadia', lastName: 'Rahman', employeeNumber: 'EMP-2026-0004' },
          leaveType: { name: 'Annual Paid Leave' },
          startDate: '2026-09-20',
          endDate: '2026-09-22',
          totalDays: 3,
          reason: 'Attending architecture summit and family event',
          status: 'PENDING',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/leave-requests', { leaveTypeId, startDate, endDate, reason });
      setShowApplyModal(false);
      setReason('');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Failed to apply for leave');
    }
  };

  const handleApproveReject = async (id: string, action: 'approve' | 'reject') => {
    const remarks = prompt(`Enter optional remarks for ${action.toUpperCase()}:`) || 'Actioned by manager';
    try {
      await api.patch(`/leave-requests/${id}/${action}`, { remarks });
      fetchData();
    } catch (err: any) {
      alert(err.message || `Failed to ${action} leave`);
    }
  };

  return (
    <DashboardLayout title="Leave & Absence Management">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">Paid Time Off & Leaves</h2>
          <p className="text-xs text-slate-400">Track entitlements, submit time-off requests, and review team absences</p>
        </div>

        <button
          onClick={() => setShowApplyModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-glow transition"
        >
          <Plus className="w-4 h-4" />
          <span>Apply for Leave</span>
        </button>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {balances.map((b: any, i: number) => (
          <div key={i} className="glass-card p-5 rounded-2xl border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">{b.leaveType?.name || 'Leave Type'}</span>
              <CalendarDays className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold font-mono text-cyan-300">{b.remainingDays}</span>
              <span className="text-xs text-slate-500 font-medium">days remaining</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-white/5 font-mono">
              <span>Allocated: {b.allocatedDays}</span>
              <span>Used: {b.usedDays || 0}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Requests & Approvals Table */}
      <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Leave Applications & Status</h3>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="border-b border-white/5 bg-white/[0.02] text-slate-400 uppercase font-mono text-[10px]">
            <tr>
              <th className="py-3 px-4">Applicant</th>
              <th className="py-3 px-4">Leave Type</th>
              <th className="py-3 px-4">Dates</th>
              <th className="py-3 px-4">Days</th>
              <th className="py-3 px-4">Reason</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 text-slate-300">
            {leaveRequests.map((req) => (
              <tr key={req.id} className="hover:bg-white/[0.02] transition">
                <td className="py-3 px-4 font-semibold text-slate-100">
                  {req.employee ? `${req.employee.firstName} ${req.employee.lastName}` : 'Employee'}
                </td>
                <td className="py-3 px-4">{req.leaveType?.name || 'Annual'}</td>
                <td className="py-3 px-4 font-mono text-slate-300">
                  {req.startDate?.split('T')[0]} &rarr; {req.endDate?.split('T')[0]}
                </td>
                <td className="py-3 px-4 font-bold font-mono text-cyan-400">{req.totalDays}d</td>
                <td className="py-3 px-4 text-slate-400 truncate max-w-xs">{req.reason}</td>
                <td className="py-3 px-4">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      req.status === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : req.status === 'REJECTED'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="py-3 px-4 text-right">
                  {req.status === 'PENDING' &&
                    hasRole(SystemRole.MANAGER, SystemRole.HR_ADMIN, SystemRole.SUPER_ADMIN) && (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleApproveReject(req.id, 'approve')}
                          title="Approve Leave"
                          className="p-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 transition"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleApproveReject(req.id, 'reject')}
                          title="Reject Leave"
                          className="p-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 transition"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Leave Application Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Submit Leave Request</h3>
            <form onSubmit={handleApply} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Leave Category</label>
                <select
                  value={leaveTypeId}
                  onChange={(e) => setLeaveTypeId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-surface-900 border border-white/10 text-slate-100 outline-none"
                >
                  {leaveTypes.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Max {t.defaultDaysPerYear}d)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Reason for Leave</label>
                <textarea
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Provide context for manager review..."
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 outline-none h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-glow"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
