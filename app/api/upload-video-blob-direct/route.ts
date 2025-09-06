import { handleUpload, type HandleUploadBody } from "@vercel/blob/client"
import { NextResponse } from "next/server"

export async function POST(request: Request): Promise<NextResponse> {
  // Check if we have the required environment
  const hasToken = process.env.BLOB_READ_WRITE_TOKEN
  const isProduction = process.env.VERCEL_ENV === "production"
  const isPreview = process.env.VERCEL_ENV === "preview"

  console.log("Environment check:", { hasToken: !!hasToken, isProduction, isPreview })

  if (!hasToken) {
    console.error("BLOB_READ_WRITE_TOKEN not found")
    return NextResponse.json(
      { error: "Blob storage not configured. This will work in production with proper environment variables." },
      { status: 500 },
    )
  }

  const body = (await request.json()) as HandleUploadBody

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        console.log("Generating upload token for:", pathname)

        return {
          allowedContentTypes: ["video/webm", "video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"],
          maximumSizeInBytes: 50 * 1024 * 1024, // 50MB limit
        }
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log("Blob upload completed:", blob.url)
      },
    })

    return NextResponse.json(jsonResponse)
  } catch (error) {
    console.error("Upload handler error:", error)

    // If it's the server environment error, provide helpful message
    if (error instanceof Error && error.message.includes("server environment")) {
      return NextResponse.json(
        {
          error: "Server environment issue. This typically works in production deployment.",
          details: error.message,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 })
  }
}
