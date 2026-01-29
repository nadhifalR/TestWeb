
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
    currency: 'IDR', fiscalYearStart: '2024-01-01', theme: 'light', language: 'en', maxFileUploadSize: 10
  };

  private static cache: SystemSettings = SettingsManager.DEFAULT_SETTINGS;

  static async getSettings(): Promise<SystemSettings> {
    try {
      const { data, error, status } = await supabase
        .from('system_configs')
        .select('value')
        .eq('key', 'global_settings')
        .maybeSingle();

      if (error || status === 404) {
        this.cache = this.DEFAULT_SETTINGS;
        return this.DEFAULT_SETTINGS;
      }
      
      this.cache = { ...this.DEFAULT_SETTINGS, ...(data?.value || {}) };
      return this.cache;
    } catch (err) {
      return this.DEFAULT_SETTINGS;
    }
  }

  static getSettingsSync(): SystemSettings {
    return this.cache;
  }

  static async updateSettings(newSettings: Partial<SystemSettings>) {
    const updated = { ...this.cache, ...newSettings };
    this.cache = updated;
    
    try {
      await supabase.from('system_configs').upsert({ key: 'global_settings', value: updated });
    } catch (err) {
      console.warn("SettingsManager: Database persistence skipped.");
    }

    if (newSettings.theme) ThemeManager.applyTheme(newSettings.theme);
  }
}
