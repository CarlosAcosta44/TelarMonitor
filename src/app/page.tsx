import { SupabaseEnergyReadingRepository } from "@/infrastructure/supabase/SupabaseEnergyReadingRepository";
import { GetCurrentConsumption } from "@/application/use-cases/GetCurrentConsumption";
import { GetSolarGeneration } from "@/application/use-cases/GetSolarGeneration";
import { GetHistoricalReadings } from "@/application/use-cases/GetHistoricalReadings";

import { ConsumptionCard } from "@/components/ConsumptionCard";
import { SolarCard } from "@/components/SolarCard";
import { BalanceIndicator } from "@/components/BalanceIndicator";
import { HistoryChart } from "@/components/HistoryChart";
import { DashboardRefresher } from "@/components/DashboardRefresher";
import { StaleDataWarning } from "@/components/StaleDataWarning";
import { TriangleAlert } from "lucide-react";

// Revalidate cache every 10 s on the server side
export const revalidate = 10;

/* ── Config Error State ─────────────────────────────────────────── */
function ConfigurationError() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="glass-card p-10 max-w-lg w-full flex flex-col items-center gap-5">
        <div
          className="p-4 rounded-2xl"
          style={{ background: "var(--accent-consumption-light)" }}
        >
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
              style={{
                background: "var(--accent-consumption-light)",
                color: "var(--accent-consumption)",
              }}
            >
              .env.local
            </code>
          </p>
        </div>

        <div
          className="w-full rounded-xl p-4 text-left font-mono text-xs space-y-1"
          style={{
            background: "var(--background-secondary)",
            border: "1px solid var(--card-border)",
            color: "var(--foreground-muted)",
          }}
        >
          <p>
            <span style={{ color: "var(--accent-solar)" }}>NEXT_PUBLIC_SUPABASE_URL</span>
            =your_url
          </p>
          <p>
            <span style={{ color: "var(--accent-solar)" }}>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
            =your_key
          </p>
        </div>
      </div>
    </div>
  );
}

/* ── Dashboard Page ─────────────────────────────────────────────── */
export default async function DashboardPage() {
  const isSupabaseConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured) {
    return <ConfigurationError />;
  }

  const repository = new SupabaseEnergyReadingRepository();
  const getConsumption = new GetCurrentConsumption(repository);
  const getSolar = new GetSolarGeneration(repository);
  const getHistory = new GetHistoricalReadings(repository);

  // Fetch all data in parallel; individual failures return null / []
  const [currentConsumption, currentSolar, historyConsumption, historySolar] =
    await Promise.all([
      getConsumption.execute().catch(() => null),
      getSolar.execute().catch(() => null),
      getHistory.execute("consumption", 24).catch(() => []),
      getHistory.execute("solar_generation", 24).catch(() => []),
    ]);

  const consumptionKwh = currentConsumption?.value_kwh ?? 0;
  const solarKwh = currentSolar?.value_kwh ?? 0;
  const lastReadingAt = currentConsumption?.recorded_at ?? null;

  // Format last-updated timestamp
  const lastUpdated = lastReadingAt
    ? new Date(lastReadingAt).toLocaleTimeString("es", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    : null;

  const today = new Date().toLocaleDateString("es", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <>
      {/* Invisible client component — refreshes Server Component data every 10 s */}
      <DashboardRefresher intervalMs={10_000} />

      <div className="flex flex-col gap-8">

        {/* ── Dashboard heading ─── */}
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--foreground)" }}
            >
              Panel de Control
            </h2>
            <p
              className="text-sm mt-1 capitalize"
              style={{ color: "var(--foreground-muted)" }}
            >
              {today}
            </p>
          </div>

          {lastUpdated && (
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs"
              style={{
                background: "var(--card-bg)",
                border: "1px solid var(--card-border)",
                color: "var(--foreground-muted)",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "var(--status-live)" }}
              />
              Última lectura:{" "}
              <strong style={{ color: "var(--foreground)" }}>{lastUpdated}</strong>
            </div>
          )}
        </div>

        {/* ── Stale data warning (only visible if sensor goes silent) ─── */}
        <StaleDataWarning lastReadingAt={lastReadingAt} staleAfterMinutes={5} />

        {/* ── Metric cards row ─── */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          <ConsumptionCard valueKwh={consumptionKwh} />
          <SolarCard valueKwh={solarKwh} consumptionKwh={consumptionKwh} />
          <div className="md:col-span-2 xl:col-span-1">
            <BalanceIndicator consumptionKwh={consumptionKwh} solarKwh={solarKwh} />
          </div>
        </div>

        {/* ── Chart ─── */}
        <HistoryChart
          consumptionData={historyConsumption}
          solarData={historySolar}
        />
      </div>
    </>
  );
}
