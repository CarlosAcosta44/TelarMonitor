import { EnergyReadingRepository } from '../../domain/repositories/EnergyReadingRepository';
import { EnergyReading, ReadingType } from '../../domain/entities/EnergyReading';

export class GetRangeReadings {
  constructor(private readonly repository: EnergyReadingRepository) {}

  async execute(type: ReadingType, from: Date, to: Date): Promise<EnergyReading[]> {
    return this.repository.getReadingsByDateRange(type, from, to);
  }
}
