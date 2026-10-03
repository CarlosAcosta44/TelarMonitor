import { SupabaseEnergyReadingRepository } from "@/infrastructure/supabase/SupabaseEnergyReadingRepository";
import { GetHistoricalReadings } from "@/application/use-cases/GetHistoricalReadings";
import { DashboardRefresher } from "@/components/DashboardRefresher";
import { AlertasClient } from "@/components/AlertasClient";

export const revalidate = 60;

export default async function AlertasPage() {
  const energyRepo = new SupabaseEnergyReadingRepository();
  const getHistory = new GetHistoricalReadings(energyRepo);

  // Fetch 30 days of data to find the highest solar peak and a night anomaly
  const [history30dConsumption, history30dSolar] = await Promise.all([
    getHistory.execute("consumption", 2880).catch(() => []),
    getHistory.execute("solar_generation", 2880).catch(() => []),
  ]);

  // 1. Find Max Solar Generation Peak
  let maxSolar = { value_kwh: 0, recorded_at: new Date().toISOString() };
  history30dSolar.forEach(s => {
    if (s.value_kwh > maxSolar.value_kwh) {
      maxSolar = s;
    }
  });
  const maxSolarKw = maxSolar.value_kwh.toFixed(1);
  const maxSolarDate = new Date(maxSolar.recorded_at);

  // 2. Find Night Anomaly (00:00 - 06:00) in the last 7 days
  const recentC = history30dConsumption.slice(-672);
  let maxNightCons = { value_kwh: 0, recorded_at: new Date().toISOString() };
  recentC.forEach(c => {
    const d = new Date(c.recorded_at);
    const hour = d.getHours();
    if (hour >= 0 && hour <= 6) {
      if (c.value_kwh > maxNightCons.value_kwh) {
        maxNightCons = c;
      }
    }
  });

  const peakKw = maxNightCons.value_kwh.toFixed(1);
  const anomalyDate = new Date(maxNightCons.recorded_at);
  const nightDateStr = anomalyDate.toDateString();
  
  // Extract data for that specific night (00:00 to 06:00)
  const anomalyNightData = recentC.filter(c => {
    const d = new Date(c.recorded_at);
    return d.toDateString() === nightDateStr && d.getHours() >= 0 && d.getHours() <= 6;
  }).map(c => ({
    time: new Date(c.recorded_at).toLocaleTimeString("es", { hour: '2-digit', minute: '2-digit' }),
    value: c.value_kwh
  }));

  const baselineKw = 0.4; // Typical night baseline
  const deviation = (maxNightCons.value_kwh - baselineKw).toFixed(1);

  return (
    <>
      <DashboardRefresher intervalMs={60_000} />
      <AlertasClient 
        maxSolarKw={maxSolarKw}
        maxSolarDate={maxSolarDate.toISOString()}
        peakKw={peakKw}
        anomalyDate={anomalyDate.toISOString()}
        anomalyNightData={anomalyNightData}
        baselineKw={baselineKw}
        deviation={deviation}
      />
    </>
  );
}
