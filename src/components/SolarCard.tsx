import { Sun } from 'lucide-react';
import clsx from 'clsx';

interface SolarCardProps {
  valueKwh: number;
  consumptionKwh?: number;
  className?: string;
}

export function SolarCard({ valueKwh, consumptionKwh = 0, className }: SolarCardProps) {
  const isGenerating = valueKwh > 0;
  const efficiencyPct =
    consumptionKwh > 0 ? Math.min(100, Math.round((valueKwh / consumptionKwh) * 100)) : 0;

  return (
    <div
      className={clsx(
        'glass-card glow-solar p-6 flex flex-col relative overflow-hidden animate-fade-in-up',
        className
      )}
      style={{ animationDelay: '80ms' }}
    >
      {/* ── Decorative background icon ─── */}
      <div
        className="absolute -top-4 -right-4 opacity-[0.07]"
        style={{ color: 'var(--accent-solar)' }}
      >
        <Sun size={120} strokeWidth={1} />
      </div>

      {/* ── Top accent bar ─── */}
      <div
        className="absolute top-0 left-0 h-[3px] w-full rounded-t-[1.25rem]"
        style={{
          background:
            'linear-gradient(to right, var(--accent-solar), transparent)',
        }}
      />

      {/* ── Header ─── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div
            className="p-2 rounded-xl"
            style={{
              background: 'var(--accent-solar-light)',
              color: 'var(--accent-solar)',
              border: '1px solid var(--accent-solar-glow)',
            }}
          >
            <Sun size={18} strokeWidth={2} />
          </div>
          <div>
            <p
              className="text-xs font-semibold tracking-widest uppercase"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Solar
            </p>
            <p className="text-xs" style={{ color: 'var(--foreground-muted)', opacity: 0.7 }}>
              Generación fotovoltaica
            </p>
          </div>
        </div>

        {/* Generating status badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold tracking-wide"
          style={{
            background: isGenerating ? 'var(--accent-solar-light)' : 'rgba(120,130,150,0.1)',
            color: isGenerating ? 'var(--accent-solar)' : 'var(--foreground-muted)',
          }}
        >
          <span
            className={clsx(
              'w-1.5 h-1.5 rounded-full',
              isGenerating ? 'animate-pulse' : ''
            )}
            style={{
              background: isGenerating ? 'var(--accent-solar)' : 'var(--foreground-muted)',
            }}
          />
          {isGenerating ? 'ACTIVO' : 'INACTIVO'}
        </div>
      </div>

      {/* ── Value ─── */}
      <div className="flex items-baseline gap-2 mt-auto animate-number" style={{ animationDelay: '180ms' }}>
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

      {/* ── Efficiency row ─── */}
      {consumptionKwh > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <p
              className="text-xs"
              style={{ color: 'var(--foreground-muted)', opacity: 0.7 }}
            >
              Cobertura solar
            </p>
            <p
              className="text-xs font-semibold"
              style={{ color: 'var(--accent-solar)' }}
            >
              {efficiencyPct}%
            </p>
          </div>
          {/* Mini progress bar */}
          <div
            className="h-1 rounded-full overflow-hidden"
            style={{ background: 'var(--accent-solar-light)' }}
          >
            <div
              className="h-full rounded-full progress-bar-fill"
              style={{
                width: `${efficiencyPct}%`,
                background:
                  'linear-gradient(to right, var(--accent-solar), rgba(52,211,153,0.6))',
              }}
            />
          </div>
        </div>
      )}

      {!consumptionKwh && (
        <p
          className="mt-3 text-xs"
          style={{ color: 'var(--foreground-muted)', opacity: 0.6 }}
        >
          {isGenerating ? 'Paneles activos y produciendo' : 'Sin radiación solar detectada'}
        </p>
      )}
    </div>
  );
}
