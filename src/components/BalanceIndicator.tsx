import { TrendingDown, TrendingUp, Minus } from 'lucide-react';
import clsx from 'clsx';

interface BalanceIndicatorProps {
  consumptionKwh: number;
  solarKwh: number;
}

export function BalanceIndicator({ consumptionKwh, solarKwh }: BalanceIndicatorProps) {
  const balance = solarKwh - consumptionKwh;
  const isPositive = balance > 0;
  const isNeutral = balance === 0;

  return (
    <div className="glass-card p-6 flex items-center justify-between">
      <div>
        <h3 className="font-medium text-foreground/80 text-sm uppercase mb-1">Balance Actual</h3>
        <p className="text-xs text-foreground/50">Generación vs Consumo</p>
      </div>
      
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className={clsx(
            "text-2xl font-bold tracking-tight flex items-center gap-1",
            isNeutral ? "text-foreground" : isPositive ? "text-accent-solar" : "text-accent-consumption"
          )}>
            {isPositive ? '+' : ''}{balance.toFixed(2)} <span className="text-sm font-medium opacity-70">kWh</span>
          </div>
          <div className="text-xs text-foreground/60">
            {isNeutral ? 'Equilibrio' : isPositive ? 'Excedente de energía' : 'Consumo de red'}
          </div>
        </div>
        
        <div className={clsx(
          "p-3 rounded-full flex items-center justify-center",
          isNeutral ? "bg-foreground/10 text-foreground" : isPositive ? "bg-accent-solar/20 text-accent-solar" : "bg-accent-consumption/20 text-accent-consumption"
        )}>
          {isNeutral ? <Minus size={24} /> : isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
        </div>
      </div>
    </div>
  );
}
