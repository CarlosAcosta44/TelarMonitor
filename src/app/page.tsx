import { SupabaseEnergyReadingRepository } from "@/infrastructure/supabase/SupabaseEnergyReadingRepository";
import { SupabaseSettingsRepository } from "@/infrastructure/supabase/SupabaseSettingsRepository";
import { GetCurrentConsumption } from "@/application/use-cases/GetCurrentConsumption";
import { GetSolarGeneration } from "@/application/use-cases/GetSolarGeneration";
import { GetHistoricalReadings } from "@/application/use-cases/GetHistoricalReadings";
import { GetRangeReadings } from "@/application/use-cases/GetRangeReadings";
import { GetDailySummary } from "@/application/use-cases/GetDailySummary";

import { ConsumptionCard } from "@/components/ConsumptionCard";
import { SolarCard } from "@/components/SolarCard";
import { BalanceIndicator } from "@/components/BalanceIndicator";
import { HistoryChart, ChartRange, ChartDataPoint } from "@/components/HistoryChart";
import { DailySummaryBar } from "@/components/DailySummaryBar";
import { DashboardRefresher } from "@/components/DashboardRefresher";
import { StaleDataWarning } from "@/components/StaleDataWarning";
import { TriangleAlert } from "lucide-react";

export const revalidate = 10;

/* ── Helpers ────────────────────────────────────────────────────── */

/** Aggregate EnergyReading[] into ChartDataPoint[] grouped by calendar day */
function aggregateByDay(
  consumptionMap: Map<string, number>,
  solarMap: Map<string, number>,
  days: number,
): ChartDataPoint[] {
  const result: ChartDataPoint[] = [];
  const now = new Date();

  for (let d = days - 1; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(now.getDate() - d);
    const key = day.toISOString().slice(0, 10); // YYYY-MM-DD
    const label = day.toLocaleDateString("es", { weekday: "short", day: "numeric" });

    result.push({
      label,
      consumption: parseFloat((consumptionMap.get(key) ?? 0).toFixed(2)),
      solar: parseFloat((solarMap.get(key) ?? 0).toFixed(2)),
    });
  }

  return result;
}

/* ── Config Error ───────────────────────────────────────────────── */
function ConfigurationError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="glass-card p-10 max-w-lg w-full flex flex-col items-center gap-5">
        <div className="p-4 rounded-2xl" style={{ background: "var(--accent-consumption-light)" }}>
          <TriangleAlert size={32} style={{ color: "var(--accent-consumption)" }} />
        </div>
        <div>
          <h2 className="text-xl font-bold mb-2" style={{ color: "var(--foreground)" }}>
            Configuración Pendiente
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: "var(--foreground-muted)" }}>
            Las credenciales de Supabase no están configuradas. Añade las
            siguientes variables a tu archivo{" "}
            <code
              className="px-1.5 py-0.5 rounded-md text-xs font-mono"
              style={{ background: "var(--accent-consumption-light)", color: "var(--accent-consumption)" }}
            >
              .env.local
            </code>
          </p>
        </div>
        <div
          className="w-full rounded-xl p-4 text-left font-mono text-xs space-y-1"
          style={{ background: "var(--background-secondary)", border: "1px solid var(--card-border)", color: "var(--foreground-muted)" }}
        >
          <p><span style={{ color: "var(--accent-solar)" }}>NEXT_PUBLIC_SUPABASE_URL</span>=your_url</p>
          <p><span style={{ color: "var(--accent-solar)" }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>=your_key</p>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard Page ─────────────────────────────────────────────── */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured) return <ConfigurationError />;

  // Resolve async searchParams (Next.js 15+)
  const params = await searchParams;
  const range: ChartRange = params.range === "7d" ? "7d" : "24h";

  const energyRepo   = new SupabaseEnergyReadingRepository();
  const settingsRepo = new SupabaseSettingsRepository();

  const getConsumption = new GetCurrentConsumption(energyRepo);
  const getSolar       = new GetSolarGeneration(energyRepo);
  const getHistory     = new GetHistoricalReadings(energyRepo);
  const getRangeData   = new GetRangeReadings(energyRepo);
  const getDailySummary = new GetDailySummary(energyRepo, settingsRepo);

  // ── Parallel data fetch ─────────────────────────────────────────
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const [
    currentConsumption,
    currentSolar,
    dailySummary,
    installationName,
    // Chart data — fetch both regardless of range so switching is instant
    history24hConsumption,
    history24hSolar,
    range7dConsumption,
    range7dSolar,
  ] = await Promise.all([
    getConsumption.execute().catch(() => null),
    getSolar.execute().catch(() => null),
    getDailySummary.execute().catch(() => null),
    settingsRepo.getSetting("installation_name").catch(() => null),
    getHistory.execute("consumption", 96).catch(() => []),        // last 96 readings (~24h with 15-min cadence)
    getHistory.execute("solar_generation", 96).catch(() => []),
    getRangeData.execute("consumption", sevenDaysAgo, new Date()).catch(() => []),
    getRangeData.execute("solar_generation", sevenDaysAgo, new Date()).catch(() => []),
  ]);

  const consumptionKwh = currentConsumption?.value_kwh ?? 0;
  const solarKwh       = currentSolar?.value_kwh ?? 0;
  const lastReadingAt  = currentConsumption?.recorded_at ?? null;

  const lastUpdated = lastReadingAt
    ? new Date(lastReadingAt).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit", second: "2-digit" })
    : null;

  const today = new Date().toLocaleDateString("es", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  // ── Build chart data for current range ─────────────────────────
  let chartData: ChartDataPoint[];

  if (range === "7d") {
    // Aggregate 7-day readings by calendar day
    const consumptionByDay = new Map<string, number>();
    const solarByDay       = new Map<string, number>();

    for (const r of range7dConsumption) {
      const key = r.recorded_at.slice(0, 10);
      consumptionByDay.set(key, (consumptionByDay.get(key) ?? 0) + r.value_kwh);
    }
    for (const r of range7dSolar) {
      const key = r.recorded_at.slice(0, 10);
      solarByDay.set(key, (solarByDay.get(key) ?? 0) + r.value_kwh);
    }

    chartData = aggregateByDay(consumptionByDay, solarByDay, 7);
  } else {
    // 24h: pair readings by index (same as original approach)
    chartData = history24hConsumption.map((c, i) => {
      const s = history24hSolar[i];
      const date = new Date(c.recorded_at);
      return {
        label: date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" }),
        consumption: c.value_kwh,
        solar: s ? s.value_kwh : 0,
      };
    });
  }

  return (
    <>
      <DashboardRefresher intervalMs={10_000} />

      <div className="flex flex-col gap-8">

        {/* ── Dashboard heading ─── */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
              Panel de Control
            </h2>
            {installationName && (
              <p className="text-sm font-medium mt-0.5" style={{ color: "var(--accent-solar)" }}>
                {installationName}
              </p>
            )}
            <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--foreground-muted)" }}>
              {today}
            </p>
          </div>

          {lastUpdated && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{ background: "var(--card-bg)", border: "1px solid var(--card-border)", color: "var(--foreground-muted)" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "var(--status-live)" }} />
              Última lectura:{" "}
              <strong style={{ color: "var(--foreground)" }}>{lastUpdated}</strong>
            </div>
          )}
        </div>

        {/* ── Stale data warning ─── */}
        <StaleDataWarning lastReadingAt={lastReadingAt} staleAfterMinutes={5} />

        {/* ── Daily summary bar ─── */}
        {dailySummary && <DailySummaryBar summary={dailySummary} />}

        {/* ── Real-time cards ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <ConsumptionCard valueKwh={consumptionKwh} />
          <SolarCard valueKwh={solarKwh} consumptionKwh={consumptionKwh} />
          <div className="md:col-span-2 xl:col-span-1">
            <BalanceIndicator consumptionKwh={consumptionKwh} solarKwh={solarKwh} />
          </div>
        </div>

        {/* ── History chart ─── */}
        <HistoryChart data={chartData} range={range} />
      </div>
    </>
  );
}
