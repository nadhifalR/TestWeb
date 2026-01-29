
import { useState, useEffect } from 'react';
import { TranslationManager } from '../services/TranslationManager';

export const useTranslation = () => {
  const [lang, setLang] = useState(TranslationManager.getLanguage());

  useEffect(() => {
    const handler = (e: any) => setLang(e.detail.lang);
    window.addEventListener('nexus-locale-change', handler);
    return () => window.removeEventListener('nexus-locale-change', handler);
  }, []);

  return {
    t: (key: string) => TranslationManager.t(key),
    lang
  };
};
