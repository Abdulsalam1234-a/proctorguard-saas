'use client';

import React from 'react';
import { Wifi, WifiOff, RefreshCw, CheckCircle2 } from 'lucide-react';

interface NetworkConnectivityPillProps {
  isOnline: boolean;
  pendingSyncCount?: number;
}

export function NetworkConnectivityPill({ isOnline, pendingSyncCount = 0 }: NetworkConnectivityPillProps) {
  return (
    <div
      className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm border transition-all duration-300 ${
        !isOnline
          ? 'bg-amber-500 text-white border-amber-600 animate-pulse'
          : pendingSyncCount > 0
          ? 'bg-sky-50 text-sky-800 border-sky-300'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
    >
      {!isOnline ? (
        <>
          <WifiOff className="w-3.5 h-3.5 text-white" />
          <span>Network offline. Progress saved locally.</span>
        </>
      ) : pendingSyncCount > 0 ? (
        <>
          <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
          <span>Syncing ({pendingSyncCount} pending)</span>
        </>
      ) : (
        <>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <Wifi className="w-3.5 h-3.5 text-emerald-600" />
          <span>Online - Live Sync</span>
        </>
      )}
    </div>
  );
}
