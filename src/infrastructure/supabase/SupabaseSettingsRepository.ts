import { SettingsRepository } from '../../domain/repositories/SettingsRepository';
import { supabase } from './client';

export class SupabaseSettingsRepository implements SettingsRepository {
  async getSetting(key: string): Promise<string | null> {
    const { data, error } = await supabase
      .from('settings')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) return null;
    return data.value as string;
  }

  async getAllSettings(): Promise<Record<string, string>> {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value');

    if (error || !data) return {};

    return Object.fromEntries(
      (data as { key: string; value: string }[]).map((s) => [s.key, s.value]),
    );
  }
}
