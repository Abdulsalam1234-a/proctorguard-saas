'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, User, Building, BookOpen, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';
import { SubscriptionTier } from '@/lib/types';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('University of Lagos (UNILAG)');
  const [department, setDepartment] = useState('');
  const [tier, setTier] = useState<SubscriptionTier>('PRO');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nigerianInstitutions = [
    'University of Lagos (UNILAG)',
    'Ahmadu Bello University (ABU Zaria)',
    'University of Ibadan (UI)',
    'Obafemi Awolowo University (OAU Ile-Ife)',
    'University of Nigeria Nsukka (UNN)',
    'Federal University of Technology Akure (FUTA)',
    'Covenant University (CU Ota)',
    'Federal University of Technology Owerri (FUTO)',
    'University of Benin (UNIBEN)',
    'Bayero University Kano (BUK)',
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          password,
          institution,
          department,
          tier,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      router.push('/instructor');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="p-8 pb-6 border-b border-slate-100 text-center bg-gradient-to-b from-slate-50/70 to-white">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Faculty Registration</h2>
            <p className="text-xs text-slate-500 mt-1">
              Create an institutional account to author proctored CBT examinations
            </p>
          </div>

          <form onSubmit={handleRegister} className="p-8 pt-6 space-y-4">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Full Name & Title
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Dr. Kelechi Nwosu"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Official Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. knwosu@unilag.edu.ng"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Institution
                </label>
                <div className="relative">
                  <Building className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                  <select
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                  >
                    {nigerianInstitutions.map((inst) => (
                      <option key={inst} value={inst}>
                        {inst}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Faculty / Department
                </label>
                <div className="relative">
                  <BookOpen className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    placeholder="e.g. Mechanical Engineering"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong account password"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Plan Tier Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Initial Subscription Tier
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'MEMBER', title: 'Member', capacity: '50 Students', exams: '5 tests/mo' },
                  { id: 'PRO', title: 'Pro Tier', capacity: '300 Students', exams: '25 tests/mo' },
                  { id: 'PREMIUM', title: 'Premium', capacity: '1,000 Students', exams: '100 tests/mo' },
                ].map((t) => (
                  <div
                    key={t.id}
                    onClick={() => setTier(t.id as SubscriptionTier)}
                    className={`p-3 rounded-2xl border text-center cursor-pointer transition-all ${
                      tier === t.id
                        ? 'bg-blue-50 border-blue-600 ring-2 ring-blue-600'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-black text-slate-900">{t.title}</div>
                    <div className="text-[10px] text-blue-700 font-semibold mt-0.5">{t.capacity}</div>
                    <div className="text-[9px] text-slate-500">{t.exams}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2 mt-4"
            >
              <span>{isLoading ? 'Creating Faculty Account...' : 'Complete Registration'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center text-xs text-slate-500 pt-2">
              Already have an institutional account?{' '}
              <Link href="/auth/login" className="font-bold text-blue-600 hover:underline">
                Sign in here
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
