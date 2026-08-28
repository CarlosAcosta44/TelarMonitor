export interface SettingsRepository {
  /**
   * Returns the value for a single setting key, or null if not found.
   */
  getSetting(key: string): Promise<string | null>;

  /**
   * Returns all settings as a key→value map.
   */
  getAllSettings(): Promise<Record<string, string>>;
}
