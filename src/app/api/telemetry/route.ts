import { SaveTelemetry } from '@/application/use-cases/SaveTelemetry';
import { SupabaseEnergyReadingRepository } from '@/infrastructure/supabase/SupabaseEnergyReadingRepository';
import { createAnonClient } from '@/infrastructure/supabase/client';
import { NextResponse } from 'next/server';

// Endpoint para recibir telemetría de hardware real (ESP32/IoT)
export async function POST(req: Request) {
  try {
    // 1. Validar seguridad (Simulado: en prod usarías Bearer tokens o firmas HMAC)
    const authHeader = req.headers.get('Authorization');
    if (authHeader !== 'Bearer TELAR_HARDWARE_TOKEN_2026') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Parsear y validar el payload
    const body = await req.json();
    
    // 3. Ejecutar Caso de Uso (Arquitectura Limpia)
    const repo = new SupabaseEnergyReadingRepository(createAnonClient());
    const saveTelemetry = new SaveTelemetry(repo);

    try {
      await saveTelemetry.execute(body.reading_type, body.value_kwh);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('inválido')) {
        return NextResponse.json({ error: message }, { status: 400 });
      }
      throw err;
    }

    // 4. Confirmar recepción al hardware (ESP32)
    return NextResponse.json({ message: 'Lectura sincronizada exitosamente' }, { status: 201 });
  } catch (error) {
    console.error('Error procesando telemetría IoT:', error);
    return NextResponse.json({ error: 'Error interno o petición malformada' }, { status: 500 });
  }
}
