import { NextResponse } from 'next/server';
import { SimulationService } from '../../../../infrastructure/simulation/SimulationService';
import { SupabaseEnergyReadingRepository } from '../../../../infrastructure/supabase/SupabaseEnergyReadingRepository';

export async function POST() {
  try {
    const repository = new SupabaseEnergyReadingRepository();
    const simulationService = new SimulationService(repository);
    
    // Seed 7 days of historical data
    await simulationService.seedHistoricalData(7);

    return NextResponse.json({ message: 'Historical data seeded successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data' }, { status: 500 });
  }
}
