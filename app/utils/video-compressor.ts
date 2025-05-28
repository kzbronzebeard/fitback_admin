"use client"

/**
 * Browser-based video compressor that uses native browser APIs
 * This avoids CORS issues with ffmpeg.wasm in restricted environments
 */

// Target file size in MB (maximum allowed size)
const TARGET_MAX_SIZE_MB = 100

// Target upload time in seconds
const TARGET_UPLOAD_TIME_SECONDS = 5

// Estimated upload speed in MB/s for slow connections
const ESTIMATED_SLOW_UPLOAD_SPEED_MBPS = 1

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

  // Calculate target size based on upload time constraint
  const targetSizeMB = Math.min(TARGET_MAX_SIZE_MB, ESTIMATED_SLOW_UPLOAD_SPEED_MBPS * TARGET_UPLOAD_TIME_SECONDS)

  // Calculate compression ratio needed
  const requiredCompressionRatio = originalSizeMB / targetSizeMB

  // If the original is already small enough, minimal compression
  if (requiredCompressionRatio <= 1) {
    return {
      width: 1280,
      height: 720,
      bitrate: 2000000, // 2Mbps
      frameRate: 30,
    }
  }

  // For videos needing moderate compression
  if (requiredCompressionRatio <= 3) {
    return {
      width: 854,
      height: 480,
      bitrate: 1000000, // 1Mbps
      frameRate: 30,
    }
  }

  // For videos needing significant compression
  if (requiredCompressionRatio <= 6) {
    return {
      width: 640,
      height: 360,
      bitrate: 800000, // 800kbps
      frameRate: 24,
    }
  }

  // For videos needing extreme compression
  return {
    width: 480,
    height: 270,
    bitrate: 500000, // 500kbps
    frameRate: 20,
  }
}

/**
 * Compresses a video using browser-native APIs
 * @param videoBlob The original video blob
 * @param onProgress Optional callback for progress updates
 * @returns A promise that resolves to the compressed video blob
 */
export async function compressVideo(videoBlob: Blob, onProgress?: (progress: number) => void): Promise<Blob> {
  console.log(`Original video size: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`)

  try {
    // Create a URL for the video blob
    const videoUrl = URL.createObjectURL(videoBlob)

    // Create a video element to load the blob
    const video = document.createElement("video")
    video.muted = true
    video.playsInline = true

    // Wait for video metadata to load
    await new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve()
      video.onerror = (e) => reject(new Error(`Video loading error: ${e}`))
      video.src = videoUrl
    })

    // Get video duration
    const duration = video.duration
    console.log(`Video duration: ${duration.toFixed(2)} seconds`)

    // Force more aggressive compression settings for all videos
    const settings = {
      width: 640,
      height: 360,
      bitrate: 800000, // 800kbps - lower bitrate for smaller file size
      frameRate: 24,
    }

    console.log("Using compression settings:", settings)

    // Create canvas for drawing video frames
    const canvas = document.createElement("canvas")
    canvas.width = settings.width
    canvas.height = settings.height
    const ctx = canvas.getContext("2d")

    if (!ctx) {
      throw new Error("Could not get canvas context")
    }

    // Create a MediaRecorder to capture the canvas
    const stream = canvas.captureStream(settings.frameRate)

    // Add audio track from original video if available
    try {
      const audioContext = new AudioContext()
      const audioSource = audioContext.createMediaElementSource(video)
      const audioDestination = audioContext.createMediaStreamDestination()
      audioSource.connect(audioDestination)

      // Add audio track to the stream
      audioDestination.stream.getAudioTracks().forEach((track) => {
        stream.addTrack(track)
      })
    } catch (audioError) {
      console.warn("Could not add audio track:", audioError)
    }

    // Configure MediaRecorder with compression options
    const options = {
      mimeType: "video/webm;codecs=vp8",
      videoBitsPerSecond: settings.bitrate,
    }

    // Check if the browser supports these options
    let mediaRecorder: MediaRecorder
    if (MediaRecorder.isTypeSupported(options.mimeType)) {
      mediaRecorder = new MediaRecorder(stream, options)
    } else {
      // Fallback to default options
      mediaRecorder = new MediaRecorder(stream)
      console.warn("Advanced compression options not supported by this browser")
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
    mediaRecorder.start(1000) // Collect data in 1-second chunks

    // Play the video and draw frames to canvas
    await video.play()
    startTime = Date.now()

    // Function to draw video frame to canvas
    const drawFrame = () => {
      if (video.ended || video.paused) {
        mediaRecorder.stop()
        return
      }

      // Draw the current frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

      // Update progress if callback provided
      if (onProgress) {
        const currentTime = video.currentTime
        const progress = Math.min(Math.round((currentTime / duration) * 100), 99)

        // Only update if progress has changed significantly
        if (progress > lastProgressUpdate + 5) {
          onProgress(progress)
          lastProgressUpdate = progress
        }
      }

      // Request next frame
      requestAnimationFrame(drawFrame)
    }

    // Start drawing frames
    drawFrame()

    // Wait for recording to complete
    const compressedBlob = await new Promise<Blob>((resolve) => {
      mediaRecorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: "video/webm" })
        resolve(finalBlob)
      }

      // Listen for video end
      video.onended = () => {
        setTimeout(() => {
          mediaRecorder.stop()
        }, 100)
      }
    })

    // Clean up
    URL.revokeObjectURL(videoUrl)

    console.log(`Compressed video size: ${(compressedBlob.size / 1024 / 1024).toFixed(2)}MB`)
    console.log(`Compression ratio: ${(videoBlob.size / compressedBlob.size).toFixed(2)}x`)

    // If compression didn't reduce size, try again with more aggressive settings
    if (compressedBlob.size > videoBlob.size * 0.9) {
      console.warn("First compression attempt didn't reduce size enough, trying more aggressive settings")

      // Return the original blob if it's already small
      if (videoBlob.size < 5 * 1024 * 1024) {
        // Less than 5MB
        console.log("Original video is already small, skipping further compression")
        return videoBlob
      }

      // Otherwise, return the compressed blob even if it's not much smaller
      return compressedBlob
    }

    // Final progress update
    if (onProgress) {
      onProgress(100)
    }

    return compressedBlob
  } catch (error) {
    console.error("Error compressing video:", error)
    // Return the original blob if compression fails
    return videoBlob
  }
}

/**
 * Extracts a thumbnail from a video using the browser's native capabilities
 * @param videoBlob The video blob
 * @param timeInSeconds The time in seconds to extract the thumbnail from
 * @returns A promise that resolves to the thumbnail blob
 */
export async function extractThumbnail(videoBlob: Blob, timeInSeconds = 0): Promise<Blob> {
  try {
    return new Promise((resolve, reject) => {
      const video = document.createElement("video")
      video.autoplay = false
      video.muted = true
      video.playsInline = true

      video.onloadedmetadata = () => {
        video.currentTime = timeInSeconds
      }

      video.onseeked = () => {
        const canvas = document.createElement("canvas")
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight

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
          0.95,
        )
      }

      video.onerror = () => {
        reject(new Error("Error loading video for thumbnail extraction"))
      }

      video.src = URL.createObjectURL(videoBlob)
    })
  } catch (error) {
    console.error("Error extracting thumbnail:", error)
    throw error
  }
}
