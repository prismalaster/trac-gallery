'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import type { AIDimensions } from '@/lib/types';

interface ScoreChartProps {
  dimensions: AIDimensions;
}

export default function ScoreChart({ dimensions }: ScoreChartProps) {
  const data = [
    { subject: 'Quality', value: dimensions.quality, fullMark: 100 },
    { subject: 'Originality', value: dimensions.originality, fullMark: 100 },
    { subject: 'Technique', value: dimensions.technique, fullMark: 100 },
    { subject: 'Appeal', value: dimensions.appeal, fullMark: 100 },
  ];

  return (
    <div className="w-full h-64">
      <ResponsiveContainer>
        <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
          <PolarGrid stroke="rgba(255,255,255,0.06)" />
          <PolarAngleAxis
            dataKey="subject"
            tick={{ fill: '#a1a1aa', fontSize: 11, fontFamily: 'var(--font-body)' }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#52525b', fontSize: 9 }}
            axisLine={false}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#f59e0b"
            strokeWidth={2}
            fill="#f59e0b"
            fillOpacity={0.15}
            dot={{ fill: '#f59e0b', r: 4 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
