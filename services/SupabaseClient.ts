
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

/**
 * Creates a robust mock object that simulates the Supabase client's fluent API.
 * This prevents runtime errors when the real client is not initialized.
 */
const createSafeClient = () => {
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.warn('Supabase configuration missing or invalid. Using safety proxy client.');
    
    const mockResult = { data: [], error: null };
    const mockSingleResult = { data: null, error: null };

    const fluentMock: any = {
      select: () => fluentMock,
      is: () => fluentMock,
      eq: () => fluentMock,
      neq: () => fluentMock,
      gt: () => fluentMock,
      lt: () => fluentMock,
      order: () => fluentMock,
      limit: () => fluentMock,
      or: () => fluentMock,
      single: () => Promise.resolve(mockSingleResult),
      maybeSingle: () => Promise.resolve(mockSingleResult),
      insert: () => Promise.resolve(mockResult),
      update: () => fluentMock,
      upsert: () => Promise.resolve(mockResult),
      delete: () => fluentMock,
      // Supabase queries are Thenable (Promise-like)
      then: (onfulfilled: any) => Promise.resolve(mockResult).then(onfulfilled),
      catch: (onrejected: any) => Promise.resolve(mockResult).catch(onrejected)
    };

    return {
      from: () => fluentMock,
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null })
      },
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ data: null, error: null }),
          getPublicUrl: () => ({ data: { publicUrl: '' } }),
          remove: () => Promise.resolve({ data: null, error: null })
        })
      }
    } as any;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSafeClient();
