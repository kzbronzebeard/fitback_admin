import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { validateSession } from "@/app/utils/session-manager"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

// Increase timeout for video uploads
export const maxDuration = 300 // 5 minutes
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    console.log("Video upload API called at:", new Date().toISOString())

    // Add timeout wrapper
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Upload timeout after 4 minutes")), 240000)
    })

    const uploadPromise = handleUpload(request)

    // Race between upload and timeout
    return await Promise.race([uploadPromise, timeoutPromise])
  } catch (error) {
    const duration = Date.now() - startTime
    console.error("Video upload failed:", {
      error: error instanceof Error ? error.message : String(error),
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    })

    if (error instanceof Error && error.message.includes("timeout")) {
      return NextResponse.json(
        {
          success: false,
          error: "Upload timeout. Please try with a smaller file or better connection.",
        },
        { status: 408 },
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: "Upload failed. Please try again.",
      },
      { status: 500 },
    )
  }
}

async function handleUpload(request: NextRequest) {
  // Parse form data with size limits
  let formData: FormData
  try {
    formData = await request.formData()
  } catch (error) {
    console.error("Error parsing form data:", error)
    return NextResponse.json({ success: false, error: "Invalid form data" }, { status: 400 })
  }

  const videoFile = formData.get("video") as File
  const feedbackId = formData.get("feedbackId") as string
  const sessionId = formData.get("sessionId") as string

  console.log("Form data received:", {
    hasVideo: !!videoFile,
    videoSize: videoFile?.size ? `${(videoFile.size / 1024 / 1024).toFixed(2)}MB` : "unknown",
    videoType: videoFile?.type,
    feedbackId,
    sessionId: sessionId ? "present" : "missing",
  })

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

  // Reduced file size limit for better reliability
  const maxSize = 25 * 1024 * 1024 // 25MB instead of 100MB
  if (videoFile.size > maxSize) {
    return NextResponse.json(
      {
        success: false,
        error: "File too large. Please compress your video to under 25MB.",
      },
      { status: 400 },
    )
  }

  console.log(`Processing video upload: ${(videoFile.size / 1024 / 1024).toFixed(2)}MB for feedback ${feedbackId}`)

  // Ensure videos bucket exists with proper configuration
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some((bucket) => bucket.name === "videos")

  if (!bucketExists) {
    const { error: bucketError } = await supabase.storage.createBucket("videos", {
      public: false,
      fileSizeLimit: maxSize,
      allowedMimeTypes: ["video/mp4", "video/webm", "video/quicktime", "video/mov", "video/avi"],
    })
    if (bucketError) {
      console.error("Bucket creation error:", bucketError)
      throw bucketError
    }
  }

  // Upload to Supabase Storage with retry logic
  const fileName = `${userId}/${feedbackId}/feedback-video-${Date.now()}.${getFileExtension(videoFile.type)}`

  let uploadAttempt = 0
  const maxRetries = 2

  while (uploadAttempt <= maxRetries) {
    try {
      console.log(`Upload attempt ${uploadAttempt + 1} for ${fileName}`)

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("videos")
        .upload(fileName, videoFile, {
          contentType: videoFile.type,
          upsert: true,
          duplex: "half", // Important for large files
        })

      if (uploadError) {
        throw uploadError
      }

      console.log("Video uploaded to storage:", uploadData.path)

      // Create video record in database
      const { data: videoRecord, error: dbError } = await supabase
        .from("videos")
        .insert({
          feedback_id: feedbackId,
          storage_path: uploadData.path,
          format: getFileExtension(videoFile.type),
          created_at: new Date().toISOString(),
        })
        .select("video_id")
        .single()

      if (dbError) {
        console.error("Database insert error:", dbError)
        // Try to clean up uploaded file
        await supabase.storage.from("videos").remove([uploadData.path])
        throw new Error(`Database error: ${dbError.message}`)
      }

      console.log("Video record created:", videoRecord)
      console.log("Video upload completed successfully")

      return NextResponse.json({
        success: true,
        videoId: videoRecord.video_id,
        path: uploadData.path,
        size: videoFile.size,
        duration: `${Date.now() - Date.now()}ms`,
      })
    } catch (error) {
      uploadAttempt++
      console.error(`Upload attempt ${uploadAttempt} failed:`, error)

      if (uploadAttempt > maxRetries) {
        throw error
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, 1000 * uploadAttempt))
    }
  }
}

function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
    "video/mov": "mov",
    "video/avi": "avi",
  }
  return extensions[mimeType] || "mp4"
}
