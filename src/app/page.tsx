import { SupabaseEnergyReadingRepository } from "@/infrastructure/supabase/SupabaseEnergyReadingRepository";
import { SupabaseSettingsRepository } from "@/infrastructure/supabase/SupabaseSettingsRepository";
import { GetCurrentConsumption } from "@/application/use-cases/GetCurrentConsumption";
import { GetSolarGeneration } from "@/application/use-cases/GetSolarGeneration";
import { GetHistoricalReadings } from "@/application/use-cases/GetHistoricalReadings";
import { GetDailySummary } from "@/application/use-cases/GetDailySummary";

import { ConsumptionCard } from "@/components/ConsumptionCard";
import { SolarCard } from "@/components/SolarCard";
import { BalanceIndicator } from "@/components/BalanceIndicator";
import { HistoryChart, ChartDataPoint } from "@/components/HistoryChart";
import { DashboardRefresher } from "@/components/DashboardRefresher";
import { PdfExportButton } from "@/components/PdfExportButton";
import { AlertCircle, Clock, Info, Zap, Sun, PiggyBank, TrendingUp } from "lucide-react";
import Link from "next/link";

export const revalidate = 10;

/* ── Config Error ───────────────────────────────────────────────── */
function ConfigurationError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="glass-card p-10 max-w-lg w-full flex flex-col items-center gap-5">
        <div className="p-4 rounded-2xl bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          <AlertCircle size={32} />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2">Configuración Pendiente</h2>
          <p className="text-sm text-slate-500">
            Las credenciales de Supabase no están configuradas en <code>.env.local</code>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard Page ─────────────────────────────────────────────── */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await searchParams;
  const range = (resolvedParams.range as string) || '24h';

  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured) return <ConfigurationError />;

  const energyRepo   = new SupabaseEnergyReadingRepository();
  const settingsRepo = new SupabaseSettingsRepository();

  const getConsumption = new GetCurrentConsumption(energyRepo);
  const getSolar       = new GetSolarGeneration(energyRepo);
  const getHistory     = new GetHistoricalReadings(energyRepo);
  const getDailySummary = new GetDailySummary(energyRepo, settingsRepo);

  let limit = 96; // 24h default
  if (range === '7d') limit = 672;
  if (range === '30d') limit = 2880;

  const [
    currentConsumption,
    currentSolar,
    dailySummary,
    installationName,
    historyConsumption,
    historySolar,
  ] = await Promise.all([
    getConsumption.execute().catch(() => null),
    getSolar.execute().catch(() => null),
    getDailySummary.execute().catch(() => null),
    settingsRepo.getSetting("installation_name").catch(() => null),
    getHistory.execute("consumption", limit).catch(() => []),
    getHistory.execute("solar_generation", limit).catch(() => []),
  ]);

  const consumptionKwh = currentConsumption?.value_kwh ?? 0;
  const solarKwh       = currentSolar?.value_kwh ?? 0;
  const lastReadingAt  = currentConsumption?.recorded_at ?? null;

  const lastUpdated = lastReadingAt
    ? new Date(lastReadingAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" })
    : null;

  const today = new Date().toLocaleDateString("es", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // ── Build chart data ─────────────────────────
  let chartData: ChartDataPoint[] = [];

  if (range === '24h') {
    chartData = historyConsumption.map((c, i) => {
      const s = historySolar[i];
      const date = new Date(c.recorded_at);
      return {
        label: date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
        consumption: c.value_kwh,
        solar: s ? s.value_kwh : 0,
      };
    });
  } else {
    // Group by day for 7d and 30d
    const dailyData = new Map<string, { consumption: number, solar: number }>();
    
    // helper to add to map
    const addData = (items: typeof historyConsumption, type: 'consumption' | 'solar') => {
      items.forEach(item => {
        const date = new Date(item.recorded_at);
        const dayKey = date.toISOString().split('T')[0];
        if (!dailyData.has(dayKey)) dailyData.set(dayKey, { consumption: 0, solar: 0 });
        
        const entry = dailyData.get(dayKey)!;
        // value_kwh is an instantaneous kW reading, to approximate kWh over a 15-min interval, divide by 4.
        entry[type] += (item.value_kwh / 4);
      });
    };
    
    addData(historyConsumption, 'consumption');
    addData(historySolar, 'solar');

    // Convert map to array and format label
    chartData = Array.from(dailyData.entries()).map(([dayKey, values]) => {
      const date = new Date(dayKey + 'T12:00:00Z');
      let labelFormat: Intl.DateTimeFormatOptions = { weekday: "short" };
      if (range === '30d') labelFormat = { day: "2-digit", month: "short" };

      return {
        label: date.toLocaleDateString("es", labelFormat),
        consumption: Number(values.consumption.toFixed(2)),
        solar: Number(values.solar.toFixed(2)),
      };
    });
  }

  return (
    <>
      <DashboardRefresher intervalMs={10_000} />

      <div className="flex flex-col gap-6">

        {/* ── Dashboard Heading ─── */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Panel de Control
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                En Vivo
              </span>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 capitalize">
              {installationName || "Mi Instalación Solar"} <span className="mx-2">•</span> {today}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {lastUpdated && (
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm text-slate-600 dark:text-slate-300">
                <Clock className="w-4 h-4 text-slate-400" />
                Última lectura: <strong className="text-slate-900 dark:text-white">{lastUpdated} hrs</strong>
              </div>
            )}
            <PdfExportButton />
          </div>
        </div>

        {/* ── System Warning Banner ─── */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-amber-50/80 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center">
              <Info className="w-4 h-4 text-amber-700 dark:text-amber-500" />
            </div>
            <p className="text-sm text-amber-900 dark:text-amber-200">
              <span className="font-bold">Aviso del sistema:</span> Visualización con datos demostrativos en vivo para validación de interfaz — Conectado a servidor local.
            </p>
          </div>
          <span className="text-xs font-bold text-amber-600 dark:text-amber-500 uppercase tracking-wider">
            SISTEMA ESTABLE
          </span>
        </div>

        {/* ── Resumen de Hoy (Top Row) ─── */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Resumen de Hoy</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Consumo Total */}
            <div className="glass-card p-6 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Consumo Total</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                    {dailySummary ? dailySummary.consumptionKwh.toFixed(2) : "0.00"}
                  </span>
                  <span className="text-sm font-medium text-slate-500">kWh</span>
                </div>
                <p className="text-xs text-slate-500 mt-1">Energía demandada hoy por el hogar</p>
              </div>
            </div>

            {/* Solar Generado */}
            <div className="glass-card p-6 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400">
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Solar Generado</p>
                <div className="flex items-center flex-wrap gap-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
                      {dailySummary ? dailySummary.solarKwh.toFixed(2) : "0.00"}
                    </span>
                    <span className="text-sm font-medium text-slate-500">kWh</span>
                  </div>
                  {dailySummary && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200/50">
                      {Math.min(100, (dailySummary.solarKwh / Math.max(0.1, dailySummary.consumptionKwh)) * 100).toFixed(0)}% Cobertura Solar
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">en el ciclo de hoy</p>
              </div>
            </div>

            {/* Ahorro Estimado */}
            <div className="glass-card p-6 flex items-start gap-4">
              <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400">
                <PiggyBank className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Ahorro Estimado</p>
                <div className="flex items-baseline gap-1 text-emerald-600 dark:text-emerald-400">
                  <span className="text-2xl font-bold">$</span>
                  <span className="text-3xl font-bold tabular-nums">
                    {dailySummary ? dailySummary.savingsCop.toLocaleString('es-CO') : "0"}
                  </span>
                  <span className="text-sm font-bold">COP</span>
                  <span className="text-xs ml-1 text-slate-500">hoy</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Tarifa ref. $950 COP/kWh • Mes: <strong className="text-slate-700 dark:text-slate-300">$420.000 COP</strong></p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Real-time cards (Row 2) ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <ConsumptionCard valueKwh={consumptionKwh} />
          <SolarCard valueKwh={solarKwh} consumptionKwh={consumptionKwh} />
          <div className="md:col-span-2 xl:col-span-1 h-full">
            <BalanceIndicator consumptionKwh={consumptionKwh} solarKwh={solarKwh} />
          </div>
        </div>

        {/* ── History chart (Row 3) ─── */}
        <div className="glass-card p-6 pb-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Histórico de Energía</h3>
              </div>
              <p className="text-sm text-slate-500">Compara la producción de tus paneles frente al consumo en cada hora del día</p>
            </div>
            {/* Legend & Controls Placeholder */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-amber-500"></span> Solar</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-1 rounded-full bg-blue-500"></span> Consumo</span>
              </div>
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                <Link href="/?range=24h" className={`px-3 py-1 rounded text-xs transition-colors ${range === '24h' ? 'bg-white dark:bg-slate-700 font-bold shadow-sm text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>24 h</Link>
                <Link href="/?range=7d" className={`px-3 py-1 rounded text-xs transition-colors ${range === '7d' ? 'bg-white dark:bg-slate-700 font-bold shadow-sm text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>7 días</Link>
                <Link href="/?range=30d" className={`px-3 py-1 rounded text-xs transition-colors ${range === '30d' ? 'bg-white dark:bg-slate-700 font-bold shadow-sm text-slate-900 dark:text-white' : 'font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}>Mes</Link>
              </div>
            </div>
          </div>
          <HistoryChart data={chartData} range={range as '24h'|'7d'|'30d'} />
        </div>
      </div>
    </>
  );
}
