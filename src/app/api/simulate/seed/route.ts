import { NextResponse } from 'next/server';
import { SimulationService } from '../../../../infrastructure/simulation/SimulationService';
import { SupabaseEnergyReadingRepository } from '../../../../infrastructure/supabase/SupabaseEnergyReadingRepository';
import { createAnonClient } from '../../../../infrastructure/supabase/client';

export async function POST(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let days = 30;
    let householdId: string | undefined = undefined;

    const queryDays = searchParams.get('days');
    const queryHouseholdId = searchParams.get('householdId');
    if (queryDays) {
      days = parseInt(queryDays, 10) || 30;
    }
    if (queryHouseholdId) {
      householdId = queryHouseholdId;
    }

    try {
      const body = await req.json();
      if (body?.days) days = parseInt(body.days, 10) || 30;
      if (body?.householdId) householdId = body.householdId;
    } catch {
      // Body is optional
    }

    const repository = new SupabaseEnergyReadingRepository(createAnonClient(), householdId);
    const simulationService = new SimulationService(repository);
    
    // Seed requested days of historical data (default: 30 days)
    await simulationService.seedHistoricalData(days, householdId);

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
