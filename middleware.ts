import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { validateSession } from "./app/utils/session-manager"

// Define public routes that don't require authentication
const publicRoutes = [
  "/",
  "/auth/login",
  "/auth/signup",
  "/auth/verify-email",
  "/auth/forgot-password",
  "/auth/reset-password",
]
// Define admin routes that require admin privileges
const adminRoutes = [
  "/admin",
  "/admin/dashboard",
  "/admin/users",
  "/admin/feedbacks",
  "/admin/setup",
  "/admin/data-check",
]
// Define routes that require authentication
const protectedRoutes = ["/dashboard", "/submit-feedback", "/feedback-success", "/create-profile", "/spin-wheel"]

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  console.log(`[MIDDLEWARE] Processing request for: ${pathname}`)

  // Get session ID from cookie or header
  const sessionId = request.cookies.get("fitback_session_id")?.value || request.headers.get("x-session-id")
  console.log(`[MIDDLEWARE] Session ID: ${sessionId ? "Found" : "Not found"}`)

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route))
  const isPublicRoute = publicRoutes.some((route) => pathname === route || pathname.startsWith(route))

  console.log(
    `[MIDDLEWARE] Route type: ${isProtectedRoute ? "Protected" : isAdminRoute ? "Admin" : isPublicRoute ? "Public" : "Other"}`,
  )

  // If it's a public route, allow access
  if (isPublicRoute) {
    console.log(`[MIDDLEWARE] Public route, allowing access`)
    return NextResponse.next()
  }

  // If it's a protected or admin route, check for session
  if (isProtectedRoute || isAdminRoute) {
    if (!sessionId) {
      console.log(`[MIDDLEWARE] Protected route without session, redirecting to login`)
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }

    try {
      console.log(`[MIDDLEWARE] Validating session`)
      const sessionResult = await validateSession(sessionId)
      console.log(`[MIDDLEWARE] Session validation result: ${sessionResult.isValid ? "Valid" : "Invalid"}`)

      if (!sessionResult.isValid || !sessionResult.user) {
        console.log(`[MIDDLEWARE] Invalid session, redirecting to login`)
        return NextResponse.redirect(new URL("/auth/login", request.url))
      }

      // For admin routes, check if user is admin
      if (isAdminRoute && !sessionResult.user.is_admin) {
        console.log(`[MIDDLEWARE] Non-admin user accessing admin route, redirecting to dashboard`)
        return NextResponse.redirect(new URL("/dashboard", request.url))
      }

      // Session is valid, allow access
      console.log(`[MIDDLEWARE] Valid session, allowing access`)
      return NextResponse.next()
    } catch (error) {
      console.error(`[MIDDLEWARE] Error validating session:`, error)
      return NextResponse.redirect(new URL("/auth/login", request.url))
    }
  }

  // For all other routes, allow access
  console.log(`[MIDDLEWARE] Non-protected route, allowing access`)
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
