
import { SettingsManager } from './SettingsManager';

const translations: Record<string, Record<string, string>> = {
  en: {
    'nav.dashboard': 'Dashboard',
    'nav.accounts': 'Accounts',
    'nav.requests': 'Requests',
    'nav.analytics': 'Analytics',
    'nav.reports': 'Reports',
    'nav.activity': 'Activity',
    'nav.settings': 'Settings',
    'dashboard.title': 'Executive Dashboard',
    'requests.title': 'Request Registry',
    'reports.title': 'Financial Synthesis',
    'settings.title': 'System Configuration',
    'common.save': 'Save Configuration',
    'common.abort': 'Abort',
    'common.search': 'Search (REQ#, Identity)...',
    'common.delete_confirm': 'Are you sure you want to delete this record?'
  },
  id: {
    'nav.dashboard': 'Dasbor',
    'nav.accounts': 'Akun',
    'nav.requests': 'Permintaan',
    'nav.analytics': 'Analitik',
    'nav.reports': 'Laporan',
    'nav.activity': 'Aktivitas',
    'nav.settings': 'Pengaturan',
    'dashboard.title': 'Dasbor Eksekutif',
    'requests.title': 'Registri Permintaan',
    'reports.title': 'Sintesis Finansial',
    'settings.title': 'Konfigurasi Sistem',
    'common.save': 'Simpan Konfigurasi',
    'common.abort': 'Batalkan',
    'common.search': 'Cari (REQ#, Identitas)...',
    'common.delete_confirm': 'Apakah Anda yakin ingin menghapus data ini?'
  }
};

export class TranslationManager {
  static getLanguage(): 'en' | 'id' {
    return SettingsManager.getSettings().language || 'en';
  }

  static t(key: string): string {
    const lang = this.getLanguage();
    return translations[lang][key] || key;
  }

  static setLanguage(lang: 'en' | 'id') {
    SettingsManager.updateSettings({ language: lang });
    window.dispatchEvent(new CustomEvent('nexus-locale-change', { detail: { lang } }));
  }
}
