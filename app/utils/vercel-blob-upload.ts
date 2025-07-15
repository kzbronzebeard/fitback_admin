"use client"

interface UploadProgress {
  uploadedBytes: number
  totalBytes: number
  percentage: number
}

const CHUNK_SIZE = 1024 * 1024 // 1MB chunks

export async function uploadLargeVideoToBlob(
  videoFile: File,
  feedbackId: string,
  sessionId: string,
  onProgress?: (progress: UploadProgress) => void,
): Promise<{ success: boolean; blobUrl?: string; error?: string }> {
  try {
    console.log(`Starting chunked upload for ${videoFile.name} (${videoFile.size} bytes)`)

    const totalChunks = Math.ceil(videoFile.size / CHUNK_SIZE)
    const uploadedChunks: string[] = []

    // Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, videoFile.size)
      const chunk = videoFile.slice(start, end)

      const formData = new FormData()
      formData.append("chunk", chunk)
      formData.append("chunkIndex", chunkIndex.toString())
      formData.append("totalChunks", totalChunks.toString())
      formData.append("fileName", videoFile.name)
      formData.append("feedbackId", feedbackId)
      formData.append("sessionId", sessionId)

      const response = await fetch("/api/upload-video-blob-chunk", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Chunk ${chunkIndex} upload failed`)
      }

      const result = await response.json()
      uploadedChunks.push(result.chunkUrl)

      // Update progress
      const uploadedBytes = end
      const percentage = Math.round((uploadedBytes / videoFile.size) * 100)

      if (onProgress) {
        onProgress({
          uploadedBytes,
          totalBytes: videoFile.size,
          percentage,
        })
      }
    }

    // Finalize upload - combine chunks
    const finalizeResponse = await fetch("/api/upload-video-blob-finalize", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chunkUrls: uploadedChunks,
        fileName: videoFile.name,
        feedbackId,
        sessionId,
        totalSize: videoFile.size,
        mimeType: videoFile.type,
      }),
    })

    if (!finalizeResponse.ok) {
      throw new Error("Failed to finalize upload")
    }

    const finalResult = await finalizeResponse.json()

    if (!finalResult.success) {
      throw new Error(finalResult.error || "Upload finalization failed")
    }

    console.log("Chunked upload completed successfully")
    return { success: true, blobUrl: finalResult.finalUrl }
  } catch (error) {
    console.error("Chunked upload error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    }
  }
}
