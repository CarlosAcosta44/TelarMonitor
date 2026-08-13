import { EnergyReadingRepository } from '../../domain/repositories/EnergyReadingRepository';
import { EnergyReading } from '../../domain/entities/EnergyReading';

export class GetSolarGeneration {
  constructor(private repository: EnergyReadingRepository) {}

  async execute(): Promise<EnergyReading | null> {
    return this.repository.getCurrentReading('solar_generation');
  }
}
