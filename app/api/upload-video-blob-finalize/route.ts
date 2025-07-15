import { type NextRequest, NextResponse } from "next/server"
import { del } from "@vercel/blob"
import { createClient } from "@supabase/supabase-js"
import { validateSession } from "@/app/utils/session-manager"

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const { chunkUrls, fileName, feedbackId, sessionId, totalSize, mimeType } = await request.json()

    if (!chunkUrls || !fileName || !feedbackId || !sessionId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Validate session
    const sessionResult = await validateSession(sessionId)
    if (!sessionResult.isValid || !sessionResult.user) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    const userId = sessionResult.user.user_id

    console.log(`Finalizing upload: ${chunkUrls.length} chunks for ${fileName}`)

    // Download and combine chunks
    const chunkBuffers: ArrayBuffer[] = []

    for (let i = 0; i < chunkUrls.length; i++) {
      const response = await fetch(chunkUrls[i])
      if (!response.ok) {
        throw new Error(`Failed to download chunk ${i}`)
      }
      const buffer = await response.arrayBuffer()
      chunkBuffers.push(buffer)
    }

    // Combine chunks into single buffer
    const totalLength = chunkBuffers.reduce((sum, buffer) => sum + buffer.byteLength, 0)
    const combinedBuffer = new Uint8Array(totalLength)
    let offset = 0

    for (const buffer of chunkBuffers) {
      combinedBuffer.set(new Uint8Array(buffer), offset)
      offset += buffer.byteLength
    }

    console.log(`Combined ${chunkBuffers.length} chunks into ${totalLength} bytes`)

    // Upload combined file to Supabase Storage
    const supabaseFileName = `${userId}/${feedbackId}/feedback-video.${fileName.split(".").pop() || "webm"}`

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("videos")
      .upload(supabaseFileName, combinedBuffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) {
      console.error("Supabase upload error:", uploadError)
      throw new Error(`Supabase upload failed: ${uploadError.message}`)
    }

    console.log("Video uploaded to Supabase:", uploadData.path)

    // Create video record in database
    const { data: videoRecord, error: dbError } = await supabase
      .from("videos")
      .insert({
        feedback_id: feedbackId,
        storage_path: uploadData.path,
        format: mimeType.split("/")[1] || "webm",
        created_at: new Date().toISOString(),
      })
      .select("video_id")
      .single()

    if (dbError) {
      console.error("Database insert error:", dbError)
      // Clean up uploaded file
      await supabase.storage.from("videos").remove([uploadData.path])
      throw new Error(`Database error: ${dbError.message}`)
    }

    // Clean up temporary chunks from Vercel Blob
    try {
      await Promise.all(
        chunkUrls.map((url: string) => {
          const urlParts = url.split("/")
          const fileName = urlParts[urlParts.length - 1]
          return del(url)
        }),
      )
      console.log("Temporary chunks cleaned up")
    } catch (cleanupError) {
      console.warn("Chunk cleanup failed:", cleanupError)
      // Don't fail the whole operation for cleanup issues
    }

    console.log("Chunked upload finalized successfully")

    return NextResponse.json({
      success: true,
      videoId: videoRecord.video_id,
      finalUrl: uploadData.path,
    })
  } catch (error) {
    console.error("Finalize upload error:", error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : "Finalization failed" },
      { status: 500 },
    )
  }
}
