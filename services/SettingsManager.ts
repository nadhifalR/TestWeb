
import { supabase } from './SupabaseClient';
import { ThemeManager, Theme } from './ThemeManager';

export interface SystemSettings {
  currency: string;
  fiscalYearStart: string;
  theme: Theme;
  language: 'en' | 'id';
  maxFileUploadSize: number;
}

export class SettingsManager {
  private static DEFAULT_SETTINGS: SystemSettings = {
    currency: 'IDR',
    fiscalYearStart: '2024-01-01',
    theme: 'light',
    language: 'en',
    maxFileUploadSize: 10
  };

  private static cache: SystemSettings = SettingsManager.DEFAULT_SETTINGS;

  static async getSettings(): Promise<SystemSettings> {
    try {
      const { data, error } = await supabase
        .from('system_configs')
        .select('value')
        .eq('key', 'global_settings')
        .maybeSingle();

      if (error) {
        // If 404, the table doesn't exist, use defaults silently
        this.cache = this.DEFAULT_SETTINGS;
        return this.DEFAULT_SETTINGS;
      }
      
      const result = { ...this.DEFAULT_SETTINGS, ...(data?.value || {}) };
      this.cache = result;
      return result;
    } catch (err) {
      this.cache = this.DEFAULT_SETTINGS;
      return this.DEFAULT_SETTINGS;
    }
  }

  static getSettingsSync(): SystemSettings {
    return this.cache;
  }

  static async updateSettings(newSettings: Partial<SystemSettings>) {
    try {
      const current = await this.getSettings();
      const updated = { ...current, ...newSettings };
      
      this.cache = updated;
      
      const { error } = await supabase
        .from('system_configs')
        .upsert({ key: 'global_settings', value: updated });

      if (error) throw error;

      if (newSettings.theme) {
        ThemeManager.applyTheme(newSettings.theme);
      }
    } catch (err) {
      console.warn("SettingsManager: system_configs table likely missing. Persistent settings unavailable.");
    }
  }
}
