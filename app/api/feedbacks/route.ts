import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { ApiResponse, Feedback, CreateFeedbackRequest } from "@/app/types/api"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/feedbacks - Get all feedbacks for the authenticated user
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<Feedback[]>>> {
  try {
    // Get the authenticated user
    const authUserId = await getAuthUserId(request)
    if (!authUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's ID from the database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_user_id", authUserId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get all feedbacks for the user
    const { data, error } = await supabase
      .from("feedbacks")
      .select("*")
      .eq("user_id", userData.user_id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const feedbacks: Feedback[] = data.map((feedback) => ({
      feedbackId: feedback.feedback_id,
      userId: feedback.user_id,
      productUrl: feedback.product_url,
      brand: feedback.brand,
      size: feedback.size,
      fitScore: feedback.fit_score,
      keptStatus: feedback.kept_status as any,
      status: feedback.status as any,
      isFinal: feedback.is_final,
      originalFeedbackId: feedback.original_feedback_id,
      pointsAwarded: feedback.points_awarded,
      createdAt: feedback.created_at,
      updatedAt: feedback.updated_at,
    }))

    return NextResponse.json({ success: true, data: feedbacks })
  } catch (error) {
    console.error("Error fetching feedbacks:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// POST /api/feedbacks - Create a new feedback
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<Feedback>>> {
  try {
    const body: CreateFeedbackRequest = await request.json()

    // Get the authenticated user
    const authUserId = await getAuthUserId(request)
    if (!authUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's ID from the database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_user_id", authUserId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from("feedbacks")
      .insert({
        user_id: userData.user_id,
        product_url: body.productUrl,
        brand: body.brand,
        size: body.size,
        fit_score: body.fitScore,
        kept_status: body.keptStatus,
        status: "submitted",
        is_final: true,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single()

    if (error) throw error

    const feedback: Feedback = {
      feedbackId: data.feedback_id,
      userId: data.user_id,
      productUrl: data.product_url,
      brand: data.brand,
      size: data.size,
      fitScore: data.fit_score,
      keptStatus: data.kept_status as any,
      status: data.status as any,
      isFinal: data.is_final,
      originalFeedbackId: data.original_feedback_id,
      pointsAwarded: data.points_awarded,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({ success: true, data: feedback })
  } catch (error) {
    console.error("Error creating feedback:", error)
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
