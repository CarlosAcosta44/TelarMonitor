import { SupabaseEnergyReadingRepository } from "@/infrastructure/supabase/SupabaseEnergyReadingRepository";
import { GetHistoricalReadings } from "@/application/use-cases/GetHistoricalReadings";
import { HistoryChart, ChartDataPoint, ChartRange } from "@/components/HistoryChart";
import { DashboardRefresher } from "@/components/DashboardRefresher";
import { Calendar, Download, Zap, Sun, Leaf, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { ExportButton } from "@/components/ExportButton";

export const revalidate = 60;

export default async function HistoricoPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const params = await searchParams;
  const rangeParam = params.range || "30d";
  const range: ChartRange = (rangeParam === "24h" || rangeParam === "7d" || rangeParam === "30d") ? rangeParam : "30d";

  const energyRepo = new SupabaseEnergyReadingRepository();
  const getHistory = new GetHistoricalReadings(energyRepo);

  // We fetch 30 days of data to populate the charts AND the time patterns/recent days
  const [history30dConsumption, history30dSolar] = await Promise.all([
    getHistory.execute("consumption", 2880).catch(() => []),
    getHistory.execute("solar_generation", 2880).catch(() => []),
  ]);

  // Aggregate by day for all 30 days
  const dailyDataMap = new Map<string, { consumption: number; solar: number; date: Date }>();
  
  history30dConsumption.forEach(c => {
    const d = new Date(c.recorded_at);
    const key = d.toISOString().split('T')[0];
    if (!dailyDataMap.has(key)) dailyDataMap.set(key, { consumption: 0, solar: 0, date: d });
    dailyDataMap.get(key)!.consumption += (c.value_kwh / 4);
  });
  
  history30dSolar.forEach(s => {
    const d = new Date(s.recorded_at);
    const key = d.toISOString().split('T')[0];
    if (!dailyDataMap.has(key)) dailyDataMap.set(key, { consumption: 0, solar: 0, date: d });
    dailyDataMap.get(key)!.solar += (s.value_kwh / 4);
  });

  const allDays = Array.from(dailyDataMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Prepare chart data based on selected range
  let chartData: ChartDataPoint[] = [];
  let summaryDays = allDays;

  if (range === "24h") {
    // Take the last 96 points directly
    const recentC = history30dConsumption.slice(-96);
    const recentS = history30dSolar.slice(-96);
    chartData = recentC.map((c, i) => {
      const s = recentS[i];
      return {
        label: new Date(c.recorded_at).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
        consumption: c.value_kwh,
        solar: s ? s.value_kwh : 0,
      };
    });
    summaryDays = allDays.slice(-1);
  } else if (range === "7d") {
    summaryDays = allDays.slice(-7);
    chartData = summaryDays.map(d => ({
      label: d.date.toLocaleDateString("es", { weekday: "short", day: "numeric" }),
      consumption: Number(d.consumption.toFixed(2)),
      solar: Number(d.solar.toFixed(2)),
    }));
  } else {
    // 30d
    summaryDays = allDays.slice(-30);
    chartData = summaryDays.map((d, i) => ({
      // "Día 01", "Día 15 (Pico)" logic could be applied here, but we'll use a clean short date
      label: `Día ${i + 1}`,
      consumption: Number(d.consumption.toFixed(2)),
      solar: Number(d.solar.toFixed(2)),
    }));
  }

  // Calculate Summary Cards
  const totalConsumption = summaryDays.reduce((acc, d) => acc + d.consumption, 0);
  const totalSolar = summaryDays.reduce((acc, d) => acc + d.solar, 0);
  
  let maxSolar = 0;
  let maxSolarDate = new Date();
  let autonomyCount = 0;

  summaryDays.forEach(d => {
    if (d.solar > maxSolar) {
      maxSolar = d.solar;
      maxSolarDate = d.date;
    }
    if (d.consumption > 0 && d.solar / d.consumption > 0.8) {
      autonomyCount++;
    }
  });

  const coveragePercent = totalConsumption > 0 ? (totalSolar / totalConsumption) * 100 : 0;
  
  // Time Patterns (Average consumption by hour block across 30 days)
  let morningCons = 0, noonCons = 0, nightCons = 0, totalPatternCons = 0;
  history30dConsumption.forEach(c => {
    const hour = new Date(c.recorded_at).getHours();
    const val = c.value_kwh / 4;
    totalPatternCons += val;
    if (hour >= 6 && hour < 11) morningCons += val;
    else if (hour >= 11 && hour < 15) noonCons += val;
    else if (hour >= 18 && hour < 23) nightCons += val;
  });

  const pMorning = totalPatternCons ? Math.round((morningCons / totalPatternCons) * 100) : 0;
  const pNoon = totalPatternCons ? Math.round((noonCons / totalPatternCons) * 100) : 0;
  const pNight = totalPatternCons ? Math.round((nightCons / totalPatternCons) * 100) : 0;

  // Recent 7 Days Table
  const recentTableDays = allDays.slice(-7).reverse();
  const recent7dBalance = recentTableDays.reduce((acc, d) => acc + (d.solar - d.consumption), 0);

  return (
    <>
      <DashboardRefresher intervalMs={60_000} />
      
      <div className="flex flex-col gap-6 max-w-[1200px] mx-auto animate-fade-in print:max-w-none print:m-0 print:gap-4">
        
        {/* Header */}
        <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-amber-600 dark:text-amber-400 print:hidden">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Histórico y Tendencias
              </h2>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed print:hidden">
              Revisa el comportamiento de tu energía por día, semana, mes o año para descubrir patrones de ahorro prácticos en tu hogar.
            </p>
          </div>

          <div className="flex flex-col items-end gap-3">
            {/* Range Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl print:hidden">
              <Link href="?range=24h" className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${range === '24h' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                Día (24h)
              </Link>
              <Link href="?range=7d" className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${range === '7d' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                Semana
              </Link>
              <Link href="?range=30d" className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${range === '30d' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                Mes en curso
              </Link>
            </div>

            {/* Bottom Row */}
            <div className="flex items-center gap-3">
              {/* Month Selector */}
              {range === '30d' && (
                <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm h-[34px] print:hidden">
                  <button className="px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="flex items-center gap-2 px-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                    <Calendar className="w-4 h-4 text-amber-600" />
                    Octubre 2026
                  </div>
                  <button className="px-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Export Button */}
              <ExportButton />
            </div>
          </div>
        </div>

        {/* 4 Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">TOTAL<br/>CONSUMIDO</p>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Zap className="w-5 h-5 text-blue-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalConsumption.toFixed(1)}</span>
              <span className="text-sm font-semibold text-slate-500">kWh</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md w-fit">
              <svg className="w-3.5 h-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M22 7 13.5 15.5 8.5 10.5 2 17"/><path d="M16 7h6v6"/></svg>
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400">8.4%</span>
              <span className="text-xs font-medium text-emerald-600/80 dark:text-emerald-500">menos que sept</span>
            </div>
          </div>

          <div className="glass-card p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">TOTAL SOLAR<br/>GENERADO</p>
              <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                <Sun className="w-5 h-5 text-amber-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{totalSolar.toFixed(1)}</span>
              <span className="text-sm font-semibold text-slate-500">kWh</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-amber-50 dark:bg-amber-900/20 rounded-md w-fit">
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">Cobertura solar mensual</span>
              <span className="text-xs font-bold text-amber-600">{coveragePercent.toFixed(1)}%</span>
            </div>
          </div>

          <div className="glass-card p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">MAYOR<br/>RENDIMIENTO</p>
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                <Sun className="w-5 h-5 text-orange-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mb-1">
              <span className="text-xl font-black text-slate-900 dark:text-white tracking-tight">{maxSolar.toFixed(1)}</span>
              <span className="text-xs font-semibold text-slate-500">kWh</span>
            </div>
            <p className="text-xs font-medium text-slate-900 dark:text-slate-200 mb-4 capitalize">
              {maxSolarDate.toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-md w-fit border border-slate-100 dark:border-slate-800">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-500"></div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">Día despejado, radiación óptima</span>
            </div>
          </div>

          <div className="glass-card p-5 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4">
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 tracking-wider">AUTONOMÍA<br/>LOGRADA</p>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                <Leaf className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5 mb-4">
              <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{autonomyCount}</span>
              <span className="text-sm font-semibold text-slate-500">días {'>'} 80%</span>
            </div>
            <div className="flex items-center gap-2 px-2.5 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-md w-fit">
              <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">Ahorro estimado</span>
              <span className="text-xs font-bold text-emerald-600">~${(totalSolar * 0.19).toFixed(2)} USD</span>
            </div>
          </div>
        </div>

        {/* Chart Section */}
        <div className="glass-card p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Evolución Diaria: Generación Solar vs. Consumo</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">Comparativa diaria de los {chartData.length} días registrados en el periodo actual.</p>
            </div>
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-amber-500"></div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Solar Producida (kWh)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-blue-500"></div>
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">Consumo Hogar (kWh)</span>
              </div>
            </div>
          </div>
          <HistoryChart data={chartData} range={range} />
        </div>

        {/* Bottom Section: 2 Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Patrones Horarios */}
          <div className="glass-card p-6 lg:col-span-5 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ClockIcon />
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Patrones Horarios Típicos</h3>
              </div>
              <span className="px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-xs font-bold text-indigo-600 dark:text-indigo-400">Octubre</span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              Distribución media de consumo del hogar según la presencia del sol a lo largo de las 24 horas.
            </p>

            <div className="space-y-4 mb-6">
              {/* Morning */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <SunSunriseIcon />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Mañana Temprano</p>
                      <p className="text-xs text-slate-500">06:00 - 11:00</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{pMorning}% consumo</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${pMorning}%` }}></div>
                </div>
              </div>

              {/* Noon */}
              <div className="p-4 rounded-xl bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-5 h-5 text-amber-500" />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Mediodía Solar</p>
                      <p className="text-xs text-slate-500">11:00 - 15:00</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-amber-700 dark:text-amber-500">{pNoon}% consumo</span>
                </div>
                <div className="h-1.5 w-full bg-amber-200 dark:bg-amber-900/50 rounded-full overflow-hidden mb-3">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${pNoon}%` }}></div>
                </div>
                <p className="text-xs text-amber-700/80 dark:text-amber-500/80 font-medium leading-relaxed">
                  Momento de máxima generación limpia. Excelente coincidencia con electrodomésticos.
                </p>
              </div>

              {/* Night */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-2">
                    <MoonIcon />
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">Tarde / Noche</p>
                      <p className="text-xs text-slate-500">18:00 - 23:00</p>
                    </div>
                  </div>
                  <span className="text-sm font-black text-slate-900 dark:text-white">{pNight}% consumo</span>
                </div>
                <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div className="h-full bg-slate-800 dark:bg-slate-400 rounded-full" style={{ width: `${pNight}%` }}></div>
                </div>
              </div>
            </div>

            <div className="mt-auto p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900/30">
              <div className="flex items-center gap-2 mb-2">
                <Leaf className="w-4 h-4 text-emerald-600" />
                <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Consejo de optimización</p>
              </div>
              <p className="text-xs text-emerald-700 dark:text-emerald-500/90 leading-relaxed font-medium">
                Aprovechas el <strong>{pNoon}%</strong> de tu energía solar en horas centrales. Programa tu lavavajillas y termo entre <strong>11:30 y 14:00</strong> para reducir la dependencia de la red vespertina.
              </p>
            </div>
          </div>

          {/* Días Recientes */}
          <div className="glass-card p-6 lg:col-span-7 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-md">
                  <svg className="w-4 h-4 text-slate-600 dark:text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>
                </div>
                <h3 className="text-[15px] font-bold text-slate-900 dark:text-white">Registro de Días Recientes</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">Últimos 7 días analizados</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800">
                    <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha</th>
                    <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider">Condición</th>
                    <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Solar (kWh)</th>
                    <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Consumo (kWh)</th>
                    <th className="pb-3 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {recentTableDays.map((d, i) => {
                    const balance = d.solar - d.consumption;
                    const isPositive = balance > 0;
                    const isPeak = d.solar === maxSolar;
                    
                    let condition = "Soleado";
                    let ConditionIcon = <Sun className="w-4 h-4 text-amber-500" />;
                    if (d.solar < 8) { condition = "Nublado"; ConditionIcon = <CloudIcon />; }
                    else if (d.solar < 15) { condition = "Variable"; ConditionIcon = <CloudSunIcon />; }
                    if (isPeak) { condition = "Pleno Sol"; ConditionIcon = <Sun className="w-4 h-4 text-orange-500" />; }

                    return (
                      <tr key={d.date.toISOString()} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                        <td className="py-3.5 pr-4">
                          <div className="flex flex-col">
                            <span className={`text-sm font-bold ${isPeak ? 'text-orange-600 dark:text-orange-500' : 'text-slate-900 dark:text-white'}`}>
                              {i === 0 ? 'Hoy, ' : i === 1 ? 'Ayer, ' : ''}{d.date.toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" }).replace(',', '')}
                            </span>
                            {isPeak && <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider mt-0.5">(Pico)</span>}
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {ConditionIcon}
                            <span className={`text-sm font-semibold ${isPeak ? 'text-orange-600 dark:text-orange-500' : 'text-slate-600 dark:text-slate-300'}`}>{condition}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className={`text-sm font-black ${isPeak ? 'text-orange-600 dark:text-orange-500' : 'text-amber-600 dark:text-amber-500'}`}>
                            {d.solar.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            {d.consumption.toFixed(1)}
                          </span>
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            isPositive 
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' 
                              : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                          }`}>
                            {isPositive ? '+' : ''}{balance.toFixed(1)} kWh
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-500">Superávit neto de los últimos 7 días:</span>
              <span className={`text-sm font-black ${recent7dBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-blue-600 dark:text-blue-400'}`}>
                {recent7dBalance > 0 ? '+' : ''}{recent7dBalance.toFixed(1)} kWh netos a favor
              </span>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}

// Inline Icons
function ClockIcon() {
  return <svg className="w-5 h-5 text-indigo-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function SunSunriseIcon() {
  return <svg className="w-5 h-5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v8"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>;
}
function MoonIcon() {
  return <svg className="w-5 h-5 text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>;
}
function CloudIcon() {
  return <svg className="w-4 h-4 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"/></svg>;
}
function CloudSunIcon() {
  return <svg className="w-4 h-4 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>;
}
