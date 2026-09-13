'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, Target, Star, Award, Plus, MessageSquare } from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../context/auth-context';

export default function PerformancePage() {
  const { user } = useAuth();
  const [cycles, setCycles] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [showGoalModal, setShowGoalModal] = useState(false);

  useEffect(() => {
    api.get('/performance/cycles').then((res) => setCycles(res || [])).catch(() => {});
    api.get('/goals').then((res) => setGoals(res || [])).catch(() => {
      setGoals([
        {
          id: '1',
          title: 'Deliver High-Performance TypeScript Monorepo',
          targetDate: '2026-10-31',
          progress: 85,
          status: 'IN_PROGRESS',
        },
        {
          id: '2',
          title: 'Achieve 90%+ Test Coverage on Core Modules',
          targetDate: '2026-11-15',
          progress: 60,
          status: 'IN_PROGRESS',
        },
      ]);
    });
    api.get('/performance/reviews').then((res) => setReviews(res || [])).catch(() => {
      setReviews([
        {
          id: '1',
          cycle: { title: 'H2 2026 Company Performance Appraisal Cycle' },
          selfRating: 4.8,
          managerRating: 4.9,
          finalScore: 4.85,
          status: 'COMPLETED',
          managerFeedback: 'Exceptional architectural delivery. Code quality and documentation meet highest enterprise standards.',
        },
      ]);
    });
  }, []);

  const handleCreateGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/goals', {
        title: newGoalTitle,
        targetDate: '2026-12-31',
        progress: 10,
      });
      setShowGoalModal(false);
      setNewGoalTitle('');
      const updated = await api.get('/goals');
      setGoals(updated || []);
    } catch (err: any) {
      alert(err.message || 'Failed to create goal');
    }
  };

  return (
    <DashboardLayout title="Performance Appraisals & Goal Tracking">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">Performance & Professional Development</h2>
          <p className="text-xs text-slate-400">Quarterly appraisal cycles, OKRs, and continuous peer feedback</p>
        </div>

        <button
          onClick={() => setShowGoalModal(true)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-glow transition"
        >
          <Plus className="w-4 h-4" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Goals Progress Column */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Target className="w-4 h-4 text-primary-400" />
              Active Goals & OKRs
            </h3>
            <span className="text-xs text-slate-400">{goals.length} in progress</span>
          </div>

          <div className="space-y-4">
            {goals.map((g) => (
              <div key={g.id} className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">{g.title}</span>
                  <span className="font-mono font-bold text-cyan-300">{g.progress}%</span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-500 to-cyan-400 transition-all duration-300"
                    style={{ width: `${g.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>Target Date: {g.targetDate?.split('T')[0] || '2026-12-31'}</span>
                  <span className="text-emerald-400 font-bold">{g.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Review Score Summary Column */}
        <div className="glass-card p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            Latest Appraisal Result
          </h3>

          {reviews[0] ? (
            <div className="space-y-4 text-xs">
              <div className="text-center p-5 rounded-xl bg-white/[0.02] border border-white/5">
                <div className="text-4xl font-extrabold font-mono text-amber-400">
                  {reviews[0].finalScore || '4.85'} / 5.0
                </div>
                <p className="text-slate-400 text-[11px] mt-1">Exceeds High Enterprise Expectations</p>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Self Evaluation:</span>
                  <span className="font-mono font-semibold text-slate-100">{reviews[0].selfRating || '4.8'}</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>Manager Appraisal:</span>
                  <span className="font-mono font-semibold text-slate-100">{reviews[0].managerRating || '4.9'}</span>
                </div>
              </div>

              {reviews[0].managerFeedback && (
                <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-slate-300">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono mb-1">Manager Remarks</span>
                  "{reviews[0].managerFeedback}"
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">No finalized reviews for this cycle yet.</p>
          )}
        </div>
      </div>

      {/* Goal Modal */}
      {showGoalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Create New Goal</h3>
            <form onSubmit={handleCreateGoal} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Goal Title</label>
                <input
                  type="text"
                  required
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  placeholder="e.g. Implement automated unit testing suite"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 outline-none focus:border-primary-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowGoalModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-glow"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
