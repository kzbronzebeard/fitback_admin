import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { validateSession } from "@/app/utils/session-manager"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const chunk = formData.get("chunk") as File
    const chunkIndex = formData.get("chunkIndex") as string
    const totalChunks = formData.get("totalChunks") as string
    const fileName = formData.get("fileName") as string
    const feedbackId = formData.get("feedbackId") as string
    const sessionId = formData.get("sessionId") as string

    if (!chunk || !chunkIndex || !totalChunks || !fileName || !feedbackId || !sessionId) {
      return NextResponse.json({ success: false, error: "Missing required parameters" }, { status: 400 })
    }

    // Validate session
    const sessionResult = await validateSession(sessionId)
    if (!sessionResult.isValid) {
      return NextResponse.json({ success: false, error: "Invalid session" }, { status: 401 })
    }

    // Upload chunk to Vercel Blob
    const chunkFileName = `temp-chunks/${feedbackId}/${fileName}-chunk-${chunkIndex}`
    const blob = await put(chunkFileName, chunk, {
      access: "public",
      addRandomSuffix: false,
    })

    return NextResponse.json({
      success: true,
      chunkUrl: blob.url,
      chunkIndex: Number.parseInt(chunkIndex),
      totalChunks: Number.parseInt(totalChunks),
    })
  } catch (error) {
    console.error("Chunk upload error:", error)
    return NextResponse.json({ success: false, error: "Chunk upload failed" }, { status: 500 })
  }
}
