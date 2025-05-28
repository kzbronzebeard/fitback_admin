import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { ApiResponse } from "@/app/types/api"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

type WalletData = {
  totalEarned: number
  availableToRedeem: number
  pendingPayout: number
  pendingReview: number
}

// GET /api/user/wallet - Get wallet balance for authenticated user
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<WalletData>>> {
  try {
    // Get the authenticated user from the Authorization header
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "No authorization token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)

    // Verify the token with Supabase Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ success: false, error: "Invalid or expired token" }, { status: 401 })
    }

    // Get the user's internal ID from the users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_user_id", user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: "User profile not found" }, { status: 404 })
    }

    // Calculate wallet balances from feedbacks
    const { data: feedbacks, error: feedbackError } = await supabase
      .from("feedbacks")
      .select(`
        cashback_amount,
        status,
        admin_reviews (status)
      `)
      .eq("user_id", userData.user_id)

    if (feedbackError) {
      console.error("Error fetching feedback data for wallet:", feedbackError)
      throw feedbackError
    }

    // Calculate totals
    let totalEarned = 0
    let pendingReview = 0
    let availableToRedeem = 0

    feedbacks?.forEach((feedback) => {
      const adminReview = feedback.admin_reviews?.[0]
      const status = adminReview?.status || feedback.status
      const amount = feedback.cashback_amount || 0

      if (status === "approved") {
        totalEarned += amount
        availableToRedeem += amount
      } else if (status === "pending") {
        pendingReview += amount
      }
    })

    // For now, assume no pending payouts (this would come from a payouts table)
    const pendingPayout = 0

    const walletData: WalletData = {
      totalEarned,
      availableToRedeem,
      pendingPayout,
      pendingReview,
    }

    return NextResponse.json({ success: true, data: walletData })
  } catch (error) {
    console.error("Error fetching wallet data:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
