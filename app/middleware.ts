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
      const sessionResult = await validateSession(sessionId)

      if (!sessionResult.isValid) {
        console.log("[MIDDLEWARE] Invalid session, redirecting to login")
        const response = NextResponse.redirect(new URL("/auth/login", request.url))
        response.cookies.delete("fitback_session_id")
        return response
      }

      // Session is valid, continue with request
      console.log("[MIDDLEWARE] Valid session, allowing access to:", pathname)
      return NextResponse.next()
    } catch (error) {
      console.error("[MIDDLEWARE] Error validating session:", error)
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
