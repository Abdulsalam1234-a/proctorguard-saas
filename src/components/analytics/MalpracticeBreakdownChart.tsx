'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { ViolationLog } from '@/lib/types';

interface MalpracticeBreakdownChartProps {
  violations: ViolationLog[];
}

export function MalpracticeBreakdownChart({ violations }: MalpracticeBreakdownChartProps) {
  const counts: Record<string, number> = {
    TAB_SWITCH: 0,
    FULLSCREEN_EXIT: 0,
    CAMERA_BLOCKED: 0,
    WINDOW_BLUR: 0,
  };

  violations.forEach((v) => {
    if (counts[v.type] !== undefined) {
      counts[v.type] += 1;
    } else {
      counts.TAB_SWITCH += 1;
    }
  });

  const data = [
    { name: 'Tab Switches', count: counts.TAB_SWITCH, color: '#f59e0b' },
    { name: 'Fullscreen Exit', count: counts.FULLSCREEN_EXIT, color: '#ef4444' },
    { name: 'Camera Issues', count: counts.CAMERA_BLOCKED, color: '#8b5cf6' },
    { name: 'Window Blur', count: counts.WINDOW_BLUR, color: '#06b6d4' },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 10, right: 20, left: 20, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} width={100} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
            formatter={(val: any) => [`${val} flags`, 'Infractions']}
          />
          <Bar dataKey="count" radius={[0, 6, 6, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
