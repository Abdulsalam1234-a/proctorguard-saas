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

interface ScoreDistributionChartProps {
  scores: number[];
  passMarkPercentage: number;
}

export function ScoreDistributionChart({ scores, passMarkPercentage }: ScoreDistributionChartProps) {
  // Group into deciles: 0-19%, 20-39%, 40-59%, 60-79%, 80-100%
  const bins = [
    { range: '0-19%', count: 0, min: 0, max: 19 },
    { range: '20-39%', count: 0, min: 20, max: 39 },
    { range: '40-59%', count: 0, min: 40, max: 59 },
    { range: '60-79%', count: 0, min: 60, max: 79 },
    { range: '80-100%', count: 0, min: 80, max: 100 },
  ];

  scores.forEach((s) => {
    const val = Math.min(100, Math.max(0, s));
    const target = bins.find((b) => val >= b.min && val <= b.max);
    if (target) target.count += 1;
  });

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={bins} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="range" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
            formatter={(value: any) => [`${value} candidates`, 'Frequency']}
          />
          <Bar dataKey="count" radius={[6, 6, 0, 0]}>
            {bins.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.min >= passMarkPercentage ? '#10b981' : entry.max < passMarkPercentage ? '#f43f5e' : '#3b82f6'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
