import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lonuptruktezinruxwya.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvbnVwdHJ1a3RlemlucnV4d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NDgwOTgsImV4cCI6MjEwMzUyNDA5OH0.h6TkphFVTXFaDH8Q4rL7MfUx3wHFy2q8koaXfbQ6PPs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const CONSUMPTION_BASE = {
  0: [0.3, 0.5],  1: [0.2, 0.4],  2: [0.2, 0.3],  3: [0.2, 0.3],
  4: [0.2, 0.4],  5: [0.4, 0.8],  6: [1.5, 2.5],  7: [2.5, 4.0],
  8: [2.0, 3.2],  9: [1.2, 2.0], 10: [1.0, 1.8], 11: [1.2, 2.0],
 12: [1.5, 2.5], 13: [1.3, 2.2], 14: [1.0, 1.8], 15: [1.0, 1.8],
 16: [1.2, 2.0], 17: [1.8, 3.0], 18: [3.0, 5.0], 19: [3.5, 5.5],
 20: [3.0, 4.5], 21: [2.5, 3.5], 22: [1.5, 2.5], 23: [0.5, 1.0],
};

function randomBetween(min, max) {
  return parseFloat((min + Math.random() * (max - min)).toFixed(4));
}

function consumptionForHour(hour) {
  const [min, max] = CONSUMPTION_BASE[hour];
  return randomBetween(min, max);
}

function solarForHour(hour, cloudFactor) {
  if (hour < 6 || hour > 19) return 0;
  const distanceToNoon = Math.abs(12.5 - hour);
  const peak = 5.5 * cloudFactor;
  const raw = Math.max(0, peak - distanceToNoon * 0.7) + Math.random() * 0.4 * cloudFactor;
  return parseFloat(raw.toFixed(4));
}

async function runSeed() {
  console.log('🌱 Iniciando sembrado directo de 30 días en Supabase...');

  // 1. Obtener el hogar destino
  const { data: household, error: hError } = await supabase
    .from('households')
    .select('id, name')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (hError || !household) {
    console.error('❌ Error obteniendo hogar:', hError);
    return;
  }

  console.log(`🏠 Hogar seleccionado: "${household.name}" (${household.id})`);

  const days = 30;
  const readings = [];
  const now = new Date();

  for (let d = days; d >= 0; d--) {
    const cloudFactor = d === 0 ? 1.0 : randomBetween(0.2, 1.0);
    const dayDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - d);
    const isWeekend = [0, 6].includes(dayDate.getDay());
    const weekendFactor = isWeekend ? 1.15 : 1.0;
    const maxHour = d === 0 ? now.getHours() : 23;

    for (let h = 0; h <= maxHour; h++) {
      const minuteSlots = d === 0 && h === now.getHours() ? [0] : [0, 15, 30, 45];
      for (const m of minuteSlots) {
        const ts = new Date(now);
        ts.setDate(now.getDate() - d);
        ts.setHours(h, m, 0, 0);

        const consumption = parseFloat((consumptionForHour(h) * weekendFactor).toFixed(4));
        const solar = solarForHour(h, cloudFactor);

        readings.push(
          { reading_type: 'consumption', value_kwh: consumption, recorded_at: ts.toISOString(), household_id: household.id },
          { reading_type: 'solar_generation', value_kwh: solar, recorded_at: ts.toISOString(), household_id: household.id }
        );
      }
    }
  }

  console.log(`📦 Insertando ${readings.length} lecturas en bloques de 1,000...`);
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < readings.length; i += CHUNK_SIZE) {
    const chunk = readings.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('energy_readings').insert(chunk);
    if (error) {
      console.error(`❌ Error insertando bloque ${i}..${i + chunk.length}:`, error);
      return;
    }
    process.stdout.write(`✅ Insertados ${Math.min(i + CHUNK_SIZE, readings.length)} / ${readings.length} registros\r`);
  }

  console.log('\n🎉 ¡Sembrado de 30 días completado con éxito!');
}

runSeed().catch(console.error);
