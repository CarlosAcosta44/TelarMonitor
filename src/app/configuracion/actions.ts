'use server';

import { createClient } from "@/infrastructure/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import crypto from "crypto";

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

  // Find target household name
  const { data: targetH } = await supabase
    .from('households')
    .select('id, name')
    .eq('invite_code', inviteCode)
    .single();

  const { error } = await supabase.rpc('join_household_by_code', {
    p_invite_code: inviteCode
  });

  if (error) {
    return { success: false, error: error.message };
  }

  // Activate joined household
  if (targetH?.id) {
    const cookieStore = await cookies();
    cookieStore.set('telar_active_household_id', targetH.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax',
    });
  }

  revalidatePath('/configuracion');
  revalidatePath('/');
  revalidatePath('/ahorro');
  revalidatePath('/historico');
  revalidatePath('/alertas');
  return { success: true, message: `¡Te has unido exitosamente a ${targetH?.name || 'este hogar'}!` };
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

  // Generate unique 8-character uppercase invite code (e.g. 8B741183)
  const inviteCode = crypto.randomBytes(4).toString('hex').toUpperCase();

  // 1. Insert new household
  const { data: household, error: hError } = await supabase
    .from('households')
    .insert({
      name: name,
      installation_name: name,
      location: location,
      capacity_kwp: isNaN(capacityKwp) ? 4.2 : capacityKwp,
      invite_code: inviteCode,
      energy_rate_cop_per_kwh: 950,
      export_rate: 650
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

  revalidatePath('/configuracion');
  revalidatePath('/historico');
  revalidatePath('/ahorro');
  return { success: true, message: '¡Hogar creado exitosamente!', household_id: household.id };
}

export async function switchHouseholdAction(householdId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'No autenticado' };
  }

  // Verify membership
  const { data: member } = await supabase
    .from('household_members')
    .select('id')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return { success: false, error: 'No perteneces a este hogar' };
  }

  const cookieStore = await cookies();
  cookieStore.set('telar_active_household_id', householdId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  });

  revalidatePath('/');
  revalidatePath('/configuracion');
  revalidatePath('/historico');
  revalidatePath('/ahorro');
  revalidatePath('/alertas');

  return { success: true };
}

export async function leaveHouseholdAction(householdId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'No autenticado' };
  }

  // Check role
  const { data: member } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single();

  if (!member) {
    return { success: false, error: 'No perteneces a este hogar' };
  }

  if (member.role === 'owner') {
    return { success: false, error: 'Como propietario no puedes abandonar el hogar. Puedes eliminarlo o transferirlo.' };
  }

  const { error: delError } = await supabase
    .from('household_members')
    .delete()
    .eq('household_id', householdId)
    .eq('user_id', user.id);

  if (delError) {
    return { success: false, error: delError.message };
  }

  // Clear or reset cookie
  const cookieStore = await cookies();
  if (cookieStore.get('telar_active_household_id')?.value === householdId) {
    cookieStore.delete('telar_active_household_id');
  }

  revalidatePath('/');
  revalidatePath('/configuracion');
  revalidatePath('/historico');
  revalidatePath('/ahorro');
  revalidatePath('/alertas');

  return { success: true, message: 'Has salido del hogar exitosamente.' };
}

export async function deleteHouseholdAction(householdId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: 'No autenticado' };
  }

  // Check role
  const { data: member } = await supabase
    .from('household_members')
    .select('role')
    .eq('household_id', householdId)
    .eq('user_id', user.id)
    .single();

  if (!member || member.role !== 'owner') {
    return { success: false, error: 'Solo el propietario (owner) puede eliminar este hogar' };
  }

  // Delete dependencies in order
  await supabase.from('energy_readings').delete().eq('household_id', householdId);
  await supabase.from('system_alerts').delete().eq('household_id', householdId);
  await supabase.from('household_members').delete().eq('household_id', householdId);

  const { error: hDelError } = await supabase
    .from('households')
    .delete()
    .eq('id', householdId);

  if (hDelError) {
    return { success: false, error: hDelError.message };
  }

  // Clear cookie
  const cookieStore = await cookies();
  if (cookieStore.get('telar_active_household_id')?.value === householdId) {
    cookieStore.delete('telar_active_household_id');
  }

  revalidatePath('/');
  revalidatePath('/configuracion');
  revalidatePath('/historico');
  revalidatePath('/ahorro');
  revalidatePath('/alertas');

  return { success: true, message: 'Hogar eliminado exitosamente.' };
}
