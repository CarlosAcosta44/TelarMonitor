'use client';

import { useState } from 'react';
import { Zap, ChevronRight, BarChart3 } from 'lucide-react';
import { ConsumptionDetailModal } from '@/components/ConsumptionDetailModal';

interface ConsumptionCardProps {
  valueKwh: number;
  totalKwh?: number;
  hasSolar?: boolean;
}

export function ConsumptionCard({ valueKwh, totalKwh = 11.9, hasSolar = true }: ConsumptionCardProps) {
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // Demo text logic
  let statusText = 'Consumo Moderado';
  let statusColor = 'text-blue-600 dark:text-blue-400';
  let dotColor = 'bg-blue-500';

  if (valueKwh < 1.0) {
    statusText = 'Consumo Bajo y Óptimo';
    statusColor = 'text-emerald-600 dark:text-emerald-400';
    dotColor = 'bg-emerald-500';
  } else if (valueKwh > 4.5) {
    statusText = 'Consumo Elevado (Pico)';
    statusColor = 'text-red-600 dark:text-red-400';
    dotColor = 'bg-red-500';
  }

  return (
    <>
      <div className="bg-white dark:bg-[#0B1628] rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between h-full shadow-sm hover:border-slate-300 dark:hover:border-slate-700 transition-all">
        <div>
          {/* Header inline */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-start gap-3">
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

            <button
              onClick={() => setIsDetailOpen(true)}
              title="Ver desglose detallado de cargas"
              className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>

          {/* Big Value */}
          <div className="flex items-baseline gap-1.5 mb-3">
            <span className="text-4xl font-extrabold tabular-nums text-slate-900 dark:text-white">
              {valueKwh.toFixed(2)}
            </span>
            <span className="text-sm font-semibold text-slate-500">kW</span>
          </div>

          {/* Text description */}
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
            Última lectura tomada desde el medidor de tu instalación. Cargas habituales (refrigerador, luces y climatización).
          </p>

          {/* Detail Button */}
          <button
            onClick={() => setIsDetailOpen(true)}
            className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 flex items-center gap-1 transition-colors"
          >
            Ver detalle por electrodoméstico
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Footer line */}
        <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-2 text-xs">
          <span className="text-slate-500 dark:text-slate-400">Nivel de demanda:</span>
          <span className={`font-semibold ${statusColor} flex items-center gap-1.5`}>
            <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
            {statusText}
          </span>
        </div>
      </div>

      <ConsumptionDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        totalKwh={totalKwh}
        hasSolar={hasSolar}
      />
    </>
  );
}
