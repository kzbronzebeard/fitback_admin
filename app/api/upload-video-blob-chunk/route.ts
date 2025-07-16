import { type NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const chunk = formData.get("chunk") as File
    const chunkIndex = Number.parseInt(formData.get("chunkIndex") as string)
    const totalChunks = Number.parseInt(formData.get("totalChunks") as string)
    const feedbackId = formData.get("feedbackId") as string
    const sessionId = formData.get("sessionId") as string
    const fileName = formData.get("fileName") as string

    if (!chunk || !feedbackId || !sessionId) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    // Store chunk in Vercel Blob with a unique path
    const chunkPath = `temp-chunks/${feedbackId}/${chunkIndex}.chunk`

    const blob = await put(chunkPath, chunk, {
      access: "public",
    })

    console.log(`Chunk ${chunkIndex}/${totalChunks - 1} uploaded to:`, blob.url)

    return NextResponse.json({
      success: true,
      chunkIndex,
      url: blob.url,
    })
  } catch (error) {
    console.error("Error uploading chunk:", error)
    return NextResponse.json({ error: "Failed to upload chunk" }, { status: 500 })
  }
}
