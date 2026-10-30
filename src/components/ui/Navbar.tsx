'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Shield, Bell, LogOut, User, CheckCircle2, Building, ChevronDown } from 'lucide-react';
import { Badge } from './Badge';

interface NavbarProps {
  user?: any;
}

export function Navbar({ user: initialUser }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(initialUser || null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setNotifications(data.notifications || []);
          setUnreadCount(data.notifications?.filter((n: any) => !n.read).length || 0);
        }
      } catch (err) {
        console.error(err);
      }
    }
    loadMe();
  }, [pathname]);

  const handleLogout = () => {
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    router.push('/auth/login');
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <Link href={user?.role === 'SUPER_ADMIN' ? '/admin' : user?.role === 'INSTRUCTOR' ? '/instructor' : '/'} className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">
                  Proctor<span className="text-blue-600">Guard</span>
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  SaaS CBT
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-none">Resilient Emerging-Market Proctoring</p>
            </div>
          </Link>
        </div>

        {/* Right side controls */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Institution badge */}
              <div className="hidden md:flex items-center space-x-1.5 text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200/80">
                <Building className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-medium max-w-[200px] truncate">{user.institution || 'Institutional Tenant'}</span>
              </div>

              {/* Notification Popover */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifs(!showNotifs)}
                  className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white" />
                  )}
                </button>

                {showNotifs && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 z-50">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-slate-900">In-App Notifications</span>
                        {unreadCount > 0 && <Badge variant="danger" size="sm">{unreadCount} new</Badge>}
                      </div>
                      <span className="text-xs text-slate-400">Super Admin & System alerts</span>
                    </div>

                    <div className="mt-3 space-y-2.5 max-h-72 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">No recent alerts or administrative notices</p>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            className={`p-3 rounded-xl border text-xs transition-colors ${
                              n.read ? 'bg-slate-50 border-slate-100 text-slate-600' : 'bg-blue-50/70 border-blue-200 text-slate-900'
                            }`}
                          >
                            <div className="font-semibold text-slate-900 mb-0.5">{n.title}</div>
                            <p className="text-slate-600 leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-slate-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* User Profile Capsule */}
              <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="font-semibold text-sm text-slate-900 leading-tight">{user.name}</div>
                  <div className="flex items-center justify-end space-x-1.5 mt-0.5">
                    <span className="text-[11px] font-medium text-slate-500">
                      {user.role === 'SUPER_ADMIN' ? 'Platform Owner' : user.department || 'Course Instructor'}
                    </span>
                    {user.subscription && (
                      <Badge variant={user.subscription.tier === 'PREMIUM' ? 'purple' : user.subscription.tier === 'PRO' ? 'info' : 'slate'} size="sm">
                        {user.subscription.tier}
                      </Badge>
                    )}
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Sign out of platform"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <Link
                href="/auth/login"
                className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 rounded-lg transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register"
                className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl shadow-md shadow-blue-500/20 transition-all hover:shadow-lg"
              >
                Register Faculty
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
