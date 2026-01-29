
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
 * This prevents runtime errors like "insert(...).select is not a function" 
 * when the real client is not initialized.
 */
const createSafeClient = () => {
  if (!supabaseUrl || !supabaseUrl.startsWith('http')) {
    console.warn('Supabase configuration missing or invalid. Using safety proxy client.');
    
    // The result we resolve to when the chain is awaited
    const mockResponse = { data: [], error: null };

    // This proxy handles any property access by returning itself (fluent)
    // and implements .then() to be awaitable.
    const fluentMock: any = new Proxy({}, {
      get: (target, prop) => {
        // If the code is awaiting the result
        if (prop === 'then') {
          return (onFulfilled: any) => Promise.resolve(mockResponse).then(onFulfilled);
        }
        if (prop === 'catch') {
          return (onRejected: any) => Promise.resolve(mockResponse).catch(onRejected);
        }
        if (prop === 'finally') {
          return (onFinally: any) => Promise.resolve(mockResponse).finally(onFinally);
        }

        // Methods that usually end the chain or transform it
        const terminalMethods = ['single', 'maybeSingle', 'select', 'insert', 'update', 'upsert', 'delete', 'eq', 'neq', 'gt', 'lt', 'is', 'order', 'limit', 'or'];
        if (typeof prop === 'string' && terminalMethods.includes(prop)) {
          return () => fluentMock;
        }

        return undefined;
      }
    });

    return {
      from: () => fluentMock,
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
        signOut: () => Promise.resolve({ error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
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
