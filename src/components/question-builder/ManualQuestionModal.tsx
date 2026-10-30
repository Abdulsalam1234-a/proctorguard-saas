'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Plus, Trash2, CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { Question, QuestionType, QuestionOption } from '@/lib/types';

interface ManualQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (questionData: any) => Promise<void>;
  initialData?: Question | null;
  examId: string;
  nextOrderIndex: number;
}

export function ManualQuestionModal({
  isOpen,
  onClose,
  onSave,
  initialData,
  examId,
  nextOrderIndex,
}: ManualQuestionModalProps) {
  const [prompt, setPrompt] = useState('');
  const [type, setType] = useState<QuestionType>('SINGLE_CHOICE');
  const [options, setOptions] = useState<QuestionOption[]>([
    { id: 'A', text: '' },
    { id: 'B', text: '' },
    { id: 'C', text: '' },
    { id: 'D', text: '' },
  ]);
  const [correctAnswers, setCorrectAnswers] = useState<string[]>(['A']);
  const [points, setPoints] = useState<number>(1.0);
  const [shortAnswerKey, setShortAnswerKey] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setPrompt(initialData.prompt);
      setType(initialData.type);
      setPoints(initialData.points);

      if (Array.isArray(initialData.options)) {
        setOptions(
          (initialData.options as any[]).map((opt, idx) => {
            if (typeof opt === 'string') {
              return { id: String.fromCharCode(65 + idx), text: opt };
            }
            return opt;
          })
        );
      }

      setCorrectAnswers(initialData.correctAnswers || []);
      if (initialData.type === 'SHORT_ANSWER') {
        setShortAnswerKey(initialData.correctAnswers?.[0] || '');
      }
    } else {
      setPrompt('');
      setType('SINGLE_CHOICE');
      setOptions([
        { id: 'A', text: '' },
        { id: 'B', text: '' },
        { id: 'C', text: '' },
        { id: 'D', text: '' },
      ]);
      setCorrectAnswers(['A']);
      setPoints(1.0);
      setShortAnswerKey('');
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleOptionChange = (idx: number, text: string) => {
    const updated = [...options];
    updated[idx].text = text;
    setOptions(updated);
  };

  const addOption = () => {
    if (options.length >= 6) return;
    const nextChar = String.fromCharCode(65 + options.length);
    setOptions([...options, { id: nextChar, text: '' }]);
  };

  const removeOption = (idx: number) => {
    if (options.length <= 2) return;
    const removedId = options[idx].id;
    const updated = options.filter((_, i) => i !== idx);
    // Re-letter
    const relettered = updated.map((opt, i) => ({
      id: String.fromCharCode(65 + i),
      text: opt.text,
    }));
    setOptions(relettered);
    setCorrectAnswers(correctAnswers.filter((a) => a !== removedId));
  };

  const toggleCorrect = (id: string) => {
    if (type === 'SINGLE_CHOICE') {
      setCorrectAnswers([id]);
    } else if (type === 'MULTIPLE_CHOICE') {
      if (correctAnswers.includes(id)) {
        if (correctAnswers.length > 1) {
          setCorrectAnswers(correctAnswers.filter((a) => a !== id));
        }
      } else {
        setCorrectAnswers([...correctAnswers, id]);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) {
      setError('Please provide a question prompt.');
      return;
    }

    if (type !== 'SHORT_ANSWER') {
      const emptyOpt = options.find((o) => !o.text.trim());
      if (emptyOpt) {
        setError(`Please fill in text for Option ${emptyOpt.id}.`);
        return;
      }
      if (correctAnswers.length === 0) {
        setError('Please select at least one correct answer.');
        return;
      }
    } else {
      if (!shortAnswerKey.trim()) {
        setError('Please provide an accepted answer key for short answer grading.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        id: initialData?.id,
        examId,
        orderIndex: initialData?.orderIndex ?? nextOrderIndex,
        prompt: prompt.trim(),
        type,
        options: type === 'SHORT_ANSWER' ? [] : options,
        correctAnswers: type === 'SHORT_ANSWER' ? [shortAnswerKey.trim()] : correctAnswers,
        points: Number(points),
      };

      await onSave(payload);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save question');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Question' : 'Manual Question Builder'}
      description="Craft and calibrate questions with point allocation and answer key verification."
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Question Type & Points Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Question Type
            </label>
            <select
              value={type}
              onChange={(e) => {
                const newType = e.target.value as QuestionType;
                setType(newType);
                if (newType === 'SINGLE_CHOICE' && correctAnswers.length > 1) {
                  setCorrectAnswers([correctAnswers[0]]);
                }
              }}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium bg-white"
            >
              <option value="SINGLE_CHOICE">Single Choice (One correct answer)</option>
              <option value="MULTIPLE_CHOICE">Multiple Choice (Multiple correct keys)</option>
              <option value="SHORT_ANSWER">Short Answer / Open Key</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Score Weight (Points)
            </label>
            <input
              type="number"
              step="0.5"
              min="0.5"
              value={points}
              onChange={(e) => setPoints(parseFloat(e.target.value) || 1.0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
              required
            />
          </div>
        </div>

        {/* Question Stem / Prompt */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
            Question Prompt / Stem
          </label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your question stem here... (e.g., Under the Companies and Allied Matters Act 2020...)"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            required
          />
        </div>

        {/* Dynamic Options for Choice Types */}
        {type !== 'SHORT_ANSWER' ? (
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Options & Correct Answer Toggle
              </label>
              {options.length < 6 && (
                <button
                  type="button"
                  onClick={addOption}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Option</span>
                </button>
              )}
            </div>

            <div className="space-y-2.5">
              {options.map((opt, idx) => {
                const isCorrect = correctAnswers.includes(opt.id);
                return (
                  <div
                    key={opt.id}
                    className={`flex items-center space-x-2.5 p-2 rounded-xl border transition-all ${
                      isCorrect ? 'bg-emerald-50/70 border-emerald-300 ring-1 ring-emerald-400' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleCorrect(opt.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs transition-colors ${
                        isCorrect
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-100'
                      }`}
                      title={isCorrect ? 'Marked as correct' : 'Click to mark as correct'}
                    >
                      {opt.id}
                    </button>

                    <input
                      type="text"
                      value={opt.text}
                      onChange={(e) => handleOptionChange(idx, e.target.value)}
                      placeholder={`Option ${opt.id} content`}
                      className="flex-1 px-3 py-1.5 text-sm bg-white rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />

                    {options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              Tip: Click the letter button (e.g. A, B) to designate the correct answer.
            </p>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Accepted Grading Key / Target Reference
            </label>
            <input
              type="text"
              value={shortAnswerKey}
              onChange={(e) => setShortAnswerKey(e.target.value)}
              placeholder="e.g., Corporate Veil or Central Bank of Nigeria"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Exact and normalized case-insensitive comparisons will be executed during automated grading.
            </p>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all"
          >
            {isSubmitting ? 'Saving Question...' : initialData ? 'Update Question' : 'Save Question'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
