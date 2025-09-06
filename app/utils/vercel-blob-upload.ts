import { upload } from "@vercel/blob/client"

interface UploadProgress {
  uploadedBytes: number
  totalBytes: number
  percentage: number
}

export async function uploadLargeVideoToBlob(
  file: File,
  feedbackId: string,
  sessionId: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<{ success: boolean; blobUrl?: string; error?: string }> {
  try {
    console.log(`Starting direct Vercel Blob upload for ${file.name} (${file.size} bytes)`)

    // Generate a unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split(".").pop() || "webm"
    const blobFileName = `feedback-videos/${feedbackId}-${timestamp}.${fileExtension}`

    // Upload directly to Vercel Blob using client upload
    const blob = await upload(blobFileName, file, {
      access: "public",
      handleUploadUrl: "/api/upload-video-blob-direct",
      clientPayload: JSON.stringify({
        feedbackId,
        sessionId,
        originalFileName: file.name,
      }),
    })

    console.log("Direct upload to Vercel Blob completed:", blob.url)

    // Simulate progress for UX (since upload() doesn't provide real-time progress)
    if (onProgress) {
      // Quick progress simulation
      const steps = 20
      for (let i = 1; i <= steps; i++) {
        setTimeout(() => {
          if (onProgress) {
            onProgress({
              uploadedBytes: (file.size * i) / steps,
              totalBytes: file.size,
              percentage: Math.round((i / steps) * 100),
            })
          }
        }, i * 50) // Spread over 1 second
      }
    }

    // Now update the database with the blob URL
    const updateResponse = await fetch("/api/update-feedback-video", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        feedbackId,
        sessionId,
        videoUrl: blob.url,
        fileName: file.name,
        fileSize: file.size,
      }),
    })

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text()
      let errorMessage = "Failed to update feedback record"

      try {
        const errorData = JSON.parse(errorText)
        errorMessage = errorData.error || errorMessage
      } catch {
        // If response isn't JSON, use the text as error
        errorMessage = errorText || errorMessage
      }

      throw new Error(errorMessage)
    }

    const updateResult = await updateResponse.json()
    console.log("Feedback record updated successfully:", updateResult)

    return {
      success: true,
      blobUrl: blob.url,
    }
  } catch (error) {
    console.error("Direct Vercel Blob upload failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}
