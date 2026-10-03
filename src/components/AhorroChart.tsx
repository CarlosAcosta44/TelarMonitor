'use client';

import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export function AhorroChart({ data }: { data: any[] }) {
  return (
    <div style={{ height: '240px', width: '100%', marginTop: '24px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 20, right: 0, left: 0, bottom: 0 }} barGap={6}>
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: 'var(--foreground-muted)', fontSize: 13, fontWeight: 500 }}
            dy={10}
          />
          <Tooltip
            cursor={{ fill: 'rgba(255,255,255,0.04)' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                return (
                  <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-3 rounded-lg shadow-xl">
                    <p className="font-bold text-slate-900 dark:text-white mb-2">{payload[0].payload.label}</p>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-slate-500">
                        Estimada: <strong className="text-blue-500">${payload[0].value?.toLocaleString('es-CO')}</strong>
                      </span>
                      <span className="text-sm font-medium text-slate-500">
                        Real: <strong className="text-emerald-600">${payload[1].value?.toLocaleString('es-CO')}</strong>
                      </span>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          
          <Bar dataKey="estimada" fill="#dbeafe" radius={[4,4,0,0]} maxBarSize={16}>
            {data.map((entry, index) => (
              <Cell key={`cell-est-${index}`} className="dark:fill-blue-900/50" />
            ))}
          </Bar>
          
          {/* Custom Label for the percentage */}
          <Bar 
            dataKey="real" 
            fill="#059669" 
            radius={[4,4,0,0]} 
            maxBarSize={16}
            label={(props: any) => {
              const { x, y, width, index } = props;
              const percent = data[index].ahorroPercent;
              return (
                <text 
                  x={x + width / 2 - 12} 
                  y={y - 12} 
                  fill="#059669" 
                  fontSize="12" 
                  fontWeight="bold" 
                  textAnchor="middle"
                >
                  -{percent}%
                </text>
              );
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
