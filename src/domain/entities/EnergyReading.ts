export type ReadingType = 'consumption' | 'solar_generation';

export interface EnergyReading {
  id: string;
  reading_type: ReadingType;
  value_kwh: number;
  recorded_at: string;
}
