import { Zap, Sun, Banknote } from 'lucide-react';
import type { DailySummary } from '@/application/use-cases/GetDailySummary';

interface DailySummaryBarProps {
  summary: DailySummary;
}

function formatCOP(amount: number): string {
  return amount.toLocaleString('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  });
}

interface MetricPillProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subValue?: string;
  accentColor: string;
  accentLight: string;
  accentGlow: string;
  delay?: string;
}

function MetricPill({
  icon,
  label,
  value,
  subValue,
  accentColor,
  accentLight,
  accentGlow,
  delay = '0ms',
}: MetricPillProps) {
  return (
    <div
      className="glass-card flex-1 px-5 py-4 flex items-center gap-4 animate-fade-in-up min-w-[200px]"
      style={{ animationDelay: delay }}
    >
      {/* Icon */}
      <div
        className="p-2.5 rounded-xl shrink-0"
        style={{
          background: accentLight,
          color: accentColor,
          border: `1px solid ${accentGlow}`,
        }}
      >
        {icon}
      </div>

      {/* Text */}
      <div className="min-w-0">
        <p
          className="text-xs font-semibold tracking-widest uppercase truncate"
          style={{ color: 'var(--foreground-muted)' }}
        >
          {label}
        </p>
        <p
          className="text-xl font-bold tracking-tight mt-0.5"
          style={{ color: accentColor, fontVariantNumeric: 'tabular-nums' }}
        >
          {value}
          <span
            className="text-xs font-medium ml-1"
            style={{ color: 'var(--foreground-muted)', opacity: 0.8 }}
          >
            kWh
          </span>
        </p>
        {subValue && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)', opacity: 0.7 }}>
            {subValue}
          </p>
        )}
      </div>
    </div>
  );
}

export function DailySummaryBar({ summary }: DailySummaryBarProps) {
  const coveragePct =
    summary.consumptionKwh > 0
      ? Math.min(100, Math.round((summary.solarKwh / summary.consumptionKwh) * 100))
      : 0;

  return (
    <div className="flex flex-col gap-3">
      {/* Section label */}
      <div className="flex items-center gap-2">
        <p
          className="text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--foreground-muted)' }}
        >
          Resumen de hoy
        </p>
        <div
          className="h-px flex-1"
          style={{ background: 'var(--card-border)' }}
        />
      </div>

      {/* Pills row */}
      <div className="flex flex-wrap gap-4">
        {/* Consumption total */}
        <MetricPill
          icon={<Zap size={18} strokeWidth={2.5} />}
          label="Consumo total"
          value={summary.consumptionKwh.toFixed(2)}
          subValue="Energía demandada hoy"
          accentColor="var(--accent-consumption)"
          accentLight="var(--accent-consumption-light)"
          accentGlow="var(--accent-consumption-glow)"
          delay="0ms"
        />

        {/* Solar total */}
        <MetricPill
          icon={<Sun size={18} strokeWidth={2} />}
          label="Solar generado"
          value={summary.solarKwh.toFixed(2)}
          subValue={`${coveragePct}% de cobertura solar`}
          accentColor="var(--accent-solar)"
          accentLight="var(--accent-solar-light)"
          accentGlow="var(--accent-solar-glow)"
          delay="60ms"
        />

        {/* Savings */}
        <div
          className="glass-card flex-1 px-5 py-4 flex items-center gap-4 animate-fade-in-up min-w-[200px]"
          style={{
            animationDelay: '120ms',
            background: 'linear-gradient(135deg, rgba(234,179,8,0.08) 0%, rgba(5,150,105,0.06) 100%)',
            borderColor: 'rgba(234,179,8,0.25)',
          }}
        >
          <div
            className="p-2.5 rounded-xl shrink-0"
            style={{
              background: 'rgba(234,179,8,0.12)',
              color: '#ca8a04',
              border: '1px solid rgba(234,179,8,0.3)',
            }}
          >
            <Banknote size={18} strokeWidth={2} />
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Ahorro estimado
            </p>
            <p
              className="text-xl font-bold tracking-tight mt-0.5"
              style={{ color: '#ca8a04', fontVariantNumeric: 'tabular-nums' }}
            >
              {formatCOP(summary.savingsCop)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)', opacity: 0.7 }}>
              a ${summary.rateCopPerKwh.toLocaleString('es-CO')} COP/kWh
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
