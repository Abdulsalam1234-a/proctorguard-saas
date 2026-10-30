'use client';

import React from 'react';
import { AlertOctagon, ShieldAlert, ArrowRight, XCircle } from 'lucide-react';

interface ViolationWarningModalProps {
  isOpen: boolean;
  onAcknowledge: () => void;
  tabSwitchCount: number;
  maxTabSwitches: number;
  isBreached?: boolean;
}

export function ViolationWarningModal({
  isOpen,
  onAcknowledge,
  tabSwitchCount,
  maxTabSwitches,
  isBreached = false,
}: ViolationWarningModalProps) {
  if (!isOpen) return null;

  const remaining = Math.max(0, maxTabSwitches - tabSwitchCount);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-rose-100 overflow-hidden text-center p-6 sm:p-8 transform animate-in fade-in zoom-in-95 duration-200">
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-5 ring-8 ring-rose-50">
          {isBreached ? <XCircle className="w-9 h-9" /> : <AlertOctagon className="w-9 h-9" />}
        </div>

        <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
          {isBreached ? 'Examination Terminated' : 'Malpractice Alert: Tab Switch Detected'}
        </h3>

        <div className="mt-3 text-slate-600 text-sm leading-relaxed">
          {isBreached ? (
            <p className="text-rose-600 font-semibold">
              You have exceeded the maximum allowed limit of {maxTabSwitches} tab switches. Your examination has been automatically locked, finalized, and flagged as an infraction.
            </p>
          ) : (
            <div>
              <p className="font-medium text-slate-800">
                Warning: Leaving the assessment window or switching tabs is strictly monitored.
              </p>
              <div className="mt-4 p-4 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900">
                <div className="text-xs font-semibold uppercase tracking-wider text-amber-700">
                  Infraction Count
                </div>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  {tabSwitchCount} <span className="text-sm font-medium text-amber-700">of {maxTabSwitches} allowed</span>
                </div>
                <p className="text-xs text-amber-700 mt-1">
                  {remaining > 0
                    ? `You have ${remaining} infraction warning${remaining > 1 ? 's' : ''} left before automatic termination.`
                    : 'Any subsequent tab switch will immediately lock and submit your assessment.'}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={onAcknowledge}
            className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm shadow-lg transition-all flex items-center justify-center space-x-2 ${
              isBreached
                ? 'bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/20'
                : 'bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/30 hover:scale-[1.02]'
            }`}
          >
            <span>{isBreached ? 'View Final Results' : 'I Acknowledge & Return to Exam'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
