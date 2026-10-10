'use server';

import { createClient } from "@/infrastructure/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();

  const updates: Record<string, string | number> = {};
  
  const fields = [
    'installation_name',
    'location',
    'capacity_kwp',
    'orientation',
    'start_date',
    'utility_company',
    'tariff_tier',
    'export_rate',
  ];

  fields.forEach((field) => {
    const value = formData.get(field);
    if (value !== null && value !== undefined && value !== '') {
      if (field === 'capacity_kwp' || field === 'export_rate') {
        updates[field] = parseFloat(value.toString());
      } else {
        updates[field] = value.toString();
      }
    }
  });

  if (Object.keys(updates).length > 0) {
    // Update the first household found for this user (enforced by RLS)
    // First, let's get the household id
    const { data: household } = await supabase
      .from('households')
      .select('id')
      .limit(1)
      .single();

    if (household) {
      await supabase
        .from('households')
        .update(updates)
        .eq('id', household.id);
    }
  }

  revalidatePath('/configuracion');
  revalidatePath('/');
  revalidatePath('/ahorro');
}

