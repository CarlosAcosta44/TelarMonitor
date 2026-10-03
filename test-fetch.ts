import { SupabaseEnergyReadingRepository } from './src/infrastructure/supabase/SupabaseEnergyReadingRepository';

async function main() {
  const repo = new SupabaseEnergyReadingRepository();
  const data = await repo.getHistoricalReadings('consumption', 2880);
  console.log(`Fetched ${data.length} rows.`);
}

main();
