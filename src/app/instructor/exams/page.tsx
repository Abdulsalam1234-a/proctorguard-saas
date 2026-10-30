'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileQuestion,
  Plus,
  Copy,
  Edit,
  Trash2,
  Activity,
  BarChart2,
  FileSpreadsheet,
  Globe,
  Archive,
  ArrowRight,
  ExternalLink,
  Shield,
  Clock,
  Video,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

export default function ExamsListPage() {
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadExams = async () => {
    try {
      const res = await fetch('/api/exams');
      if (res.ok) {
        const data = await res.json();
        setExams(data.exams || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  const handleTogglePublish = async (exam: any) => {
    try {
      const res = await fetch(`/api/exams/${exam.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !exam.isPublished }),
      });
      if (res.ok) {
        await loadExams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCloneExam = async (examId: string) => {
    try {
      const res = await fetch(`/api/exams/${examId}/clone`, { method: 'POST' });
      if (res.ok) {
        await loadExams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteExam = async (examId: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete the exam "${title}"?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/exams/${examId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadExams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Examinations & CBT Tests</h1>
          <p className="text-xs text-slate-500 mt-1">
            Author, duplicate, publish, proctor, and export comprehensive assessment reports.
          </p>
        </div>

        <Link
          href="/instructor/exams/create"
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Create New Exam</span>
        </Link>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-extrabold text-base text-slate-900">Configured Assessments</h3>
          <span className="text-xs text-slate-400">{exams.length} examinations created</span>
        </div>

        <div className="divide-y divide-slate-100">
          {exams.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No exams found. Click "Create New Exam" to author your first assessment.
            </div>
          ) : (
            exams.map((exam) => (
              <div key={exam.id} className="p-6 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-black text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg">
                      {exam.accessCode}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {exam.course?.code} - {exam.course?.title}
                    </span>
                    <Badge variant={exam.isPublished ? 'success' : 'slate'} size="sm">
                      {exam.isPublished ? 'PUBLISHED (LIVE)' : 'DRAFT'}
                    </Badge>
                    {exam.requireCamera && (
                      <span className="inline-flex items-center space-x-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
                        <Video className="w-3 h-3" />
                        <span>Webcam Mandatory</span>
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900">{exam.title}</h3>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{exam.durationMinutes} Minutes</span>
                    </span>
                    <span>•</span>
                    <span>Pass: {exam.passMarkPercentage}%</span>
                    <span>•</span>
                    <span>Max Tab Switches: {exam.maxTabSwitches}</span>
                    <span>•</span>
                    <span className="font-bold text-slate-700">{exam.questions?.length || 0} Questions</span>
                    <span>•</span>
                    <span className="font-bold text-blue-700">{exam.attempts?.length || 0} Attempts</span>
                  </div>
                </div>

                {/* Operations Palette */}
                <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0">
                  <Link
                    href={`/instructor/exams/${exam.id}/monitor`}
                    className="px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-xl font-bold text-xs transition-all flex items-center space-x-1"
                  >
                    <Activity className="w-3.5 h-3.5" />
                    <span>Live Monitor</span>
                  </Link>

                  <Link
                    href={`/instructor/exams/${exam.id}/questions`}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-xs transition-all flex items-center space-x-1"
                  >
                    <FileQuestion className="w-3.5 h-3.5" />
                    <span>Questions</span>
                  </Link>

                  <Link
                    href={`/instructor/exams/${exam.id}/analytics`}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition-all flex items-center space-x-1"
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Analytics</span>
                  </Link>

                  {/* Export Excel (.xlsx) */}
                  <a
                    href={`/api/exams/${exam.id}/export?format=xlsx`}
                    download
                    className="px-2.5 py-1.5 bg-emerald-100/70 hover:bg-emerald-200 text-emerald-800 rounded-xl font-bold text-xs transition-all flex items-center space-x-1"
                    title="Export Results to Excel (.xlsx)"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </a>

                  {/* Publish/Draft toggle */}
                  <button
                    onClick={() => handleTogglePublish(exam)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all flex items-center space-x-1 ${
                      exam.isPublished
                        ? 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    {exam.isPublished ? <Archive className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                    <span>{exam.isPublished ? 'Unpublish' : 'Publish'}</span>
                  </button>

                  {/* Clone */}
                  <button
                    onClick={() => handleCloneExam(exam.id)}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                    title="Duplicate / Clone Exam"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Edit Config */}
                  <Link
                    href={`/instructor/exams/${exam.id}/edit`}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-all"
                    title="Edit Settings"
                  >
                    <Edit className="w-4 h-4" />
                  </Link>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteExam(exam.id, exam.title)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                    title="Delete Exam"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
