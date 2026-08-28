import { EnergyReadingRepository } from '../../domain/repositories/EnergyReadingRepository';
import { supabase } from '../supabase/client';

/** Realistic consumption profile by hour (kWh) */
const CONSUMPTION_BASE: Record<number, [number, number]> = {
  0: [0.3, 0.5],  1: [0.2, 0.4],  2: [0.2, 0.3],  3: [0.2, 0.3],
  4: [0.2, 0.4],  5: [0.4, 0.8],  6: [1.5, 2.5],  7: [2.5, 4.0],
  8: [2.0, 3.2],  9: [1.2, 2.0], 10: [1.0, 1.8], 11: [1.2, 2.0],
 12: [1.5, 2.5], 13: [1.3, 2.2], 14: [1.0, 1.8], 15: [1.0, 1.8],
 16: [1.2, 2.0], 17: [1.8, 3.0], 18: [3.0, 5.0], 19: [3.5, 5.5],
 20: [3.0, 4.5], 21: [2.5, 3.5], 22: [1.5, 2.5], 23: [0.5, 1.0],
};

function randomBetween(min: number, max: number): number {
  return parseFloat((min + Math.random() * (max - min)).toFixed(4));
}

function consumptionForHour(hour: number): number {
  const [min, max] = CONSUMPTION_BASE[hour];
  return randomBetween(min, max);
}

function solarForHour(hour: number, cloudFactor: number): number {
  if (hour < 6 || hour > 19) return 0;
  // Bell curve peaking at 12:30
  const distanceToNoon = Math.abs(12.5 - hour);
  const peak = 5.5 * cloudFactor;
  const raw = Math.max(0, peak - distanceToNoon * 0.7) + Math.random() * 0.4 * cloudFactor;
  return parseFloat(raw.toFixed(4));
}

export class SimulationService {
  constructor(private repository: EnergyReadingRepository) {}

  /**
   * Generates a single reading tick (both types) based on the current time.
   * Called by the /api/simulate/reading endpoint.
   */
  async generateTick() {
    const hour = new Date().getHours();
    const [min, max] = CONSUMPTION_BASE[hour];
    const consumptionKwh = randomBetween(min, max);
    const solarKwh = solarForHour(hour, 1.0);

    await Promise.all([
      this.repository.insertReading({ reading_type: 'consumption',      value_kwh: consumptionKwh }),
      this.repository.insertReading({ reading_type: 'solar_generation', value_kwh: solarKwh }),
    ]);
  }

  /**
   * Seeds the database with realistic historical data.
   * Generates one reading every 15 minutes over the last `days` days.
   * Random cloud factors per day make the solar curve believably variable.
   */
  async seedHistoricalData(days: number = 7) {
    const readings: {
      reading_type: string;
      value_kwh: number;
      recorded_at: string;
    }[] = [];

    const now = new Date();

    for (let d = days; d >= 0; d--) {
      // Cloud factor: 0.2–1.0 (1.0 = clear sky, 0.2 = very cloudy)
      const cloudFactor = d === 0 ? 1.0 : randomBetween(0.2, 1.0);
      const isWeekend = [0, 6].includes(
        new Date(now.getFullYear(), now.getMonth(), now.getDate() - d).getDay(),
      );
      // Weekends tend to have slightly higher home consumption during daytime
      const weekendFactor = isWeekend ? 1.15 : 1.0;

      const maxHour = d === 0 ? now.getHours() : 23;

      for (let h = 0; h <= maxHour; h++) {
        // 4 readings per hour (every 15 min)
        const minuteSlots = d === 0 && h === now.getHours()
          ? [0]
          : [0, 15, 30, 45];

        for (const m of minuteSlots) {
          const ts = new Date(now);
          ts.setDate(now.getDate() - d);
          ts.setHours(h, m, 0, 0);

          const consumption = parseFloat(
            (consumptionForHour(h) * weekendFactor).toFixed(4),
          );
          const solar = solarForHour(h, cloudFactor);

          readings.push(
            { reading_type: 'consumption',      value_kwh: consumption, recorded_at: ts.toISOString() },
            { reading_type: 'solar_generation', value_kwh: solar,       recorded_at: ts.toISOString() },
          );
        }
      }
    }

    // Bulk insert in chunks to avoid Supabase payload limits
    const CHUNK = 500;
    for (let i = 0; i < readings.length; i += CHUNK) {
      const chunk = readings.slice(i, i + CHUNK);
      const { error } = await supabase.from('energy_readings').insert(chunk);
      if (error) {
        console.error('Error seeding chunk:', error);
        throw error;
      }
    }

    console.log(`Seeded ${readings.length} readings (${days} days × ~96 readings/day)`);
  }
}
