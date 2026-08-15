'use client';

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { EnergyReading } from '../domain/entities/EnergyReading';
import { Zap, Sun, Clock } from 'lucide-react';

interface HistoryChartProps {
  consumptionData: EnergyReading[];
  solarData: EnergyReading[];
}

/* ── Custom Tooltip ─────────────────────────────────────────────── */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
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
        minWidth: '180px',
      }}
    >
      {/* Time label */}
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
        {label}
      </div>

      {/* Solar row */}
      <div className="flex items-center justify-between gap-8 mb-1.5">
        <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
          <Sun size={12} style={{ color: 'var(--accent-solar)' }} />
          Solar
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-solar)', fontVariantNumeric: 'tabular-nums' }}>
          {Number(solar).toFixed(2)} kWh
        </span>
      </div>

      {/* Consumption row */}
      <div className="flex items-center justify-between gap-8 mb-3">
        <div className="flex items-center gap-1.5" style={{ fontSize: '12px', color: 'var(--foreground-muted)' }}>
          <Zap size={12} style={{ color: 'var(--accent-consumption)' }} />
          Consumo
        </div>
        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--accent-consumption)', fontVariantNumeric: 'tabular-nums' }}>
          {Number(consumption).toFixed(2)} kWh
        </span>
      </div>

      {/* Balance row */}
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
export function HistoryChart({ consumptionData, solarData }: HistoryChartProps) {
  const combinedData = consumptionData.map((c, i) => {
    const s = solarData[i];
    const date = new Date(c.recorded_at);
    return {
      time: date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' }),
      consumption: c.value_kwh,
      solar: s ? s.value_kwh : 0,
    };
  });

  if (combinedData.length === 0) {
    return (
      <div
        className="glass-card p-8 flex flex-col items-center justify-center gap-3 animate-fade-in-up"
        style={{ minHeight: '420px', animationDelay: '240ms' }}
      >
        <div
          className="p-4 rounded-2xl"
          style={{ background: 'var(--accent-solar-light)' }}
        >
          <Sun size={32} style={{ color: 'var(--accent-solar)' }} />
        </div>
        <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
          Sin datos históricos
        </p>
        <p className="text-sm text-center max-w-xs" style={{ color: 'var(--foreground-muted)' }}>
          Los registros aparecerán aquí cuando comiencen a llegar lecturas del sistema.
        </p>
      </div>
    );
  }

  return (
    <div
      className="glass-card p-6 w-full animate-fade-in-up"
      style={{ animationDelay: '240ms' }}
    >
      {/* ── Card header ─── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h3
            className="text-base font-bold tracking-tight"
            style={{ color: 'var(--foreground)' }}
          >
            Histórico de Energía
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
            Últimas 24 horas · {combinedData.length} lecturas
          </p>
        </div>

        {/* ── Legend ─── */}
        <div className="flex items-center gap-5">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-2.5 rounded-full"
              style={{
                background: 'linear-gradient(to right, var(--accent-solar), rgba(52,211,153,0.4))',
              }}
            />
            <span className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
              Generación Solar
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-2.5 rounded-full"
              style={{
                background: 'linear-gradient(to right, var(--accent-consumption), rgba(248,113,113,0.4))',
              }}
            />
            <span className="text-xs font-medium" style={{ color: 'var(--foreground-muted)' }}>
              Consumo
            </span>
          </div>
        </div>
      </div>

      {/* ── Chart ─── */}
      <div style={{ height: '320px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={combinedData}
            margin={{ top: 6, right: 4, left: -24, bottom: 0 }}
          >
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

            <CartesianGrid
              strokeDasharray="4 4"
              stroke="var(--card-border)"
              vertical={false}
              strokeOpacity={0.6}
            />

            <XAxis
              dataKey="time"
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
              content={<CustomTooltip />}
              cursor={{
                stroke: 'var(--card-border)',
                strokeWidth: 1,
                strokeDasharray: '4 4',
              }}
            />

            {/* Solar first so it renders under consumption */}
            <Area
              type="monotone"
              dataKey="solar"
              name="Generación Solar"
              stroke="var(--accent-solar)"
              strokeWidth={2.5}
              fill="url(#gradSolar)"
              dot={false}
              activeDot={{ r: 5, fill: 'var(--accent-solar)', stroke: 'var(--card-bg)', strokeWidth: 2 }}
            />
            <Area
              type="monotone"
              dataKey="consumption"
              name="Consumo"
              stroke="var(--accent-consumption)"
              strokeWidth={2.5}
              fill="url(#gradConsumption)"
              dot={false}
              activeDot={{ r: 5, fill: 'var(--accent-consumption)', stroke: 'var(--card-bg)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
