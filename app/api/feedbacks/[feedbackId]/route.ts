import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { ApiResponse, Feedback, UpdateFeedbackRequest } from "@/app/types/api"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/feedbacks/[feedbackId] - Get a specific feedback
export async function GET(
  request: NextRequest,
  { params }: { params: { feedbackId: string } },
): Promise<NextResponse<ApiResponse<Feedback>>> {
  try {
    const feedbackId = params.feedbackId

    // Check if user is authorized to access this feedback
    const authUserId = await getAuthUserId(request)
    const isAuthorized = await isUserAuthorizedForFeedback(authUserId, feedbackId)

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { data, error } = await supabase.from("feedbacks").select("*").eq("feedback_id", feedbackId).single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ success: false, error: "Feedback not found" }, { status: 404 })
    }

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
    console.error("Error fetching feedback:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// PATCH /api/feedbacks/[feedbackId] - Update a feedback
export async function PATCH(
  request: NextRequest,
  { params }: { params: { feedbackId: string } },
): Promise<NextResponse<ApiResponse<Feedback>>> {
  try {
    const feedbackId = params.feedbackId
    const body: UpdateFeedbackRequest = await request.json()

    // Check if user is authorized to update this feedback
    const authUserId = await getAuthUserId(request)
    const isAdmin = await checkIfAdmin(authUserId)
    const isOwner = await isUserAuthorizedForFeedback(authUserId, feedbackId)

    // Regular users can only update their own feedback if it's not final
    // Admins can update any feedback
    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Check if feedback is final and user is not admin
    if (!isAdmin && isOwner) {
      const { data: feedbackData } = await supabase
        .from("feedbacks")
        .select("is_final")
        .eq("feedback_id", feedbackId)
        .single()

      if (feedbackData?.is_final) {
        return NextResponse.json({ success: false, error: "Cannot update finalized feedback" }, { status: 403 })
      }
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Only allow certain fields to be updated
    if (body.productUrl !== undefined) updateData.product_url = body.productUrl
    if (body.brand !== undefined) updateData.brand = body.brand
    if (body.size !== undefined) updateData.size = body.size
    if (body.fitScore !== undefined) updateData.fit_score = body.fitScore
    if (body.keptStatus !== undefined) updateData.kept_status = body.keptStatus

    // Only admins can update these fields
    if (isAdmin) {
      if (body.status !== undefined) updateData.status = body.status
      if (body.isFinal !== undefined) updateData.is_final = body.isFinal
      if (body.pointsAwarded !== undefined) updateData.points_awarded = body.pointsAwarded
    }

    const { data, error } = await supabase
      .from("feedbacks")
      .update(updateData)
      .eq("feedback_id", feedbackId)
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
    console.error("Error updating feedback:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// DELETE /api/feedbacks/[feedbackId] - Delete a feedback
export async function DELETE(
  request: NextRequest,
  { params }: { params: { feedbackId: string } },
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const feedbackId = params.feedbackId

    // Check if user is authorized to delete this feedback
    const authUserId = await getAuthUserId(request)
    const isAdmin = await checkIfAdmin(authUserId)
    const isOwner = await isUserAuthorizedForFeedback(authUserId, feedbackId)

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    // Check if feedback is final and user is not admin
    if (!isAdmin && isOwner) {
      const { data: feedbackData } = await supabase
        .from("feedbacks")
        .select("is_final, created_at")
        .eq("feedback_id", feedbackId)
        .single()

      if (feedbackData?.is_final) {
        return NextResponse.json({ success: false, error: "Cannot delete finalized feedback" }, { status: 403 })
      }

      // Check if feedback is older than 24 hours
      const createdAt = new Date(feedbackData?.created_at)
      const now = new Date()
      const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

      if (hoursDiff > 24) {
        return NextResponse.json(
          { success: false, error: "Cannot delete feedback older than 24 hours" },
          { status: 403 },
        )
      }
    }

    const { error } = await supabase.from("feedbacks").delete().eq("feedback_id", feedbackId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "Feedback deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting feedback:", error)
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

// Helper function to check if user is authorized to access/modify a feedback
async function isUserAuthorizedForFeedback(authUserId: string | null, feedbackId: string): Promise<boolean> {
  if (!authUserId) return false

  try {
    // Check if the authenticated user is an admin
    const isAdmin = await checkIfAdmin(authUserId)
    if (isAdmin) return true

    // Check if the authenticated user owns the feedback
    const { data: userData } = await supabase.from("users").select("user_id").eq("auth_user_id", authUserId).single()

    if (!userData) return false

    const { data: feedbackData } = await supabase
      .from("feedbacks")
      .select("user_id")
      .eq("feedback_id", feedbackId)
      .single()

    return feedbackData?.user_id === userData.user_id
  } catch (error) {
    console.error("Error checking feedback authorization:", error)
    return false
  }
}
