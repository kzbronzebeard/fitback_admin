"use server"

import { createClient } from "@supabase/supabase-js"
import { generateText } from "ai"
import { groq } from "@ai-sdk/groq"
import { isServer } from "../utils/environment"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

type ValidationResult = {
  hasHuman: boolean
  hasGarment: boolean
  hasFace: boolean
  hasOcclusion: boolean
  hasBlur: boolean
  hasNoise: boolean
  isValid: boolean
  reasons: string[]
}

export async function validateVideo(
  videoBlob: Blob,
  feedbackId: string,
): Promise<{ success: boolean; result?: ValidationResult; error?: string }> {
  try {
    // Extract frames from the video for analysis
    const frames = await extractFramesFromVideo(videoBlob)

    // Analyze each frame for validation criteria
    const frameResults = await Promise.all(
      frames.map(async (frame, index) => {
        return analyzeFrame(frame, index)
      }),
    )

    // Aggregate results from all frames
    const aggregatedResult = aggregateResults(frameResults)

    // Store validation results in database
    await storeValidationResults(feedbackId, aggregatedResult)

    return {
      success: true,
      result: aggregatedResult,
    }
  } catch (error) {
    console.error("Video validation error:", error)
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

// Extract frames from video at regular intervals
async function extractFramesFromVideo(videoBlob: Blob): Promise<string[]> {
  // If we're on the server, we can't use browser APIs
  if (isServer) {
    // For server-side, return a mock frame for now
    // In a production app, you would use a server-side video processing library
    return ["mockFrameBase64"]
  }

  // Browser-side frame extraction
  // Create a video element to load the blob
  const videoUrl = URL.createObjectURL(videoBlob)
  const video = document.createElement("video")

  // Wait for video metadata to load
  await new Promise<void>((resolve) => {
    video.onloadedmetadata = () => resolve()
    video.src = videoUrl
  })

  // Get video duration and calculate frame extraction points
  const duration = video.duration
  const frameCount = Math.min(5, Math.ceil(duration)) // Extract up to 5 frames
  const frameGap = duration / frameCount

  // Extract frames
  const frames: string[] = []
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")

  if (!context) {
    throw new Error("Could not create canvas context")
  }

  canvas.width = video.videoWidth
  canvas.height = video.videoHeight

  for (let i = 0; i < frameCount; i++) {
    const timePoint = i * frameGap

    // Seek to time point
    video.currentTime = timePoint

    // Wait for the seek to complete
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve()
    })

    // Draw the video frame to the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height)

    // Get the frame as a base64-encoded image
    const frameBase64 = canvas.toDataURL("image/jpeg").split(",")[1]
    frames.push(frameBase64)
  }

  // Clean up
  URL.revokeObjectURL(videoUrl)

  return frames
}

// Analyze a single frame for validation criteria
async function analyzeFrame(frameBase64: string, frameIndex: number): Promise<ValidationResult> {
  try {
    // Use Groq to analyze the image
    const prompt = `
      Analyze this image of a person wearing clothing for a fit feedback app.
      
      The image should:
      1. Clearly show a human wearing a garment
      2. Not show the person's face (this is not allowed)
      3. Have the garment clearly visible without occlusion
      4. Not be blurry or noisy
      
      Respond with a JSON object with these properties:
      - hasHuman: boolean (is there a human in the image?)
      - hasGarment: boolean (is there visible clothing/garment?)
      - hasFace: boolean (is a face visible in the image?)
      - hasOcclusion: boolean (is the garment partially hidden/occluded?)
      - hasBlur: boolean (is the image blurry?)
      - hasNoise: boolean (does the image have significant noise?)
      - reasons: array of strings explaining any issues found
    `

    const response = await generateText({
      model: groq("llava-1.6-34b"),
      prompt,
      image: frameBase64,
    })

    // Parse the JSON response
    const analysisResult = extractJsonFromText(response.text)

    // Determine if the frame is valid
    const isValid =
      analysisResult.hasHuman &&
      analysisResult.hasGarment &&
      !analysisResult.hasFace &&
      !analysisResult.hasOcclusion &&
      !analysisResult.hasBlur &&
      !analysisResult.hasNoise

    return {
      ...analysisResult,
      isValid,
    }
  } catch (error) {
    console.error(`Error analyzing frame ${frameIndex}:`, error)
    return {
      hasHuman: false,
      hasGarment: false,
      hasFace: false,
      hasOcclusion: true,
      hasBlur: true,
      hasNoise: true,
      isValid: false,
      reasons: [`Error analyzing frame ${frameIndex}: ${(error as Error).message}`],
    }
  }
}

// Helper function to extract JSON from text response
function extractJsonFromText(text: string): any {
  try {
    // Try to find JSON object in the text
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0])
    }

    // If no JSON found, return default values
    return {
      hasHuman: false,
      hasGarment: false,
      hasFace: false,
      hasOcclusion: true,
      hasBlur: true,
      hasNoise: true,
      reasons: ["Could not extract analysis results"],
    }
  } catch (error) {
    console.error("Error parsing JSON from text:", error)
    return {
      hasHuman: false,
      hasGarment: false,
      hasFace: false,
      hasOcclusion: true,
      hasBlur: true,
      hasNoise: true,
      reasons: ["Error parsing analysis results"],
    }
  }
}

// Aggregate results from multiple frames
function aggregateResults(frameResults: ValidationResult[]): ValidationResult {
  // Initialize aggregated result
  const aggregated: ValidationResult = {
    hasHuman: false,
    hasGarment: false,
    hasFace: false,
    hasOcclusion: false,
    hasBlur: false,
    hasNoise: false,
    isValid: false,
    reasons: [],
  }

  // Count frames that meet each criteria
  const frameCounts = {
    hasHuman: 0,
    hasGarment: 0,
    hasFace: 0,
    hasOcclusion: 0,
    hasBlur: 0,
    hasNoise: 0,
  }

  // Collect all reasons
  const allReasons: string[] = []

  // Process each frame result
  frameResults.forEach((result) => {
    if (result.hasHuman) frameCounts.hasHuman++
    if (result.hasGarment) frameCounts.hasGarment++
    if (result.hasFace) frameCounts.hasFace++
    if (result.hasOcclusion) frameCounts.hasOcclusion++
    if (result.hasBlur) frameCounts.hasBlur++
    if (result.hasNoise) frameCounts.hasNoise++

    allReasons.push(...result.reasons)
  })

  const frameCount = frameResults.length
  const threshold = Math.ceil(frameCount * 0.6) // 60% threshold

  // Set aggregated values based on threshold
  aggregated.hasHuman = frameCounts.hasHuman >= threshold
  aggregated.hasGarment = frameCounts.hasGarment >= threshold
  aggregated.hasFace = frameCounts.hasFace > 0 // Any frame with face is flagged
  aggregated.hasOcclusion = frameCounts.hasOcclusion >= threshold
  aggregated.hasBlur = frameCounts.hasBlur >= threshold
  aggregated.hasNoise = frameCounts.hasNoise >= threshold

  // Determine if the video is valid overall
  aggregated.isValid =
    aggregated.hasHuman &&
    aggregated.hasGarment &&
    !aggregated.hasFace &&
    !aggregated.hasOcclusion &&
    !aggregated.hasBlur &&
    !aggregated.hasNoise

  // Compile reasons for rejection if not valid
  if (!aggregated.isValid) {
    if (!aggregated.hasHuman) {
      aggregated.reasons.push("No human detected in most frames")
    }
    if (!aggregated.hasGarment) {
      aggregated.reasons.push("No garment clearly visible in most frames")
    }
    if (aggregated.hasFace) {
      aggregated.reasons.push("Face detected in one or more frames")
    }
    if (aggregated.hasOcclusion) {
      aggregated.reasons.push("Garment is occluded in most frames")
    }
    if (aggregated.hasBlur) {
      aggregated.reasons.push("Video is too blurry in most frames")
    }
    if (aggregated.hasNoise) {
      aggregated.reasons.push("Video has too much noise in most frames")
    }

    // Add specific reasons from frame analysis
    const uniqueReasons = [...new Set(allReasons)].filter((reason) => reason.length > 0)
    if (uniqueReasons.length > 0) {
      aggregated.reasons.push(...uniqueReasons)
    }
  }

  return aggregated
}

// Store validation results in the database
async function storeValidationResults(feedbackId: string, result: ValidationResult) {
  try {
    // Create a new table for video validations if it doesn't exist
    await supabase.rpc("create_video_validations_if_not_exists")

    // Insert validation results
    const { error } = await supabase.from("video_validations").insert({
      feedback_id: feedbackId,
      has_human: result.hasHuman,
      has_garment: result.hasGarment,
      has_face: result.hasFace,
      has_occlusion: result.hasOcclusion,
      has_blur: result.hasBlur,
      has_noise: result.hasNoise,
      is_valid: result.isValid,
      reasons: result.reasons,
      created_at: new Date().toISOString(),
    })

    if (error) throw error

    // Update the feedback status based on validation
    const newStatus = result.isValid ? "under_review" : "rejected"

    const { error: updateError } = await supabase
      .from("feedbacks")
      .update({ status: newStatus })
      .eq("feedback_id", feedbackId)

    if (updateError) throw updateError
  } catch (error) {
    console.error("Error storing validation results:", error)
    throw error
  }
}
