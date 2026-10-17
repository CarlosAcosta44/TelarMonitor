'use server';

import { createClient } from "@/infrastructure/supabase/server";
import { SimulatorApiClient } from "@/infrastructure/simulation/SimulatorApiClient";
import { SimulationService } from "@/infrastructure/simulation/SimulationService";
import { SupabaseEnergyReadingRepository } from "@/infrastructure/supabase/SupabaseEnergyReadingRepository";
import { revalidatePath } from "next/cache";

const simulatorClient = new SimulatorApiClient();

/**
 * Consulta el estado del servicio backend-simulator (healthcheck).
 */
export async function getSimulatorStatusAction() {
  const health = await simulatorClient.checkHealth();
  return {
    online: health.online,
    url: simulatorClient.getBaseUrl(),
    data: health.data,
    error: health.error,
  };
}

/**
 * Obtiene el conteo exacto de lecturas en energy_readings en tiempo real.
 */
export async function getReadingsCountAction(householdId?: string) {
  const supabase = await createClient();
  let query = supabase.from('energy_readings').select('*', { count: 'exact', head: true });

  if (householdId) {
    query = query.eq('household_id', householdId);
  }

  const { count, error } = await query;
  if (error) {
    console.error('Error obteniendo conteo de lecturas:', error);
    return { count: 0, error: error.message };
  }

  return { count: count ?? 0 };
}

/**
 * Dispara el sembrado de datos históricos (7 o 30 días).
 * Intenta primero mediante el microservicio backend-simulator; si está apagado,
 * utiliza el motor local SimulationService como fallback transparente.
 */
export async function seedHistoricalAction(params: {
  days: number;
  cleanBefore: boolean;
  householdId?: string;
}) {
  const { days, cleanBefore, householdId } = params;

  // 1. Verificar si el microservicio backend-simulator está disponible
  const health = await simulatorClient.checkHealth();

  if (health.online) {
    const res = await simulatorClient.seedHistorical({
      days,
      cleanBefore,
      householdId,
    });

    if (res.success) {
      revalidatePath('/');
      revalidatePath('/historico');
      revalidatePath('/ahorro');
      revalidatePath('/configuracion');
      return {
        success: true,
        source: 'backend-simulator' as const,
        message: res.message || `Sembrado de ${days} días exitoso vía Microservicio`,
        totalRecordsInserted: res.totalRecordsInserted,
      };
    }
  }

  // 2. Fallback: Ejecución interna con SimulationService de Next.js
  try {
    const supabase = await createClient();
    const repo = new SupabaseEnergyReadingRepository(supabase);
    const service = new SimulationService(repo);

    await service.seedHistoricalData(days, householdId, cleanBefore);

    revalidatePath('/');
    revalidatePath('/historico');
    revalidatePath('/ahorro');
    revalidatePath('/configuracion');

    return {
      success: true,
      source: 'local-engine' as const,
      message: `Sembrado de ${days} días exitoso (Motor Local de Fallback)`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error desconocido al sembrar datos';
    return { success: false, error: msg };
  }
}

/**
 * Dispara un pulso telemétrico instantáneo (tick de prueba).
 */
export async function triggerPulseAction(params?: { householdId?: string }) {
  try {
    const supabase = await createClient();
    const repo = new SupabaseEnergyReadingRepository(supabase);
    const service = new SimulationService(repo);

    const result = await service.generateTick(params?.householdId);

    revalidatePath('/');
    revalidatePath('/historico');
    revalidatePath('/ahorro');
    revalidatePath('/configuracion');

    return {
      success: true,
      data: result,
      message: `Pulso telemétrico generado: ${result.consumptionKwh} kW consumo ${result.hasSolar ? `| ${result.solarKwh} kW solar` : '(Solo Red)'}`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Error al generar pulso de prueba';
    return { success: false, error: msg };
  }
}

/**
 * Elimina todas las lecturas de telemetría de la tabla energy_readings.
 * Si las políticas RLS bloquean la eliminación vía API, detecta las filas restantes
 * y provee el comando SQL de un solo clic para ejecutar en Supabase SQL Editor.
 */
export async function cleanAllReadingsAction(params?: { householdId?: string }) {
  const householdId = params?.householdId;
  const supabase = await createClient();

  // 1. Intentar limpiar mediante el microservicio si está activo
  try {
    const health = await simulatorClient.checkHealth();
    if (health.online) {
      await simulatorClient.cleanReadings(householdId);
    }
  } catch {
    // Continuar con limpieza directa
  }

  // 2. Intentar limpieza directa con el cliente de Supabase
  let deleteQuery = supabase.from('energy_readings').delete();
  if (householdId) {
    deleteQuery = deleteQuery.eq('household_id', householdId);
  } else {
    deleteQuery = deleteQuery.neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { error: delError } = await deleteQuery;
  if (delError) {
    console.warn('Advertencia en delete query:', delError.message);
  }

  // 3. Validar cuántos registros quedan en la tabla
  let countQuery = supabase.from('energy_readings').select('*', { count: 'exact', head: true });
  if (householdId) {
    countQuery = countQuery.eq('household_id', householdId);
  }

  const { count: remainingCount } = await countQuery;
  const count = remainingCount ?? 0;

  revalidatePath('/');
  revalidatePath('/historico');
  revalidatePath('/ahorro');
  revalidatePath('/configuracion');

  if (count > 0) {
    // RLS impidió el borrado silenciosamente
    return {
      success: false,
      count,
      needsSqlTruncate: true,
      message: `Supabase bloqueó el borrado de ${count.toLocaleString('es-CO')} registros por política RLS. Ejecuta el comando SQL en el panel de Supabase para vaciarla de inmediato.`,
      sqlCommand: `TRUNCATE TABLE public.energy_readings;\nCREATE POLICY "rls_readings_delete" ON public.energy_readings FOR DELETE TO anon, authenticated USING (true);`,
    };
  }

  return {
    success: true,
    count: 0,
    message: 'Todas las lecturas de telemetría han sido eliminadas exitosamente.',
  };
}
