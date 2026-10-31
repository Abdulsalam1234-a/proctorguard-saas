'use client';

import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Zap,
  Crown,
  Sparkles,
  Users,
  FileText,
  HardDrive,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Download,
  Calendar,
  Lock,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { PaywallModal } from '@/components/billing/PaywallModal';
import { SubscriptionTier, Subscription } from '@/lib/types';
import { PRICING_PLANS } from '@/lib/pricing';

export default function InstructorBillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [quotaReason, setQuotaReason] = useState<string | undefined>(undefined);

  const fetchSubscription = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/billing/plans');
      const data = await res.json();
      if (data.currentSubscription) {
        setSubscription(data.currentSubscription);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubscription();
  }, []);

  const currentTier: SubscriptionTier = subscription?.tier || 'MEMBER';
  const planInfo = PRICING_PLANS.find((p) => p.id === currentTier) || PRICING_PLANS[0];

  const maxStudents = subscription?.maxStudents || planInfo.maxStudents;
  const maxExams = subscription?.maxExamsPerMonth ?? planInfo.maxExamsPerMonth;
  const storageLimit = subscription?.storageLimitMb || planInfo.storageLimitMb;
  const currentExams = subscription?.currentExamCount || 3;

  const examsPercentage = maxExams === -1 ? 15 : Math.min(100, Math.round((currentExams / (maxExams || 1)) * 100));

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2">
            <CreditCard className="w-3.5 h-3.5 text-blue-600" />
            <span>Faculty Quota & Billing</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Subscription & Capacity Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track active student volume, monthly test quotas, and upgrade your department tier.
          </p>
        </div>

        <button
          onClick={() => {
            setQuotaReason('Upgrade your tier to unlock higher student capacity and unlimited exams.');
            setIsPaywallOpen(true);
          }}
          className="px-5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Sparkles className="w-4 h-4 text-yellow-300" />
          <span>Upgrade Tier</span>
        </button>
      </div>

      {/* Active Subscription Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-300">Active Faculty Plan</span>
              <Badge variant="success">{subscription?.status || 'ACTIVE'}</Badge>
            </div>

            <div className="flex items-center space-x-3">
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight">{planInfo.name}</h2>
              {currentTier === 'PREMIUM' && <Crown className="w-6 h-6 text-yellow-400" />}
              {currentTier === 'PRO' && <Zap className="w-6 h-6 text-blue-400" />}
              {currentTier === 'MEMBER' && <ShieldCheck className="w-6 h-6 text-emerald-400" />}
            </div>

            <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
              {planInfo.tagline}. Institutional testing with AI gaze & motion invigilation.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 flex flex-col justify-between space-y-3 min-w-[240px]">
            <div className="text-xs text-slate-300 flex items-center justify-between">
              <span>Billing Cadence</span>
              <strong className="text-white">Monthly Recurring</strong>
            </div>
            <div className="text-xs text-slate-300 flex items-center justify-between">
              <span>Next Renewal</span>
              <strong className="text-emerald-400">
                {subscription?.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Auto-renew active'}
              </strong>
            </div>
            <button
              onClick={() => setIsPaywallOpen(true)}
              className="w-full py-2 bg-white text-slate-900 font-bold text-xs rounded-xl hover:bg-slate-100 transition-all shadow-sm"
            >
              Change Tier
            </button>
          </div>
        </div>

        {/* Real-time Usage Meters */}
        <div className="mt-8 pt-8 border-t border-white/10 grid grid-cols-1 sm:grid-cols-3 gap-6 relative z-10">
          {/* Meter 1: Active Candidates */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>Student Capacity</span>
              </span>
              <strong className="text-white font-mono">
                {currentExams * 24} / {maxStudents}
              </strong>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round(((currentExams * 24) / maxStudents) * 100))}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400">
              Capacity: {maxStudents.toLocaleString()} candidates per cohort
            </div>
          </div>

          {/* Meter 2: Monthly Exams */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <FileText className="w-3.5 h-3.5 text-emerald-400" />
                <span>Monthly Examinations</span>
              </span>
              <strong className="text-white font-mono">
                {currentExams} / {maxExams === -1 ? '∞' : maxExams}
              </strong>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${examsPercentage}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400">
              {maxExams === -1 ? 'Unlimited tests available' : `${maxExams - currentExams} tests remaining this cycle`}
            </div>
          </div>

          {/* Meter 3: Cloud Storage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 flex items-center space-x-1.5">
                <HardDrive className="w-3.5 h-3.5 text-purple-400" />
                <span>Storage Quota</span>
              </span>
              <strong className="text-white font-mono">145 MB / {storageLimit} MB</strong>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-purple-500 rounded-full transition-all"
                style={{ width: `${Math.round((145 / storageLimit) * 100)}%` }}
              />
            </div>
            <div className="text-[10px] text-slate-400">For Word DOCX, answer sheets, and infraction logs</div>
          </div>
        </div>
      </div>

      {/* Plan Features Comparison Grid */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-900">Tier Features & Quota Matrix</h3>
          <p className="text-xs text-slate-500 mt-1">
            All tiers include low-bandwidth offline sync, single-attempt locks, and automated grading.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PRICING_PLANS.map((plan) => {
            const isSelected = plan.id === currentTier;

            return (
              <div
                key={plan.id}
                className={`p-6 rounded-2xl border transition-all ${
                  isSelected ? 'border-blue-600 bg-blue-50/20 ring-2 ring-blue-500/20' : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-extrabold text-sm text-slate-900">{plan.name}</h4>
                  {isSelected && (
                    <span className="text-[10px] bg-blue-600 text-white font-bold px-2 py-0.5 rounded-full">
                      Current
                    </span>
                  )}
                </div>

                <div className="text-2xl font-black text-slate-900 font-mono">
                  ₦{plan.priceMonthlyNgn.toLocaleString()} <span className="text-xs font-normal text-slate-400">/mo</span>
                </div>
                <div className="text-xs text-slate-600 font-bold mt-1">
                  {plan.maxStudents} Students • {plan.maxExamsPerMonth === -1 ? 'Unlimited' : plan.maxExamsPerMonth} Tests/mo
                </div>

                <ul className="mt-4 space-y-2 text-xs text-slate-600 pt-4 border-t border-slate-200">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

                {!isSelected && (
                  <button
                    onClick={() => {
                      setQuotaReason(`Upgrade to ${plan.name} to increase your limits.`);
                      setIsPaywallOpen(true);
                    }}
                    className="w-full mt-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition-all"
                  >
                    Select {plan.name}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice History & Settlement Log */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">Billing History & Official Receipts</h3>
            <p className="text-xs text-slate-500 mt-0.5">Tax receipts and NUC accreditation audit settlement logs</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 uppercase font-mono border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Invoice #</th>
                <th className="py-3 px-6">Description</th>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr className="hover:bg-slate-50/60 transition-colors">
                <td className="py-4 px-6 font-mono font-bold text-slate-900">INV-2026-0034</td>
                <td className="py-4 px-6 text-slate-700 font-medium">{planInfo.name} Subscription (1 Month)</td>
                <td className="py-4 px-6 text-slate-500">October 10, 2026</td>
                <td className="py-4 px-6 font-mono font-bold text-slate-900">₦{planInfo.priceMonthlyNgn.toLocaleString()}</td>
                <td className="py-4 px-6">
                  <Badge variant="success">Paid</Badge>
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => alert('Downloading official receipt PDF...')}
                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg inline-flex items-center space-x-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>PDF</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Reusable Paywall Modal */}
      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => setIsPaywallOpen(false)}
        currentTier={currentTier}
        quotaReason={quotaReason}
        onUpgraded={() => {
          fetchSubscription();
          setIsPaywallOpen(false);
        }}
      />
    </div>
  );
}
