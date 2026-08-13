'use client';

import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis, 
  CartesianGrid 
} from 'recharts';
import { EnergyReading } from '../domain/entities/EnergyReading';

interface HistoryChartProps {
  consumptionData: EnergyReading[];
  solarData: EnergyReading[];
}

export function HistoryChart({ consumptionData, solarData }: HistoryChartProps) {
  // Merge data by recorded_at (assuming they are synced, or we group them by hour)
  // For MVP simplicity, let's create a combined array assuming they match timeframes
  
  const combinedData = consumptionData.map((c, i) => {
    const s = solarData[i];
    const date = new Date(c.recorded_at);
    return {
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      date: date.toLocaleDateString(),
      consumption: c.value_kwh,
      solar: s ? s.value_kwh : 0
    };
  });

  if (combinedData.length === 0) {
    return (
      <div className="glass-card p-6 h-[400px] flex items-center justify-center text-foreground/50">
        No hay datos históricos disponibles
      </div>
    );
  }

  return (
    <div className="glass-card p-6 w-full">
      <h3 className="font-medium text-foreground/80 mb-6">Histórico de Consumo y Generación (Últimas 24h)</h3>
      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={combinedData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorConsumption" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-consumption)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--accent-consumption)" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="colorSolar" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--accent-solar)" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="var(--accent-solar)" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--card-border)" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="currentColor" 
              className="text-foreground/50 text-xs"
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              stroke="currentColor" 
              className="text-foreground/50 text-xs"
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'var(--card-bg)', 
                borderColor: 'var(--card-border)',
                borderRadius: '8px',
                color: 'var(--foreground)'
              }}
              itemStyle={{ fontWeight: 500 }}
              labelStyle={{ color: 'var(--foreground)', opacity: 0.7, marginBottom: '8px' }}
            />
            <Area 
              type="monotone" 
              dataKey="solar" 
              name="Generación Solar (kWh)"
              stroke="var(--accent-solar)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorSolar)" 
            />
            <Area 
              type="monotone" 
              dataKey="consumption" 
              name="Consumo (kWh)"
              stroke="var(--accent-consumption)" 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorConsumption)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
