import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

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

    // Update the feedback record with the video URL
    const { data, error } = await supabase
      .from("feedbacks")
      .update({
        video_url: videoUrl,
        video_filename: fileName,
        video_size: fileSize,
        status: "pending_review",
        updated_at: new Date().toISOString(),
      })
      .eq("id", feedbackId)
      .eq("session_id", sessionId) // Security check
      .select()

    if (error) {
      console.error("Database update error:", error)
      return NextResponse.json({ error: "Failed to update feedback record: " + error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: "Feedback record not found or access denied" }, { status: 404 })
    }

    console.log("Feedback record updated successfully:", data[0])

    return NextResponse.json({
      success: true,
      feedback: data[0],
    })
  } catch (error) {
    console.error("Update feedback video error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
