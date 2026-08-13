import { EnergyReading, ReadingType } from '../entities/EnergyReading';

export interface EnergyReadingRepository {
  /**
   * Gets the most recent reading of a specific type.
   */
  getCurrentReading(type: ReadingType): Promise<EnergyReading | null>;

  /**
   * Gets historical readings of a specific type.
   * In a real application, this would accept a time range (start/end dates).
   * For the MVP, we might just ask for the last N readings or the last 7 days.
   */
  getHistoricalReadings(type: ReadingType, limit?: number): Promise<EnergyReading[]>;

  /**
   * Inserts a new reading into the data store.
   * Useful for the simulation aspect of the MVP.
   */
  insertReading(reading: Omit<EnergyReading, 'id' | 'recorded_at'>): Promise<EnergyReading>;
}
