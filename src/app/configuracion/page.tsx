import { SupabaseSettingsRepository } from "@/infrastructure/supabase/SupabaseSettingsRepository";
import { updateSettings } from "./actions";
import { ConfiguracionClient } from "@/components/ConfiguracionClient";
import { createClient } from "@/infrastructure/supabase/server";

export const revalidate = 0; // Don't cache settings page

export default async function ConfiguracionPage() {
  const supabase = await createClient();
  const settingsRepo = new SupabaseSettingsRepository(supabase);
  
  // Fetch all settings
  const [
    installationName,
    location,
    capacityKwp,
    orientation,
    startDate,
    utilityCompany,
    tariffTier,
    exportRate,
  ] = await Promise.all([
    settingsRepo.getSetting("installation_name").catch(() => "Hogar Las Palmas"),
    settingsRepo.getSetting("location").catch(() => "Envigado, Antioquia"),
    settingsRepo.getSetting("capacity_kwp").catch(() => "4.2"),
    settingsRepo.getSetting("orientation").catch(() => "Sur-Oeste (Inclinación 15°)"),
    settingsRepo.getSetting("start_date").catch(() => "Marzo 2025"),
    settingsRepo.getSetting("utility_company").catch(() => "EPM"),
    settingsRepo.getSetting("tariff_tier").catch(() => "Residencial (Estrato 5)"),
    settingsRepo.getSetting("export_rate").catch(() => "650"),
  ]);

  return (
    <>
      <ConfiguracionClient 
        initialSettings={{
          installationName,
          location,
          capacityKwp,
          orientation,
          startDate,
          utilityCompany,
          tariffTier,
          exportRate
        }} 
        updateSettingsAction={updateSettings} 
      />
    </>
  );
}
