import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Admin email whitelist
const ADMIN_EMAILS = ["p10khanazka@iima.ac.in", "team@tashion.ai"]

async function validateAdminAccess() {
  try {
    // Get session from cookies
    const cookieStore = cookies()
    const sessionId = cookieStore.get("fitback_session_id")?.value

    if (!sessionId) {
      return { isValid: false, error: "No session found" }
    }

    // Get user from session
    const { data: session } = await supabase
      .from("user_sessions")
      .select(`
        user_id,
        users!inner(email, is_blocked)
      `)
      .eq("session_id", sessionId)
      .eq("is_active", true)
      .single()

    if (!session || !session.users) {
      return { isValid: false, error: "Invalid session" }
    }

    const userEmail = session.users.email
    const isBlocked = session.users.is_blocked

    if (isBlocked) {
      return { isValid: false, error: "User is blocked" }
    }

    if (!ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
      return { isValid: false, error: "Admin access required" }
    }

    return { isValid: true, user: session.users }
  } catch (error) {
    console.error("[ADMIN AUTH] Error:", error)
    return { isValid: false, error: "Authentication failed" }
  }
}

export async function GET() {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess()
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const now = new Date()
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get user registration stats
    const { data: users24h } = await supabase
      .from("users")
      .select("user_id")
      .gte("created_at", twentyFourHoursAgo.toISOString())

    const { data: users1week } = await supabase
      .from("users")
      .select("user_id")
      .gte("created_at", oneWeekAgo.toISOString())

    // Get feedback stats
    const { data: feedbacks24h } = await supabase
      .from("feedbacks")
      .select("feedback_id, status")
      .gte("created_at", twentyFourHoursAgo.toISOString())

    const { data: feedbacks1week } = await supabase
      .from("feedbacks")
      .select("feedback_id, status")
      .gte("created_at", oneWeekAgo.toISOString())

    // Calculate feedback breakdowns
    const feedback24hBreakdown = {
      pending: feedbacks24h?.filter((f) => f.status === "pending").length || 0,
      approved: feedbacks24h?.filter((f) => f.status === "approved").length || 0,
      rejected: feedbacks24h?.filter((f) => f.status === "rejected").length || 0,
    }

    const feedback1weekBreakdown = {
      pending: feedbacks1week?.filter((f) => f.status === "pending").length || 0,
      approved: feedbacks1week?.filter((f) => f.status === "approved").length || 0,
      rejected: feedbacks1week?.filter((f) => f.status === "rejected").length || 0,
    }

    return NextResponse.json({
      success: true,
      data: {
        users: {
          last24h: users24h?.length || 0,
          lastWeek: users1week?.length || 0,
        },
        feedbacks: {
          last24h: {
            total: feedbacks24h?.length || 0,
            ...feedback24hBreakdown,
          },
          lastWeek: {
            total: feedbacks1week?.length || 0,
            ...feedback1weekBreakdown,
          },
        },
      },
    })
  } catch (error) {
    console.error("[ADMIN DASHBOARD] Error:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
