import { EnergyReadingRepository } from '../../domain/repositories/EnergyReadingRepository';
import { ReadingType } from '../../domain/entities/EnergyReading';

export class SaveTelemetry {
  constructor(private readonly energyRepository: EnergyReadingRepository) {}

  async execute(type: ReadingType, valueKwh: number) {
    if (!['consumption', 'solar_generation'].includes(type)) {
      throw new Error('Tipo de lectura inválido');
    }

    if (typeof valueKwh !== 'number' || valueKwh < 0) {
      throw new Error('Valor de lectura inválido');
    }

    return await this.energyRepository.insertReading({
      reading_type: type,
      value_kwh: valueKwh
    });
  }
}
