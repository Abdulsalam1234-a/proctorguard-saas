'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileQuestion,
  Plus,
  Upload,
  Edit3,
  Trash2,
  ArrowLeft,
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  AlertCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ManualQuestionModal } from '@/components/question-builder/ManualQuestionModal';
import { DocxUploadModal } from '@/components/question-builder/DocxUploadModal';
import { StagingReviewModal } from '@/components/question-builder/StagingReviewModal';
import { Question, StagedQuestion } from '@/lib/types';

export default function ExamQuestionsPage({ params }: { params: { id: string } }) {
  const examId = params.id;
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isDocxModalOpen, setIsDocxModalOpen] = useState(false);
  const [isStagingModalOpen, setIsStagingModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [stagedQuestions, setStagedQuestions] = useState<StagedQuestion[]>([]);
  const [stagedFileName, setStagedFileName] = useState<string>('');

  const loadExamAndQuestions = async () => {
    try {
      const res = await fetch(`/api/exams/${examId}`);
      if (res.ok) {
        const data = await res.json();
        setExam(data.exam);
        setQuestions(data.exam?.questions || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadExamAndQuestions();
  }, [examId]);

  const handleSaveQuestion = async (qData: any) => {
    if (qData.id) {
      // Update
      const res = await fetch(`/api/questions/${qData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qData),
      });
      if (!res.ok) throw new Error('Failed to update question');
    } else {
      // Create single
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(qData),
      });
      if (!res.ok) throw new Error('Failed to create question');
    }
    await loadExamAndQuestions();
  };

  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm('Are you sure you want to remove this question from the examination?')) return;
    try {
      const res = await fetch(`/api/questions/${qId}`, { method: 'DELETE' });
      if (res.ok) {
        await loadExamAndQuestions();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const currentQ = questions[index];
    const targetQ = questions[targetIndex];

    const tempOrder = currentQ.orderIndex;
    currentQ.orderIndex = targetQ.orderIndex;
    targetQ.orderIndex = tempOrder;

    // Optimistic swap
    const reordered = [...questions];
    reordered[index] = targetQ;
    reordered[targetIndex] = currentQ;
    setQuestions(reordered);

    // Save
    await Promise.all([
      fetch(`/api/questions/${currentQ.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIndex: currentQ.orderIndex }),
      }),
      fetch(`/api/questions/${targetQ.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIndex: targetQ.orderIndex }),
      }),
    ]);
  };

  const handleStagingReady = (staging: StagedQuestion[], fileName: string) => {
    setStagedQuestions(staging);
    setStagedFileName(fileName);
    setIsStagingModalOpen(true);
  };

  const totalPoints = questions.reduce((acc, q) => acc + (q.points || 1.0), 0);

  if (!exam) {
    return <div className="p-12 text-center text-xs text-slate-400">Loading exam questions...</div>;
  }

  return (
    <div className="space-y-6">
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
              Course: <strong>{exam.course?.code}</strong> • {questions.length} questions • Total Weight: <strong>{totalPoints.toFixed(1)} Points</strong>
            </p>
          </div>
        </div>

        {/* Dual Question Ingestion Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsDocxModalOpen(true)}
            className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl border border-indigo-200 transition-all flex items-center space-x-1.5"
          >
            <Upload className="w-4 h-4" />
            <span>Upload Word (.docx)</span>
          </button>

          <button
            onClick={() => {
              setEditingQuestion(null);
              setIsManualModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Manual Question Builder</span>
          </button>
        </div>
      </div>

      {/* Question List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <h3 className="font-extrabold text-base text-slate-900">Configured Questions</h3>
            <Badge variant="info">{questions.length} Questions</Badge>
          </div>
          <span className="text-xs text-slate-500 font-semibold">
            Cumulative Points: <strong className="text-slate-900">{totalPoints} pts</strong>
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {questions.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
                <FileQuestion className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-700">No questions ingested yet</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Upload your departmental Word document (.docx) to automatically extract questions, or build them one by one.
              </p>
              <div className="flex justify-center space-x-3 pt-2">
                <button
                  onClick={() => setIsDocxModalOpen(true)}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl"
                >
                  Upload .docx
                </button>
                <button
                  onClick={() => {
                    setEditingQuestion(null);
                    setIsManualModalOpen(true);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl"
                >
                  Manual Builder
                </button>
              </div>
            </div>
          ) : (
            questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-5 hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="flex items-start space-x-3.5 flex-1">
                  {/* Reordering Controls */}
                  <div className="flex flex-col items-center space-y-1 pt-0.5">
                    <button
                      onClick={() => handleMove(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-200 rounded"
                      title="Move up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-extrabold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <button
                      onClick={() => handleMove(idx, 'down')}
                      disabled={idx === questions.length - 1}
                      className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-20 hover:bg-slate-200 rounded"
                      title="Move down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Question Content */}
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center space-x-2">
                      <Badge variant="purple" size="sm">{q.type}</Badge>
                      <span className="text-xs font-bold text-slate-600">
                        {q.points} point{q.points === 1 ? '' : 's'}
                      </span>
                    </div>

                    <p className="text-sm font-semibold text-slate-900 leading-relaxed">{q.prompt}</p>

                    {/* Options Preview */}
                    {q.type !== 'SHORT_ANSWER' && Array.isArray(q.options) && q.options.length > 0 && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt: any) => {
                          const isCorrect = q.correctAnswers?.includes(opt.id);
                          return (
                            <div
                              key={opt.id}
                              className={`flex items-center space-x-2 p-2 rounded-xl text-xs border ${
                                isCorrect
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950 font-semibold'
                                  : 'bg-slate-50 border-slate-200 text-slate-700'
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                                  isCorrect ? 'bg-emerald-600 text-white' : 'bg-white border text-slate-600'
                                }`}
                              >
                                {opt.id}
                              </span>
                              <span className="truncate">{opt.text}</span>
                              {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 ml-auto flex-shrink-0" />}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'SHORT_ANSWER' && (
                      <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                        <span className="font-semibold text-slate-900">Accepted Key: </span>
                        <code className="text-blue-700 font-mono font-bold">
                          {q.correctAnswers?.join(', ')}
                        </code>
                      </div>
                    )}
                  </div>
                </div>

                {/* Edit & Delete Controls */}
                <div className="flex items-center space-x-2 self-end md:self-start">
                  <button
                    onClick={() => {
                      setEditingQuestion(q);
                      setIsManualModalOpen(true);
                    }}
                    className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                    title="Edit question"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Manual Question Modal */}
      <ManualQuestionModal
        isOpen={isManualModalOpen}
        onClose={() => {
          setIsManualModalOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        initialData={editingQuestion}
        examId={examId}
        nextOrderIndex={questions.length + 1}
      />

      {/* Word Ingestion Modal */}
      <DocxUploadModal
        isOpen={isDocxModalOpen}
        onClose={() => setIsDocxModalOpen(false)}
        examId={examId}
        onStagingReady={handleStagingReady}
      />

      {/* Staging Review & Inline Confirmation Modal */}
      <StagingReviewModal
        isOpen={isStagingModalOpen}
        onClose={() => setIsStagingModalOpen(false)}
        examId={examId}
        initialQuestions={stagedQuestions}
        fileName={stagedFileName}
        onBulkCommitted={loadExamAndQuestions}
      />
    </div>
  );
}
