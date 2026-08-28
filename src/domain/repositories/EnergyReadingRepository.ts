import { EnergyReading, ReadingType } from '../entities/EnergyReading';

export interface EnergyReadingRepository {
  /**
   * Gets the most recent reading of a specific type.
   */
  getCurrentReading(type: ReadingType): Promise<EnergyReading | null>;

  /**
   * Gets the last N historical readings of a specific type, ascending by time.
   */
  getHistoricalReadings(type: ReadingType, limit?: number): Promise<EnergyReading[]>;

  /**
   * Gets all readings of a specific type within a date range, ascending by time.
   */
  getReadingsByDateRange(type: ReadingType, from: Date, to: Date): Promise<EnergyReading[]>;

  /**
   * Returns the sum of value_kwh for a given type on a specific calendar day.
   */
  getDailyTotal(type: ReadingType, date: Date): Promise<number>;

  /**
   * Inserts a new reading into the data store.
   */
  insertReading(reading: Omit<EnergyReading, 'id' | 'recorded_at'>): Promise<EnergyReading>;
}
