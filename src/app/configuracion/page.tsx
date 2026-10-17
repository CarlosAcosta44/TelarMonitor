import { ConfiguracionClient } from "@/components/ConfiguracionClient";
import { createClient } from "@/infrastructure/supabase/server";
import { updateSettings, updatePassword, inviteHouseholdMember, joinHousehold } from "./actions";
import { redirect } from "next/navigation";

export const revalidate = 0; // Don't cache settings page

export default async function ConfiguracionPage() {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch household data through household_members
  const { data: memberRows } = await supabase
    .from('household_members')
    .select('household_id, role, households (*)')
    .eq('user_id', user.id)
    .limit(1);

  if (!memberRows || memberRows.length === 0 || !memberRows[0]?.households) {
    redirect('/?notice=sin_hogar');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const household: any = memberRows[0].households;

  // 3. Fetch household members
  const { data: members } = await supabase
    .from('household_members')
    .select('*')
    .eq('household_id', household.id);

  // 4. Fetch last telemetry pulse from energy_readings for this household
  const { data: lastReading } = await supabase
    .from('energy_readings')
    .select('recorded_at')
    .eq('household_id', household.id)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .single();

  const safeHousehold = {
    id: household?.id || 'TLR-ENV-2026-01',
    installation_name: household?.installation_name || household?.name || 'Hogar Las Palmas',
    location: household?.location || 'Envigado, Antioquia • Colombia',
    capacity_kwp: household?.capacity_kwp !== undefined && household?.capacity_kwp !== null 
      ? String(household.capacity_kwp) 
      : '4.2',
    orientation: household?.orientation || 'Sur-Oeste (Inclinación 15°)',
    start_date: household?.start_date || '2025-03-01',
    utility_company: household?.utility_company || 'EPM (Empresas Públicas de Medellín)',
    tariff_tier: household?.tariff_tier || 'Residencial (Estrato 5)',
    import_rate: household?.energy_rate_cop_per_kwh !== undefined && household?.energy_rate_cop_per_kwh !== null 
      ? String(household.energy_rate_cop_per_kwh) 
      : (household?.import_rate !== undefined && household?.import_rate !== null ? String(household.import_rate) : '950'),
    export_rate: household?.export_rate !== undefined && household?.export_rate !== null 
      ? String(household.export_rate) 
      : '650',
    currency: household?.currency || 'COP',
    invite_code: household?.invite_code || 'ACOSTA26',
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
      joinHouseholdAction={joinHousehold}
    />
  );
}
