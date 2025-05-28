import { type NextRequest, NextResponse } from "next/server"
import { extendSession } from "../../../utils/session-manager"

export async function POST(request: NextRequest) {
  try {
    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 })
    }

    const result = await extendSession(sessionId)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[API] Error extending session:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
