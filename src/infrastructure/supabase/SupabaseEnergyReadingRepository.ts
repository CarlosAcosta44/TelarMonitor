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

    // Reverse to ascending for charts
    return (data as EnergyReading[]).reverse();
  }

  async getReadingsByDateRange(
    type: ReadingType,
    from: Date,
    to: Date,
  ): Promise<EnergyReading[]> {
    const { data, error } = await supabase
      .from('energy_readings')
      .select('*')
      .eq('reading_type', type)
      .gte('recorded_at', from.toISOString())
      .lte('recorded_at', to.toISOString())
      .order('recorded_at', { ascending: true });

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

    const { data, error } = await supabase
      .from('energy_readings')
      .select('value_kwh')
      .eq('reading_type', type)
      .gte('recorded_at', startOfDay.toISOString())
      .lte('recorded_at', endOfDay.toISOString());

    if (error || !data) {
      console.error(`Error fetching daily total for ${type}:`, error);
      return 0;
    }

    return data.reduce((sum: number, r: { value_kwh: number }) => sum + r.value_kwh, 0);
  }

  async insertReading(
    reading: Omit<EnergyReading, 'id' | 'recorded_at'>,
  ): Promise<EnergyReading> {
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
