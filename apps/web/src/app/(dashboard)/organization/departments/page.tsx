'use client';

import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, FolderTree, ArrowRight, Trash2 } from 'lucide-react';
import { DashboardLayout } from '../../../../components/layout/dashboard-layout';
import { api } from '../../../../lib/api-client';
import { useAuth } from '../../../../context/auth-context';
import { SystemRole } from '@ems/shared';

export default function DepartmentsPage() {
  const { hasRole } = useAuth();
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');

  const fetchDepts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/departments');
      setDepartments(res || []);
    } catch {
      setDepartments([
        { id: '1', name: 'Engineering', code: 'ENG', description: 'Software Development & Platform Engineering', _count: { employees: 3, designations: 2 } },
        { id: '2', name: 'Human Resources', code: 'HR', description: 'Talent Acquisition & Employee Operations', _count: { employees: 1, designations: 1 } },
        { id: '4', name: 'Finance & Accounting', code: 'FIN', description: 'Payroll & Financial Planning', _count: { employees: 0, designations: 0 } },
        { id: '5', name: 'Marketing', code: 'MKT', description: 'Brand Strategy, Public Relations and Growth Marketing', _count: { employees: 0, designations: 0 } },
        { id: '6', name: 'Legal', code: 'LGL', description: 'Corporate Governance, Contracts and Regulatory Compliance', _count: { employees: 0, designations: 0 } },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  const handleDelete = async (id: string, deptName: string) => {
    if (!confirm(`Are you sure you want to remove the ${deptName} department?`)) return;
    try {
      await api.delete(`/departments/${id}`);
      fetchDepts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete department');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/departments', { name, code, description });
      setShowModal(false);
      setName('');
      setCode('');
      setDescription('');
      fetchDepts();
    } catch (err: any) {
      alert(err.message || 'Failed to create department');
    }
  };

  return (
    <DashboardLayout title="Department Hierarchy & Organization">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-100">Organizational Departments</h2>
          <p className="text-xs text-slate-400">Department structures, functional units, and headcount distribution</p>
        </div>

        {hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN) && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-glow transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Department</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs font-mono">Loading departments...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {departments.map((dept) => (
            <div key={dept.id} className="glass-card p-5 rounded-2xl border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-primary-600/20 border border-primary-500/30 flex items-center justify-center text-primary-300">
                  <Building2 className="w-5 h-5" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/[0.04] text-slate-300 border border-white/10">
                    {dept.code}
                  </span>
                  {hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN) && (
                    <button
                      onClick={() => handleDelete(dept.id, dept.name)}
                      title={`Delete ${dept.name} department`}
                      className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-100">{dept.name}</h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">{dept.description || 'Core business unit'}</p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-500" />
                  <span>{dept._count?.employees ?? 0} Employees</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-slate-500" />
                  <span>{dept._count?.designations ?? 0} Roles</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Creation Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel p-6 rounded-2xl border border-white/10 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-slate-100">Create New Department</h3>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Data Science"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 outline-none focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. DATA"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 outline-none focus:border-primary-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mission and scope of this department"
                  className="w-full px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-slate-100 outline-none focus:border-primary-500 h-20"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white font-semibold shadow-glow"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
