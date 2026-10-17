import { SupabaseEnergyReadingRepository } from "@/infrastructure/supabase/SupabaseEnergyReadingRepository";
import { GetHistoricalReadings } from "@/application/use-cases/GetHistoricalReadings";
import { AlertasClient } from "@/components/AlertasClient";
import { createClient } from "@/infrastructure/supabase/server";
import { getHouseholdAlertsAction } from "./actions";

export const revalidate = 30;

export default async function AlertasPage() {
  const supabase = await createClient();
  const energyRepo = new SupabaseEnergyReadingRepository(supabase);
  const getHistory = new GetHistoricalReadings(energyRepo);

  // 1. Fetch active household
  const { data: { user } } = await supabase.auth.getUser();
  let householdId: string | undefined = undefined;
  let householdName = 'Hogar Las Palmas';
  let capacityKwp = 4.2;

  if (user) {
    const { data: memberRows } = await supabase
      .from('household_members')
      .select('household_id, households (*)')
      .eq('user_id', user.id)
      .limit(1);

    if (memberRows && memberRows.length > 0 && memberRows[0].households) {
      const h: any = memberRows[0].households;
      householdId = h.id;
      householdName = h.name || h.installation_name;
      capacityKwp = Number(h.capacity_kwp) || 0;
    }
  }

  if (!householdId) {
    const { data: h } = await supabase
      .from('households')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (h) {
      householdId = h.id;
      householdName = h.name || h.installation_name;
      capacityKwp = Number(h.capacity_kwp) || 0;
    }
  }

  // 2. Fetch real alerts and 30d history in parallel
  const [alertsRes, history30dConsumption, history30dSolar] = await Promise.all([
    getHouseholdAlertsAction(householdId),
    getHistory.execute("consumption", 2880).catch(() => []),
    getHistory.execute("solar_generation", 2880).catch(() => []),
  ]);

  // 3. Find Max Solar Generation Peak
  let maxSolar = { value_kwh: 0, recorded_at: new Date().toISOString() };
  history30dSolar.forEach(s => {
    if (s.value_kwh > maxSolar.value_kwh) {
      maxSolar = s;
    }
  });
  const maxSolarKw = maxSolar.value_kwh.toFixed(1);
  const maxSolarDate = new Date(maxSolar.recorded_at);

  // 4. Find Night Anomaly (00:00 - 06:00) in the last 7 days
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

  const peakKw = maxNightCons.value_kwh > 0 ? maxNightCons.value_kwh.toFixed(1) : '1.8';
  const anomalyDate = maxNightCons.recorded_at || new Date().toISOString();
  const nightDateStr = new Date(anomalyDate).toDateString();
  
  // Extract data for that specific night (00:00 to 06:00)
  const anomalyNightData = recentC.filter(c => {
    const d = new Date(c.recorded_at);
    return d.toDateString() === nightDateStr && d.getHours() >= 0 && d.getHours() <= 6;
  }).map(c => ({
    time: new Date(c.recorded_at).toLocaleTimeString("es", { hour: '2-digit', minute: '2-digit' }),
    value: c.value_kwh
  }));

  const baselineKw = 0.4;
  const deviation = (Math.max(0, Number(peakKw) - baselineKw)).toFixed(1);

  return (
    <AlertasClient 
      initialAlerts={alertsRes.alerts}
      household={{
        id: householdId || 'default',
        name: householdName,
        capacityKwp,
        hasSolar: capacityKwp > 0,
      }}
      maxSolarKw={maxSolarKw}
      maxSolarDate={maxSolarDate.toISOString()}
      peakKw={peakKw}
      anomalyDate={anomalyDate}
      anomalyNightData={anomalyNightData.length > 0 ? anomalyNightData : [
        { time: '01:00', value: 0.4 },
        { time: '02:00', value: 1.8 },
        { time: '03:00', value: 1.6 },
        { time: '04:00', value: 0.5 },
      ]}
      baselineKw={baselineKw}
      deviation={deviation}
    />
  );
}
