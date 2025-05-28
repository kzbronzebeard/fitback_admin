import { type NextRequest, NextResponse } from "next/server"
import { validateSession } from "../../../utils/session-manager"

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 })
    }

    const result = await validateSession(sessionId)

    if (result.isValid && result.user) {
      return NextResponse.json({
        success: true,
        user: {
          user_id: result.user.user_id,
          email: result.user.email,
          name: result.user.name,
          is_admin: result.user.is_admin,
          email_verified: result.user.email_verified,
        },
      })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }
  } catch (error) {
    console.error("[API] Error validating session:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
