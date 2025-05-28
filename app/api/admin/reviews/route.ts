import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { ApiResponse, AdminReview, CreateAdminReviewRequest } from "@/app/types/api"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/admin/reviews - Get all admin reviews (admin only)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<AdminReview[]>>> {
  try {
    // Check if user is admin
    const authUserId = await getAuthUserId(request)
    const isAdmin = await checkIfAdmin(authUserId)

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Get query parameters
    const url = new URL(request.url)
    const feedbackId = url.searchParams.get("feedbackId")

    let query = supabase.from("admin_reviews").select("*").order("reviewed_at", { ascending: false })

    // Filter by feedback ID if provided
    if (feedbackId) {
      query = query.eq("feedback_id", feedbackId)
    }

    const { data, error } = await query

    if (error) throw error

    const reviews: AdminReview[] = data.map((review) => ({
      reviewId: review.review_id,
      feedbackId: review.feedback_id,
      status: review.status,
      reviewedBy: review.reviewed_by,
      notes: review.notes,
      reviewedAt: review.reviewed_at,
    }))

    return NextResponse.json({ success: true, data: reviews })
  } catch (error) {
    console.error("Error fetching admin reviews:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// POST /api/admin/reviews - Create a new admin review (admin only)
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<AdminReview>>> {
  try {
    const body: CreateAdminReviewRequest = await request.json()

    // Check if user is admin
    const authUserId = await getAuthUserId(request)
    const isAdmin = await checkIfAdmin(authUserId)

    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Get admin username
    const { data: userData } = await supabase.from("users").select("name").eq("auth_user_id", authUserId).single()

    const reviewedBy = userData?.name || "Unknown Admin"
    const now = new Date().toISOString()

    // Begin transaction
    const { data, error } = await supabase.rpc("create_admin_review", {
      feedback_id_param: body.feedbackId,
      status_param: body.status,
      notes_param: body.notes,
      reviewed_by_param: reviewedBy,
    })

    if (error) throw error

    // Return the review data
    const review: AdminReview = {
      reviewId: data.review_id,
      feedbackId: body.feedbackId,
      status: body.status,
      reviewedBy: reviewedBy,
      notes: body.notes,
      reviewedAt: now,
    }

    return NextResponse.json({ success: true, data: review })
  } catch (error) {
    console.error("Error creating admin review:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// Helper function to get authenticated user ID
async function getAuthUserId(request: NextRequest): Promise<string | null> {
  // In a real app, you would extract this from the session or token
  // For now, we'll use a placeholder implementation
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.substring(7)

  // Verify the token with Supabase Auth
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null

  return data.user.id
}

// Helper function to check if user is admin
async function checkIfAdmin(authUserId: string | null): Promise<boolean> {
  if (!authUserId) return false

  try {
    const { data } = await supabase.from("users").select("is_admin").eq("auth_user_id", authUserId).single()

    return data?.is_admin === true
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}
