'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  ScrollText,
  BookOpen,
  FileQuestion,
  Activity,
  BarChart3,
  Users,
  HardDrive,
  ShieldAlert,
  CreditCard,
  Sparkles,
} from 'lucide-react';

interface SidebarProps {
  role?: 'SUPER_ADMIN' | 'INSTRUCTOR';
  subscription?: any;
}

export function Sidebar({ role = 'INSTRUCTOR', subscription }: SidebarProps) {
  const pathname = usePathname();

  const isSuperAdmin = role === 'SUPER_ADMIN';

  const superAdminNav = [
    { label: 'Admin Overview', href: '/admin', icon: LayoutDashboard },
    { label: 'Tenant Oversight & Quotas', href: '/admin/tenants', icon: Building2 },
    { label: 'Platform Audit Trail', href: '/admin/audit', icon: ScrollText },
  ];

  const instructorNav = [
    { label: 'Instructor Hub', href: '/instructor', icon: LayoutDashboard },
    { label: 'Courses', href: '/instructor/courses', icon: BookOpen },
    { label: 'Exams & CBT Tests', href: '/instructor/exams', icon: FileQuestion },
    { label: 'Billing & Plans', href: '/instructor/billing', icon: CreditCard },
  ];

  const navItems = isSuperAdmin ? superAdminNav : instructorNav;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 min-h-[calc(100vh-4rem)] p-4 flex flex-col justify-between">
      <div className="space-y-6">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
            {isSuperAdmin ? 'Platform Governance' : 'Assessment Management'}
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Quick Links */}
        {!isSuperAdmin && (
          <div className="pt-4 border-t border-slate-100">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Candidate Testing
            </div>
            <Link
              href="/exam/LAW301-2026"
              target="_blank"
              className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium text-slate-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <span className="flex items-center space-x-2">
                <Activity className="w-3.5 h-3.5 text-blue-600" />
                <span>Launch Test Portal</span>
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.5 rounded">
                Live
              </span>
            </Link>
          </div>
        )}
      </div>

      {/* Subscription Quota Usage Card */}
      {!isSuperAdmin && subscription && (
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
              {subscription.tier} Plan Quotas
            </span>
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              {subscription.status}
            </span>
          </div>

          {/* Students meter */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span className="flex items-center space-x-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>Active Candidates</span>
              </span>
              <span className="font-semibold text-slate-900">
                Limit: {subscription.maxStudents}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div className="bg-blue-600 h-full rounded-full w-2/5" />
            </div>
          </div>

          {/* Monthly Exams meter */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span className="flex items-center space-x-1">
                <FileQuestion className="w-3 h-3 text-slate-400" />
                <span>Monthly Tests</span>
              </span>
              <span className="font-semibold text-slate-900">
                {subscription.currentExamCount || 2} / {subscription.maxExamsPerMonth === -1 ? '∞' : subscription.maxExamsPerMonth}
              </span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full"
                style={{
                  width: `${subscription.maxExamsPerMonth === -1 ? 25 : Math.min(
                    100,
                    ((subscription.currentExamCount || 2) / (subscription.maxExamsPerMonth || 5)) * 100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Storage meter */}
          <div className="space-y-1">
            <div className="flex justify-between text-[11px] text-slate-600">
              <span className="flex items-center space-x-1">
                <HardDrive className="w-3 h-3 text-slate-400" />
                <span>File Storage</span>
              </span>
              <span className="font-semibold text-slate-900">
                {subscription.storageLimitMb} MB
              </span>
            </div>
          </div>

          {/* Upgrade Plan button */}
          <div className="pt-2 border-t border-slate-200/60">
            <Link
              href="/instructor/billing"
              className="w-full py-1.5 px-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-[11px] font-bold text-center flex items-center justify-center space-x-1.5 shadow-sm transition-all"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>Upgrade Plan Quotas</span>
            </Link>
          </div>
        </div>
      )}
    </aside>
  );
}
