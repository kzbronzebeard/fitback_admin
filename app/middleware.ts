import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateSession } from "./utils/session-manager"

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/submit-feedback", "/create-profile", "/admin"]

// Auth routes that should redirect authenticated users
const authRoutes = ["/auth/login", "/auth/signup", "/auth/forgot-password", "/auth/reset-password"]

// Public routes that don't require authentication
const publicRoutes = ["/", "/auth/verify-email"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Get session ID from cookie or header
  const sessionId = request.cookies.get("fitback_session_id")?.value || request.headers.get("x-session-id")

  console.log("[MIDDLEWARE] Checking route:", pathname, "Session:", !!sessionId)

  // Add comprehensive logging at the beginning of the middleware function
  console.log("[MIDDLEWARE DEBUG] Route:", pathname)
  console.log("[MIDDLEWARE DEBUG] Session ID:", sessionId)
  console.log("[MIDDLEWARE DEBUG] Has SUPABASE_URL:", !!process.env.SUPABASE_URL)
  console.log("[MIDDLEWARE DEBUG] Has SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  // Allow public routes without authentication
  if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Check if route requires authentication
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route))

  if (isProtectedRoute) {
    if (!sessionId) {
      console.log("[MIDDLEWARE] No session, redirecting to login")
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    try {
      console.log("[MIDDLEWARE DEBUG] Validating session:", sessionId)
      const sessionResult = await validateSession(sessionId)
      console.log("[MIDDLEWARE DEBUG] Session validation result:", {
        isValid: sessionResult.isValid,
        error: sessionResult.error,
        hasUser: !!sessionResult.user,
      })

      if (!sessionResult.isValid) {
        console.log("[MIDDLEWARE DEBUG] Invalid session, redirecting to login")
        const response = NextResponse.redirect(new URL("/auth/login", request.url))
        response.cookies.delete("fitback_session_id")
        return response
      }

      console.log("[MIDDLEWARE DEBUG] Valid session, allowing access to:", pathname)
      return NextResponse.next()
    } catch (error) {
      console.error("[MIDDLEWARE DEBUG] Error validating session:", error)
      const response = NextResponse.redirect(new URL("/auth/login", request.url))
      response.cookies.delete("fitback_session_id")
      return response
    }
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && sessionId) {
    try {
      const sessionResult = await validateSession(sessionId)

      if (sessionResult.isValid) {
        console.log("[MIDDLEWARE] Authenticated user accessing auth page, redirecting to dashboard")
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }
    } catch (error) {
      console.error("[MIDDLEWARE] Error checking auth redirect:", error)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
