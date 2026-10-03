import { Zap } from 'lucide-react';

interface ConsumptionCardProps {
  valueKwh: number;
}

export function ConsumptionCard({ valueKwh }: ConsumptionCardProps) {
  // Demo text logic
  let statusText = '• Consumo Moderado';
  let statusColor = 'text-blue-600 dark:text-blue-400';
  let dotColor = 'bg-blue-500';

  if (valueKwh < 1.0) {
    statusText = '• Consumo Bajo y Óptimo';
    statusColor = 'text-emerald-600 dark:text-emerald-400';
    dotColor = 'bg-emerald-500';
  } else if (valueKwh > 5.0) {
    statusText = '• Consumo Elevado (Pico)';
    statusColor = 'text-red-600 dark:text-red-400';
    dotColor = 'bg-red-500';
  }

  return (
    <div className="bg-white dark:bg-[#0B1628] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between h-full shadow-sm">
      <div>
        {/* Header inline */}
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Consumo Actual
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Demanda de tu hogar en tiempo real
            </p>
          </div>
        </div>

        {/* Big Value */}
        <div className="flex items-baseline gap-1.5 mb-4">
          <span className="text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white">
            {valueKwh.toFixed(2)}
          </span>
          <span className="text-sm font-semibold text-slate-500">kW</span>
        </div>

        {/* Text description */}
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-6">
          Última lectura tomada desde el medidor de tu instalación. Cargas habituales (refrigerador, luces y climatización moderada).
        </p>
      </div>

      {/* Footer line */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-2 text-xs">
        <span className="text-slate-500 dark:text-slate-400">Nivel de demanda:</span>
        <span className={`font-semibold ${statusColor} flex items-center gap-1.5`}>
          <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
          {statusText.replace('• ', '')}
        </span>
      </div>
    </div>
  );
}
