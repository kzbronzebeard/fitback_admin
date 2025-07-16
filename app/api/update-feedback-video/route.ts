import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateSession } from "@/app/utils/session-manager"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { feedbackId, sessionId, videoUrl, fileName, fileSize } = await request.json()

    console.log("Updating feedback record:", {
      feedbackId,
      sessionId,
      videoUrl,
      fileName,
      fileSize,
    })

    // Validate required fields
    if (!feedbackId || !sessionId || !videoUrl) {
      return NextResponse.json(
        { error: "Missing required fields: feedbackId, sessionId, or videoUrl" },
        { status: 400 },
      )
    }

    // Validate session
    const sessionResult = await validateSession(sessionId)
    if (!sessionResult.isValid || !sessionResult.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 })
    }

    // First, verify the feedback exists and belongs to this session
    const { data: feedbackData, error: feedbackError } = await supabase
      .from("feedbacks")
      .select("feedback_id, status")
      .eq("feedback_id", feedbackId)
      .single()

    if (feedbackError || !feedbackData) {
      console.error("Feedback verification error:", feedbackError)
      return NextResponse.json({ error: "Feedback record not found" }, { status: 404 })
    }

    // Create video record in the videos table (following your existing schema)
    const { data: videoData, error: videoError } = await supabase
      .from("videos")
      .insert({
        feedback_id: feedbackId,
        storage_path: videoUrl, // Store the Vercel Blob URL as storage path
        format: fileName ? fileName.split(".").pop() || "webm" : "webm",
        video_type: "original",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (videoError) {
      console.error("Video record creation error:", videoError)
      return NextResponse.json({ error: "Failed to create video record: " + videoError.message }, { status: 500 })
    }

    // Update feedback status to indicate video has been uploaded
    const { data: updatedFeedback, error: updateError } = await supabase
      .from("feedbacks")
      .update({
        status: "pending", // Keep existing status workflow
      })
      .eq("feedback_id", feedbackId)
      .select()
      .single()

    if (updateError) {
      console.error("Feedback update error:", updateError)
      // If feedback update fails, clean up the video record
      await supabase.from("videos").delete().eq("video_id", videoData.video_id)
      return NextResponse.json({ error: "Failed to update feedback status: " + updateError.message }, { status: 500 })
    }

    console.log("Video record created successfully:", videoData)
    console.log("Feedback updated successfully:", updatedFeedback)

    return NextResponse.json({
      success: true,
      video: videoData,
      feedback: updatedFeedback,
    })
  } catch (error) {
    console.error("Update feedback video error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
