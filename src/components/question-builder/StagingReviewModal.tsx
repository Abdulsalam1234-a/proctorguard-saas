'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { StagedQuestion, QuestionType } from '@/lib/types';
import { CheckCircle2, Trash2, Edit3, AlertCircle, Save, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface StagingReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  examId: string;
  initialQuestions: StagedQuestion[];
  fileName?: string;
  onBulkCommitted: () => void;
}

export function StagingReviewModal({
  isOpen,
  onClose,
  examId,
  initialQuestions,
  fileName,
  onBulkCommitted,
}: StagingReviewModalProps) {
  const [questions, setQuestions] = useState<StagedQuestion[]>(initialQuestions);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state when new questions passed
  React.useEffect(() => {
    setQuestions(initialQuestions);
  }, [initialQuestions]);

  const updateQuestionPrompt = (idx: number, prompt: string) => {
    const updated = [...questions];
    updated[idx].prompt = prompt;
    setQuestions(updated);
  };

  const updateQuestionType = (idx: number, type: QuestionType) => {
    const updated = [...questions];
    updated[idx].type = type;
    setQuestions(updated);
  };

  const updateQuestionPoints = (idx: number, points: number) => {
    const updated = [...questions];
    updated[idx].points = points;
    setQuestions(updated);
  };

  const toggleOptionCorrect = (qIdx: number, optId: string) => {
    const updated = [...questions];
    const q = updated[qIdx];
    if (q.type === 'SINGLE_CHOICE') {
      q.correctAnswers = [optId];
    } else {
      if (q.correctAnswers.includes(optId)) {
        if (q.correctAnswers.length > 1) {
          q.correctAnswers = q.correctAnswers.filter((id) => id !== optId);
        }
      } else {
        q.correctAnswers = [...q.correctAnswers, optId];
      }
    }
    setQuestions(updated);
  };

  const removeQuestion = (idx: number) => {
    const filtered = questions.filter((_, i) => i !== idx).map((q, i) => ({
      ...q,
      orderIndex: i + 1,
    }));
    setQuestions(filtered);
  };

  const handleBulkCommit = async () => {
    if (questions.length === 0) {
      setError('There are no questions to commit.');
      return;
    }

    setIsCommitting(true);
    setError(null);

    try {
      const res = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bulk: true,
          examId,
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save questions');
      }

      onBulkCommitted();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error saving questions to examination');
    } finally {
      setIsCommitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Staging Review: Extracted Questions"
      description={`Review and edit the ${questions.length} questions extracted from "${fileName || 'document.docx'}" before committing to the database.`}
      maxWidth="4xl"
    >
      <div className="space-y-4">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <span>
              <strong>{questions.length} Questions Staged</strong> • Review prompts, answer keys, and options below.
            </span>
          </div>
          <span className="text-[11px] text-blue-700">Click letters (A, B...) to toggle correct keys</span>
        </div>

        <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
          {questions.map((q, qIdx) => (
            <div
              key={qIdx}
              className="p-4 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3 hover:border-slate-300 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-sm text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg">
                    #{qIdx + 1}
                  </span>
                  <select
                    value={q.type}
                    onChange={(e) => updateQuestionType(qIdx, e.target.value as QuestionType)}
                    className="text-xs font-semibold px-2 py-1 bg-slate-100 rounded-lg border border-slate-300"
                  >
                    <option value="SINGLE_CHOICE">Single Choice</option>
                    <option value="MULTIPLE_CHOICE">Multiple Choice</option>
                    <option value="SHORT_ANSWER">Short Answer</option>
                  </select>
                </div>

                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1 text-xs text-slate-600">
                    <span className="font-medium">Points:</span>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={q.points}
                      onChange={(e) => updateQuestionPoints(qIdx, parseFloat(e.target.value) || 1.0)}
                      className="w-16 px-2 py-1 text-xs border rounded-lg"
                    />
                  </div>

                  <button
                    onClick={() => removeQuestion(qIdx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove question"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Prompt input */}
              <textarea
                rows={2}
                value={q.prompt}
                onChange={(e) => updateQuestionPrompt(qIdx, e.target.value)}
                className="w-full text-sm font-medium text-slate-900 border border-slate-200 rounded-xl p-2.5 focus:ring-2 focus:ring-blue-500"
              />

              {/* Options */}
              {q.type !== 'SHORT_ANSWER' && q.options && q.options.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {q.options.map((opt) => {
                    const isCorrect = q.correctAnswers.includes(opt.id);
                    return (
                      <div
                        key={opt.id}
                        className={`flex items-center space-x-2 p-2 rounded-xl border text-xs transition-colors ${
                          isCorrect ? 'bg-emerald-50 border-emerald-300 font-semibold' : 'bg-slate-50 border-slate-200'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleOptionCorrect(qIdx, opt.id)}
                          className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                            isCorrect ? 'bg-emerald-600 text-white shadow-sm' : 'bg-white text-slate-600 border'
                          }`}
                        >
                          {opt.id}
                        </button>
                        <span className="truncate flex-1">{opt.text}</span>
                        {isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />}
                      </div>
                    );
                  })}
                </div>
              )}

              {q.type === 'SHORT_ANSWER' && (
                <div className="p-2.5 bg-slate-50 rounded-xl border text-xs text-slate-700">
                  <span className="font-semibold">Grading Key: </span>
                  <span>{q.correctAnswers?.join(', ') || 'None specified'}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Modal actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel Staging
          </button>
          <button
            type="button"
            onClick={handleBulkCommit}
            disabled={isCommitting || questions.length === 0}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{isCommitting ? 'Committing to Exam...' : `Confirm & Save All (${questions.length})`}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
