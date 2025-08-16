
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import type { User } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'cashier' | 'head_chef';

export interface UserWithRole extends User {
  role: UserRole;
}

const createSupabaseServerClient = () => {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            auth: {
                storage: {
                    getItem: (key) => cookies().get(key)?.value,
                    setItem: (key, value) => {
                        const cookieStore = cookies();
                        cookieStore.set(key, value);
                    },
                    removeItem: (key) => {
                        const cookieStore = cookies();
                        cookieStore.delete(key);
                    },
                },
                autoRefreshToken: true,
                persistSession: true,
                detectSessionInUrl: true,
            },
        }
    );
};

export async function getCurrentUser(): Promise<UserWithRole | null> {
  const supabase = createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return null;
  }
  
  const user = session.user;
  const role = user?.user_metadata?.role || 'cashier'; // Default to cashier if no role

  return {
    ...user,
    role: role as UserRole,
  };
}
