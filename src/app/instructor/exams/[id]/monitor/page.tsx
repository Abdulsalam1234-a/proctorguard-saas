'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  RefreshCw,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Video,
  Eye,
  Clock,
  User,
  ShieldCheck,
  AlertOctagon,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function RealTimeMonitorPage({ params }: { params: { id: string } }) {
  const examId = params.id;
  const [exam, setExam] = useState<any>(null);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [unlockFeedback, setUnlockFeedback] = useState<string | null>(null);

  const fetchMonitorData = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}`);
      if (res.ok) {
        const data = await res.json();
        setExam(data.exam);
        setAttempts(data.exam?.attempts || []);
        setLastUpdated(new Date());
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMonitorData();
  }, [examId]);

  // Live telemetry polling
  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      fetchMonitorData();
    }, 5000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, examId]);

  const handleUnlockCandidate = async (attemptId: string, studentName: string) => {
    if (!confirm(`Are you sure you want to unlock candidate "${studentName}"? This resets infraction counter to 0 and permits re-entry.`)) {
      return;
    }

    try {
      const res = await fetch('/api/student/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId }),
      });

      const data = await res.json();
      if (res.ok) {
        setUnlockFeedback(`Candidate ${studentName} was successfully unlocked.`);
        await fetchMonitorData();
        setTimeout(() => setUnlockFeedback(null), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const inProgress = attempts.filter((a) => a.status === 'IN_PROGRESS');
  const violationsBreached = attempts.filter((a) => a.status === 'AUTO_SUBMITTED_VIOLATION');
  const normalSubmitted = attempts.filter((a) => a.status === 'SUBMITTED');
  const totalViolations = attempts.reduce((acc, a) => acc + (a.violations?.length || 0), 0);

  if (!exam) {
    return <div className="p-12 text-center text-xs text-slate-400">Connecting to examination telemetry...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
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
              <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-lg flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>LIVE TELEMETRY</span>
              </span>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{exam.title}</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Access Code: <code className="font-mono font-bold text-blue-600">{exam.accessCode}</code> • Max Tab Switches: {exam.maxTabSwitches} • Last Heartbeat Sync: {lastUpdated.toLocaleTimeString()}
            </p>
          </div>
        </div>

        {/* Refresh & Polling Controls */}
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-xs font-semibold text-slate-600 cursor-pointer bg-white px-3 py-2 rounded-xl border border-slate-200">
            <input
              type="checkbox"
              checked={isAutoRefresh}
              onChange={(e) => setIsAutoRefresh(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span>Auto-Refresh (5s)</span>
          </label>

          <button
            onClick={fetchMonitorData}
            className="p-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 shadow-sm"
            title="Manual sync now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {unlockFeedback && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{unlockFeedback}</span>
        </div>
      )}

      {/* Live Metric Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Active Candidates In-Session</div>
          <div className="text-2xl font-black text-emerald-600 mt-1 flex items-center space-x-2">
            <span>{inProgress.length}</span>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Terminated (Malpractice)</div>
          <div className="text-2xl font-black text-rose-600 mt-1">{violationsBreached.length}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Total Proctoring Flags</div>
          <div className="text-2xl font-black text-amber-600 mt-1">{totalViolations}</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] uppercase font-bold text-slate-400">Normal Submissions</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{normalSubmitted.length}</div>
        </div>
      </div>

      {/* Real-Time Candidate Grid */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900">Live Candidate Attempt Status</h3>
          <span className="text-xs text-slate-500 font-semibold">{attempts.length} Total Registered Attempts</span>
        </div>

        <div className="divide-y divide-slate-100">
          {attempts.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No candidates have entered this assessment yet. Share access code <code className="font-mono font-bold text-blue-600">{exam.accessCode}</code> with students.
            </div>
          ) : (
            attempts.map((att) => {
              const isLocked = att.status === 'AUTO_SUBMITTED_VIOLATION' || att.status === 'SUBMITTED';
              const tabExceeded = att.tabSwitchCount >= exam.maxTabSwitches;

              // Check heartbeat latency
              const lastHb = att.lastHeartbeat ? new Date(att.lastHeartbeat).getTime() : 0;
              const isHeartbeatLive = Date.now() - lastHb < 35000;

              return (
                <div
                  key={att.id}
                  className={`p-6 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                    att.status === 'AUTO_SUBMITTED_VIOLATION'
                      ? 'bg-rose-50/40'
                      : att.status === 'IN_PROGRESS'
                      ? 'hover:bg-slate-50/70'
                      : 'bg-white'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Heartbeat pulse pill */}
                      {att.status === 'IN_PROGRESS' && (
                        <span
                          className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                            isHeartbeatLive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isHeartbeatLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                            }`}
                          />
                          <span>{isHeartbeatLive ? 'Heartbeat Live' : 'Signal Degraded'}</span>
                        </span>
                      )}

                      <span className="font-mono font-bold text-xs bg-slate-100 px-2.5 py-0.5 rounded text-slate-800">
                        {att.studentId}
                      </span>

                      <Badge
                        variant={
                          att.status === 'IN_PROGRESS'
                            ? 'info'
                            : att.status === 'SUBMITTED'
                            ? 'success'
                            : 'danger'
                        }
                      >
                        {att.status}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <h4 className="font-extrabold text-base text-slate-900">{att.studentName}</h4>
                      {att.score != null && (
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {att.score} / {att.totalPoints} pts ({att.percentage?.toFixed(1)}%)
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                      <span>Started: {new Date(att.startedAt).toLocaleTimeString()}</span>
                      <span>•</span>
                      <span>Answers Synced: <strong>{att.answers?.length || 0}</strong></span>
                      <span>•</span>
                      <span className={tabExceeded ? 'text-rose-600 font-bold' : ''}>
                        Tab Switches: <strong>{att.tabSwitchCount}</strong> / {exam.maxTabSwitches}
                      </span>
                      <span>•</span>
                      <span>Total Violations: <strong>{att.violations?.length || 0}</strong></span>
                    </div>

                    {/* Violations Preview if any */}
                    {att.violations && att.violations.length > 0 && (
                      <div className="pt-1 flex flex-wrap gap-1.5">
                        {att.violations.slice(-3).map((v: any, vIdx: number) => (
                          <span
                            key={vIdx}
                            className="text-[10px] bg-rose-50 border border-rose-200 text-rose-800 px-2 py-0.5 rounded-md flex items-center space-x-1"
                          >
                            <AlertTriangle className="w-3 h-3 text-rose-500 flex-shrink-0" />
                            <span>{v.type}: {v.details?.substring(0, 40)}...</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions (Unlock Candidate) */}
                  <div className="flex items-center space-x-3 pt-2 lg:pt-0">
                    {isLocked ? (
                      <button
                        onClick={() => handleUnlockCandidate(att.id, att.studentName)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>Unlock & Allow Re-entry</span>
                      </button>
                    ) : (
                      <div className="text-right text-xs text-emerald-700 font-semibold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                        Active Exam Session
                      </div>
                    )}
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
