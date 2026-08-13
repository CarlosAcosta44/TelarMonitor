import { EnergyReadingRepository } from '../../domain/repositories/EnergyReadingRepository';
import { supabase } from '../supabase/client';

export class SimulationService {
  constructor(private repository: EnergyReadingRepository) {}

  /**
   * Generates a realistic reading based on time of day.
   */
  async generateTick() {
    const hour = new Date().getHours();
    
    // Simulate consumption (higher in morning and evening)
    let consumptionKwh = 1.0;
    if (hour >= 6 && hour <= 9) consumptionKwh = 3.0 + Math.random() * 2;
    else if (hour >= 18 && hour <= 22) consumptionKwh = 4.0 + Math.random() * 3;
    else consumptionKwh = 1.0 + Math.random() * 1.5;

    // Simulate solar (peak at noon, 0 at night)
    let solarKwh = 0;
    if (hour >= 7 && hour <= 18) {
      const distanceToNoon = Math.abs(12.5 - hour);
      solarKwh = Math.max(0, 5.0 - (distanceToNoon * 0.8)) + Math.random();
    }

    // Insert both readings
    await Promise.all([
      this.repository.insertReading({
        reading_type: 'consumption',
        value_kwh: parseFloat(consumptionKwh.toFixed(2))
      }),
      this.repository.insertReading({
        reading_type: 'solar_generation',
        value_kwh: parseFloat(solarKwh.toFixed(2))
      })
    ]);
  }

  /**
   * Generates historical dummy data.
   */
  async seedHistoricalData(days: number = 7) {
    const readings = [];
    const now = new Date();
    const currentHour = now.getHours();
    
    for (let d = days; d >= 0; d--) {
      // For today (d=0), only generate up to the current hour to avoid "future" readings
      const maxHour = d === 0 ? currentHour : 23;
      
      for (let h = 0; h <= maxHour; h++) {
        const simulatedDate = new Date(now);
        simulatedDate.setDate(now.getDate() - d);
        simulatedDate.setHours(h, 0, 0, 0);
        
        let consumptionKwh = 1.0;
        if (h >= 6 && h <= 9) consumptionKwh = 3.0 + Math.random() * 2;
        else if (h >= 18 && h <= 22) consumptionKwh = 4.0 + Math.random() * 3;
        else consumptionKwh = 1.0 + Math.random() * 1.5;

        let solarKwh = 0;
        if (h >= 7 && h <= 18) {
          const distanceToNoon = Math.abs(12.5 - h);
          solarKwh = Math.max(0, 5.0 - (distanceToNoon * 0.8)) + Math.random();
        }

        readings.push({
          reading_type: 'consumption',
          value_kwh: parseFloat(consumptionKwh.toFixed(2)),
          recorded_at: simulatedDate.toISOString()
        });
        
        readings.push({
          reading_type: 'solar_generation',
          value_kwh: parseFloat(solarKwh.toFixed(2)),
          recorded_at: simulatedDate.toISOString()
        });
      }
    }
    
    // Bulk insert for performance using the supabase client directly
    const { error } = await supabase
      .from('energy_readings')
      .insert(readings);

    if (error) {
      console.error('Error seeding historical data:', error);
      throw error;
    }
    
    console.log(`Successfully seeded ${readings.length} readings`);
  }
}
