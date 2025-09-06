import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Validate the request - you can add authentication here
        console.log("Generating upload token for:", pathname)

        return {
          allowedContentTypes: ["video/webm", "video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB limit
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Blob upload completed:", blob.url)
        // The actual database update will happen in a separate call
        // This just confirms the upload to Vercel Blob succeeded
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Upload handler error:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 })
  }
}
