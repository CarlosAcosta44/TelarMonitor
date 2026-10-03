'use client';

import {
  AreaChart,
  Area,
  ResponsiveContainer,
} from 'recharts';

export function AlertChart({ data }: { data: any[] }) {
  return (
    <div style={{ height: '80px', width: '100%', marginTop: '8px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="colorAlert" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d97706" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#d97706" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <Area 
            type="monotone" 
            dataKey="value" 
            stroke="#d97706" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorAlert)" 
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
