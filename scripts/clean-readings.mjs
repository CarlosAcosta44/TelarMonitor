import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lonuptruktezinruxwya.supabase.co';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvbnVwdHJ1a3RlemlucnV4d3lhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5NDgwOTgsImV4cCI6MjEwMzUyNDA5OH0.h6TkphFVTXFaDH8Q4rL7MfUx3wHFy2q8koaXfbQ6PPs';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanReadings() {
  const targetHouseholdId = process.argv[2];

  console.log('🧹 Iniciando limpieza de lecturas en energy_readings...');

  let query = supabase.from('energy_readings').delete();

  if (targetHouseholdId) {
    console.log(`🎯 Filtrando por hogar: ${targetHouseholdId}`);
    query = query.eq('household_id', targetHouseholdId);
  } else {
    console.log('⚠️  Limpiando todas las lecturas de la tabla...');
    query = query.neq('id', '00000000-0000-0000-0000-000000000000');
  }

  const { error } = await query;

  if (error) {
    console.error('❌ Error al eliminar lecturas:', error.message);
    console.log('\n💡 Nota: Si RLS bloquea el borrado con la anon key, ejecuta en Supabase SQL Editor:');
    console.log('   TRUNCATE TABLE public.energy_readings;');
    console.log('   CREATE POLICY "rls_readings_delete" ON public.energy_readings FOR DELETE TO anon, authenticated USING (true);\n');
    return;
  }

  const { count } = await supabase.from('energy_readings').select('*', { count: 'exact', head: true });
  console.log(`✅ Operación finalizada. Registros restantes en la tabla: ${count ?? 0}`);
}

cleanReadings().catch(console.error);
