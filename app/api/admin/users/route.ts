import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateSession } from "../../../utils/session-manager"

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Admin email whitelist
const ADMIN_EMAILS = ["p10khanazka@iima.ac.in", "team@tashion.ai"]

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

    const url = new URL(request.url)
    const page = Number.parseInt(url.searchParams.get("page") || "1")
    const limit = Number.parseInt(url.searchParams.get("limit") || "10")
    const userFlag = url.searchParams.get("userFlag")

    const offset = (page - 1) * limit

    // Build query for users with feedback stats
    let query = supabase.from("users").select(`
      *,
      feedbacks:feedbacks(
        feedback_id,
        status,
        created_at
      )
    `)

    // Add user flag filter if specified
    if (userFlag && userFlag !== "all") {
      query = query.eq("user_flag", userFlag)
    }

    // Order by oldest pending feedback
    query = query.order("created_at", { ascending: true })

    // Add pagination
    query = query.range(offset, offset + limit - 1)

    const { data: users, error, count } = await query

    if (error) {
      console.error("[ADMIN USERS] Query error:", error)
      throw error
    }

    // Process users to add stats
    const processedUsers = users?.map((user) => {
      const feedbacks = user.feedbacks || []
      const pendingFeedbacks = feedbacks.filter((f) => f.status === "pending")
      const approvedFeedbacks = feedbacks.filter((f) => f.status === "approved")
      const rejectedFeedbacks = feedbacks.filter((f) => f.status === "rejected")

      // Get oldest pending feedback date
      const oldestPendingDate =
        pendingFeedbacks.length > 0
          ? new Date(Math.min(...pendingFeedbacks.map((f) => new Date(f.created_at).getTime())))
          : null

      return {
        ...user,
        stats: {
          total_feedbacks: feedbacks.length,
          pending_feedbacks: pendingFeedbacks.length,
          approved_feedbacks: approvedFeedbacks.length,
          rejected_feedbacks: rejectedFeedbacks.length,
          oldest_pending_date: oldestPendingDate,
          earned_amount: approvedFeedbacks.length * 50, // ₹50 per approved feedback
        },
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        users: processedUsers || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    })
  } catch (error) {
    console.error("[ADMIN USERS] Error:", error)
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Validate admin access
    const authResult = await validateAdminAccess(request)
    if (!authResult.isValid) {
      return NextResponse.json({ error: authResult.error }, { status: 401 })
    }

    const body = await request.json()
    const { userId, action, userFlag, payoutAmount } = body

    if (!userId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get user details
    const { data: user } = await supabase.from("users").select("*").eq("user_id", userId).single()

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Handle different actions
    if (action === "block") {
      const { error: blockError } = await supabase.from("users").update({ is_blocked: true }).eq("user_id", userId)

      if (blockError) throw blockError

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_user_id: authResult.userId,
        action_type: "block_user",
        target_type: "user",
        target_id: userId,
        details: { reason: body.reason || "Admin action" },
      })
    } else if (action === "unblock") {
      const { error: unblockError } = await supabase.from("users").update({ is_blocked: false }).eq("user_id", userId)

      if (unblockError) throw unblockError

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_user_id: authResult.userId,
        action_type: "unblock_user",
        target_type: "user",
        target_id: userId,
        details: { reason: body.reason || "Admin action" },
      })
    } else if (action === "update_flag" && userFlag) {
      const { error: flagError } = await supabase.from("users").update({ user_flag: userFlag }).eq("user_id", userId)

      if (flagError) throw flagError

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_user_id: authResult.userId,
        action_type: "update_user_flag",
        target_type: "user",
        target_id: userId,
        details: { flag: userFlag, reason: body.reason || "Admin action" },
      })
    } else if (action === "update_payout" && payoutAmount !== undefined) {
      // Check if payout record exists
      const { data: existingPayout } = await supabase.from("payouts").select("*").eq("user_id", userId).single()

      if (existingPayout) {
        // Update existing payout record
        const { error: updateError } = await supabase
          .from("payouts")
          .update({
            total_payout_till_date: payoutAmount,
            last_payout_date: new Date().toISOString(),
          })
          .eq("user_id", userId)

        if (updateError) throw updateError
      } else {
        // Create new payout record
        const { error: insertError } = await supabase.from("payouts").insert({
          user_id: userId,
          total_payout_till_date: payoutAmount,
          last_payout_date: new Date().toISOString(),
        })

        if (insertError) throw insertError
      }

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_user_id: authResult.userId,
        action_type: "update_payout",
        target_type: "user",
        target_id: userId,
        details: { amount: payoutAmount },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN USERS] Error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}
