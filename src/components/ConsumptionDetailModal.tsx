'use client';

import * as React from 'react';
import { 
  X, 
  Zap, 
  Tv, 
  Refrigerator, 
  Wind, 
  WashingMachine, 
  Lightbulb, 
  Laptop, 
  Sun, 
  Clock,
  Sparkles
} from 'lucide-react';

interface ApplianceItem {
  name: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  kwhToday: number;
  costCop: number;
  solarCoveredPercent: number;
  status: 'Activo' | 'Standby' | 'Óptimo';
  tip: string;
}

const APPLIANCES_DATA: ApplianceItem[] = [
  {
    name: 'Aire Acondicionado Inverter',
    category: 'Climatización',
    icon: Wind,
    kwhToday: 4.8,
    costCop: 4560,
    solarCoveredPercent: 85,
    status: 'Activo',
    tip: 'Opera principalmente en horas solares (11:00 AM - 3:00 PM), maximizando el autoconsumo gratuito.',
  },
  {
    name: 'Refrigerador No-Frost',
    category: 'Cocina & Conservación',
    icon: Refrigerator,
    kwhToday: 2.1,
    costCop: 1995,
    solarCoveredPercent: 48,
    status: 'Óptimo',
    tip: 'Consumo constante 24/7. El 48% diurno fue cubierto íntegramente por los paneles solares.',
  },
  {
    name: 'Lavadora y Secadora',
    category: 'Lavado',
    icon: WashingMachine,
    kwhToday: 1.9,
    costCop: 1805,
    solarCoveredPercent: 92,
    status: 'Activo',
    tip: 'Ciclo ejecutado al mediodía: 92% de energía limpia aprovechada en el pico de irradiación.',
  },
  {
    name: 'Iluminación LED Inteligente',
    category: 'Iluminación',
    icon: Lightbulb,
    kwhToday: 0.9,
    costCop: 855,
    solarCoveredPercent: 15,
    status: 'Standby',
    tip: 'Demanda concentrada en horario nocturno (7:00 PM - 11:00 PM).',
  },
  {
    name: 'Zona Home Office & Cómputo',
    category: 'Electrónica',
    icon: Laptop,
    kwhToday: 1.4,
    costCop: 1330,
    solarCoveredPercent: 88,
    status: 'Activo',
    tip: 'Consumo continuo durante el día laboral amortizado por generación solar directa.',
  },
  {
    name: 'Entretenimiento & Audio/TV',
    category: 'Multimedia',
    icon: Tv,
    kwhToday: 0.8,
    costCop: 760,
    solarCoveredPercent: 35,
    status: 'Standby',
    tip: 'Uso mixto tarde/noche con bajo impacto en la red.',
  },
];

interface ConsumptionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalKwh?: number;
}

export function ConsumptionDetailModal({ isOpen, onClose, totalKwh = 11.9 }: ConsumptionDetailModalProps) {
  if (!isOpen) return null;

  const totalCost = Math.round(totalKwh * 950);
  const totalSolarCovered = Math.round(totalKwh * 0.68 * 10) / 10;
  const solarSavingsCop = Math.round(totalSolarCovered * 950);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="bg-white dark:bg-[#0B132B] border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Detalle de Consumo por Electrodoméstico
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Desglose estimado y cobertura solar por categoría de carga
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-6 pb-2 shrink-0">
          <div className="p-4 rounded-2xl bg-slate-100/70 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Consumo Total Hoy</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{totalKwh.toFixed(1)}</span>
              <span className="text-xs font-bold text-slate-500">kWh</span>
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">${totalCost.toLocaleString('es-CO')} COP estimados</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1 flex items-center gap-1">
              <Sun className="w-3.5 h-3.5" /> Autoconsumo Solar
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{totalSolarCovered.toFixed(1)}</span>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">kWh</span>
            </div>
            <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold mt-1 block">
              68% cubierto por tus paneles
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block mb-1 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Ahorro Evitado
            </span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ${solarSavingsCop.toLocaleString('es-CO')}
              </span>
            </div>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1 block">
              No pagado a la red hoy
            </span>
          </div>
        </div>

        {/* Scrollable Appliances List */}
        <div className="p-6 overflow-y-auto space-y-3 flex-1 hide-scrollbar">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
            Desglose por Cargas Eléctricas
          </p>

          {APPLIANCES_DATA.map((item) => {
            const Icon = item.icon;
            return (
              <div 
                key={item.name}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-amber-500/30 transition-all flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0 shadow-sm">
                      <Icon className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                        {item.name}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-medium">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {item.kwhToday.toFixed(1)} kWh
                    </span>
                    <span className="text-xs text-slate-400 block font-semibold">
                      ${item.costCop.toLocaleString('es-CO')} COP
                    </span>
                  </div>
                </div>

                {/* Solar Coverage Bar */}
                <div>
                  <div className="flex justify-between items-center text-[11px] mb-1">
                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Sun className="w-3 h-3 text-amber-500" /> Cobertura Solar Directa
                    </span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">
                      {item.solarCoveredPercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-amber-500 to-orange-400 rounded-full transition-all duration-500"
                      style={{ width: `${item.solarCoveredPercent}%` }}
                    />
                  </div>
                </div>

                {/* Energy Tip */}
                <p className="text-[11px] text-slate-500 dark:text-slate-400 italic bg-white/60 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/50 dark:border-slate-800">
                  💡 {item.tip}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Clock className="w-4 h-4 text-slate-400" />
            <span>Actualización en tiempo real vía telemetría Telar</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl text-xs font-bold transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
