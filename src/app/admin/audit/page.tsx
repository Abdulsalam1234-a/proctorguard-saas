'use client';

import React, { useState, useEffect } from 'react';
import {
  ScrollText,
  Clock,
  User,
  ShieldAlert,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  Edit3,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [isOverrideModalOpen, setIsOverrideModalOpen] = useState(false);

  // Score override form state
  const [overrideAttemptId, setOverrideAttemptId] = useState('att-01');
  const [overrideNewScore, setOverrideNewScore] = useState<number>(12);
  const [overrideReason, setOverrideReason] = useState('Faculty board approved remarking of question 5');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadLogs = async () => {
    try {
      const res = await fetch('/api/admin/audit');
      if (res.ok) {
        const data = await res.json();
        setLogs(data.auditLogs || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleScoreOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/override-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: overrideAttemptId,
          newScore: Number(overrideNewScore),
          reason: overrideReason,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to override score');
      }

      setFeedback({
        type: 'success',
        message: 'Score successfully updated. Audit log created and instructor notified in-app!',
      });
      await loadLogs();
      setTimeout(() => {
        setIsOverrideModalOpen(false);
      }, 1500);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesAction = filterAction === 'ALL' || log.action === filterAction;
    const matchesSearch =
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.actor?.name?.toLowerCase().includes(search.toLowerCase()) ||
      JSON.stringify(log.metadata || {}).toLowerCase().includes(search.toLowerCase());
    return matchesAction && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Platform Audit Trail & Action Log</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tamper-evident record of administrative quota modifications, score overrides, and tenant changes.
          </p>
        </div>

        <button
          onClick={() => {
            setIsOverrideModalOpen(true);
            setFeedback(null);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center space-x-1.5 self-start sm:self-auto"
        >
          <Edit3 className="w-4 h-4" />
          <span>Execute Score Override</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, action, or metadata..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500 bg-white"
          />
        </div>

        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="w-full sm:w-auto px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold bg-white"
        >
          <option value="ALL">All Audit Actions</option>
          <option value="SUPER_ADMIN_OVERRIDE_SCORE">SUPER_ADMIN_OVERRIDE_SCORE</option>
          <option value="SUPER_ADMIN_UPDATE_SUBSCRIPTION">SUPER_ADMIN_UPDATE_SUBSCRIPTION</option>
          <option value="TENANT_TIER_UPGRADE">TENANT_TIER_UPGRADE</option>
        </select>
      </div>

      {/* Audit Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 text-slate-400 text-xs">
            No audit records match your query
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3 hover:border-slate-300 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex items-center space-x-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                    <ScrollText className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-mono font-bold text-xs text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                      {log.action}
                    </span>
                    <span className="text-xs text-slate-500 ml-2">
                      by <strong className="text-slate-800">{log.actor?.name || 'Super Admin'}</strong> ({log.actor?.email})
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1.5 text-[11px] text-slate-400 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Diff / Metadata box */}
              {log.metadata && (
                <div className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto space-y-1">
                  <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">
                    Audit Diff & Modification Details:
                  </div>
                  <pre className="text-[11px] leading-relaxed text-emerald-400 whitespace-pre-wrap">
                    {JSON.stringify(log.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Manual Score Override Modal */}
      <Modal
        isOpen={isOverrideModalOpen}
        onClose={() => setIsOverrideModalOpen(false)}
        title="Execute Score Override & Dispatch Audit Alert"
        description="Allows platform owners to adjust candidate scores following official faculty board or Senate petitions."
        maxWidth="lg"
      >
        <form onSubmit={handleScoreOverride} className="space-y-4">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl text-xs flex items-center space-x-2 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Candidate Attempt ID
            </label>
            <input
              type="text"
              value={overrideAttemptId}
              onChange={(e) => setOverrideAttemptId(e.target.value)}
              placeholder="e.g., att-01 (Chinedu Okonkwo)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono"
              required
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Sample attempts in database: <code className="font-bold text-blue-600">att-01</code> (LAW301 candidate).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              New Recalibrated Score (Points)
            </label>
            <input
              type="number"
              step="0.5"
              value={overrideNewScore}
              onChange={(e) => setOverrideNewScore(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Official Justification / Senate Remarking Reason
            </label>
            <textarea
              rows={2}
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
              required
            />
          </div>

          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsOverrideModalOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Overriding Score...' : 'Confirm Override & Alert Faculty'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
