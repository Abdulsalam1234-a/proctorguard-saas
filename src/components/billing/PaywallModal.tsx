'use client';

import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  X,
  Sparkles,
  Zap,
  Crown,
  CreditCard,
  Building,
  ArrowRight,
  Loader2,
  Lock,
} from 'lucide-react';
import { SubscriptionTier, PricingPlan } from '@/lib/types';
import { PRICING_PLANS } from '@/lib/pricing';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTier?: SubscriptionTier;
  quotaReason?: string;
  onUpgraded?: (newTier: SubscriptionTier) => void;
}

export function PaywallModal({
  isOpen,
  onClose,
  currentTier = 'MEMBER',
  quotaReason,
  onUpgraded,
}: PaywallModalProps) {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [currency, setCurrency] = useState<'NGN' | 'USD'>('NGN');
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan>(
    PRICING_PLANS.find((p) => p.id === 'PRO') || PRICING_PLANS[1]
  );
  const [paymentStep, setPaymentStep] = useState<'SELECT_PLAN' | 'CHECKOUT' | 'SUCCESS'>('SELECT_PLAN');
  const [paymentMethod, setPaymentMethod] = useState<'paystack' | 'bank_transfer'>('paystack');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<any>(null);

  if (!isOpen) return null;

  const handleSelectTier = (plan: PricingPlan) => {
    setSelectedPlan(plan);
    setPaymentStep('CHECKOUT');
  };

  const handleExecutePayment = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tier: selectedPlan.id,
          billingCycle,
          currency,
          paymentMethod,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Payment failed');
      }

      setReceipt(data.receipt);
      setPaymentStep('SUCCESS');
      if (onUpgraded) {
        onUpgraded(selectedPlan.id);
      }
    } catch (err: any) {
      alert(`Checkout failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (plan: PricingPlan) => {
    if (currency === 'USD') {
      const amt = billingCycle === 'annual' ? plan.priceAnnualUsd : plan.priceMonthlyUsd;
      return `$${amt.toLocaleString()}`;
    }
    const amt = billingCycle === 'annual' ? plan.priceAnnualNgn : plan.priceMonthlyNgn;
    return `₦${amt.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Institutional Quota Upgrade</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            Unlock Full Academic Assessment Scale
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            {quotaReason ||
              'Scale your testing capacity with AI-powered gaze tracking, expanded candidate limits, and unlimited tests.'}
          </p>

          {/* Toggle Switches */}
          {paymentStep === 'SELECT_PLAN' && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-white/10">
              {/* Monthly vs Annual */}
              <div className="flex items-center space-x-2 bg-slate-800/80 p-1 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    billingCycle === 'monthly' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-3 py-1.5 rounded-lg transition-all flex items-center space-x-1 ${
                    billingCycle === 'annual' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Annual Billing</span>
                  <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                    SAVE 15%
                  </span>
                </button>
              </div>

              {/* Currency Selector */}
              <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-white/10 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCurrency('NGN')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    currency === 'NGN' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  ₦ NGN (Naira)
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    currency === 'USD' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  $ USD (Intl)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STEP 1: Plan Comparison Cards */}
        {paymentStep === 'SELECT_PLAN' && (
          <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50">
            {PRICING_PLANS.map((plan) => {
              const isCurrent = currentTier === plan.id;
              const isPopular = plan.popular;

              return (
                <div
                  key={plan.id}
                  className={`rounded-3xl p-6 transition-all relative flex flex-col justify-between ${
                    isPopular
                      ? 'bg-white border-2 border-blue-600 shadow-xl ring-4 ring-blue-500/10'
                      : 'bg-white border border-slate-200 shadow-sm hover:border-slate-300'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white text-[10px] uppercase font-black px-3 py-0.5 rounded-full shadow-md tracking-wider">
                      Most Recommended
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-sm text-slate-900">{plan.name}</div>
                      {plan.id === 'PREMIUM' && <Crown className="w-4 h-4 text-amber-500" />}
                      {plan.id === 'PRO' && <Zap className="w-4 h-4 text-blue-500" />}
                      {plan.id === 'MEMBER' && <ShieldCheck className="w-4 h-4 text-emerald-500" />}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{plan.tagline}</p>

                    <div className="mt-4 pb-4 border-b border-slate-100">
                      <div className="flex items-baseline space-x-1">
                        <span className="text-3xl font-black text-slate-900 font-mono tracking-tight">
                          {formatPrice(plan)}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          /{billingCycle === 'annual' ? 'yr' : 'mo'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold mt-1">
                        <strong>{plan.maxStudents.toLocaleString()} Students</strong> •{' '}
                        <strong>{plan.maxExamsPerMonth === -1 ? 'Unlimited' : plan.maxExamsPerMonth} Tests/mo</strong>
                      </div>
                    </div>

                    <ul className="mt-4 space-y-2.5 text-xs text-slate-600">
                      {plan.features.slice(0, 6).map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <span className="leading-tight">{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100">
                    {isCurrent ? (
                      <button
                        disabled
                        className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-400 font-bold text-xs cursor-not-allowed text-center"
                      >
                        Active Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSelectTier(plan)}
                        className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center space-x-1.5 shadow-md ${
                          isPopular
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20'
                            : 'bg-slate-900 hover:bg-slate-800 text-white'
                        }`}
                      >
                        <span>Upgrade to {plan.name}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* STEP 2: Checkout Confirmation Modal */}
        {paymentStep === 'CHECKOUT' && (
          <div className="p-6 sm:p-8 bg-white space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Checkout Order</span>
                <h3 className="text-xl font-black text-slate-900">{selectedPlan.name} Subscription</h3>
              </div>
              <button
                onClick={() => setPaymentStep('SELECT_PLAN')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Change Tier
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Plan Summary Card */}
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400">Quota Allocation</div>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Active Student Capacity</span>
                    <strong className="text-slate-900">{selectedPlan.maxStudents.toLocaleString()} Candidates</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Monthly CBT Examinations</span>
                    <strong className="text-slate-900">
                      {selectedPlan.maxExamsPerMonth === -1 ? 'Unlimited' : selectedPlan.maxExamsPerMonth}
                    </strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Cloud Storage Quota</span>
                    <strong className="text-slate-900">{selectedPlan.storageLimitMb} MB</strong>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60">
                    <span>Proctoring Engine</span>
                    <strong className="text-emerald-700 font-bold">
                      {selectedPlan.id === 'PREMIUM'
                        ? 'Full AI Vision Suite'
                        : selectedPlan.id === 'PRO'
                        ? 'Gaze & Motion Tracking'
                        : 'Standard Browser Lock'}
                    </strong>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="font-medium text-slate-500">Total Billed ({billingCycle})</span>
                    <span className="text-2xl font-black text-slate-900 font-mono">{formatPrice(selectedPlan)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-4">
                <div className="font-bold text-xs uppercase tracking-wider text-slate-400">Payment Gateway</div>

                <div className="space-y-2.5">
                  <label
                    className={`flex items-center space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'paystack'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paystack"
                      checked={paymentMethod === 'paystack'}
                      onChange={() => setPaymentMethod('paystack')}
                      className="text-blue-600"
                    />
                    <CreditCard className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Paystack / Flutterwave Online Gateway</div>
                      <div className="text-[11px] text-slate-500">Supports Debit Card, USSD, Bank Transfer & QR</div>
                    </div>
                  </label>

                  <label
                    className={`flex items-center space-x-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/10'
                        : 'border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank_transfer"
                      checked={paymentMethod === 'bank_transfer'}
                      onChange={() => setPaymentMethod('bank_transfer')}
                      className="text-blue-600"
                    />
                    <Building className="w-5 h-5 text-slate-600 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-xs text-slate-900">Official Institutional Direct Transfer</div>
                      <div className="text-[11px] text-slate-500">Direct NUC/University TSA account settlement</div>
                    </div>
                  </label>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-emerald-800 text-xs">
                  <Lock className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                  <span>256-bit encrypted academic billing. Immediate instant activation.</span>
                </div>

                <button
                  onClick={handleExecutePayment}
                  disabled={isProcessing}
                  className="w-full py-3.5 px-6 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authorizing Upgrade...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Authorize {formatPrice(selectedPlan)}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Success Confirmation Receipt */}
        {paymentStep === 'SUCCESS' && receipt && (
          <div className="p-8 text-center bg-white space-y-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg ring-8 ring-emerald-50">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="font-mono font-bold text-xs bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200">
                {receipt.receiptNumber}
              </span>
              <h3 className="text-2xl font-black text-slate-900 mt-2">Subscription Upgrade Complete!</h3>
              <p className="text-xs text-slate-500 mt-1">
                Your faculty account has been upgraded to <strong>{receipt.tier}</strong>.
              </p>
            </div>

            <div className="max-w-md mx-auto p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-2 text-left">
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Transaction Ref</span>
                <span className="font-mono font-bold text-slate-900">{receipt.paymentRef}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Plan Level</span>
                <span className="font-bold text-slate-900">{receipt.tier}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Amount Settled</span>
                <span className="font-mono font-bold text-emerald-700">
                  {receipt.currency} {receipt.amount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200">
                <span>Billed To</span>
                <span className="font-medium text-slate-900">{receipt.instructorEmail}</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="py-3 px-8 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-all shadow-md"
            >
              Continue to Examination Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
