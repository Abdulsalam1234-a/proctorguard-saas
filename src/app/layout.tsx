import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ProctorGuard SaaS | High-Integrity Multi-Tenant Assessment Platform',
  description: 'Enterprise CBT and proctored examination platform optimized for high integrity and resilient low-bandwidth operation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased text-slate-900 bg-slate-50 selection:bg-blue-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
