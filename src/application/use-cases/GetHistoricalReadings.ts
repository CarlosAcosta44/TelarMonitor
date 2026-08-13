import { EnergyReadingRepository } from '../../domain/repositories/EnergyReadingRepository';
import { EnergyReading, ReadingType } from '../../domain/entities/EnergyReading';

export class GetHistoricalReadings {
  constructor(private repository: EnergyReadingRepository) {}

  async execute(type: ReadingType, limit: number = 50): Promise<EnergyReading[]> {
    // For the MVP, we assume the repository will return them ordered correctly 
    // or we can sort them here if we want application logic to handle it.
    // Generally, the repository sorts them by recorded_at.
    return this.repository.getHistoricalReadings(type, limit);
  }
}
