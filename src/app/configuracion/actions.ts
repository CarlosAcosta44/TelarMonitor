'use server';

import { createClient } from "@/infrastructure/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
  const supabase = await createClient();
  const householdId = formData.get('household_id')?.toString();

  const updates: Record<string, string | number> = {};
  
  const textFields = [
    'installation_name',
    'location',
    'orientation',
    'start_date',
    'utility_company',
    'tariff_tier',
    'currency',
  ];

  textFields.forEach((field) => {
    const value = formData.get(field);
    if (value !== null && value !== undefined && value !== '') {
      updates[field] = value.toString();
    }
  });

  const capacityVal = formData.get('capacity_kwp');
  if (capacityVal !== null && capacityVal !== undefined && capacityVal !== '') {
    const parsed = parseFloat(capacityVal.toString().replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) updates['capacity_kwp'] = parsed;
  }

  const exportVal = formData.get('export_rate');
  if (exportVal !== null && exportVal !== undefined && exportVal !== '') {
    const parsed = parseFloat(exportVal.toString().replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) updates['export_rate'] = parsed;
  }

  const importVal = formData.get('import_rate') || formData.get('energy_rate_cop_per_kwh');
  if (importVal !== null && importVal !== undefined && importVal !== '') {
    const parsed = parseFloat(importVal.toString().replace(/[^0-9.]/g, ''));
    if (!isNaN(parsed)) updates['energy_rate_cop_per_kwh'] = parsed;
  }

  if (Object.keys(updates).length > 0) {
    if (updates['installation_name']) {
      updates['name'] = updates['installation_name'];
    }

    if (householdId) {
      await supabase
        .from('households')
        .update(updates)
        .eq('id', householdId);
    } else {
      const { data: households } = await supabase
        .from('households')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1);

      const targetId = households && households.length > 0 ? households[0].id : null;
      if (targetId) {
        await supabase
          .from('households')
          .update(updates)
          .eq('id', targetId);
      }
    }

    // Also update settings table as fallback if present
    try {
      if (updates['installation_name']) {
        await supabase
          .from('settings')
          .update({ value: updates['installation_name'].toString() })
          .eq('key', 'installation_name');
      }
    } catch {
      // Ignored if settings table was migrated
    }
  }

  revalidatePath('/configuracion');
  revalidatePath('/');
  revalidatePath('/ahorro');
  revalidatePath('/historico');
  return { success: true };
}

export async function joinHousehold(formData: FormData) {
  const supabase = await createClient();
  const inviteCode = formData.get('invite_code')?.toString().trim().toUpperCase();

  if (!inviteCode) {
    return { success: false, error: 'Ingresa un código de invitación válido' };
  }

  const { error } = await supabase.rpc('join_household_by_code', {
    p_invite_code: inviteCode
  });

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath('/configuracion');
  revalidatePath('/');
  revalidatePath('/ahorro');
  revalidatePath('/historico');
  return { success: true, message: '¡Te has unido exitosamente al hogar!' };
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const newPassword = formData.get('new_password')?.toString();

  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}

export async function inviteHouseholdMember(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get('email')?.toString().trim();
  const role = formData.get('role')?.toString() || 'viewer';

  if (!email) {
    return { success: false, error: 'El correo electrónico es requerido' };
  }

  // Get current user and active household
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: memberRows } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('user_id', user.id)
      .limit(1);

    const householdId = memberRows?.[0]?.household_id;
    if (householdId) {
      const { error } = await supabase
        .from('household_invitations')
        .insert({
          household_id: householdId,
          email: email.toLowerCase(),
          role: role,
          invited_by: user.id
        });

      if (error && !error.message.includes('duplicate')) {
        console.error('Error guardando invitación:', error);
      }
    }
  }

  revalidatePath('/configuracion');
  return { 
    success: true, 
    message: `Invitación registrada para ${email} (${role}). En esta fase de prototipo, comparte el código del hogar para vincularlo al instante.` 
  };
}

export async function createHouseholdAction(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get('name')?.toString().trim();
  const location = formData.get('location')?.toString().trim() || 'Colombia';
  const capacityKwp = parseFloat(formData.get('capacity_kwp')?.toString() || '4.2');

  if (!name) {
    return { success: false, error: 'El nombre del hogar es obligatorio' };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'Debes iniciar sesión para crear un hogar' };
  }

  // 1. Insert new household
  const { data: household, error: hError } = await supabase
    .from('households')
    .insert({
      name: name,
      installation_name: name,
      location: location,
      capacity_kwp: isNaN(capacityKwp) ? 4.2 : capacityKwp
    })
    .select('id')
    .single();

  if (hError || !household) {
    return { success: false, error: hError?.message || 'Error al crear el hogar' };
  }

  // 2. Link user as owner in household_members
  const { error: mError } = await supabase
    .from('household_members')
    .insert({
      household_id: household.id,
      user_id: user.id,
      role: 'owner'
    });

  if (mError) {
    return { success: false, error: mError.message };
  }

  revalidatePath('/');
  revalidatePath('/configuracion');
  revalidatePath('/historico');
  revalidatePath('/ahorro');
  return { success: true, message: '¡Hogar creado exitosamente!', household_id: household.id };
}
