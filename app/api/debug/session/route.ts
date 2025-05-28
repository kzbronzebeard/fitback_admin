import { NextResponse } from "next/server"
import { validateSession } from "@/app/utils/session-manager"

export async function GET(request: Request) {
  // Get session ID from cookie or header
  const url = new URL(request.url)
  const sessionId = url.searchParams.get("sessionId")

  console.log("[DEBUG API] Testing session validation for:", sessionId)
  console.log("[DEBUG API] Has SUPABASE_URL:", !!process.env.SUPABASE_URL)
  console.log("[DEBUG API] Has SUPABASE_SERVICE_ROLE_KEY:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

  if (!sessionId) {
    return NextResponse.json({ error: "No session ID provided" }, { status: 400 })
  }

  try {
    const result = await validateSession(sessionId)
    console.log("[DEBUG API] Validation result:", {
      isValid: result.isValid,
      error: result.error,
      hasUser: !!result.user,
    })

    return NextResponse.json({
      isValid: result.isValid,
      error: result.error,
      hasUser: !!result.user,
      userId: result.user?.id,
    })
  } catch (error) {
    console.error("[DEBUG API] Validation error:", error)
    return NextResponse.json({ error: "Validation error", details: String(error) }, { status: 500 })
  }
}
