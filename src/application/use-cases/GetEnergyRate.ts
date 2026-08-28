import { SettingsRepository } from '../../domain/repositories/SettingsRepository';

export class GetEnergyRate {
  constructor(private readonly settingsRepo: SettingsRepository) {}

  /** Returns the energy tariff in COP per kWh */
  async execute(): Promise<number> {
    const value = await this.settingsRepo.getSetting('energy_rate_cop_per_kwh').catch(() => null);
    return parseFloat(value ?? '950');
  }
}
