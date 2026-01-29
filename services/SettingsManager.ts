
import { TemporaryDatabase } from './TemporaryDatabase';
import { ThemeManager, Theme } from './ThemeManager';

export interface SystemSettings {
  currency: string;
  fiscalYearStart: string;
  theme: Theme;
  language: 'en' | 'id';
  maxFileUploadSize: number;
}

export class SettingsManager {
  static getSettings(): SystemSettings {
    const db = TemporaryDatabase.getDB();
    return db.settings || {
      currency: 'IDR',
      fiscalYearStart: '2024-01-01',
      theme: 'light',
      language: 'en',
      maxFileUploadSize: 10
    };
  }

  static updateSettings(newSettings: Partial<SystemSettings>) {
    const db = TemporaryDatabase.getDB();
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    db.settings = updated;
    TemporaryDatabase.saveDB(db);
    
    if (newSettings.theme) {
      ThemeManager.applyTheme(newSettings.theme);
    }
  }
}
