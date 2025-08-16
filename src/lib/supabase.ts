
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// A function to check if a string is a valid URL and not the placeholder
const isValidSupabaseConfig = (url?: string, key?: string): boolean => {
  if (!url || !key || url.includes('YOUR_SUPABASE_URL') || key.includes('YOUR_SUPABASE_ANON_KEY')) {
      return false;
  }
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

const supabase = isValidSupabaseConfig(supabaseUrl, supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: (table: string) => {
        console.warn(`Supabase client is not configured. Call to table "${table}" is mocked.`);
        const mockClient = {
          select: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
          insert: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
          update: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
          delete: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
        };
        return mockClient;
      },
      channel: (channelName: string) => {
        console.warn(`Supabase client is not configured. Call to channel "${channelName}" is mocked.`);
        return {
          on: () => ({
            subscribe: () => ({
              unsubscribe: () => {},
            }),
          }),
          subscribe: () => ({
              unsubscribe: () => {},
          }),
        };
      },
      removeChannel: (channel: any) => {
         console.warn(`Supabase client is not configured. Call to removeChannel is mocked.`);
      },
       auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signInWithPassword: async () => ({ data: { session: null }, error: { message: 'Supabase not configured' } }),
        signOut: async () => ({ error: null }),
      },
    };

export { supabase };
