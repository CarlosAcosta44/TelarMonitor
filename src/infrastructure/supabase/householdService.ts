import { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export interface UserHouseholdMembership {
  id: string; // membership id in household_members
  household_id: string;
  role: string;
  household: {
    id: string;
    name: string;
    installation_name?: string;
    location?: string;
    capacity_kwp?: number;
    orientation?: string;
    start_date?: string;
    utility_company?: string;
    tariff_tier?: string;
    energy_rate_cop_per_kwh?: number;
    import_rate?: number;
    export_rate?: number;
    currency?: string;
    invite_code?: string;
  };
}

export async function getUserHouseholds(
  supabase: SupabaseClient,
  userId: string
): Promise<UserHouseholdMembership[]> {
  const { data: memberRows, error } = await supabase
    .from('household_members')
    .select('id, household_id, role, households (*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true });

  if (error || !memberRows) {
    console.error('Error fetching user households:', error);
    return [];
  }

  // Filter out any entries where the household might have been deleted
  return memberRows
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((row: any) => row.households)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((row: any) => ({
      id: row.id,
      household_id: row.household_id,
      role: row.role || 'viewer',
      household: row.households
    }));
}

export async function getActiveHousehold(
  supabase: SupabaseClient,
  userId: string
): Promise<{
  activeHousehold: UserHouseholdMembership['household'] | null;
  role: string | null;
  allMemberships: UserHouseholdMembership[];
}> {
  const allMemberships = await getUserHouseholds(supabase, userId);

  if (allMemberships.length === 0) {
    return { activeHousehold: null, role: null, allMemberships: [] };
  }

  const cookieStore = await cookies();
  const activeId = cookieStore.get('telar_active_household_id')?.value;

  const matched = activeId ? allMemberships.find(m => m.household_id === activeId) : null;
  const current = matched || allMemberships[0];

  return {
    activeHousehold: current.household,
    role: current.role,
    allMemberships
  };
}
