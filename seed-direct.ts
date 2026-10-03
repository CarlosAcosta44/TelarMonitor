import { SupabaseEnergyReadingRepository } from './src/infrastructure/supabase/SupabaseEnergyReadingRepository';
import { SimulationService } from './src/infrastructure/simulation/SimulationService';

async function main() {
  console.log("Starting direct seed...");
  try {
    const repo = new SupabaseEnergyReadingRepository();
    const sim = new SimulationService(repo);
    await sim.seedHistoricalData(30); // 30 days is enough for the Month view
    console.log("Seed complete.");
  } catch (err) {
    console.error(err);
  }
}

main();
