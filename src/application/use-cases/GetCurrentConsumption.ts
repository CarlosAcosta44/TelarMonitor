import { EnergyReadingRepository } from '../../domain/repositories/EnergyReadingRepository';
import { EnergyReading } from '../../domain/entities/EnergyReading';

export class GetCurrentConsumption {
  constructor(private repository: EnergyReadingRepository) {}

  async execute(): Promise<EnergyReading | null> {
    return this.repository.getCurrentReading('consumption');
  }
}
