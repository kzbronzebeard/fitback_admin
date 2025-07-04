import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateSession } from "@/app/utils/session-manager"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    console.log("Video upload API called")

    // Get form data
    const formData = await request.formData()
    const videoFile = formData.get("video") as File
    const feedbackId = formData.get("feedbackId") as string
    const sessionId = formData.get("sessionId") as string

    if (!videoFile || !feedbackId || !sessionId) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Validate session
    const sessionResult = await validateSession(sessionId)
    if (!sessionResult.isValid || !sessionResult.user) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    const userId = sessionResult.user.user_id

    // Validate file
    if (!videoFile.type.startsWith("video/")) {
      return NextResponse.json({ success: false, error: "Invalid file type" }, { status: 400 })
    }

    // Check file size (50MB limit)
    const maxSize = 50 * 1024 * 1024
    if (videoFile.size > maxSize) {
      return NextResponse.json({ success: false, error: "File too large" }, { status: 400 })
    }

    console.log(`Uploading video: ${videoFile.size} bytes for feedback ${feedbackId}`)

    // Ensure videos bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === "videos")

    if (!bucketExists) {
      const { error: bucketError } = await supabase.storage.createBucket("videos", {
        public: false,
        fileSizeLimit: maxSize,
      })
      if (bucketError) {
        console.error("Bucket creation error:", bucketError)
        throw bucketError
      }
    }

    // Upload to Supabase Storage
    const fileName = `${userId}/${feedbackId}/feedback-video.webm`
    const { data: uploadData, error: uploadError } = await supabase.storage.from("videos").upload(fileName, videoFile, {
      contentType: videoFile.type,
      upsert: true,
    })

    if (uploadError) {
      console.error("Storage upload error:", uploadError)
      return NextResponse.json({ success: false, error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    console.log("Video uploaded to storage:", uploadData.path)

    // Create video record in database
    const { data: videoRecord, error: dbError } = await supabase
      .from("videos")
      .insert({
        feedback_id: feedbackId,
        storage_path: uploadData.path,
        format: videoFile.type.split("/")[1] || "webm",
        created_at: new Date().toISOString(),
      })
      .select("video_id")
      .single()

    if (dbError) {
      console.error("Database insert error:", dbError)
      // Try to clean up uploaded file
      await supabase.storage.from("videos").remove([uploadData.path])

      return NextResponse.json({ success: false, error: `Database error: ${dbError.message}` }, { status: 500 })
    }

    console.log("Video record created:", videoRecord)

    // Note: We don't need to update the feedback record here since it's already created with "pending" status
    // The video upload completion is tracked by the existence of a record in the videos table
    console.log("Video upload completed successfully - feedback remains in pending status for admin review")

    return NextResponse.json({
      success: true,
      videoId: videoRecord.video_id,
      path: uploadData.path,
    })
  } catch (error) {
    console.error("Video upload API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
