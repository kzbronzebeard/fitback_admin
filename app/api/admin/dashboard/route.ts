import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateSession } from "../../../utils/session-manager"

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Admin email whitelist
const ADMIN_EMAILS = ["p10khanazka@iima.ac.in", "team@tashion.ai", "chhekur@gmail.com"]

async function validateAdminAccess(request: NextRequest) {
  try {
    // Get session from cookie or header
    const sessionId = request.cookies.get("fitback_session_id")?.value || request.headers.get("x-session-id")

    if (!sessionId) {
      return { isValid: false, error: "No session found" }
    }

    // Validate session using existing session manager
    const sessionResult = await validateSession(sessionId)

    if (!sessionResult.isValid || !sessionResult.user) {
      return { isValid: false, error: "Invalid session" }
    }

    const userEmail = sessionResult.user.email
    const isBlocked = sessionResult.user.is_blocked

    if (isBlocked) {
      return { isValid: false, error: "User is blocked" }
    }

    if (!ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
      return { isValid: false, error: "Admin access required" }
    }

    return { isValid: true, user: sessionResult.user, userId: sessionResult.user.user_id }
  } catch (error) {
    console.error("[ADMIN AUTH] Error:", error)
    return { isValid: false, error: "Authentication failed" }
  }
}

export async function GET(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get total user count
    const { count: totalUsers } = await supabase.from("users").select("*", { count: "exact", head: true })

    // Get user registration stats for last 24h
    const { data: users24h } = await supabase
      .from("users")
      .select("user_id")
      .gte("created_at", twentyFourHoursAgo.toISOString())

    // Get user registration stats for last 7 days
    const { data: users1week } = await supabase
      .from("users")
      .select("user_id")
      .gte("created_at", oneWeekAgo.toISOString())

    // Get total feedback count
    const { count: totalFeedbacks } = await supabase.from("feedbacks").select("*", { count: "exact", head: true })

    // Get pending feedback count
    const { count: pendingFeedbacks } = await supabase
      .from("feedbacks")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending")

    // Get feedback stats for last 24h
    const { data: feedbacks24h } = await supabase
      .from("feedbacks")
      .select("feedback_id, status")
      .gte("created_at", twentyFourHoursAgo.toISOString())

    // Get feedback stats for last 7 days
    const { data: feedbacks1week } = await supabase
      .from("feedbacks")
      .select("feedback_id, status")
      .gte("created_at", oneWeekAgo.toISOString())

    // Calculate feedback breakdowns
    const feedback24hBreakdown = {
      pending: feedbacks24h?.filter((f) => f.status === "pending").length || 0,
      approved: feedbacks24h?.filter((f) => f.status === "approved").length || 0,
      rejected: feedbacks24h?.filter((f) => f.status === "rejected").length || 0,
      rewarded: feedbacks24h?.filter((f) => f.status === "rewarded").length || 0,
    }

    const feedback1weekBreakdown = {
      pending: feedbacks1week?.filter((f) => f.status === "pending").length || 0,
      approved: feedbacks1week?.filter((f) => f.status === "approved").length || 0,
      rejected: feedbacks1week?.filter((f) => f.status === "rejected").length || 0,
      rewarded: feedbacks1week?.filter((f) => f.status === "rewarded").length || 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total: totalUsers || 0,
          last24h: users24h?.length || 0,
          last7days: users1week?.length || 0,
        },
        feedbacks: {
          total: totalFeedbacks || 0,
          pending: pendingFeedbacks || 0,
          last24h: {
            total: feedbacks24h?.length || 0,
            ...feedback24hBreakdown,
          },
          last7days: {
            total: feedbacks1week?.length || 0,
            ...feedback1weekBreakdown,
          },
        },
        systemStatus: "operational",
      },
    })
  } catch (error) {
    console.error("[ADMIN DASHBOARD] Error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
