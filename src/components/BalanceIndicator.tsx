import { Scale } from 'lucide-react';

interface BalanceIndicatorProps {
  consumptionKwh: number;
  solarKwh: number;
}

export function BalanceIndicator({ consumptionKwh, solarKwh }: BalanceIndicatorProps) {
  const isExporting = solarKwh > consumptionKwh;
  const netBalance = solarKwh - consumptionKwh;
  const absBalance = Math.abs(netBalance);
  
  const solarRatio = consumptionKwh > 0 
    ? Math.min(100, (solarKwh / consumptionKwh) * 100) 
    : (solarKwh > 0 ? 100 : 0);
  
  const gridRatio = Math.max(0, 100 - solarRatio);

  const valueColor = isExporting ? 'text-emerald-500' : 'text-slate-900 dark:text-white';
  const prefix = isExporting ? '+' : '-';

  return (
    <div className="bg-white dark:bg-[#0B1628] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between h-full shadow-sm">
      <div>
        {/* Header inline */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Balance de Energía
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Energía solar vs Consumo de red
            </p>
          </div>
        </div>

        {/* Big Value + Pill */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-4xl font-extrabold tabular-nums ${valueColor}`}>
              {prefix}{absBalance.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-slate-500">kW</span>
          </div>
          {isExporting ? (
            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold border border-emerald-200/50">
              Autosuficiente
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-bold border border-slate-200 dark:border-slate-700">
              Dependiente
            </span>
          )}
        </div>

        {/* Stacked Progress Bar & Legend */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2 px-1">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              Solar ({solarRatio.toFixed(0)}%)
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Red Externa ({gridRatio.toFixed(0)}%)
              <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></span>
            </div>
          </div>
          <div className="h-2.5 w-full flex bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-amber-500 transition-all duration-1000" 
              style={{ width: `${solarRatio}%` }} 
            />
            <div 
              className="h-full bg-slate-300 dark:bg-slate-600 transition-all duration-1000" 
              style={{ width: `${gridRatio}%` }} 
            />
          </div>
        </div>

        {/* Two info boxes */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-900/50 rounded-lg p-2 flex flex-col justify-center items-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Generando</span>
            <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{solarKwh.toFixed(2)} kW</span>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-lg p-2 flex flex-col justify-center items-center">
            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Consumiendo</span>
            <span className="text-sm font-bold text-slate-900 dark:text-white">{consumptionKwh.toFixed(2)} kW</span>
          </div>
        </div>
      </div>

      {/* Footer line */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Excedente inyectado:</span>
        <span className={`font-semibold ${isExporting ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
          {isExporting ? `${absBalance.toFixed(2)} kW a favor` : '0.00 kW'}
        </span>
      </div>
    </div>
  );
}
