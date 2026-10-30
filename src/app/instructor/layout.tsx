'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Sidebar } from '@/components/ui/Sidebar';

export default function InstructorLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    async function loadMe() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadMe();
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar user={user} />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar role="INSTRUCTOR" subscription={user?.subscription} />
        <main className="flex-1 p-6 sm:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
