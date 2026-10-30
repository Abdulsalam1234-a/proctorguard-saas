'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { StudentAttempt } from '@/lib/types';

interface SubmissionTypeChartProps {
  attempts: StudentAttempt[];
}

export function SubmissionTypeChart({ attempts }: SubmissionTypeChartProps) {
  let submitted = 0;
  let violation = 0;
  let timeout = 0;
  let network = 0;
  let inProgress = 0;

  attempts.forEach((a) => {
    if (a.status === 'SUBMITTED') submitted += 1;
    else if (a.status === 'AUTO_SUBMITTED_VIOLATION') violation += 1;
    else if (a.status === 'AUTO_SUBMITTED_TIMEOUT') timeout += 1;
    else if (a.status === 'AUTO_SUBMITTED_NETWORK') network += 1;
    else if (a.status === 'IN_PROGRESS') inProgress += 1;
  });

  const data = [
    { name: 'Normal Submissions', value: submitted, color: '#10b981' },
    { name: 'Malpractice Auto-Submit', value: violation, color: '#ef4444' },
    { name: 'Timeout Auto-Submit', value: timeout, color: '#f59e0b' },
    { name: 'Network Disconnect', value: network, color: '#8b5cf6' },
    { name: 'Currently In Progress', value: inProgress, color: '#3b82f6' },
  ].filter((d) => d.value > 0);

  if (data.length === 0) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-xs text-slate-400">
        No attempts recorded yet
      </div>
    );
  }

  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: 'none', color: '#fff', fontSize: '12px' }}
            formatter={(value: any, name: any) => [`${value} candidates`, name]}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '11px', color: '#64748b' }}
          />
          <Pie
            data={data}
            cx="50%"
            cy="45%"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
