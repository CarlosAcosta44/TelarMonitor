import { EnergyReadingRepository } from '../../domain/repositories/EnergyReadingRepository';
import { SettingsRepository } from '../../domain/repositories/SettingsRepository';

export interface DailySummary {
  consumptionKwh: number;
  solarKwh: number;
  /** Estimated savings in Colombian Pesos (COP) */
  savingsCop: number;
  rateCopPerKwh: number;
  date: Date;
}

export class GetDailySummary {
  constructor(
    private readonly energyRepo: EnergyReadingRepository,
    private readonly settingsRepo: SettingsRepository,
  ) {}

  async execute(date: Date = new Date()): Promise<DailySummary> {
    const [consumptionKwh, solarKwh, rateStr] = await Promise.all([
      this.energyRepo.getDailyTotal('consumption', date).catch(() => 0),
      this.energyRepo.getDailyTotal('solar_generation', date).catch(() => 0),
      this.settingsRepo.getSetting('energy_rate_cop_per_kwh').catch(() => null),
    ]);

    const rateCopPerKwh = parseFloat(rateStr ?? '950');
    const savingsCop = solarKwh * rateCopPerKwh;

    return {
      consumptionKwh: parseFloat(consumptionKwh.toFixed(3)),
      solarKwh: parseFloat(solarKwh.toFixed(3)),
      savingsCop: parseFloat(savingsCop.toFixed(0)),
      rateCopPerKwh,
      date,
    };
  }
}
