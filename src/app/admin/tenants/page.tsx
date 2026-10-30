'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Building2,
  Users,
  ShieldAlert,
  Edit,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  RotateCcw,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { SubscriptionTier, SubscriptionStatus } from '@/lib/types';

function AdminTenantsContent() {
  const searchParams = useSearchParams();
  const editIdParam = searchParams.get('edit');

  const [tenants, setTenants] = useState<any[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Modal Form State
  const [tier, setTier] = useState<SubscriptionTier>('PRO');
  const [status, setStatus] = useState<SubscriptionStatus>('ACTIVE');
  const [maxStudents, setMaxStudents] = useState<number>(300);
  const [maxExamsPerMonth, setMaxExamsPerMonth] = useState<number>(25);
  const [storageLimitMb, setStorageLimitMb] = useState<number>(1000);
  const [reason, setReason] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const loadTenants = async () => {
    try {
      const res = await fetch('/api/admin/tenants');
      if (res.ok) {
        const data = await res.json();
        setTenants(data.tenants || []);

        if (editIdParam) {
          const target = data.tenants?.find((t: any) => t.id === editIdParam);
          if (target) {
            openEditModal(target);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadTenants();
  }, [editIdParam]);

  const openEditModal = (tenant: any) => {
    setSelectedTenant(tenant);
    const sub = tenant.subscription;
    setTier(sub?.tier || 'MEMBER');
    setStatus(sub?.status || 'ACTIVE');
    setMaxStudents(sub?.maxStudents || 50);
    setMaxExamsPerMonth(sub?.maxExamsPerMonth || 5);
    setStorageLimitMb(sub?.storageLimitMb || 250);
    setReason(`Administrative quota adjustment for ${tenant.institution}`);
    setIsEditModalOpen(true);
    setFeedback(null);
  };

  const handleTierPreset = (newTier: SubscriptionTier) => {
    setTier(newTier);
    if (newTier === 'PREMIUM') {
      setMaxStudents(1000);
      setMaxExamsPerMonth(100);
      setStorageLimitMb(5000);
    } else if (newTier === 'PRO') {
      setMaxStudents(300);
      setMaxExamsPerMonth(25);
      setStorageLimitMb(1000);
    } else {
      setMaxStudents(50);
      setMaxExamsPerMonth(5);
      setStorageLimitMb(250);
    }
  };

  const handleSaveQuotas = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTenant) return;

    setIsSaving(true);
    setFeedback(null);

    try {
      const res = await fetch(`/api/admin/tenants/${selectedTenant.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier,
          status,
          maxStudents: Number(maxStudents),
          maxExamsPerMonth: Number(maxExamsPerMonth),
          storageLimitMb: Number(storageLimitMb),
          reason: reason || 'Super Admin quota calibration',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update tenant quotas');
      }

      setFeedback({
        type: 'success',
        message: 'Tenant quotas updated. Audit trail logged and in-app alert dispatched.',
      });
      await loadTenants();
      setTimeout(() => {
        setIsEditModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Institutional Tenant Oversight & Quotas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Dynamic allocation of student volumes, monthly exam quotas, and subscription lifecycle states.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Registered Higher Institutions & Leads</h3>
            <span className="text-xs text-slate-400">All modifications are immutably audited</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-4">Institution & Lead</th>
                <th className="px-6 py-4">Tier</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Student Capacity</th>
                <th className="px-6 py-4">Tests / Month</th>
                <th className="px-6 py-4">Storage Limit</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {tenants.map((t) => {
                const sub = t.subscription;
                return (
                  <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 text-sm">{t.institution}</div>
                      <div className="text-[11px] text-slate-600">
                        {t.name} • <span className="font-mono text-slate-400">{t.email}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{t.department}</div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={sub?.tier === 'PREMIUM' ? 'purple' : sub?.tier === 'PRO' ? 'info' : 'slate'}
                      >
                        {sub?.tier || 'MEMBER'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={sub?.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {sub?.status || 'TRIAL'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {sub?.maxStudents || 50}
                    </td>
                    <td className="px-6 py-4 font-mono font-bold text-slate-900">
                      {sub?.maxExamsPerMonth || 5}
                    </td>
                    <td className="px-6 py-4 font-mono text-slate-600">
                      {sub?.storageLimitMb || 250} MB
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openEditModal(t)}
                        className="px-3.5 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white rounded-xl font-bold text-xs transition-all inline-flex items-center space-x-1"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Calibrate Quota</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Quotas Modal */}
      {selectedTenant && (
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title={`Calibrate Quota: ${selectedTenant.institution}`}
          description={`Instructor: ${selectedTenant.name} (${selectedTenant.email})`}
          maxWidth="lg"
        >
          <form onSubmit={handleSaveQuotas} className="space-y-5">
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

            {/* Quick Tier Selection Presets */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Subscription Tier Preset
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['MEMBER', 'PRO', 'PREMIUM'] as SubscriptionTier[]).map((tPreset) => (
                  <button
                    key={tPreset}
                    type="button"
                    onClick={() => handleTierPreset(tPreset)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      tier === tPreset
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {tPreset}
                  </button>
                ))}
              </div>
            </div>

            {/* Status Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold bg-white"
              >
                <option value="ACTIVE">ACTIVE (Authorized for CBT Testing)</option>
                <option value="TRIAL">TRIAL (Under Initial Accreditation)</option>
                <option value="PAST_DUE">PAST_DUE (Subscription Pending Renewal)</option>
                <option value="CANCELLED">CANCELLED (Suspended by NUC Super Admin)</option>
              </select>
            </div>

            {/* Quota inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Max Students
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(parseInt(e.target.value) || 50)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Tests / Month
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxExamsPerMonth}
                  onChange={(e) => setMaxExamsPerMonth(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Storage (MB)
                </label>
                <input
                  type="number"
                  min="10"
                  value={storageLimitMb}
                  onChange={(e) => setStorageLimitMb(parseInt(e.target.value) || 250)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-mono font-bold"
                  required
                />
              </div>
            </div>

            {/* Justification Reason for Audit Trail */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Administrative Justification / Audit Reason
              </label>
              <textarea
                rows={2}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason for modifying this tenant's tier or limits (will be logged to AuditLog)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm"
                required
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Saving will write an entry to AuditLog and instantly send an in-app alert to the instructor.
              </p>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Logging & Updating...' : 'Save Quotas & Notify'}</span>
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default function AdminTenantsPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-400">Loading tenant oversight...</div>}>
      <AdminTenantsContent />
    </Suspense>
  );
}
