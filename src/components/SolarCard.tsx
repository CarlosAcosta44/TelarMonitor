import { Sun } from 'lucide-react';
import clsx from 'clsx';

interface SolarCardProps {
  valueKwh: number;
  className?: string;
}

export function SolarCard({ valueKwh, className }: SolarCardProps) {
  const isGenerating = valueKwh > 0;
  
  return (
    <div className={clsx("glass-card p-6 flex flex-col relative overflow-hidden", className)}>
      <div className="absolute top-0 right-0 p-4 opacity-10 text-accent-solar">
        <Sun size={80} />
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <div className="p-2 rounded-lg bg-accent-solar/20 text-accent-solar">
          <Sun size={20} />
        </div>
        <h3 className="font-medium text-foreground/80 tracking-wide text-sm uppercase">Generación Solar</h3>
      </div>
      
      <div className="flex items-baseline gap-2 mt-auto">
        <span className="text-5xl font-bold tracking-tight text-foreground">
          {valueKwh.toFixed(2)}
        </span>
        <span className="text-foreground/60 font-medium">kWh</span>
      </div>
      
      <div className="mt-4 text-xs text-foreground/50 flex items-center gap-1.5">
        <span className={clsx("w-2 h-2 rounded-full", isGenerating ? "bg-accent-solar animate-pulse" : "bg-foreground/20")}></span>
        {isGenerating ? "Paneles activos y generando" : "Paneles inactivos (sin sol)"}
      </div>
      
      {/* Decorative gradient bar */}
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-accent-solar/50 to-transparent"></div>
    </div>
  );
}
