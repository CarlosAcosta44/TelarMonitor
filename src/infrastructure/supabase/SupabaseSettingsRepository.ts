import { SettingsRepository } from '../../domain/repositories/SettingsRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAnonClient } from './client';

export class SupabaseSettingsRepository implements SettingsRepository {
  constructor(
    private supabase: SupabaseClient = createAnonClient(),
    private householdId?: string
  ) {}

  async getSetting(key: string): Promise<string | null> {
    if (!this.householdId) return null;

    const { data, error } = await this.supabase
      .from('households')
      .select('*')
      .eq('id', this.householdId)
      .limit(1);

    if (error || !data || data.length === 0) return null;
    const row = data[0] as Record<string, unknown>;

    if (key === 'installation_name') {
      return String(row['installation_name'] || row['name'] || '');
    }
    if (key === 'name') {
      return String(row['name'] || row['installation_name'] || '');
    }
    if (key === 'import_rate' || key === 'energy_rate_cop_per_kwh') {
      return String(row['energy_rate_cop_per_kwh'] || row['import_rate'] || '');
    }

    return row[key] !== undefined && row[key] !== null ? String(row[key]) : null;
  }

  async getAllSettings(): Promise<Record<string, string>> {
    if (!this.householdId) return {};

    const { data, error } = await this.supabase
      .from('households')
      .select('*')
      .eq('id', this.householdId)
      .limit(1);

    if (error || !data || data.length === 0) return {};

    const row = data[0] as Record<string, unknown>;
    const settings: Record<string, string> = {};
    for (const [k, v] of Object.entries(row)) {
      if (v !== null && v !== undefined) {
        settings[k] = String(v);
      }
    }
    if (settings['name'] && !settings['installation_name']) {
      settings['installation_name'] = settings['name'];
    }
    if (settings['installation_name'] && !settings['name']) {
      settings['name'] = settings['installation_name'];
    }
    return settings;
  }
}
