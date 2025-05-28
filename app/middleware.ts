import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Extremely simplified middleware just to test if it runs
export function middleware(request: NextRequest) {
  // Basic logging that should appear if middleware runs at all
  console.log("🔍 BASIC MIDDLEWARE RUNNING")
  console.log("📍 Path:", request.nextUrl.pathname)
  console.log("🍪 Has session cookie:", !!request.cookies.get("fitback_session_id"))

  // Just pass through all requests
  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
