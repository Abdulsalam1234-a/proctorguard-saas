'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Wifi,
  FileText,
  Lock,
  ArrowRight,
  CheckCircle2,
  Users,
  Building,
  School,
  GraduationCap,
  Sparkles,
  BarChart,
  Eye,
  Download,
} from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { Badge } from '@/components/ui/Badge';

export default function HomePage() {
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('LAW301-2026');

  const handleLaunchExam = (e: React.FormEvent) => {
    e.preventDefault();
    if (accessCode.trim()) {
      router.push(`/exam/${accessCode.trim().toUpperCase()}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-200/80 bg-gradient-to-b from-white via-slate-50/50 to-slate-100/50">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold mb-6">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Engineered for Resilient Emerging-Market CBT & High-Integrity Testing</span>
            </div>

            <h1 className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
              Production-Grade Multi-Tenant{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-indigo-600 to-sky-600">
                Proctoring & Assessment
              </span>{' '}
              SaaS
            </h1>

            <p className="mt-6 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Equipped with <strong>Zero-Data-Loss</strong> offline synchronization, native browser anti-malpractice lockdown, Mammoth .docx question ingestion, and dynamic multi-tier institutional quotas.
            </p>

            {/* Quick Candidate CBT Launcher Form */}
            <div className="mt-10 max-w-xl mx-auto bg-white p-3 rounded-2xl shadow-xl border border-slate-200">
              <form onSubmit={handleLaunchExam} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 font-mono text-xs">
                    CODE:
                  </div>
                  <input
                    type="text"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    placeholder="e.g., LAW301-2026"
                    className="w-full pl-16 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-mono font-bold text-sm text-slate-900 uppercase"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 hover:shadow-lg transition-all flex items-center justify-center space-x-2 whitespace-nowrap"
                >
                  <span>Launch CBT Exam</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="flex items-center justify-center space-x-3 text-[11px] text-slate-500 mt-2.5">
                <span>Try Preloaded CBT Codes:</span>
                <button
                  type="button"
                  onClick={() => setAccessCode('LAW301-2026')}
                  className="font-mono font-bold text-blue-600 hover:underline"
                >
                  LAW301-2026
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setAccessCode('FIN301-EXAM')}
                  className="font-mono font-bold text-blue-600 hover:underline"
                >
                  FIN301-EXAM
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setAccessCode('CSC201-TEST')}
                  className="font-mono font-bold text-blue-600 hover:underline"
                >
                  CSC201-TEST
                </button>
              </div>
            </div>

            {/* Portal Action Cards */}
            <div className="mt-14 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto text-left">
              {/* Card 1: Student Assessment */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Candidate Examination Portal</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Distraction-free assessment UI with single question view, local write-through caching, offline queue flush, countdown timer, and corner webcam mirror.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href={`/exam/${accessCode}`}
                    className="text-xs font-bold text-sky-700 hover:text-sky-800 flex items-center space-x-1"
                  >
                    <span>Enter Exam Session</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Badge variant="info" size="sm">Single Attempt</Badge>
                </div>
              </div>

              {/* Card 2: Instructor Portal */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                    <School className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Instructor Assessment Hub</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Create courses, ingest Word (.docx) exam papers with Mammoth, monitor live candidate heartbeats, unlock locked attempts, and export master Excel sheets.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href="/instructor"
                    className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center space-x-1"
                  >
                    <span>Manage Assessments</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Badge variant="purple" size="sm">Faculty Hub</Badge>
                </div>
              </div>

              {/* Card 3: Super Admin Portal */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                    <Building className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Super Admin & NUC Oversight</h3>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    Platform owner tenant management across all universities, subscription tier allocation (Member, Pro, Premium), automated AuditLog diffs, and score overrides.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    href="/admin"
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                  >
                    <span>Enter Governance Board</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                  <Badge variant="success" size="sm">NUC Owner</Badge>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              High-Integrity Architecture Highlights
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Designed specifically to resolve the realities of power fluctuations, erratic internet, and strict academic anti-cheating regulations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-3">
                <Wifi className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Zero-Data-Loss Offline Sync</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Local write-through storage immediately commits selected answers. When connectivity drops, background queue buffers answers and flushes monotonically upon reconnection.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center mb-3">
                <Eye className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Multi-Modal Proctoring</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Continuous 160x120px webcam tracking, window blur listeners, strict tab switch limits with auto-termination, and clipboard/fullscreen lockdown.
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">Mammoth .docx Extraction</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Converts Word exam files into structured staging JSON payloads with automatic detection of numbering (1., 1)), options (A., B., [ ]), and answers (Ans: B).
              </p>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <Download className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-sm text-slate-900">XLSX & CSV Export Engine</h4>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Generates multi-sheet Excel reports containing official grading sheets, per-question candidate selections, proctoring violation logs, and statistical pass metrics.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="font-bold text-slate-800">ProctorGuard Multi-Tenant SaaS CBT Platform</span>
          </div>
          <div>Built for High Academic Integrity & Offline Resilience • Version 1.0 Production</div>
        </div>
      </footer>
    </div>
  );
}
