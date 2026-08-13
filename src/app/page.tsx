import { SupabaseEnergyReadingRepository } from "@/infrastructure/supabase/SupabaseEnergyReadingRepository";
import { GetCurrentConsumption } from "@/application/use-cases/GetCurrentConsumption";
import { GetSolarGeneration } from "@/application/use-cases/GetSolarGeneration";
import { GetHistoricalReadings } from "@/application/use-cases/GetHistoricalReadings";

import { ConsumptionCard } from "@/components/ConsumptionCard";
import { SolarCard } from "@/components/SolarCard";
import { BalanceIndicator } from "@/components/BalanceIndicator";
import { HistoryChart } from "@/components/HistoryChart";

// Refresh this page every 10 seconds to simulate real-time when JS is disabled
// In a full SPA we would use SWR or React Query, but Server Components + refresh works for MVP
export const revalidate = 10;

export default async function DashboardPage() {
  const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!isSupabaseConfigured) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <h2 className="text-2xl font-bold mb-4">Configuración Pendiente</h2>
        <p className="text-foreground/70 max-w-md">
          Las credenciales de Supabase no están configuradas. Por favor, añade <code className="bg-foreground/10 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> y <code className="bg-foreground/10 px-1 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> a tu archivo <code className="bg-foreground/10 px-1 py-0.5 rounded">.env.local</code>.
        </p>
      </div>
    );
  }

  const repository = new SupabaseEnergyReadingRepository();
  const getConsumption = new GetCurrentConsumption(repository);
  const getSolar = new GetSolarGeneration(repository);
  const getHistory = new GetHistoricalReadings(repository);

  // Fetch all data in parallel
  const [currentConsumption, currentSolar, historyConsumption, historySolar] = await Promise.all([
    getConsumption.execute(),
    getSolar.execute(),
    getHistory.execute('consumption', 24),
    getHistory.execute('solar_generation', 24)
  ]);

  const consumptionKwh = currentConsumption?.value_kwh || 0;
  const solarKwh = currentSolar?.value_kwh || 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <ConsumptionCard valueKwh={consumptionKwh} />
        <SolarCard valueKwh={solarKwh} />
        <div className="lg:col-span-1 md:col-span-2">
          <BalanceIndicator consumptionKwh={consumptionKwh} solarKwh={solarKwh} />
        </div>
      </div>
      
      <div className="mt-4">
        <HistoryChart 
          consumptionData={historyConsumption} 
          solarData={historySolar} 
        />
      </div>
    </div>
  );
}
