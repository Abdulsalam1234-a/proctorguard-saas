'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  FileQuestion,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Save,
  Video,
  Shuffle,
  ShieldAlert,
  Clock,
  Sparkles,
} from 'lucide-react';
import { PaywallModal } from '@/components/billing/PaywallModal';
import { SubscriptionTier } from '@/lib/types';

function CreateExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');

  const [courses, setCourses] = useState<any[]>([]);
  const [courseId, setCourseId] = useState(preselectedCourseId || '');
  const [title, setTitle] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [durationMinutes, setDurationMinutes] = useState<number>(45);
  const [passMarkPercentage, setPassMarkPercentage] = useState<number>(50.0);
  const [randomizeQuestions, setRandomizeQuestions] = useState<boolean>(true);
  const [randomizeOptions, setRandomizeOptions] = useState<boolean>(true);
  const [maxTabSwitches, setMaxTabSwitches] = useState<number>(3);
  const [requireCamera, setRequireCamera] = useState<boolean>(true);
  const [isPublished, setIsPublished] = useState<boolean>(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<any>(null);
  const [showPaywall, setShowPaywall] = useState<boolean>(false);

  const fetchSubscription = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.user?.subscription || null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubscription();
    async function fetchCourses() {
      try {
        const res = await fetch('/api/courses');
        if (res.ok) {
          const data = await res.json();
          setCourses(data.courses || []);
          if (!courseId && data.courses?.length > 0) {
            setCourseId(data.courses[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchCourses();
  }, []);

  const handleGenerateCode = () => {
    const selectedCourse = courses.find((c) => c.id === courseId);
    const prefix = selectedCourse ? selectedCourse.code : 'EXAM';
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    setAccessCode(`${prefix}-${new Date().getFullYear()}-${random}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title.trim() || !accessCode.trim()) {
      setError('Course, Exam Title, and Access Code are mandatory.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/exams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          title: title.trim(),
          accessCode: accessCode.trim().toUpperCase(),
          durationMinutes: Number(durationMinutes),
          passMarkPercentage: Number(passMarkPercentage),
          randomizeQuestions,
          randomizeOptions,
          maxTabSwitches: Number(maxTabSwitches),
          requireCamera,
          isPublished,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.quotaExceeded) {
          setShowPaywall(true);
        }
        throw new Error(data.error || 'Failed to create exam');
      }

      // Route directly to question ingestion page for this new exam!
      router.push(`/instructor/exams/${data.exam.id}/questions`);
    } catch (err: any) {
      setError(err.message || 'Creation error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isQuotaExceeded =
    subscription &&
    subscription.maxExamsPerMonth !== -1 &&
    subscription.currentExamCount >= subscription.maxExamsPerMonth;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-3">
        <Link
          href="/instructor/exams"
          className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create CBT Examination</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure assessment timing, security rules, proctoring parameters, and candidate access codes.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {/* Quota Exceeded Alert Banner */}
        {isQuotaExceeded && (
          <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-amber-100 text-amber-700 rounded-xl">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">
                  Monthly Assessment Quota Reached ({subscription.currentExamCount} of {subscription.maxExamsPerMonth} tests used)
                </h4>
                <p className="text-[11px] text-slate-600">
                  Your current {subscription.tier} plan has reached its limit. Upgrade to Pro (10 tests) or Premium (Unlimited) to continue.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowPaywall(true)}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center justify-center space-x-1.5 flex-shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Upgrade Plan</span>
            </button>
          </div>
        )}

        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Section 1: Course & Metadata */}
        <div className="space-y-4">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">
            1. Curriculum & Examination Identity
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Select Course
              </label>
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                required
              >
                {courses.length === 0 ? (
                  <option value="">No courses found. Create a course first.</option>
                ) : (
                  courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.title}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Unique Access Code (for Candidate Entry)
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LAW301-2026-X1"
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500"
                  required
                />
                <button
                  type="button"
                  onClick={handleGenerateCode}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold text-slate-700 transition-colors"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Examination Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Mid-Semester CBT Assessment: Corporate Governance & Securities Regulations"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        {/* Section 2: Timing & Pass Criteria */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">
            2. Timing & Grading Benchmarks
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Duration (Minutes)
              </label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="number"
                  min="5"
                  max="300"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Automatic timeout occurs upon timer expiration.</p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Pass Mark Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={passMarkPercentage}
                onChange={(e) => setPassMarkPercentage(parseFloat(e.target.value) || 50)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">Institutional threshold for candidate pass badge.</p>
            </div>
          </div>
        </div>

        {/* Section 3: Proctoring & Anti-Malpractice Rules */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-400">
            3. Anti-Malpractice & Proctoring Lockdown
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Max Allowed Tab Switches
              </label>
              <input
                type="number"
                min="0"
                max="10"
                value={maxTabSwitches}
                onChange={(e) => setMaxTabSwitches(parseInt(e.target.value) || 3)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                If breached, session immediately auto-submits with status <code className="text-rose-600 font-bold">AUTO_SUBMITTED_VIOLATION</code>.
              </p>
            </div>

            <div className="flex flex-col justify-center">
              <label className="flex items-center space-x-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requireCamera}
                  onChange={(e) => setRequireCamera(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                    <Video className="w-3.5 h-3.5 text-purple-600" />
                    <span>Mandatory Corner Webcam Proctoring</span>
                  </div>
                  <div className="text-[10px] text-slate-500">Requires camera permissions and active 160x120px mirror</div>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <label className="flex items-center space-x-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={randomizeQuestions}
                onChange={(e) => setRandomizeQuestions(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Shuffle className="w-3.5 h-3.5 text-blue-600" />
                  <span>Randomize Question Order</span>
                </div>
                <div className="text-[10px] text-slate-500">Unique candidate sequencing to prevent cross-glance copying</div>
              </div>
            </label>

            <label className="flex items-center space-x-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="checkbox"
                checked={randomizeOptions}
                onChange={(e) => setRandomizeOptions(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <div className="text-xs font-bold text-slate-900 flex items-center space-x-1.5">
                  <Shuffle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Randomize Options Order</span>
                </div>
                <div className="text-[10px] text-slate-500">Shuffles choices (A, B, C, D) uniquely for each student</div>
              </div>
            </label>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-3 p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
              />
              <div>
                <div className="text-xs font-bold text-emerald-950">Publish Immediately (Active for Candidate Entry)</div>
                <div className="text-[10px] text-emerald-700">If unchecked, exam is stored as Draft and entrance is blocked</div>
              </div>
            </label>
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Link
            href="/instructor/exams"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Creating Exam...' : 'Create & Proceed to Questions'}</span>
          </button>
        </div>
      </form>

      <PaywallModal
        isOpen={showPaywall}
        onClose={() => setShowPaywall(false)}
        currentTier={subscription?.tier}
        onUpgraded={(newTier) => {
          fetchSubscription();
          setShowPaywall(false);
          setError(null);
        }}
      />
    </div>
  );
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading exam builder...</div>}>
      <CreateExamContent />
    </Suspense>
  );
}
