import { Sun } from 'lucide-react';

interface SolarCardProps {
  valueKwh: number;
  consumptionKwh: number;
}

export function SolarCard({ valueKwh, consumptionKwh }: SolarCardProps) {
  const coverageRatio = consumptionKwh > 0 ? (valueKwh / consumptionKwh) * 100 : 0;
  const coveragePercent = Math.min(100, Math.round(coverageRatio));
  
  let conditionText = '☀️ Pleno Sol de Tarde';
  let barColor = 'bg-amber-500';
  let textColor = 'text-amber-600 dark:text-amber-500';

  if (valueKwh === 0) {
    conditionText = '🌙 Noche / Sin Generación';
    barColor = 'bg-slate-300 dark:bg-slate-700';
    textColor = 'text-slate-500';
  } else if (valueKwh < 1.0) {
    conditionText = '⛅ Nublado / Baja Irradiación';
    barColor = 'bg-amber-300 dark:bg-amber-700';
  }

  return (
    <div className="bg-white dark:bg-[#0B1628] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between h-full shadow-sm">
      <div>
        {/* Header inline */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <Sun className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Generación Solar
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Producción fotovoltaica en techos
            </p>
          </div>
        </div>

        {/* Big Value */}
        <div className="flex items-baseline gap-1.5 mb-6">
          <span className={`text-4xl font-extrabold tabular-nums ${valueKwh > 0 ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
            {valueKwh.toFixed(2)}
          </span>
          <span className="text-sm font-semibold text-slate-500">kW</span>
        </div>

        {/* Progress Bar Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Cobertura de tu consumo:</span>
            <span className={`text-xs font-bold ${textColor}`}>
              {coveragePercent}% cubierto
            </span>
          </div>
          <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-1000 ${barColor}`} 
              style={{ width: `${coveragePercent}%` }} 
            />
          </div>
        </div>
      </div>

      {/* Footer line */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center justify-between text-xs">
        <span className="text-slate-500 dark:text-slate-400">Condición solar:</span>
        <span className={`font-semibold ${textColor}`}>
          {conditionText}
        </span>
      </div>
    </div>
  );
}
