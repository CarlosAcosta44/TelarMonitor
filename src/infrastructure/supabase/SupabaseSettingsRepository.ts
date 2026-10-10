import { SettingsRepository } from '../../domain/repositories/SettingsRepository';
import { SupabaseClient } from '@supabase/supabase-js';
import { createAnonClient } from './client';

export class SupabaseSettingsRepository implements SettingsRepository {
  constructor(private supabase: SupabaseClient = createAnonClient()) {}

  async getSetting(key: string): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('households')
      .select(key)
      .limit(1)
      .single();

    if (error || !data) return null;
    return String((data as unknown as Record<string, unknown>)[key]);
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const { data, error } = await this.supabase
      .from('households')
      .select('*')
      .limit(1)
      .single();

    if (error || !data) return {};

    // Map all columns to string values
    const settings: Record<string, string> = {};
    for (const [k, v] of Object.entries(data)) {
      if (v !== null && v !== undefined) {
        settings[k] = String(v);
      }
    }
    return settings;
  }
}
