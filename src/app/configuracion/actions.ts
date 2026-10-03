'use server';

import { supabase } from "@/infrastructure/supabase/client";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const installation_name = formData.get('installation_name');
  const location = formData.get('location');
  const capacity_kwp = formData.get('capacity_kwp');
  const orientation = formData.get('orientation');
  const start_date = formData.get('start_date');
  const utility_company = formData.get('utility_company');
  const tariff_tier = formData.get('tariff_tier');
  const export_rate = formData.get('export_rate');

  // We fetch existing settings to know which ones to update,
  // or we can just iterate over them.
  // Supabase doesn't easily do a bulk update on different rows by key if we map them differently,
  // but since we only have one set of settings, we'll loop.
  const updates = [
    { key: 'installation_name', value: installation_name },
    { key: 'location', value: location },
    { key: 'capacity_kwp', value: capacity_kwp },
    { key: 'orientation', value: orientation },
    { key: 'start_date', value: start_date },
    { key: 'utility_company', value: utility_company },
    { key: 'tariff_tier', value: tariff_tier },
    { key: 'export_rate', value: export_rate },
  ];

  for (const item of updates) {
    if (item.value !== null && item.value !== undefined) {
      // Check if setting exists
      const { data } = await supabase.from('settings').select('id').eq('key', item.key).single();
      
      if (data) {
        await supabase.from('settings').update({ value: item.value.toString() }).eq('key', item.key);
      } else {
        await supabase.from('settings').insert({ key: item.key, value: item.value.toString() });
      }
    }
  }

  revalidatePath('/configuracion');
  revalidatePath('/');
  revalidatePath('/ahorro');
}
