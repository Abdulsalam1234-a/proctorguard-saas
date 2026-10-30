'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  FileQuestion,
  GraduationCap,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Activity,
  Layers,
  AlertTriangle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function AdminOverviewPage() {
  const [tenants, setTenants] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalInstitutions: 0,
    totalInstructors: 0,
    totalExams: 0,
    totalAttempts: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/tenants');
        if (res.ok) {
          const data = await res.json();
          setTenants(data.tenants || []);
          setStats(data.stats || {});
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Platform Governance & Tenant Oversight
            </h1>
            <Badge variant="success">NUC Platform Owner</Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregate institutional monitoring across accredited tertiary institutions and faculty departments.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/tenants"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
          >
            <span>Manage All Tenants</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* High-Level Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Institutions</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalInstitutions}</div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <span className="text-emerald-600 font-bold">100% Active</span>
            <span>universities accredited</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Instructors</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalInstructors}</div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <span className="text-indigo-600 font-bold">Faculty Managers</span>
            <span>across tiers</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Exams Hosted</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileQuestion className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalExams}</div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <span className="text-amber-600 font-bold">Live CBT Sessions</span>
          </div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Candidate Volume</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{stats.totalAttempts}</div>
          <div className="text-[11px] text-slate-500 flex items-center space-x-1">
            <span className="text-emerald-600 font-bold">Student Attempts</span>
            <span>processed</span>
          </div>
        </div>
      </div>

      {/* Registered Institutions & Instructors Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Registered Institutional Tenants</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live status, allocated subscription tiers, and monthly quota capacities
            </p>
          </div>
          <Link
            href="/admin/tenants"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>Quota Management</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Institution & Department</th>
                <th className="px-6 py-3.5">Lead Instructor</th>
                <th className="px-6 py-3.5">Tier & Status</th>
                <th className="px-6 py-3.5">Student Quota</th>
                <th className="px-6 py-3.5">Exams / Month</th>
                <th className="px-6 py-3.5">Courses</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {tenants.map((tenant) => {
                const sub = tenant.subscription;
                return (
                  <tr key={tenant.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{tenant.institution}</div>
                      <div className="text-[11px] text-slate-500">{tenant.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-900">{tenant.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{tenant.email}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-1.5">
                        <Badge
                          variant={sub?.tier === 'PREMIUM' ? 'purple' : sub?.tier === 'PRO' ? 'info' : 'slate'}
                          size="sm"
                        >
                          {sub?.tier || 'MEMBER'}
                        </Badge>
                        <Badge variant={sub?.status === 'ACTIVE' ? 'success' : 'danger'} size="sm">
                          {sub?.status || 'TRIAL'}
                        </Badge>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {sub?.maxStudents || 50} students
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {sub?.maxExamsPerMonth || 5} tests/mo
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">{tenant.courses?.length || 0}</span> courses
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/tenants?edit=${tenant.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 rounded-lg font-bold text-[11px] transition-colors inline-block"
                      >
                        Adjust Quotas
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
