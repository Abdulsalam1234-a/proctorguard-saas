'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, Clock, Video, Shuffle } from 'lucide-react';

export default function EditExamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const examId = params.id;

  const [exam, setExam] = useState<any>(null);
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

  useEffect(() => {
    async function loadExam() {
      try {
        const res = await fetch(`/api/exams/${examId}`);
        if (res.ok) {
          const data = await res.json();
          const e = data.exam;
          setExam(e);
          setTitle(e.title);
          setAccessCode(e.accessCode);
          setDurationMinutes(e.durationMinutes);
          setPassMarkPercentage(e.passMarkPercentage);
          setRandomizeQuestions(e.randomizeQuestions);
          setRandomizeOptions(e.randomizeOptions);
          setMaxTabSwitches(e.maxTabSwitches);
          setRequireCamera(e.requireCamera);
          setIsPublished(e.isPublished);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadExam();
  }, [examId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/exams/${examId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
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
        throw new Error(data.error || 'Failed to update exam');
      }

      router.push('/instructor/exams');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!exam) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading examination settings...</div>;
  }

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
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edit Examination Settings</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Course: <strong>{exam.course?.code}</strong> - {exam.course?.title}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Access Code
            </label>
            <input
              type="text"
              value={accessCode}
              onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold uppercase focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Duration (Minutes)
            </label>
            <input
              type="number"
              min="5"
              max="300"
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
              required
            />
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
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Pass Mark Percentage (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={passMarkPercentage}
              onChange={(e) => setPassMarkPercentage(parseFloat(e.target.value) || 50)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
              required
            />
          </div>

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
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <label className="flex items-center space-x-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={requireCamera}
              onChange={(e) => setRequireCamera(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-xs font-bold text-slate-900">Mandatory Webcam Proctoring</span>
          </label>

          <label className="flex items-center space-x-3 p-3 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded"
            />
            <span className="text-xs font-bold text-slate-900">Exam Published (Active)</span>
          </label>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <Link
            href="/instructor/exams"
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Update Settings'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
