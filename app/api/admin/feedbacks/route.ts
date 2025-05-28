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
      console.log("[ADMIN AUTH] No session found")
      return { isValid: false, error: "No session found" }
    }

    // Validate session using existing session manager
    const sessionResult = await validateSession(sessionId)

    if (!sessionResult.isValid || !sessionResult.user) {
      console.log("[ADMIN AUTH] Invalid session")
      return { isValid: false, error: "Invalid session" }
    }

    const userEmail = sessionResult.user.email
    const isBlocked = sessionResult.user.is_blocked

    if (isBlocked) {
      console.log("[ADMIN AUTH] User is blocked:", userEmail)
      return { isValid: false, error: "User is blocked" }
    }

    if (!ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
      console.log("[ADMIN AUTH] Not an admin email:", userEmail)
      return { isValid: false, error: "Admin access required" }
    }

    console.log("[ADMIN AUTH] Admin access granted for:", userEmail)
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
    const status = url.searchParams.get("status") || "pending"
    const userFlag = url.searchParams.get("userFlag")

    const offset = (page - 1) * limit

    // Build query for feedbacks with user details - use LEFT JOIN instead of INNER JOIN
    let query = supabase
      .from("feedbacks")
      .select(`
        *,
        users(
          user_id,
          name,
          email,
          height_cm,
          weight_kg,
          gender,
          body_type,
          user_flag,
          is_blocked
        )
      `)
      .eq("status", status)
      .order("created_at", { ascending: true })
      .range(offset, offset + limit - 1)

    // Add user flag filter if specified
    if (userFlag && userFlag !== "all") {
      query = query.eq("users.user_flag", userFlag)
    }

    const { data: feedbacks, error, count } = await query

    if (error) {
      console.error("[ADMIN FEEDBACKS] Query error:", error)
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        feedbacks: feedbacks || [],
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit),
        },
      },
    })
  } catch (error) {
    console.error("[ADMIN FEEDBACKS] Error:", error)
    return NextResponse.json({ error: "Failed to fetch feedbacks" }, { status: 500 })
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
    const { feedbackId, action, comments, userFlag } = body

    if (!feedbackId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Get feedback details
    const { data: feedback } = await supabase
      .from("feedbacks")
      .select("user_id, status")
      .eq("feedback_id", feedbackId)
      .single()

    if (!feedback) {
      return NextResponse.json({ error: "Feedback not found" }, { status: 404 })
    }

    // Update feedback status
    if (action === "approve" || action === "reject") {
      const newStatus = action === "approve" ? "approved" : "rejected"

      const { error: updateError } = await supabase
        .from("feedbacks")
        .update({ status: newStatus })
        .eq("feedback_id", feedbackId)

      if (updateError) throw updateError

      // If approved, add cashback to user's wallet
      if (action === "approve") {
        const { error: walletError } = await supabase.from("wallet_transactions").insert({
          user_id: feedback.user_id,
          amount: 50,
          type: "credit",
          description: "Feedback approved",
          reference_feedback_id: feedbackId,
        })

        if (walletError) {
          console.error("[ADMIN FEEDBACKS] Wallet error:", walletError)
          // Don't fail the whole operation if wallet update fails
        }
      }

      // Log admin action
      await supabase.from("admin_actions").insert({
        admin_user_id: authResult.userId,
        action_type: action,
        target_type: "feedback",
        target_id: feedbackId,
        details: { comments },
      })
    }

    // Update user flag if provided
    if (userFlag && userFlag !== "none") {
      const { error: flagError } = await supabase
        .from("users")
        .update({ user_flag: userFlag })
        .eq("user_id", feedback.user_id)

      if (flagError) throw flagError

      // Log user flag action
      await supabase.from("admin_actions").insert({
        admin_user_id: authResult.userId,
        action_type: "flag_user",
        target_type: "user",
        target_id: feedback.user_id,
        details: { flag: userFlag, reason: comments },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[ADMIN FEEDBACKS] Error:", error)
    return NextResponse.json({ error: "Failed to update feedback" }, { status: 500 })
  }
}
