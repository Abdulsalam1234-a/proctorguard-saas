import React from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { Sidebar } from '@/components/ui/Sidebar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar role="SUPER_ADMIN" />
        <main className="flex-1 p-6 sm:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
