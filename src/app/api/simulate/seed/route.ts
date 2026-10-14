import { NextResponse } from 'next/server';
import { SimulationService } from '../../../../infrastructure/simulation/SimulationService';
import { SupabaseEnergyReadingRepository } from '../../../../infrastructure/supabase/SupabaseEnergyReadingRepository';
import { createAnonClient } from '../../../../infrastructure/supabase/client';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let days = 30;

    const queryDays = searchParams.get('days');
    if (queryDays) {
      days = parseInt(queryDays, 10) || 30;
    } else {
      try {
        const body = await req.json();
        if (body?.days) days = parseInt(body.days, 10) || 30;
      } catch {
        // Body is optional
      }
    }

    const repository = new SupabaseEnergyReadingRepository(createAnonClient());
    const simulationService = new SimulationService(repository);
    
    // Seed requested days of historical data (default: 30 days)
    await simulationService.seedHistoricalData(days);

    return NextResponse.json({ 
      message: `Historical data seeded successfully for ${days} days`,
      days 
    }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error('Error seeding data:', error);
    return NextResponse.json({ error: 'Failed to seed data', detail: message }, { status: 500 });
  }
}
