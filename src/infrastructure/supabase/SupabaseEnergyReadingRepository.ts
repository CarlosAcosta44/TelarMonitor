import { EnergyReadingRepository } from '../../domain/repositories/EnergyReadingRepository';
import { EnergyReading, ReadingType } from '../../domain/entities/EnergyReading';
import { supabase } from './client';

export class SupabaseEnergyReadingRepository implements EnergyReadingRepository {
  async getCurrentReading(type: ReadingType): Promise<EnergyReading | null> {
    const { data, error } = await supabase
      .from('energy_readings')
      .select('*')
      .eq('reading_type', type)
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
    const { data, error } = await supabase
      .from('energy_readings')
      .select('*')
      .eq('reading_type', type)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`Error fetching historical ${type} readings:`, error);
      return [];
    }

    // Reverse to make it ascending for the charts (oldest first)
    return (data as EnergyReading[]).reverse();
  }

  async insertReading(reading: Omit<EnergyReading, 'id' | 'recorded_at'>): Promise<EnergyReading> {
    const { data, error } = await supabase
      .from('energy_readings')
      .insert([reading])
      .select()
      .single();

    if (error) {
      console.error('Error inserting reading:', error);
      throw error;
    }

    return data as EnergyReading;
  }
}
