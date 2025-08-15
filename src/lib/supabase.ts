
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// A function to check if a string is a valid URL and not the placeholder
const isValidSupabaseUrl = (url: string | undefined): url is string => {
  if (!url || url.includes('YOUR_SUPABASE_URL')) {
      return false;
  }
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};


const supabase = isValidSupabaseUrl(supabaseUrl) && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      from: (table: string) => {
        console.warn(`Supabase client is not configured. Call to table "${table}" is mocked.`);
        return {
          select: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
          insert: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
          update: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
          delete: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
        };
      },
      channel: (channelName: string) => {
        console.warn(`Supabase client is not configured. Call to channel "${channelName}" is mocked.`);
        return {
          on: () => ({
            subscribe: () => ({
              unsubscribe: () => {},
            }),
          }),
        };
      },
      removeChannel: (channel: any) => {
         console.warn(`Supabase client is not configured. Call to removeChannel is mocked.`);
      },
    };

export { supabase };
