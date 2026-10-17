import { NextResponse } from 'next/server';
import { createClient } from '@/infrastructure/supabase/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, error: 'Debes iniciar sesión para crear un hogar' }, { status: 401 });
    }

    let name = '';
    let location = 'Colombia';
    let capacityKwp = 4.2;

    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await req.json();
      name = body.name?.trim() || '';
      location = body.location?.trim() || 'Colombia';
      capacityKwp = parseFloat(body.capacity_kwp || '4.2');
    } else {
      const formData = await req.formData();
      name = formData.get('name')?.toString().trim() || '';
      location = formData.get('location')?.toString().trim() || 'Colombia';
      capacityKwp = parseFloat(formData.get('capacity_kwp')?.toString() || '4.2');
    }

    if (!name) {
      return NextResponse.json({ success: false, error: 'El nombre del hogar es obligatorio' }, { status: 400 });
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
      console.error('Error inserting household:', hError);
      return NextResponse.json({ success: false, error: hError?.message || 'Error al crear el hogar' }, { status: 500 });
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
      console.error('Error linking owner in household_members:', mError);
      return NextResponse.json({ success: false, error: mError.message }, { status: 500 });
    }

    const response = NextResponse.json({
      success: true,
      message: '¡Hogar creado exitosamente!',
      household_id: household.id
    });

    response.cookies.set('telar_active_household_id', household.id, {
      path: '/',
      maxAge: 60 * 60 * 24 * 365,
      sameSite: 'lax'
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error interno al procesar la solicitud';
    console.error('API household/create error:', err);
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
