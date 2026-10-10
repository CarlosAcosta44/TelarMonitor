import { ConfiguracionClient } from "@/components/ConfiguracionClient";
import { createClient } from "@/infrastructure/supabase/server";
import { updateSettings, updatePassword, inviteHouseholdMember } from "./actions";

export const revalidate = 0; // Don't cache settings page

export default async function ConfiguracionPage() {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();

  // 2. Fetch household data from households table
  const { data: household } = await supabase
    .from('households')
    .select('*')
    .limit(1)
    .single();

  // 3. Fetch household members
  const { data: members } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', household?.id || '');

  // 4. Fetch last telemetry pulse from energy_readings
  const { data: lastReading } = await supabase
    .from('energy_readings')
    .select('recorded_at')
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  const safeHousehold = {
    id: household?.id || 'TLR-ENV-2026-01',
    installation_name: household?.name || household?.installation_name || 'Hogar Las Palmas',
    location: household?.location || 'Envigado, Antioquia • Colombia',
    capacity_kwp: household?.capacity_kwp?.toString() || '4.2',
    orientation: household?.orientation || 'Sur-Oeste (Inclinación 15°)',
    start_date: household?.start_date || 'Marzo 2025',
    utility_company: household?.utility_company || 'EPM (Empresas Públicas de Medellín)',
    tariff_tier: household?.tariff_tier || 'Residencial (Estrato 5)',
    import_rate: household?.energy_rate_cop_per_kwh?.toString() || '950',
    export_rate: household?.export_rate?.toString() || '650',
    currency: household?.currency || 'COP',
  };

  const safeUser = {
    id: user?.id || 'usr-local-owner',
    email: user?.email || 'admin@telar.co',
    name: user?.user_metadata?.full_name || (user?.email ? user.email.split('@')[0] : 'Familia Propietaria'),
    createdAt: user?.created_at || new Date().toISOString(),
  };

  return (
    <ConfiguracionClient
      household={safeHousehold}
      user={safeUser}
      members={members || []}
      lastTelemetryTimestamp={lastReading?.recorded_at || null}
      updateSettingsAction={updateSettings}
      updatePasswordAction={updatePassword}
      inviteMemberAction={inviteHouseholdMember}
    />
  );
}
