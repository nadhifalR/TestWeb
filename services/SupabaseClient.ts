import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  try {
    const meta = (import.meta as any);
    if (meta && meta.env && meta.env[key]) {
      return meta.env[key];
    }
  } catch (e) {}
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

const createSafeClient = () => {
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.warn('Supabase URL is missing or invalid. Returning fallback client.');
    return new Proxy({} as any, {
      get: (target, prop) => {
        if (prop === 'from' || prop === 'storage' || prop === 'auth') {
          return () => ({
            select: () => ({ 
              is: () => ({ order: () => Promise.resolve({ data: [], error: null }) }),
              eq: () => ({ maybeSingle: () => Promise.resolve({ data: null, error: null }) }) 
            }),
            insert: () => Promise.resolve({ data: null, error: null }),
            update: () => Promise.resolve({ data: null, error: null }),
            delete: () => Promise.resolve({ data: null, error: null }),
            upsert: () => Promise.resolve({ data: null, error: null }),
          });
        }
        return undefined;
      }
    });
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSafeClient();