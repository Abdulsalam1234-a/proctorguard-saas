'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  ArrowLeft,
  Download,
  FileSpreadsheet,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  TrendingUp,
  Users,
  ShieldAlert,
  Percent,
} from 'lucide-react';
import { ScoreDistributionChart } from '@/components/analytics/ScoreDistributionChart';
import { MalpracticeBreakdownChart } from '@/components/analytics/MalpracticeBreakdownChart';
import { SubmissionTypeChart } from '@/components/analytics/SubmissionTypeChart';
import { Badge } from '@/components/ui/Badge';

export default function ExamAnalyticsPage({ params }: { params: { id: string } }) {
  const examId = params.id;
  const [exam, setExam] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        if (res.ok) {
          const data = await res.json();
          setExam(data.exam);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [examId]);

  if (!exam) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading statistical dashboard...</div>;
  }

  const attempts = exam.attempts || [];
  const totalAttempts = attempts.length;
  const passMark = exam.passMarkPercentage || 50;

  const passedAttempts = attempts.filter((a: any) => (a.percentage ?? 0) >= passMark);
  const failedAttempts = attempts.filter((a: any) => (a.percentage ?? 0) < passMark);

  const passRate = totalAttempts > 0 ? ((passedAttempts.length / totalAttempts) * 100).toFixed(1) : '0.0';
  const failRate = totalAttempts > 0 ? ((failedAttempts.length / totalAttempts) * 100).toFixed(1) : '0.0';

  const allScores = attempts.map((a: any) => a.percentage ?? 0);
  const avgPercentage =
    totalAttempts > 0 ? (allScores.reduce((sum: number, val: number) => sum + val, 0) / totalAttempts).toFixed(1) : '0.0';

  const allViolations = attempts.flatMap((a: any) => a.violations || []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/instructor/exams"
            className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-lg">
                {exam.accessCode}
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{exam.title}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Course: <strong>{exam.course?.code}</strong> • Statistical Performance & Proctoring Report
            </p>
          </div>
        </div>

        {/* Dual Export Actions */}
        <div className="flex items-center space-x-2.5">
          <a
            href={`/api/exams/${examId}/export?format=xlsx`}
            download
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Export Master Excel (.xlsx)</span>
          </a>

          <a
            href={`/api/exams/${examId}/export?format=csv`}
            download
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>CSV</span>
          </a>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Total Attempts</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-3xl font-black text-slate-900">{totalAttempts}</div>
          <div className="text-[11px] text-slate-500">Candidates registered</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-emerald-600 uppercase">
            <span>Pass Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600">{passRate}%</div>
          <div className="text-[11px] text-slate-500">{passedAttempts.length} passed (threshold {passMark}%)</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-rose-600 uppercase">
            <span>Fail Rate</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-3xl font-black text-rose-600">{failRate}%</div>
          <div className="text-[11px] text-slate-500">{failedAttempts.length} below passing mark</div>
        </div>

        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-indigo-600 uppercase">
            <span>Mean Performance</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-3xl font-black text-indigo-600">{avgPercentage}%</div>
          <div className="text-[11px] text-slate-500">Average candidate score</div>
        </div>
      </div>

      {/* Visual Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Score Distribution */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Score Distribution Histogram</h3>
              <p className="text-xs text-slate-400">Frequency of candidate percentages by score bin</p>
            </div>
            <Badge variant="success">Pass threshold {passMark}%</Badge>
          </div>
          <ScoreDistributionChart scores={allScores} passMarkPercentage={passMark} />
        </div>

        {/* Chart 2: Malpractice Breakdown */}
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">Malpractice Flags Breakdown</h3>
              <p className="text-xs text-slate-400">Categorization of recorded proctoring infractions</p>
            </div>
            <Badge variant="warning">{allViolations.length} total flags</Badge>
          </div>
          <MalpracticeBreakdownChart violations={allViolations} />
        </div>
      </div>

      {/* Chart 3 & Submission Categorization Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">Submission Categorization</h3>
            <p className="text-xs text-slate-400">Normal vs Auto-submit modes</p>
          </div>
          <SubmissionTypeChart attempts={attempts} />
        </div>

        {/* Candidate Ranking & Score Table */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-slate-900">Candidate Grade Sheet Preview</h3>
            <span className="text-xs text-slate-400">Full sheets in Excel (.xlsx)</span>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3">Matric / ID</th>
                  <th className="px-6 py-3">Student Name</th>
                  <th className="px-6 py-3">Score</th>
                  <th className="px-6 py-3">Percentage</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Switches</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {attempts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                      No attempts recorded yet
                    </td>
                  </tr>
                ) : (
                  attempts.map((att: any) => (
                    <tr key={att.id} className="hover:bg-slate-50/70">
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-900">{att.studentId}</td>
                      <td className="px-6 py-3.5 font-semibold text-slate-900">{att.studentName}</td>
                      <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                        {att.score ?? '-'} / {att.totalPoints}
                      </td>
                      <td className="px-6 py-3.5 font-mono font-bold">
                        <span
                          className={(att.percentage ?? 0) >= passMark ? 'text-emerald-600' : 'text-rose-600'}
                        >
                          {att.percentage != null ? `${att.percentage.toFixed(1)}%` : '-'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5">
                        <Badge
                          variant={
                            att.status === 'SUBMITTED'
                              ? 'success'
                              : att.status === 'IN_PROGRESS'
                              ? 'info'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {att.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-3.5 font-mono text-slate-600">{att.tabSwitchCount}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
