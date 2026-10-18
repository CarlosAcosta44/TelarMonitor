import { ConfiguracionClient } from "@/components/ConfiguracionClient";
import { createClient } from "@/infrastructure/supabase/server";
import { getActiveHousehold } from "@/infrastructure/supabase/householdService";
import { 
  updateSettings, 
  updatePassword, 
  inviteHouseholdMember, 
  joinHousehold, 
  switchHouseholdAction, 
  leaveHouseholdAction, 
  deleteHouseholdAction,
  removeHouseholdMemberAction
} from "./actions";
import { redirect } from "next/navigation";

export const revalidate = 0; // Don't cache settings page

export default async function ConfiguracionPage() {
  const supabase = await createClient();

  // 1. Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect('/login');
  }

  // 2. Fetch active household and all memberships through getActiveHousehold
  const { activeHousehold, role, allMemberships } = await getActiveHousehold(supabase, user.id);

  if (!activeHousehold) {
    redirect('/?notice=sin_hogar');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const household: any = activeHousehold;

  // 3. Fetch household members for current household (with profile info if available)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let rawMembers: any[] = [];
  const { data: rpcMembers, error: rpcErr } = await supabase.rpc('get_household_members_with_profiles', {
    p_household_id: household.id
  });

  if (!rpcErr && Array.isArray(rpcMembers)) {
    rawMembers = rpcMembers;
  } else {
    const { data: directMembers } = await supabase
      .from('household_members')
      .select('*')
      .eq('household_id', household.id);
    rawMembers = directMembers || [];
  }

  // Format members ensuring the active user has their full profile and fallback formatting for others
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const safeMembers = rawMembers.map((m: any) => {
    const isCurrent = m.user_id === user.id;
    return {
      id: m.id,
      user_id: m.user_id,
      role: m.role || 'viewer',
      created_at: m.created_at || new Date().toISOString(),
      name: isCurrent
        ? (user.user_metadata?.full_name || (user.email ? user.email.split('@')[0] : 'Tú'))
        : (m.user_name || m.name || null),
      email: isCurrent
        ? user.email
        : (m.user_email || m.email || null)
    };
  });

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

  const safeMemberships = allMemberships.map(m => ({
    id: m.id,
    household_id: m.household_id,
    role: m.role,
    household: {
      id: m.household.id,
      name: m.household.name,
      installation_name: m.household.installation_name || m.household.name,
      location: m.household.location || 'Colombia',
      capacity_kwp: String(m.household.capacity_kwp ?? '0'),
      invite_code: m.household.invite_code,
    }
  }));

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
      members={safeMembers}
      userRole={role || 'viewer'}
      allMemberships={safeMemberships}
      lastTelemetryTimestamp={lastReading?.recorded_at || null}
      updateSettingsAction={updateSettings}
      updatePasswordAction={updatePassword}
      inviteMemberAction={inviteHouseholdMember}
      joinHouseholdAction={joinHousehold}
      switchHouseholdAction={switchHouseholdAction}
      leaveHouseholdAction={leaveHouseholdAction}
      deleteHouseholdAction={deleteHouseholdAction}
      removeMemberAction={removeHouseholdMemberAction}
    />
  );
}
