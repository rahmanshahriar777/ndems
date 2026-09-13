'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Mail,
  Phone,
  Building2,
  Briefcase,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { DashboardLayout } from '../../../components/layout/dashboard-layout';
import { api } from '../../../lib/api-client';
import { useAuth } from '../../../context/auth-context';
import { SystemRole } from '@ems/shared';

export default function EmployeesPage() {
  const { hasRole } = useAuth();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const res = await api.get('/employees', {
          params: { search: search || undefined, limit: 50 },
        });
        setEmployees(res?.items || []);
      } catch {
        // Fallback demo data if backend not active
        setEmployees([
          {
            id: '1',
            employeeNumber: 'EMP-2026-0001',
            firstName: 'System',
            lastName: 'Administrator',
            email: 'superadmin@ems.local',
            phone: '+1 (555) 010-0001',
            department: { name: 'Engineering' },
            designation: { title: 'VP of Engineering' },
            status: 'FULL_TIME',
          },
          {
            id: '2',
            employeeNumber: 'EMP-2026-0002',
            firstName: 'HR',
            lastName: 'Manager',
            email: 'hradmin@ems.local',
            phone: '+880 1711-000002',
            department: { name: 'Human Resources' },
            designation: { title: 'HR Operations Manager' },
            status: 'FULL_TIME',
          },
          {
            id: '3',
            employeeNumber: 'EMP-2026-0003',
            firstName: 'Shahriar',
            lastName: 'Rahman',
            email: 'manager@ems.local',
            phone: '+880 1711-000003',
            department: { name: 'Engineering' },
            designation: { title: 'Engineering Manager' },
            status: 'FULL_TIME',
          },
          {
            id: '4',
            employeeNumber: 'EMP-2026-0004',
            firstName: 'Sadia',
            lastName: 'Rahman',
            email: 'sadia.rahman@ems.local',
            phone: '+880 1711-000004',
            department: { name: 'Engineering' },
            designation: { title: 'Senior Software Engineer' },
            status: 'FULL_TIME',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    const delay = setTimeout(fetchEmployees, 250);
    return () => clearTimeout(delay);
  }, [search]);

  return (
    <DashboardLayout title="Employee Management & Directory">
      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or employee number..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/[0.04] border border-white/10 text-xs text-slate-100 placeholder:text-slate-500 outline-none focus:border-primary-500 transition"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/10 text-xs">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg font-medium transition ${viewMode === 'grid' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Directory Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg font-medium transition ${viewMode === 'table' ? 'bg-primary-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Table View
            </button>
          </div>

          {hasRole(SystemRole.SUPER_ADMIN, SystemRole.HR_ADMIN) && (
            <button className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-primary-600 hover:bg-primary-500 text-white text-xs font-semibold shadow-glow transition">
              <Plus className="w-4 h-4" />
              <span>Add Employee</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 text-xs font-mono">
          Loading employee records...
        </div>
      ) : employees.length === 0 ? (
        <div className="py-16 text-center text-slate-400 glass-card rounded-2xl border border-white/5">
          <Users className="w-10 h-10 text-slate-600 mx-auto mb-2" />
          <p className="text-sm font-semibold">No employee records match your query</p>
          <p className="text-xs text-slate-500 mt-1">Try refining your search filter</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {employees.map((emp) => (
            <div
              key={emp.id}
              className="glass-card p-5 rounded-2xl border border-white/5 hover:border-primary-500/40 flex flex-col justify-between group transition"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-primary-600/30 to-cyan-500/20 border border-primary-500/30 flex items-center justify-center text-sm font-bold text-primary-300">
                    {emp.firstName?.[0]}
                    {emp.lastName?.[0]}
                  </div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {emp.status || 'FULL_TIME'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-slate-100 group-hover:text-primary-300 transition">
                  {emp.firstName} {emp.lastName}
                </h3>
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{emp.employeeNumber}</p>

                <div className="space-y-1.5 mt-4 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate text-slate-300 font-medium">
                      {emp.designation?.title || 'Engineer'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{emp.department?.name || 'Engineering'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="truncate font-mono text-[11px]">{emp.email}</span>
                  </div>
                </div>
              </div>

              <Link
                href={`/employees/${emp.id}`}
                className="mt-5 w-full py-2 px-3 rounded-xl bg-white/[0.03] hover:bg-primary-600/20 hover:text-primary-300 border border-white/5 hover:border-primary-500/30 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
              >
                <span>View Full Profile</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-white/5 bg-white/[0.02] text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-4">Number</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Designation</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-white/[0.02] transition">
                  <td className="py-3 px-4 font-semibold text-slate-100">
                    {emp.firstName} {emp.lastName}
                    <span className="block text-[11px] font-normal text-slate-500 font-mono">{emp.email}</span>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">{emp.employeeNumber}</td>
                  <td className="py-3 px-4">{emp.department?.name || 'Engineering'}</td>
                  <td className="py-3 px-4 text-slate-200">{emp.designation?.title || 'Engineer'}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                      {emp.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/employees/${emp.id}`}
                      className="text-primary-400 hover:text-primary-300 font-medium"
                    >
                      View Details
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardLayout>
  );
}
