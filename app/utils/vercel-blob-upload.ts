import { upload } from "@vercel/blob/client"

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
  speed: number // bytes per second
  eta: number // seconds remaining
}

interface UploadOptions {
  onProgress?: (progress: UploadProgress) => void
  onRetry?: (attempt: number, error: Error) => void
  timeout?: number
  maxRetries?: number
}

export async function uploadLargeVideoToBlob(
  file: File,
  options: UploadOptions = {},
): Promise<{ url: string; pathname: string }> {
  const {
    onProgress,
    onRetry,
    timeout = 90000, // 90 seconds
    maxRetries = 2,
  } = options

  let lastProgressTime = Date.now()
  let lastProgressLoaded = 0
  let uploadStartTime = Date.now()

  // Create abort controller for timeout
  const abortController = new AbortController()
  const timeoutId = setTimeout(() => {
    console.log("Upload timeout reached, aborting...")
    abortController.abort()
  }, timeout)

  // Progress monitoring for inactivity detection
  let inactivityTimeoutId: NodeJS.Timeout | null = null
  const resetInactivityTimer = () => {
    if (inactivityTimeoutId) {
      clearTimeout(inactivityTimeoutId)
    }
    inactivityTimeoutId = setTimeout(() => {
      console.log("Upload inactivity detected, aborting...")
      abortController.abort()
    }, 15000) // 15 seconds of inactivity
  }

  const attemptUpload = async (attempt: number): Promise<{ url: string; pathname: string }> => {
    try {
      console.log(`Upload attempt ${attempt + 1}/${maxRetries + 1}`)

      // Reset timers for each attempt
      resetInactivityTimer()
      lastProgressTime = Date.now()
      lastProgressLoaded = 0
      uploadStartTime = Date.now()

      // Try client-side upload first
      try {
        const result = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/upload-video-blob-direct",
          clientPayload: JSON.stringify({ attempt: attempt + 1 }),
          signal: abortController.signal,
          onUploadProgress: (progressEvent) => {
            const now = Date.now()
            const timeDiff = (now - lastProgressTime) / 1000 // seconds
            const bytesDiff = progressEvent.loaded - lastProgressLoaded

            // Calculate speed (bytes per second)
            const speed = timeDiff > 0 ? bytesDiff / timeDiff : 0

            // Calculate ETA
            const remainingBytes = progressEvent.total - progressEvent.loaded
            const eta = speed > 0 ? remainingBytes / speed : 0

            const progress: UploadProgress = {
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100),
              speed,
              eta,
            }

            onProgress?.(progress)

            // Reset inactivity timer on progress
            resetInactivityTimer()

            // Update tracking variables
            lastProgressTime = now
            lastProgressLoaded = progressEvent.loaded
          },
        })

        // Clear timers on success
        clearTimeout(timeoutId)
        if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId)

        return {
          url: result.url,
          pathname: result.pathname || result.url.split("/").pop() || file.name,
        }
      } catch (clientError) {
        console.log("Client upload failed, trying server upload:", clientError)

        // Fallback to server-side upload
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/upload-video-blob-alternative", {
          method: "POST",
          body: formData,
          signal: abortController.signal,
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Server upload failed: ${response.status}`)
        }

        const result = await response.json()

        // Clear timers on success
        clearTimeout(timeoutId)
        if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId)

        return {
          url: result.url,
          pathname: result.pathname || result.url.split("/").pop() || file.name,
        }
      }
    } catch (error) {
      // Clear inactivity timer
      if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId)

      const isAborted = abortController.signal.aborted
      const isTimeout =
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("timeout") || error.message.includes("aborted"))

      if (isTimeout || isAborted) {
        const timeoutError = new Error(
          isAborted && Date.now() - uploadStartTime >= timeout
            ? `Upload timed out after ${timeout / 1000} seconds`
            : "Upload was aborted due to inactivity (no progress for 15 seconds)",
        )

        if (attempt < maxRetries) {
          console.log(`Upload timeout/abort on attempt ${attempt + 1}, retrying...`)
          onRetry?.(attempt + 1, timeoutError)

          // Create new abort controller for retry
          const newAbortController = new AbortController()
          const newTimeoutId = setTimeout(() => {
            newAbortController.abort()
          }, timeout)

          // Wait before retry (exponential backoff)
          const delay = Math.min(5000 * Math.pow(2, attempt), 15000)
          await new Promise((resolve) => setTimeout(resolve, delay))

          // Update references for retry
          abortController.abort = newAbortController.abort.bind(newAbortController)
          abortController.signal = newAbortController.signal
          clearTimeout(timeoutId)

          return attemptUpload(attempt + 1)
        } else {
          throw timeoutError
        }
      }

      // For other errors, retry if we haven't exceeded max attempts
      if (attempt < maxRetries) {
        console.log(`Upload failed on attempt ${attempt + 1}, retrying...`, error)
        onRetry?.(attempt + 1, error as Error)

        // Wait before retry (exponential backoff)
        const delay = Math.min(5000 * Math.pow(2, attempt), 15000)
        await new Promise((resolve) => setTimeout(resolve, delay))

        return attemptUpload(attempt + 1)
      } else {
        throw error
      }
    }
  }

  try {
    return await attemptUpload(0)
  } finally {
    // Cleanup timers
    clearTimeout(timeoutId)
    if (inactivityTimeoutId) clearTimeout(inactivityTimeoutId)
  }
}
