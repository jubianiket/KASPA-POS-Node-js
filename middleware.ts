
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define roles and their allowed paths
const rolePermissions: Record<string, string[]> = {
  admin: ['/dashboard', '/', '/kds', '/menu', '/history', '/settings'],
  cashier: ['/'],
  head_chef: ['/kds'],
};

// Define default redirect paths for each role
const defaultRedirects: Record<string, string> = {
  admin: '/dashboard',
  cashier: '/',
  head_chef: '/kds',
};

export async function middleware(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storage: {
            getItem: (key) => request.cookies.get(key)?.value,
            setItem: (key, value) => { /* server-side only */},
            removeItem: (key) => { /* server-side only */},
        },
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: true,
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  
  const user = session?.user;
  const userRole = user?.user_metadata?.role || null;
  const { pathname } = request.nextUrl;

  // If user is not logged in and not on the login page, redirect to login
  if (!user && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user is logged in and tries to access login page, redirect to their dashboard
  if (user && pathname === '/login') {
    const redirectUrl = userRole ? defaultRedirects[userRole] : '/';
    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }
  
  // If user is logged in, check their role and path permissions
  if (user && userRole) {
    const allowedPaths = rolePermissions[userRole];
    if (allowedPaths && !allowedPaths.includes(pathname)) {
       // If path is not allowed, redirect to their default page
       const redirectUrl = defaultRedirects[userRole];
       return NextResponse.redirect(new URL(redirectUrl, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match all paths except for static assets
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
