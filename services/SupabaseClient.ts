
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    const meta = (import.meta as any);
    if (meta && meta.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {}
  
  // Fallback values for current environment configuration
  const fallbacks: Record<string, string> = {
    'VITE_SUPABASE_URL': 'https://vzqeokzxrgokxzygvzhm.supabase.co',
    'VITE_SUPABASE_ANON_KEY': 'sb_publishable_EdxfrjgRYD-qM1ivnCyUXQ_40zPi7xP'
  };
  return fallbacks[key] || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

/**
 * Production Supabase Client
 * Note: If using the placeholder anon key provided in .env.local, 
 * ensure your Supabase project is active and tables are created.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
