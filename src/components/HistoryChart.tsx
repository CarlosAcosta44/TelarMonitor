'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { Zap, Sun, Clock } from 'lucide-react';
import Link from 'next/link';

export type ChartRange = '24h' | '7d' | '30d';

export interface ChartDataPoint {
  label: string;
  consumption: number;
  solar: number;
}

interface HistoryChartProps {
  data: ChartDataPoint[];
  range: ChartRange;
}

/* ── Custom Tooltip ─────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, range }: any) {
  if (!active || !payload || !payload.length) return null;

  const solar = payload.find((p: { dataKey: string }) => p.dataKey === 'solar')?.value ?? 0;
  const consumption = payload.find((p: { dataKey: string }) => p.dataKey === 'consumption')?.value ?? 0;
  const balance = solar - consumption;
  const isPositive = balance >= 0;

  return (
    <div
      style={{
        background: 'var(--card-bg)',
        border: '1px solid var(--card-border)',
        borderRadius: '12px',
        padding: '12px 16px',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
        minWidth: '190px',
      }}
    >
      <div
        className="flex items-center gap-1.5 mb-3 pb-2"
        style={{
          borderBottom: '1px solid var(--card-border)',
          color: 'var(--foreground-muted)',
          fontSize: '11px',
          fontWeight: 600,
        }}
      >
        <Clock size={11} />
        {label} {range === '7d' ? '(total día)' : ''}
      </div>

      <div className="flex items-center justify-between gap-8 mb-1.5">
        <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
          <Sun size={12} style={{ color: 'var(--accent-solar)' }} />
          Solar
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-solar)', fontVariantNumeric: 'tabular-nums' }}>
          {Number(solar).toFixed(2)} kWh
        </span>
      </div>

      <div className="flex items-center justify-between gap-8 mb-3">
        <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
          <Zap size={12} style={{ color: 'var(--accent-consumption)' }} />
          Consumo
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-consumption)', fontVariantNumeric: 'tabular-nums' }}>
          {Number(consumption).toFixed(2)} kWh
        </span>
      </div>

      <div
        className="flex items-center justify-between pt-2"
        style={{ borderTop: '1px solid var(--card-border)' }}
      >
        <span style={{ fontSize: '11px', color: 'var(--foreground-muted)' }}>Balance</span>
        <span
          style={{
            fontSize: '12px',
            fontWeight: 700,
            color: isPositive ? 'var(--accent-solar)' : 'var(--accent-consumption)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {isPositive ? '+' : ''}
          {balance.toFixed(2)} kWh
        </span>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────────── */
export function HistoryChart({ data, range }: HistoryChartProps) {
  if (data.length === 0) {
    return (
      <div
        className="glass-card p-8 flex flex-col items-center justify-center gap-3 animate-fade-in-up"
        style={{ minHeight: '420px', animationDelay: '240ms' }}
      >
        <div className="p-4 rounded-2xl" style={{ background: 'var(--accent-solar-light)' }}>
          <Sun size={32} style={{ color: 'var(--accent-solar)' }} />
        </div>
        <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
          Sin datos históricos
        </p>
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--foreground-muted)' }}>
          Ejecuta el seed para generar datos de demostración.
        </p>
      </div>
    );
  }

  const rangeLabel = range === '7d'
    ? `Últimos 7 días · ${data.length} días`
    : `Últimas 24 horas · ${data.length} lecturas`;

  return (
    <div className="w-full animate-fade-in-up" style={{ animationDelay: '240ms' }}>
      {/* ── Chart ─── */}

      {/* ── Chart ─── */}
      <div style={{ height: '320px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          {range === '7d' ? (
            /* Bar chart for 7-day view — perfect for small number of discrete days */
            <BarChart data={data} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--card-border)" vertical={false} strokeOpacity={0.6} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--foreground-muted)', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--foreground-muted)', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                content={<CustomTooltip range={range} />}
                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
              />
              <Bar dataKey="solar"       name="Solar"   fill="var(--accent-solar)"       radius={[4,4,0,0]} maxBarSize={36} />
              <Bar dataKey="consumption" name="Consumo" fill="var(--accent-consumption)" radius={[4,4,0,0]} maxBarSize={36} />
            </BarChart>
          ) : range === '30d' ? (
            /* Composed chart for 30-day view — Area for solar, Line for consumption to show trends clearly */
            <ComposedChart data={data} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--accent-solar)"       stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent-solar)"       stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--card-border)" vertical={false} strokeOpacity={0.6} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={30}
                tick={{ fill: 'var(--foreground-muted)', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--foreground-muted)', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                content={<CustomTooltip range={range} />}
                cursor={{ stroke: 'var(--card-border)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone" dataKey="solar" name="Solar"
                stroke="var(--accent-solar)" strokeWidth={2.5} fill="url(#gradSolar)"
                dot={false}
                activeDot={{ r: 5, fill: 'var(--accent-solar)', stroke: 'var(--card-bg)', strokeWidth: 2 }}
              />
              <Line
                type="monotone" dataKey="consumption" name="Consumo"
                stroke="var(--accent-consumption)" strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 5, fill: 'var(--accent-consumption)', stroke: 'var(--card-bg)', strokeWidth: 2 }}
              />
            </ComposedChart>
          ) : (
            /* Area chart for 24h view — minute-level granularity */
            <AreaChart data={data} margin={{ top: 6, right: 4, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gradSolar" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--accent-solar)"       stopOpacity={0.35} />
                  <stop offset="100%" stopColor="var(--accent-solar)"       stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradConsumption" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="var(--accent-consumption)" stopOpacity={0.30} />
                  <stop offset="100%" stopColor="var(--accent-consumption)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="var(--card-border)" vertical={false} strokeOpacity={0.6} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                minTickGap={40}
                tick={{ fill: 'var(--foreground-muted)', fontSize: 11, fontWeight: 500 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fill: 'var(--foreground-muted)', fontSize: 11, fontWeight: 500 }}
                tickFormatter={(v) => `${v}`}
              />
              <Tooltip
                content={<CustomTooltip range={range} />}
                cursor={{ stroke: 'var(--card-border)', strokeWidth: 1, strokeDasharray: '4 4' }}
              />
              <Area
                type="monotone" dataKey="solar" name="Solar"
                stroke="var(--accent-solar)" strokeWidth={2.5} fill="url(#gradSolar)"
                dot={false}
                activeDot={{ r: 5, fill: 'var(--accent-solar)', stroke: 'var(--card-bg)', strokeWidth: 2 }}
              />
              <Area
                type="monotone" dataKey="consumption" name="Consumo"
                stroke="var(--accent-consumption)" strokeWidth={2.5} fill="url(#gradConsumption)"
                dot={false}
                activeDot={{ r: 5, fill: 'var(--accent-consumption)', stroke: 'var(--card-bg)', strokeWidth: 2 }}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Insight Banner */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200/50 flex items-center justify-center shrink-0">
            <svg className="w-3 h-3 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Durante las horas centrales de hoy, <strong className="text-slate-700 dark:text-slate-300">el 100% de la energía consumida provino del sol</strong> sin costo de la red eléctrica.
          </p>
        </div>
        <button className="text-xs font-bold text-amber-600 dark:text-amber-500 hover:text-amber-700 transition-colors flex items-center gap-1 shrink-0">
          Ver detalle de consumo por electrodoméstico
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
