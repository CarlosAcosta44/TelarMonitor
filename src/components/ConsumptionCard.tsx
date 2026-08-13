import { Zap } from 'lucide-react';
import clsx from 'clsx';

interface ConsumptionCardProps {
  valueKwh: number;
  className?: string;
}

export function ConsumptionCard({ valueKwh, className }: ConsumptionCardProps) {
  return (
    <div className={clsx("glass-card p-6 flex flex-col relative overflow-hidden", className)}>
      <div className="absolute top-0 right-0 p-4 opacity-10 text-accent-consumption">
        <Zap size={80} />
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-accent-consumption/20 text-accent-consumption">
          <Zap size={20} />
        </div>
        <h3 className="font-medium text-foreground/80 tracking-wide text-sm uppercase">Consumo Actual</h3>
      </div>
      
      <div className="flex items-baseline gap-2 mt-auto">
        <span className="text-5xl font-bold tracking-tight text-foreground">
          {valueKwh.toFixed(2)}
        </span>
        <span className="text-foreground/60 font-medium">kWh</span>
      </div>
      
      <div className="mt-4 text-xs text-foreground/50">
        Actualizado en tiempo real
      </div>
      
      {/* Decorative gradient bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-accent-consumption/50 to-transparent"></div>
    </div>
  );
}
