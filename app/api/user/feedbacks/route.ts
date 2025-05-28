import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { ApiResponse, Feedback } from "@/app/types/api"
import { validateSession } from "@/app/utils/session-manager"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/user/feedbacks - Get all feedbacks for the authenticated user
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Feedback[]>>> {
  try {
    // Get session ID from headers
    const sessionId = request.headers.get("x-session-id")
    if (!sessionId) {
      return NextResponse.json({ success: false, error: "No session ID provided" }, { status: 401 })
    }

    // Validate session
    const sessionResult = await validateSession(sessionId)
    if (!sessionResult.isValid || !sessionResult.user) {
      return NextResponse.json({ success: false, error: "Invalid or expired session" }, { status: 401 })
    }

    const userId = sessionResult.user.user_id

    // Step 1: Get all user feedbacks first
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (feedbackError) {
      console.error("Error fetching feedbacks:", feedbackError)
      throw feedbackError
    }

    // Step 2: Get videos for all feedbacks
    const feedbackIds = feedbackData?.map((f) => f.feedback_id) || []
    const { data: videosData } =
      feedbackIds.length > 0 ? await supabase.from("videos").select("*").in("feedback_id", feedbackIds) : { data: [] }

    // Step 3: Get admin reviews ONLY for non-pending feedbacks
    const reviewedFeedbackIds = feedbackData?.filter((f) => f.status !== "pending").map((f) => f.feedback_id) || []

    const { data: adminReviewsData } =
      reviewedFeedbackIds.length > 0
        ? await supabase.from("admin_reviews").select("*").in("feedback_id", reviewedFeedbackIds)
        : { data: [] }

    // Add logging for debugging
    console.log(`Found ${feedbackData?.length || 0} feedbacks for user ${userId}`)
    console.log(`Found ${reviewedFeedbackIds.length} non-pending feedbacks`)
    console.log(`Found ${adminReviewsData?.length || 0} admin reviews`)

    // Create lookup maps for efficient joining
    const videosMap = new Map(videosData?.map((v) => [v.feedback_id, v]) || [])
    const adminReviewsMap = new Map(adminReviewsData?.map((ar) => [ar.feedback_id, ar]) || [])

    // Transform the data with manual joins
    const feedbacks: Feedback[] = (feedbackData || []).map((feedback) => {
      const video = videosMap.get(feedback.feedback_id)
      const adminReview = adminReviewsMap.get(feedback.feedback_id)

      return {
        feedbackId: feedback.feedback_id,
        userId: feedback.user_id,
        productUrl: feedback.product_url,
        brand: feedback.brand,
        size: feedback.size,
        fitScore: feedback.fit_score,
        keptStatus: feedback.kept_status as any,
        status: adminReview?.status || feedback.status || "pending", // Use admin review status if exists, otherwise feedback status
        isFinal: true,
        originalFeedbackId: feedback.original_feedback_id,
        pointsAwarded: feedback.points_awarded,
        cashbackAmount: feedback.cashback_amount || 0,
        createdAt: feedback.created_at,
        updatedAt: feedback.updated_at,
        adminNotes: adminReview?.notes,
        videoPath: video?.storage_path,
        videoFormat: video?.format,
      }
    })

    return NextResponse.json({ success: true, feedbacks: feedbacks })
  } catch (error) {
    console.error("Error fetching user feedbacks:", error)
    return NextResponse.json(
      {
        success: false,
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
