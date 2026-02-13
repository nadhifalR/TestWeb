import React, { useState, useEffect } from 'react';
import { Save, Globe, Paintbrush, Check, Database, Shield } from 'lucide-react';
import { SettingsManager, SystemSettings } from '../services/SettingsManager';
import { TranslationManager } from '../services/TranslationManager';
import { Theme } from '../services/ThemeManager';

const SettingsPage: React.FC = () => {
  // Fix: Initializing state synchronously using the cached settings
  const [settings, setSettings] = useState<SystemSettings>(SettingsManager.getSettingsSync());
  const [isSaved, setIsSaved] = useState(false);

  // Fix: Ensure we have the latest settings from the backend on mount
  useEffect(() => {
    SettingsManager.getSettings().then(setSettings);
  }, []);

  const handleUpdate = (updates: Partial<SystemSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    if (updates.theme) SettingsManager.updateSettings({ theme: updates.theme });
    if (updates.language) TranslationManager.setLanguage(updates.language as 'en' | 'id');
  };

  const handleSave = () => {
    SettingsManager.updateSettings(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 1500);
  };

  const themes: { id: Theme; label: string; bg: string; border: string }[] = [
    { id: 'light', label: 'Enterprise Light', bg: 'bg-white', border: 'border-slate-200' },
    { id: 'dark', label: 'Deep Slate', bg: 'bg-slate-800', border: 'border-slate-700' },
    { id: 'retro', label: 'Classic Ivory', bg: 'bg-[#f4f1ea]', border: 'border-[#e5e0d3]' },
    { id: 'true-black', label: 'Onyx Dark', bg: 'bg-black', border: 'border-zinc-800' }
  ];

  return (
    <div className="max-w-5xl space-y-10 animate-in fade-in duration-500 pb-20">
      <div className="border-b theme-border pb-8">
        <h1 className="text-3xl font-black theme-text tracking-tight uppercase">{TranslationManager.t('settings.title')}</h1>
        <p className="theme-text-muted font-medium text-sm italic">Application and system preferences.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        <section className="theme-card rounded-lg border theme-border overflow-hidden">
          <div className="p-6 border-b theme-border bg-opacity-30 theme-bg">
            <span className="font-black text-[10px] uppercase tracking-widest theme-text">Localization</span>
          </div>
          <div className="p-10 space-y-8">
            <div className="space-y-4">
              <label className="label-caps">Currency</label>
              <select value={settings.currency} onChange={(e) => handleUpdate({ currency: e.target.value })} className="w-full px-6 py-4 theme-bg border theme-border rounded-lg font-black text-sm theme-text">
                <option value="IDR">IDR</option><option value="USD">USD</option>
              </select>
            </div>
            <div className="space-y-4">
              <label className="label-caps">Language</label>
              <div className="flex gap-4">
                <button onClick={() => handleUpdate({ language: 'en' })} className={`flex-1 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${settings.language === 'en' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'theme-card'}`}>English</button>
                <button onClick={() => handleUpdate({ language: 'id' })} className={`flex-1 py-4 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-all ${settings.language === 'id' ? 'bg-slate-900 text-white dark:bg-blue-600' : 'theme-card'}`}>Indonesia</button>
              </div>
            </div>
          </div>
        </section>

        <section className="theme-card rounded-lg border theme-border overflow-hidden">
          <div className="p-6 border-b theme-border bg-opacity-30 theme-bg">
            <span className="font-black text-[10px] uppercase tracking-widest theme-text">Theme Settings</span>
          </div>
          <div className="p-10">
            <div className="grid grid-cols-2 gap-6">
              {themes.map((t) => (
                <button key={t.id} onClick={() => handleUpdate({ theme: t.id })} className={`p-6 border-2 rounded-lg text-left transition-all ${settings.theme === t.id ? 'border-blue-500 bg-blue-500/5' : 'theme-border theme-bg'}`}>
                  <div className={`w-10 h-10 rounded-full mb-3 ${t.bg} ${t.border}`} />
                  <span className="text-[9px] font-black uppercase">{t.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </div>

      <div className="flex justify-end pt-10">
        <button onClick={handleSave} className="px-12 py-5 bg-slate-900 dark:bg-blue-600 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-lg shadow-2xl flex items-center gap-4">
          <Save size={20} /> {TranslationManager.t('common.save')}
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;