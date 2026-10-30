'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileQuestion,
  BookOpen,
  Users,
  Activity,
  Plus,
  ArrowRight,
  TrendingUp,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function InstructorDashboard() {
  const [exams, setExams] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [meRes, examsRes, coursesRes] = await Promise.all([
          fetch('/api/auth/me'),
          fetch('/api/exams'),
          fetch('/api/courses'),
        ]);

        if (meRes.ok) {
          const meData = await meRes.json();
          setUser(meData.user);
        }
        if (examsRes.ok) {
          const exData = await examsRes.json();
          setExams(exData.exams || []);
        }
        if (coursesRes.ok) {
          const cData = await coursesRes.json();
          setCourses(cData.courses || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const totalAttempts = exams.reduce((sum, e) => sum + (e.attempts?.length || 0), 0);
  const totalQuestions = exams.reduce((sum, e) => sum + (e.questions?.length || 0), 0);
  const sub = user?.subscription;

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-sky-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-blue-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-[11px] font-semibold border border-white/20">
            <span>{user?.institution || 'Nigerian Higher Education'}</span>
            <span>•</span>
            <span className="font-mono">{user?.department || 'Faculty Lead'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Welcome back, {user?.name || 'Lecturer'}
          </h1>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl leading-relaxed">
            Manage your courses, parse Word exam papers into questions, monitor ongoing candidate attempts in real-time, and download master grading sheets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/instructor/exams/create"
            className="px-5 py-2.5 rounded-2xl bg-white text-blue-700 font-bold text-xs shadow-md hover:bg-blue-50 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Exam</span>
          </Link>
          <Link
            href="/instructor/courses"
            className="px-4 py-2.5 rounded-2xl bg-blue-800/80 hover:bg-blue-800 text-white font-bold text-xs border border-white/20 transition-all"
          >
            Manage Courses
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Courses</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{courses.length}</div>
          <div className="text-[11px] text-slate-500">Curriculum units assigned</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Exams Authored</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileQuestion className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{exams.length}</div>
          <div className="text-[11px] text-slate-500">{totalQuestions} total questions ingested</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Candidate Attempts</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900">{totalAttempts}</div>
          <div className="text-[11px] text-slate-500">Graded & tracked submissions</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Tier Quota Usage</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-black text-slate-900 font-mono">
            {exams.length} / {sub?.maxExamsPerMonth || 25}
          </div>
          <div className="text-[11px] text-slate-500">
            {sub?.tier || 'PRO'} Tier • Max {sub?.maxStudents || 300} students
          </div>
        </div>
      </div>

      {/* Active Examinations Hub */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Active Examinations & CBT Tests</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Launch real-time monitors, edit question stems, or review proctoring analytics
            </p>
          </div>
          <Link
            href="/instructor/exams"
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
          >
            <span>View All Exams</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {exams.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No exams created yet. Click "Create New Exam" to begin.
            </div>
          ) : (
            exams.map((exam) => {
              const inProgressCount = exam.attempts?.filter((a: any) => a.status === 'IN_PROGRESS').length || 0;
              const completedCount = exam.attempts?.filter((a: any) => a.status !== 'IN_PROGRESS').length || 0;

              return (
                <div key={exam.id} className="p-6 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs font-mono bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-lg border border-blue-200">
                        {exam.accessCode}
                      </span>
                      <span className="font-semibold text-xs text-slate-500">
                        {exam.course?.code} - {exam.course?.title}
                      </span>
                      <Badge variant={exam.isPublished ? 'success' : 'slate'} size="sm">
                        {exam.isPublished ? 'PUBLISHED' : 'DRAFT'}
                      </Badge>
                    </div>

                    <h4 className="font-extrabold text-slate-900 text-base">{exam.title}</h4>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 pt-1">
                      <span><strong>{exam.durationMinutes}</strong> mins duration</span>
                      <span>•</span>
                      <span><strong>{exam.questions?.length || 0}</strong> questions</span>
                      <span>•</span>
                      <span><strong>{exam.passMarkPercentage}%</strong> pass mark</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-semibold">{inProgressCount} active now</span>
                      <span>•</span>
                      <span>{completedCount} submitted</span>
                    </div>
                  </div>

                  {/* Actions for this exam */}
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/instructor/exams/${exam.id}/monitor`}
                      className="px-3.5 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5"
                    >
                      <Activity className="w-3.5 h-3.5" />
                      <span>Live Monitor</span>
                    </Link>

                    <Link
                      href={`/instructor/exams/${exam.id}/questions`}
                      className="px-3.5 py-2 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5"
                    >
                      <FileQuestion className="w-3.5 h-3.5" />
                      <span>Questions ({exam.questions?.length || 0})</span>
                    </Link>

                    <Link
                      href={`/instructor/exams/${exam.id}/analytics`}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all flex items-center space-x-1.5"
                    >
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Analytics</span>
                    </Link>

                    <a
                      href={`/api/exams/${exam.id}/export?format=xlsx`}
                      download
                      className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                      title="Download Master Results Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                    </a>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
