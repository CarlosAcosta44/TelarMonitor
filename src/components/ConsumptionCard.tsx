import { Zap } from 'lucide-react';
import clsx from 'clsx';

interface ConsumptionCardProps {
  valueKwh: number;
  className?: string;
}

export function ConsumptionCard({ valueKwh, className }: ConsumptionCardProps) {
  return (
    <div
      className={clsx(
        'glass-card glow-consumption p-6 flex flex-col relative overflow-hidden animate-fade-in-up',
        className
      )}
      style={{ animationDelay: '0ms' }}
    >
      {/* ── Decorative background icon ─── */}
      <div
        className="absolute -top-4 -right-4 opacity-[0.07]"
        style={{ color: 'var(--accent-consumption)' }}
      >
        <Zap size={120} strokeWidth={1.5} />
      </div>

      {/* ── Top accent bar ─── */}
      <div
        className="absolute top-0 left-0 h-[3px] w-full rounded-t-[1.25rem]"
        style={{
          background:
            'linear-gradient(to right, var(--accent-consumption), transparent)',
        }}
      />

      {/* ── Header ─── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl"
            style={{
              background: 'var(--accent-consumption-light)',
              color: 'var(--accent-consumption)',
              border: '1px solid var(--accent-consumption-glow)',
            }}
          >
            <Zap size={18} strokeWidth={2.5} />
          </div>
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Consumo
            </p>
            <p className="text-xs" style={{ color: 'var(--foreground-muted)', opacity: 0.7 }}>
              Demanda actual
            </p>
          </div>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide"
          style={{
            background: 'var(--accent-consumption-light)',
            color: 'var(--accent-consumption)',
          }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse"
            style={{ background: 'var(--accent-consumption)' }}
          />
          LIVE
        </div>
      </div>

      {/* ── Value ─── */}
      <div className="flex items-baseline gap-2 mt-auto animate-number" style={{ animationDelay: '100ms' }}>
        <span
          className="font-bold tracking-tight leading-none"
          style={{
            fontSize: 'clamp(2.5rem, 5vw, 3.5rem)',
            color: 'var(--foreground)',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {valueKwh.toFixed(2)}
        </span>
        <span
          className="text-base font-medium"
          style={{ color: 'var(--foreground-muted)' }}
        >
          kWh
        </span>
      </div>

      {/* ── Footer label ─── */}
      <p
        className="mt-3 text-xs"
        style={{ color: 'var(--foreground-muted)', opacity: 0.6 }}
      >
        Última lectura del medidor de red
      </p>
    </div>
  );
}
