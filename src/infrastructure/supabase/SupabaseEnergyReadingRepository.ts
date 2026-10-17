import { EnergyReadingRepository } from '../../domain/repositories/EnergyReadingRepository';
import { EnergyReading, ReadingType } from '../../domain/entities/EnergyReading';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAnonClient } from './client';

export class SupabaseEnergyReadingRepository implements EnergyReadingRepository {
  constructor(
    private supabase: SupabaseClient = createAnonClient(),
    private householdId?: string
  ) {}

  async getCurrentReading(type: ReadingType): Promise<EnergyReading | null> {
    let query = this.supabase
      .from('energy_readings')
      .select('*')
      .eq('reading_type', type);

    if (this.householdId) {
      query = query.eq('household_id', this.householdId);
    }

    const { data, error } = await query
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      console.error(`Error fetching current ${type} reading:`, error);
      return null;
    }

    return data as EnergyReading;
  }

  async getHistoricalReadings(type: ReadingType, limit: number = 50): Promise<EnergyReading[]> {
    const allData: EnergyReading[] = [];
    const chunkSize = 1000;
    
    // We will collect unique timestamps because the seed might have inserted duplicates
    const seenTimestamps = new Set<string>();
    
    // Fetch in chunks to bypass PostgREST max-rows limit (defaults to 1000)
    // We keep fetching until we have `limit` UNIQUE rows
    for (let offset = 0; allData.length < limit; offset += chunkSize) {
      let query = this.supabase
        .from('energy_readings')
        .select('*')
        .eq('reading_type', type);

      if (this.householdId) {
        query = query.eq('household_id', this.householdId);
      }

      const { data, error } = await query
        .order('recorded_at', { ascending: false })
        .range(offset, offset + chunkSize - 1);

      if (error) {
        console.error(`Error fetching historical ${type} readings:`, error);
        break;
      }

      if (data && data.length > 0) {
        for (const row of data as EnergyReading[]) {
          if (!seenTimestamps.has(row.recorded_at)) {
            seenTimestamps.add(row.recorded_at);
            allData.push(row);
            if (allData.length >= limit) break;
          }
        }
      }

      if (!data || data.length < chunkSize) {
        break; // No more data in DB
      }
    }

    // Reverse to ascending for charts
    return allData.reverse();
  }

  async getReadingsByDateRange(
    type: ReadingType,
    from: Date,
    to: Date,
  ): Promise<EnergyReading[]> {
    let query = this.supabase
      .from('energy_readings')
      .select('*')
      .eq('reading_type', type)
      .gte('recorded_at', from.toISOString())
      .lte('recorded_at', to.toISOString());

    if (this.householdId) {
      query = query.eq('household_id', this.householdId);
    }

    const { data, error } = await query.order('recorded_at', { ascending: true });

    if (error) {
      console.error(`Error fetching ${type} readings by date range:`, error);
      return [];
    }

    return data as EnergyReading[];
  }

  async getDailyTotal(type: ReadingType, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    let query = this.supabase
      .from('energy_readings')
      .select('value_kwh')
      .eq('reading_type', type)
      .gte('recorded_at', startOfDay.toISOString())
      .lte('recorded_at', endOfDay.toISOString());

    if (this.householdId) {
      query = query.eq('household_id', this.householdId);
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error(`Error fetching daily total for ${type}:`, error);
      return 0;
    }

    return data.reduce((sum: number, r: { value_kwh: number }) => sum + r.value_kwh, 0);
  }

  async insertReading(
    reading: Omit<EnergyReading, 'id' | 'recorded_at'>,
  ): Promise<EnergyReading> {
    const readingToInsert = {
      ...reading,
      ...(this.householdId && !reading.household_id ? { household_id: this.householdId } : {})
    };

    const { data, error } = await this.supabase
      .from('energy_readings')
      .insert([readingToInsert])
      .select()
      .single();

    if (error) {
      console.error('Error inserting reading:', error);
      throw error;
    }

    return data as EnergyReading;
  }

  async getDailySummaries(year: number): Promise<{ summary_date: string, total_consumption: number, total_generation: number, net_balance: number }[]> {
    let query = this.supabase
      .from('daily_energy_summary')
      .select('*')
      .gte('summary_date', `${year}-01-01T00:00:00Z`)
      .lte('summary_date', `${year}-12-31T23:59:59Z`);

    if (this.householdId) {
      query = query.eq('household_id', this.householdId);
    }

    const { data, error } = await query.order('summary_date', { ascending: true });

    if (error) {
      console.error(`Error fetching daily summaries:`, error);
      return [];
    }

    // Normalized calculation per 15-minute intervals
    return data.map(d => ({
      summary_date: d.summary_date,
      total_consumption: d.total_consumption / 16,
      total_generation: d.total_generation / 16,
      net_balance: d.net_balance / 16,
    }));
  }
}
