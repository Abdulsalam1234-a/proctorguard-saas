'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, Key, UserCheck } from 'lucide-react';
import { Navbar } from '@/components/ui/Navbar';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      if (data.user?.role === 'SUPER_ADMIN') {
        router.push('/admin');
      } else {
        router.push('/instructor');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  const autofillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header */}
          <div className="p-8 pb-6 border-b border-slate-100 text-center bg-gradient-to-b from-slate-50/70 to-white">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 mb-3">
              <Shield className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Staff & Faculty Portal</h2>
            <p className="text-xs text-slate-500 mt-1">
              Sign in with institutional credentials to manage assessments
            </p>
          </div>

          <div className="p-8 pt-6 space-y-6">
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Institutional Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. lecturer@unilag.edu.ng"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/20 disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
              >
                <span>{isLoading ? 'Verifying...' : 'Sign In'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* 1-Click Demo Accounts */}
            <div className="pt-4 border-t border-slate-100">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center space-x-1.5">
                <Key className="w-3.5 h-3.5" />
                <span>Instant Demo Login Presets:</span>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => autofillDemo('admin@proctorguard.edu.ng', 'Admin@2026!')}
                  className="w-full p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-emerald-900">Super Admin (NUC Board)</div>
                    <div className="text-[10px] text-emerald-700 font-mono">admin@proctorguard.edu.ng</div>
                  </div>
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                </button>

                <button
                  type="button"
                  onClick={() => autofillDemo('dradewale@unilag.edu.ng', 'Lecturer@2026!')}
                  className="w-full p-2.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-blue-900">Dr. Folashade Adewale (UNILAG)</div>
                    <div className="text-[10px] text-blue-700 font-mono">dradewale@unilag.edu.ng</div>
                  </div>
                  <UserCheck className="w-4 h-4 text-blue-600" />
                </button>

                <button
                  type="button"
                  onClick={() => autofillDemo('profibrahim@abu.edu.ng', 'Lecturer@2026!')}
                  className="w-full p-2.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100 text-left transition-colors flex items-center justify-between"
                >
                  <div>
                    <div className="text-xs font-bold text-indigo-900">Prof. Abubakar Ibrahim (ABU Zaria)</div>
                    <div className="text-[10px] text-indigo-700 font-mono">profibrahim@abu.edu.ng</div>
                  </div>
                  <UserCheck className="w-4 h-4 text-indigo-600" />
                </button>
              </div>
            </div>

            <div className="text-center text-xs text-slate-500 pt-2">
              Need a new institutional account?{' '}
              <Link href="/auth/register" className="font-bold text-blue-600 hover:underline">
                Register Faculty
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
