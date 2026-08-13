import { NextResponse } from 'next/server';
import { SimulationService } from '../../../../infrastructure/simulation/SimulationService';
import { SupabaseEnergyReadingRepository } from '../../../../infrastructure/supabase/SupabaseEnergyReadingRepository';

export async function POST() {
  try {
    const repository = new SupabaseEnergyReadingRepository();
    const simulationService = new SimulationService(repository);
    
    // Generate a single reading tick (both consumption and solar)
    await simulationService.generateTick();

    return NextResponse.json({ message: 'Simulated reading inserted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Error inserting reading:', error);
    return NextResponse.json({ error: 'Failed to insert reading' }, { status: 500 });
  }
}
