'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Shield,
  Wifi,
  WifiOff,
  Clock,
  Video,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Maximize,
  ArrowRight,
  ArrowLeft,
  Bookmark,
  Send,
  User,
  GraduationCap,
  Layers,
  AlertOctagon,
  RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { NetworkConnectivityPill } from '@/components/proctoring/NetworkConnectivityPill';
import { WebcamMirror } from '@/components/proctoring/WebcamMirror';
import { ViolationWarningModal } from '@/components/proctoring/ViolationWarningModal';
import { OfflineSyncManager } from '@/lib/offline-sync';
import { ProctoringEngine } from '@/lib/proctoring-engine';
import { Question } from '@/lib/types';

type ExamStep = 'ENTER' | 'PRECHECKS' | 'ASSESSMENT' | 'COMPLETED';

export default function StudentExamPage({ params }: { params: { accessCode: string } }) {
  const router = useRouter();
  const rawAccessCode = params.accessCode;

  // Step state
  const [step, setStep] = useState<ExamStep>('ENTER');

  // Entrance form
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [isEntering, setIsEntering] = useState(false);
  const [entryError, setEntryError] = useState<string | null>(null);

  // Active attempt & exam payload
  const [examData, setExamData] = useState<any>(null);
  const [attemptData, setAttemptData] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Local answers cache & review flags
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());

  // Timing
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);

  // Connectivity
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  // Proctoring
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0);
  const [showTabWarning, setShowTabWarning] = useState<boolean>(false);
  const [isBreached, setIsBreached] = useState<boolean>(false);
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [completionData, setCompletionData] = useState<any>(null);

  // Manager refs
  const syncManagerRef = useRef<OfflineSyncManager | null>(null);
  const proctoringRef = useRef<ProctoringEngine | null>(null);

  // Check initial online status
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsOnline(navigator.onLine);
    }
  }, []);

  // Countdown Timer
  useEffect(() => {
    if (step !== 'ASSESSMENT' || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit('AUTO_SUBMITTED_TIMEOUT');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [step, secondsRemaining]);

  // Periodic Heartbeat
  useEffect(() => {
    if (step !== 'ASSESSMENT' || !attemptData?.id) return;

    const hbInterval = setInterval(async () => {
      try {
        await fetch('/api/student/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ attemptId: attemptData.id }),
        });
      } catch {}
    }, 15000);

    return () => clearInterval(hbInterval);
  }, [step, attemptData]);

  // STEP 1: Enter Assessment
  const handleEnterExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentId.trim() || !studentName.trim()) {
      setEntryError('Student ID and Full Name are required.');
      return;
    }

    setIsEntering(true);
    setEntryError(null);

    try {
      const res = await fetch('/api/student/enter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessCode: rawAccessCode.toUpperCase(),
          studentId: studentId.trim(),
          studentName: studentName.trim(),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to enter exam');
      }

      setExamData(data.exam);
      setAttemptData(data.attempt);
      setQuestions(data.questions || []);
      setSecondsRemaining(data.exam.timeRemainingSeconds);
      setTabSwitchCount(data.attempt.tabSwitchCount || 0);

      // Restore previously saved answers
      const restored: Record<string, any> = {};
      (data.attempt.answers || []).forEach((a: any) => {
        restored[a.questionId] = a.selectedAnswer;
      });
      setAnswers(restored);

      // Initialize offline sync manager
      const syncManager = new OfflineSyncManager(data.attempt.id, (online, pending) => {
        setIsOnline(online);
        setPendingSyncCount(pending);
      });
      syncManagerRef.current = syncManager;

      // Merge local storage answers if any
      const cached = syncManager.getCachedAnswers();
      setAnswers((prev) => ({ ...prev, ...cached }));

      setStep('PRECHECKS');
    } catch (err: any) {
      setEntryError(err.message);
    } finally {
      setIsEntering(false);
    }
  };

  // STEP 2: Prechecks -> Start
  const handleStartExamSession = async () => {
    if (!attemptData || !examData) return;

    // Initialize proctoring engine
    const proctoring = new ProctoringEngine(
      {
        attemptId: attemptData.id,
        maxTabSwitches: examData.maxTabSwitches,
        requireCamera: examData.requireCamera,
      },
      {
        onTabSwitch: (count, max) => {
          setTabSwitchCount(count);
          setShowTabWarning(true);
        },
        onViolationBreached: () => {
          setIsBreached(true);
          setShowTabWarning(true);
          handleAutoSubmit('AUTO_SUBMITTED_VIOLATION');
        },
        onCameraDropped: (reason) => {
          console.warn('Proctoring camera alert:', reason);
        },
        onFullscreenExit: () => {
          setShowTabWarning(true);
        },
        onContextMenuAttempt: () => {},
      }
    );

    proctoringRef.current = proctoring;
    proctoring.start(attemptData.tabSwitchCount);
    await proctoring.requestFullscreen();

    setStep('ASSESSMENT');
  };

  // Record Answer selection with Zero-Data-Loss write-through
  const handleSelectAnswer = (questionId: string, answer: any) => {
    // 1. Instant local React state
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    // 2. Instant LocalStorage write + queued backend sync
    if (syncManagerRef.current) {
      syncManagerRef.current.recordAnswer(questionId, answer);
    }
  };

  const toggleFlag = (qId: string) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  // Final Submission
  const handleManualSubmit = async () => {
    const unansweredCount = questions.filter((q) => answers[q.id] === undefined).length;
    let confirmMsg = 'Are you ready to submit and finalize your examination?';
    if (unansweredCount > 0) {
      confirmMsg = `You have ${unansweredCount} unanswered question${unansweredCount > 1 ? 's' : ''}. Are you sure you want to finalize now?`;
    }

    if (!confirm(confirmMsg)) return;
    await executeSubmission('SUBMITTED');
  };

  const handleAutoSubmit = async (reason: 'AUTO_SUBMITTED_TIMEOUT' | 'AUTO_SUBMITTED_VIOLATION') => {
    await executeSubmission(reason);
  };

  const executeSubmission = async (status: string) => {
    if (!attemptData) return;

    // Stop proctoring listeners
    if (proctoringRef.current) {
      proctoringRef.current.stop();
    }

    // Prepare fail-safe answers backup
    const failSafePayload = syncManagerRef.current?.generateFailSafePayload();

    try {
      const res = await fetch('/api/student/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attemptData.id,
          status,
          failSafeAnswers: failSafePayload?.cachedAnswers || answers,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setCompletionData(data.attempt);
        syncManagerRef.current?.clearLocalCache();
        setStep('COMPLETED');
      }
    } catch (err) {
      console.error('Final submission error:', err);
      // Even if network drops, state displays local completed notification
      setCompletionData({
        ...attemptData,
        status,
        score: null,
      });
      setStep('COMPLETED');
    }
  };

  // Format seconds into MM:SS
  const formatTimer = (totalSec: number) => {
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = questions[currentIndex];
  const isTimeCritical = secondsRemaining <= 300; // Under 5 mins

  // ---------------- STEP: ENTER ----------------
  if (step === 'ENTER') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 pb-6 border-b border-slate-100 text-center bg-gradient-to-b from-blue-50/50 to-white">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <span className="font-mono font-bold text-xs bg-blue-100 text-blue-800 px-3 py-1 rounded-full border border-blue-200">
              {rawAccessCode.toUpperCase()}
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">Candidate CBT Entrance</h2>
            <p className="text-xs text-slate-500 mt-1">
              Provide your official matriculation or registration identifier to begin
            </p>
          </div>

          <form onSubmit={handleEnterExam} className="p-8 pt-6 space-y-5">
            {entryError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 space-y-1">
                <div className="font-bold flex items-center space-x-1.5">
                  <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>Access Restricted</span>
                </div>
                <p>{entryError}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Matriculation / Registration Number
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value.toUpperCase())}
                placeholder="e.g. LAW/2022/104 or CSC/2021/045"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Candidate Full Name (as Registered)
              </label>
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="e.g. Chinedu Okonkwo"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
              <div className="font-bold text-slate-800">CBT Integrity Regulations:</div>
              <div>• Single attempt policy enforced per student matriculation number.</div>
              <div>• Real-time webcam and window focus monitoring active during testing.</div>
              <div>• Zero-data-loss offline caching guarantees answers are preserved.</div>
            </div>

            <button
              type="submit"
              disabled={isEntering}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
            >
              <span>{isEntering ? 'Validating Session...' : 'Authenticate & Proceed'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* Quick Candidate Presets for 1-Click Testing */}
            <div className="pt-3 border-t border-slate-100">
              <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">
                1-Click Quick Testing Presets:
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStudentId('LAW/2022/330');
                    setStudentName('Emeka Danladi');
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-left transition-colors"
                >
                  <div className="font-bold font-mono text-[11px]">LAW/2022/330</div>
                  <div className="text-[10px] text-slate-500 truncate">Emeka Danladi</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setStudentId('CSC/2021/088');
                    setStudentName('Fatima Aliyu');
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-left transition-colors"
                >
                  <div className="font-bold font-mono text-[11px]">CSC/2021/088</div>
                  <div className="text-[10px] text-slate-500 truncate">Fatima Aliyu</div>
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ---------------- STEP: PRECHECKS ----------------
  if (step === 'PRECHECKS') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 pb-6 border-b border-slate-100 text-center bg-gradient-to-b from-blue-50/50 to-white">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">System Checks & Honor Code</h2>
            <p className="text-xs text-slate-500 mt-1">
              Assessment: <strong>{examData?.title}</strong> ({examData?.courseCode})
            </p>
          </div>

          <div className="p-8 pt-6 space-y-6">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <div>
                  <div className="font-bold">Candidate Verified</div>
                  <div className="text-[11px] text-emerald-700">
                    {attemptData?.studentName} • {attemptData?.studentId}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs">
                <Clock className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <div className="font-bold">Time Limit: {examData?.durationMinutes} Minutes</div>
                  <div className="text-[11px] text-blue-700">
                    Countdown commences immediately upon entry.
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900 text-xs">
                <Video className="w-5 h-5 text-purple-600 flex-shrink-0" />
                <div>
                  <div className="font-bold">Webcam & Proctoring Active</div>
                  <div className="text-[11px] text-purple-700">
                    Maximum {examData?.maxTabSwitches} tab switches allowed before session termination.
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                <Maximize className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                  <div className="font-bold">Mandatory Fullscreen Mode</div>
                  <div className="text-[11px] text-amber-700">
                    Right-click, copy-paste, and external shortcuts are disabled.
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={handleStartExamSession}
              className="w-full py-4 rounded-2xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center space-x-2 hover:scale-[1.01]"
            >
              <span>Launch Fullscreen & Begin Assessment</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- STEP: ASSESSMENT (Active Exam) ----------------
  if (step === 'ASSESSMENT') {
    const answeredCount = Object.keys(answers).length;
    const progressPercent = Math.round((answeredCount / (questions.length || 1)) * 100);

    return (
      <div className="min-h-screen bg-slate-100 flex flex-col select-none proctoring-lockdown">
        {/* Top Exam Header Bar */}
        <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-sm px-4 sm:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs">
                CBT
              </div>
              <div>
                <h2 className="font-bold text-xs sm:text-sm text-slate-900 leading-tight truncate max-w-[200px] sm:max-w-md">
                  {examData?.title}
                </h2>
                <div className="text-[11px] text-slate-500">
                  {attemptData?.studentName} ({attemptData?.studentId})
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Ambient Network Connectivity Pill */}
            <NetworkConnectivityPill isOnline={isOnline} pendingSyncCount={pendingSyncCount} />

            {/* Live Countdown Timer */}
            <div
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-mono font-bold text-xs sm:text-sm shadow-inner transition-colors ${
                isTimeCritical
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-slate-900 text-emerald-400'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(secondsRemaining)}</span>
            </div>

            <button
              onClick={handleManualSubmit}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Finalize & Submit</span>
              <span className="sm:hidden">Submit</span>
            </button>
          </div>
        </header>

        {/* Main Examination Body */}
        <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* Left Column: Question Navigator */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4 lg:col-span-1 order-2 lg:order-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-400">Question Navigator</span>
              <span className="font-bold text-blue-700">{progressPercent}% done</span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Grid of question buttons */}
            <div className="grid grid-cols-5 gap-2 max-h-64 overflow-y-auto pr-1">
              {questions.map((q, idx) => {
                const isCurrent = idx === currentIndex;
                const isAnswered = answers[q.id] !== undefined;
                const isFlagged = flaggedQuestions.has(q.id);

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`relative h-9 rounded-xl font-bold text-xs transition-all flex items-center justify-center ${
                      isCurrent
                        ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-600 ring-offset-2'
                        : isAnswered
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{idx + 1}</span>
                    {isFlagged && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Answered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                <span>Unanswered</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Flagged</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <span>Current View</span>
              </div>
            </div>
          </div>

          {/* Center Column: Question Presenter (One Question per view) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6 lg:col-span-3 order-1 lg:order-2 flex flex-col justify-between min-h-[500px]">
            {currentQ ? (
              <div className="space-y-6">
                {/* Question Header */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-sm text-slate-900 bg-slate-100 px-3 py-1 rounded-xl">
                      Question {currentIndex + 1} of {questions.length}
                    </span>
                    <Badge variant="purple" size="sm">
                      {currentQ.points} Point{currentQ.points === 1 ? '' : 's'}
                    </Badge>
                  </div>

                  <button
                    onClick={() => toggleFlag(currentQ.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1.5 ${
                      flaggedQuestions.has(currentQ.id)
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>{flaggedQuestions.has(currentQ.id) ? 'Flagged for Review' : 'Flag Question'}</span>
                  </button>
                </div>

                {/* Question Prompt */}
                <div className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
                  {currentQ.prompt}
                </div>

                {/* Options / Answer Input */}
                <div className="space-y-3 pt-2">
                  {/* Single Choice Options */}
                  {currentQ.type === 'SINGLE_CHOICE' && Array.isArray(currentQ.options) && (
                    <div className="space-y-2.5">
                      {currentQ.options.map((opt: any) => {
                        const isSelected = answers[currentQ.id] === opt.id;
                        return (
                          <div
                            key={opt.id}
                            onClick={() => handleSelectAnswer(currentQ.id, opt.id)}
                            className={`flex items-center space-x-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-600 ring-2 ring-blue-600/20 text-blue-950 font-bold'
                                : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 text-slate-800'
                            }`}
                          >
                            <span
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                                isSelected ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="text-sm flex-1">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Multiple Choice Options */}
                  {currentQ.type === 'MULTIPLE_CHOICE' && Array.isArray(currentQ.options) && (
                    <div className="space-y-2.5">
                      <p className="text-xs text-blue-700 font-semibold mb-2">
                        Select all options that apply:
                      </p>
                      {currentQ.options.map((opt: any) => {
                        const selectedList: string[] = Array.isArray(answers[currentQ.id])
                          ? answers[currentQ.id]
                          : [];
                        const isSelected = selectedList.includes(opt.id);

                        const toggleMulti = () => {
                          let nextList: string[];
                          if (isSelected) {
                            nextList = selectedList.filter((item) => item !== opt.id);
                          } else {
                            nextList = [...selectedList, opt.id];
                          }
                          handleSelectAnswer(currentQ.id, nextList);
                        };

                        return (
                          <div
                            key={opt.id}
                            onClick={toggleMulti}
                            className={`flex items-center space-x-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-indigo-50/70 border-indigo-600 ring-2 ring-indigo-600/20 text-indigo-950 font-bold'
                                : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                            }`}
                          >
                            <span
                              className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs transition-colors ${
                                isSelected ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {opt.id}
                            </span>
                            <span className="text-sm flex-1">{opt.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Short Answer Input */}
                  {currentQ.type === 'SHORT_ANSWER' && (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">
                        Type Your Answer Below
                      </label>
                      <input
                        type="text"
                        value={answers[currentQ.id] || ''}
                        onChange={(e) => handleSelectAnswer(currentQ.id, e.target.value)}
                        placeholder="Type concise answer or keyword..."
                        className="w-full px-4 py-3 rounded-2xl border-2 border-slate-300 focus:border-blue-600 text-sm font-semibold"
                      />
                    </div>
                  )}
                </div>
              </div>
            ) : null}

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-100 mt-6">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-30 transition-all flex items-center space-x-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Previous</span>
              </button>

              <div className="text-xs font-medium text-slate-400">
                Question {currentIndex + 1} / {questions.length}
              </div>

              {currentIndex < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
                >
                  <span>Next Question</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleManualSubmit}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
                >
                  <span>Finalize Exam</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Proctoring Corner Webcam Mirror (160x120px) */}
        {examData?.requireCamera && (
          <WebcamMirror
            isActive={true}
            onError={(err) => {
              proctoringRef.current?.reportViolation('CAMERA_BLOCKED', err);
            }}
          />
        )}

        {/* Proctoring Malpractice Warning Modal */}
        <ViolationWarningModal
          isOpen={showTabWarning}
          onAcknowledge={() => {
            setShowTabWarning(false);
            if (isBreached) {
              setStep('COMPLETED');
            }
          }}
          tabSwitchCount={tabSwitchCount}
          maxTabSwitches={examData?.maxTabSwitches ?? 3}
          isBreached={isBreached}
        />
      </div>
    );
  }

  // ---------------- STEP: COMPLETED ----------------
  const passMark = examData?.passMarkPercentage || 50;
  const isPassed = (completionData?.percentage ?? 0) >= passMark;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-center p-8 space-y-6">
        <div
          className={`mx-auto w-16 h-16 rounded-3xl flex items-center justify-center ${
            completionData?.status === 'AUTO_SUBMITTED_VIOLATION'
              ? 'bg-rose-100 text-rose-600 ring-8 ring-rose-50'
              : 'bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50'
          }`}
        >
          {completionData?.status === 'AUTO_SUBMITTED_VIOLATION' ? (
            <AlertOctagon className="w-8 h-8" />
          ) : (
            <CheckCircle2 className="w-8 h-8" />
          )}
        </div>

        <div>
          <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
            {rawAccessCode.toUpperCase()}
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-2">
            {completionData?.status === 'AUTO_SUBMITTED_VIOLATION'
              ? 'Assessment Session Terminated'
              : 'Examination Submitted & Finalized'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Candidate: <strong>{attemptData?.studentName}</strong> ({attemptData?.studentId})
          </p>
        </div>

        {/* Score & Outcome Box */}
        {completionData?.score != null ? (
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="text-xs uppercase font-bold tracking-wider text-slate-400">Final Result</div>
            <div className="text-4xl font-black text-slate-900 font-mono">
              {completionData.score} <span className="text-lg text-slate-400 font-medium">/ {completionData.totalPoints} pts</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <span className="font-black text-lg text-slate-900 font-mono">
                {completionData.percentage?.toFixed(1)}%
              </span>
              <Badge variant={isPassed ? 'success' : 'danger'}>
                {isPassed ? 'PASSED' : 'FAILED'} (Pass Mark: {passMark}%)
              </Badge>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600">
            Answers secured in persistent storage. Lecturer grading is pending.
          </div>
        )}

        {/* Submission Telemetry Breakdown */}
        <div className="grid grid-cols-2 gap-3 text-left text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Status Code</div>
            <div className="font-bold text-slate-900 mt-0.5">{completionData?.status}</div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
            <div className="text-slate-400 text-[10px] uppercase font-bold">Tab Switches Recorded</div>
            <div className="font-bold text-slate-900 mt-0.5">{completionData?.tabSwitchCount || tabSwitchCount}</div>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/"
            className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 transition-all inline-block shadow-md"
          >
            Return to ProctorGuard Home
          </Link>
        </div>
      </div>
    </div>
  );
}
