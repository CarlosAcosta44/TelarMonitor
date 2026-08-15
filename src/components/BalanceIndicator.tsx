import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import clsx from 'clsx';

interface BalanceIndicatorProps {
  consumptionKwh: number;
  solarKwh: number;
}

export function BalanceIndicator({ consumptionKwh, solarKwh }: BalanceIndicatorProps) {
  const balance = solarKwh - consumptionKwh;
  const isPositive = balance > 0;
  const isNeutral = balance === 0 && consumptionKwh === 0;

  const total = consumptionKwh + solarKwh;
  // What % of total energy demand is covered by solar
  const solarPct = total > 0 ? Math.min(100, Math.round((solarKwh / total) * 100)) : 0;
  const gridPct = 100 - solarPct;

  const accentColor = isNeutral
    ? 'var(--foreground-muted)'
    : isPositive
    ? 'var(--accent-solar)'
    : 'var(--accent-consumption)';

  const accentLight = isNeutral
    ? 'rgba(120,130,150,0.1)'
    : isPositive
    ? 'var(--accent-solar-light)'
    : 'var(--accent-consumption-light)';

  const Icon = isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown;

  return (
    <div
      className="glass-card p-6 flex flex-col gap-5 animate-fade-in-up"
      style={{ animationDelay: '160ms' }}
    >
      {/* ── Header row ─── */}
      <div className="flex items-center justify-between">
        <div>
          <p
            className="text-xs font-semibold tracking-widest uppercase"
            style={{ color: 'var(--foreground-muted)' }}
          >
            Balance de Energía
          </p>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--foreground-muted)', opacity: 0.6 }}
          >
            Solar vs. consumo de red
          </p>
        </div>

        {/* Icon + balance value */}
        <div className="flex items-center gap-3">
          <div>
            <div
              className="text-xl font-bold tracking-tight text-right"
              style={{ color: accentColor, fontVariantNumeric: 'tabular-nums' }}
            >
              {isPositive ? '+' : ''}
              {balance.toFixed(2)}{' '}
              <span className="text-sm font-medium opacity-70">kWh</span>
            </div>
            <p
              className="text-xs text-right mt-0.5"
              style={{ color: accentColor, opacity: 0.8 }}
            >
              {isNeutral
                ? 'Sin datos'
                : isPositive
                ? 'Excedente · vertiendo a red'
                : 'Déficit · importando de red'}
            </p>
          </div>

          <div
            className="p-3 rounded-xl shrink-0"
            style={{ background: accentLight, color: accentColor }}
          >
            <Icon size={22} strokeWidth={2.5} />
          </div>
        </div>
      </div>

      {/* ── Stacked progress bar ─── */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--accent-solar)' }}
            />
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Solar
            </span>
            <span
              className="text-xs font-bold ml-1"
              style={{ color: 'var(--accent-solar)' }}
            >
              {solarPct}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className="text-xs font-bold"
              style={{ color: 'var(--accent-consumption)' }}
            >
              {gridPct}%
            </span>
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--foreground-muted)' }}
            >
              Red
            </span>
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: 'var(--accent-consumption)' }}
            />
          </div>
        </div>

        {/* The bar */}
        <div
          className="h-3 rounded-full overflow-hidden flex"
          style={{ background: 'var(--accent-consumption-light)' }}
        >
          <div
            className="h-full progress-bar-fill rounded-full"
            style={{
              width: `${solarPct}%`,
              background:
                'linear-gradient(to right, var(--accent-solar), rgba(52,211,153,0.7))',
            }}
          />
        </div>
      </div>

      {/* ── KWh pill row ─── */}
      <div
        className="grid grid-cols-2 gap-3"
      >
        <div
          className="rounded-xl p-3 text-center"
          style={{
            background: 'var(--accent-solar-light)',
            border: '1px solid var(--accent-solar-glow)',
          }}
        >
          <p
            className="text-xs font-medium"
            style={{ color: 'var(--accent-solar)', opacity: 0.8 }}
          >
            Generando
          </p>
          <p
            className="text-lg font-bold mt-0.5"
            style={{ color: 'var(--accent-solar)', fontVariantNumeric: 'tabular-nums' }}
          >
            {solarKwh.toFixed(2)}
            <span className="text-xs font-medium ml-1 opacity-70">kWh</span>
          </p>
        </div>

        <div
          className="rounded-xl p-3 text-center"
          style={{
            background: 'var(--accent-consumption-light)',
            border: '1px solid var(--accent-consumption-glow)',
          }}
        >
          <p
            className="text-xs font-medium"
            style={{ color: 'var(--accent-consumption)', opacity: 0.8 }}
          >
            Consumiendo
          </p>
          <p
            className="text-lg font-bold mt-0.5"
            style={{ color: 'var(--accent-consumption)', fontVariantNumeric: 'tabular-nums' }}
          >
            {consumptionKwh.toFixed(2)}
            <span className="text-xs font-medium ml-1 opacity-70">kWh</span>
          </p>
        </div>
      </div>
    </div>
  );
}
