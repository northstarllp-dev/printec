import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const updateSession = async (request: NextRequest) => {
  // Create an unmodified response
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase environment variables are missing. Skipping session update.");
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
            supabaseResponse = NextResponse.next({
              request,
            })
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            )
          },
        },
      },
    );

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake can write a secure cookie.
    const { data: { user } } = await supabase.auth.getUser();

    // Route Protection Logic
    const isProtectedRoute = request.nextUrl.pathname.startsWith('/admin') || request.nextUrl.pathname.startsWith('/staff') || request.nextUrl.pathname.startsWith('/production');
    const isLoginPage = request.nextUrl.pathname === '/admin/login' || request.nextUrl.pathname === '/staff/login' || request.nextUrl.pathname === '/production/login' || request.nextUrl.pathname === '/login';

    // If trying to access a protected route without being logged in
    if (isProtectedRoute && !isLoginPage && !user) {
      const loginUrl = request.nextUrl.clone();
      if (request.nextUrl.pathname.startsWith('/production')) {
        loginUrl.pathname = '/production/login';
      } else if (request.nextUrl.pathname.startsWith('/staff')) {
        loginUrl.pathname = '/staff/login';
      } else {
        loginUrl.pathname = '/admin/login';
      }
      return NextResponse.redirect(loginUrl);
    }

    // If trying to access login page while already logged in
    if (isLoginPage && user) {
      const dashboardUrl = request.nextUrl.clone();
      if (request.nextUrl.pathname.startsWith('/production')) {
        dashboardUrl.pathname = '/production/orders';
      } else if (request.nextUrl.pathname.startsWith('/staff')) {
        dashboardUrl.pathname = '/staff/orders';
      } else {
        dashboardUrl.pathname = '/admin/dashboard';
      }
      return NextResponse.redirect(dashboardUrl);
    }
  } catch (error) {
    console.error("Failed to update supabase session in middleware:", error);
  }

  return supabaseResponse;
};
