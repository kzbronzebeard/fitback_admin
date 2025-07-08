"use client"

/**
 * Browser-based video compressor that uses native browser APIs
 * This avoids CORS issues with ffmpeg.wasm in restricted environments
 */

// More aggressive compression settings
const TARGET_MAX_SIZE_MB = 20 // Reduced from 100MB
const TARGET_UPLOAD_TIME_SECONDS = 3 // Reduced from 5
const ESTIMATED_SLOW_UPLOAD_SPEED_MBPS = 2 // Increased assumption

/**
 * Determines the optimal compression settings based on the original video size
 */
function determineOptimalSettings(videoBlob: Blob): {
  width: number
  height: number
  bitrate: number
  frameRate: number
} {
  const originalSizeMB = videoBlob.size / (1024 * 1024)
  console.log(`Original video size: ${originalSizeMB.toFixed(2)} MB`)

  // Always use aggressive compression for reliability
  return {
    width: 480,
    height: 270,
    bitrate: 400000, // 400kbps - very aggressive
    frameRate: 20,
  }
}

/**
 * Compresses a video using browser-native APIs with memory management
 */
export async function compressVideo(videoBlob: Blob, onProgress?: (progress: number) => void): Promise<Blob> {
  console.log(`Starting compression: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`)

  // If already small enough, return original
  if (videoBlob.size < 5 * 1024 * 1024) {
    console.log("Video already small enough, skipping compression")
    if (onProgress) onProgress(100)
    return videoBlob
  }

  try {
    // Create a URL for the video blob
    const videoUrl = URL.createObjectURL(videoBlob)

    // Create a video element to load the blob
    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true
    video.preload = "metadata"

    // Wait for video metadata to load
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Video loading timeout"))
      }, 30000) // 30 second timeout

      video.onloadedmetadata = () => {
        clearTimeout(timeout)
        resolve()
      }
      video.onerror = (e) => {
        clearTimeout(timeout)
        reject(new Error(`Video loading error: ${e}`))
      }
      video.src = videoUrl
    })

    // Get video duration and limit it
    const duration = Math.min(video.duration, 60) // Max 60 seconds
    console.log(`Video duration: ${duration.toFixed(2)} seconds`)

    // Use very aggressive settings
    const settings = {
      width: 480,
      height: 270,
      bitrate: 300000, // 300kbps
      frameRate: 15, // Lower frame rate
    }

    console.log("Using aggressive compression settings:", settings)

    // Create canvas for drawing video frames
    const canvas = document.createElement("canvas")
    canvas.width = settings.width
    canvas.height = settings.height
    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    })

    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    // Create a MediaRecorder to capture the canvas
    const stream = canvas.captureStream(settings.frameRate)

    // Configure MediaRecorder with very aggressive compression
    const options = {
      mimeType: "video/webm;codecs=vp8",
      videoBitsPerSecond: settings.bitrate,
    }

    let mediaRecorder: MediaRecorder
    if (MediaRecorder.isTypeSupported(options.mimeType)) {
      mediaRecorder = new MediaRecorder(stream, options)
    } else {
      // Fallback
      mediaRecorder = new MediaRecorder(stream, {
        videoBitsPerSecond: settings.bitrate,
      })
    }

    const chunks: Blob[] = []
    let startTime = 0
    let lastProgressUpdate = 0

    // Collect data as it becomes available
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data)
      }
    }

    // Start recording
    mediaRecorder.start(2000) // Collect data in 2-second chunks

    // Play the video and draw frames to canvas
    await video.play()
    startTime = Date.now()

    // Function to draw video frame to canvas with throttling
    let frameCount = 0
    const drawFrame = () => {
      if (video.ended || video.paused) {
        mediaRecorder.stop()
        return
      }

      // Skip frames for better performance
      frameCount++
      if (frameCount % 2 === 0) {
        // Draw every other frame
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      }

      // Update progress
      if (onProgress) {
        const currentTime = video.currentTime
        const progress = Math.min(Math.round((currentTime / duration) * 100), 99)

        if (progress > lastProgressUpdate + 10) {
          onProgress(progress)
          lastProgressUpdate = progress
        }
      }

      // Request next frame with throttling
      setTimeout(() => requestAnimationFrame(drawFrame), 1000 / settings.frameRate)
    }

    // Start drawing frames
    drawFrame()

    // Wait for recording to complete
    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Compression timeout"))
      }, 120000) // 2 minute timeout

      mediaRecorder.onstop = () => {
        clearTimeout(timeout)
        const finalBlob = new Blob(chunks, { type: "video/webm" })
        resolve(finalBlob)
      }

      mediaRecorder.onerror = (e) => {
        clearTimeout(timeout)
        reject(new Error("MediaRecorder error"))
      }

      // Listen for video end
      video.onended = () => {
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop()
          }
        }, 100)
      }
    })

    // Clean up
    URL.revokeObjectURL(videoUrl)
    stream.getTracks().forEach((track) => track.stop())

    const compressionRatio = videoBlob.size / compressedBlob.size
    console.log(
      `Compressed: ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB (${compressionRatio.toFixed(2)}x smaller)`,
    )

    // Final progress update
    if (onProgress) {
      onProgress(100)
    }

    return compressedBlob
  } catch (error) {
    console.error("Error compressing video:", error)

    // If compression fails and original is reasonably small, return it
    if (videoBlob.size < 15 * 1024 * 1024) {
      console.log("Compression failed, but original is small enough")
      return videoBlob
    }

    throw error
  }
}

/**
 * Extracts a thumbnail from a video using the browser's native capabilities
 */
export async function extractThumbnail(videoBlob: Blob, timeInSeconds = 0): Promise<Blob> {
  try {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Thumbnail extraction timeout"))
      }, 30000)

      const video = document.createElement("video")
      video.autoplay = false
      video.muted = true
      video.playsInline = true

      video.onloadedmetadata = () => {
        video.currentTime = Math.min(timeInSeconds, video.duration / 2)
      }

      video.onseeked = () => {
        clearTimeout(timeout)

        const canvas = document.createElement("canvas")
        canvas.width = Math.min(video.videoWidth, 640)
        canvas.height = Math.min(video.videoHeight, 480)

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          reject(new Error("Could not get canvas context"))
          return
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error("Failed to create thumbnail blob"))
            }
          },
          "image/jpeg",
          0.8,
        )
      }

      video.onerror = () => {
        clearTimeout(timeout)
        reject(new Error("Error loading video for thumbnail extraction"))
      }

      video.src = URL.createObjectURL(videoBlob)
    })
  } catch (error) {
    console.error("Error extracting thumbnail:", error)
    throw error
  }
}
