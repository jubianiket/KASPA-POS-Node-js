import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// A function to check if a string is a valid URL
const isValidUrl = (url: string | undefined): url is string => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch (error) {
    return false;
  }
};

// Conditionally create the client only if the URL is valid
// This prevents build errors when environment variables are placeholders
const supabase = isValidUrl(supabaseUrl)
  ? createClient(supabaseUrl, supabaseAnonKey)
  : {
      // Provide a mock client when the URL is invalid to prevent runtime errors
      // on properties of `supabase` being accessed.
      from: () => ({
        select: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
        insert: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
        update: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
        delete: async () => ({ data: [], error: { message: 'Supabase not configured' } }),
      }),
      channel: () => ({
        on: () => ({
            subscribe: () => ({
                unsubscribe: () => {}
            })
        }),
      }),
      removeChannel: () => {}
    };


export { supabase };
