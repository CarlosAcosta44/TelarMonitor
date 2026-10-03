import { NextResponse } from 'next/server';
import { supabase } from '@/infrastructure/supabase/client';

// Endpoint para recibir telemetría de hardware real (ESP32/IoT)
export async function POST(req: Request) {
  try {
    // 1. Validar seguridad (Simulado: en prod usarías Bearer tokens o firmas HMAC)
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== 'Bearer TELAR_HARDWARE_TOKEN_2026') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Parsear y validar el payload
    // Formato esperado: { "reading_type": "consumption" | "solar_generation", "value_kwh": 1.25 }
    const body = await req.json();
    
    if (!body.reading_type || typeof body.value_kwh !== 'number') {
      return NextResponse.json({ error: 'Estructura de payload inválida' }, { status: 400 });
    }

    if (!['consumption', 'solar_generation'].includes(body.reading_type)) {
      return NextResponse.json({ error: 'Tipo de lectura no soportado' }, { status: 400 });
    }

    // 3. Insertar el dato en crudo en la base de datos de Supabase
    const { error } = await supabase
      .from('energy_readings')
      .insert([
        {
          reading_type: body.reading_type,
          value_kwh: body.value_kwh,
          recorded_at: new Date().toISOString()
        }
      ]);

    if (error) {
      console.error('Error insertando telemetría IoT:', error);
      return NextResponse.json({ error: 'Error persistiendo en base de datos' }, { status: 500 });
    }

    // 4. Confirmar recepción al hardware (ESP32)
    return NextResponse.json({ message: 'Lectura sincronizada exitosamente' }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Petición HTTP malformada' }, { status: 400 });
  }
}
