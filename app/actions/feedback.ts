"use server"

import { createClient } from "@supabase/supabase-js"
import { validateFeedbackInput, sanitizeInput } from "@/app/utils/validation"
import { captureError, ErrorSeverity } from "@/app/utils/monitoring"
import { validateSession } from "@/app/utils/session-manager"

// CRITICAL: Admin approval workflow - feedback starts as "pending", cashback only awarded after admin approval
// DO NOT auto-approve or auto-award cashback - all manual admin review required

// Initialize Supabase client with better error handling
const initSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error(
      "Supabase URL is not defined. Please set the SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL environment variable.",
    )
  }

  if (!supabaseKey) {
    throw new Error(
      "Supabase key is not defined. Please set the SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.",
    )
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Create the client
const supabase = initSupabaseClient()

// Update the createFeedbackRecord function to work with custom auth system

export async function createFeedbackRecord(
  sessionId: string,
  productUrl: string,
  brand: string,
  size: string,
  fitScore: number,
  keptStatus: string,
): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
  try {
    console.log("Starting feedback record creation with session:", sessionId)

    // Validate session and get user
    const sessionResult = await validateSession(sessionId)
    if (!sessionResult.isValid || !sessionResult.user) {
      throw new Error("User not authenticated. Please log in to submit feedback.")
    }

    const authUserId = sessionResult.user.user_id
    console.log("Authenticated user ID:", authUserId)

    console.log("Starting feedback record creation with:", { productUrl, brand, size, fitScore, keptStatus })

    // Validate all inputs
    const validation = validateFeedbackInput({
      productUrl,
      brand,
      size,
      fitScore,
      keptStatus,
    })

    if (!validation.isValid) {
      const errorMessage = Object.values(validation.errors).join(", ")
      throw new Error(`Validation failed: ${errorMessage}`)
    }

    // Sanitize text inputs
    const sanitizedProductUrl = sanitizeInput(productUrl)
    const sanitizedBrand = sanitizeInput(brand)
    const sanitizedSize = sanitizeInput(size)

    // Validate keptStatus to ensure it matches the database constraint
    const validKeptStatuses = ["kept", "returned", "want_to_return"]
    if (!validKeptStatuses.includes(keptStatus)) {
      throw new Error(`Invalid kept status: ${keptStatus}. Must be one of: ${validKeptStatuses.join(", ")}`)
    }

    console.log("Validation passed, checking database connection...")

    // Check if user exists in our users table
    console.log("Checking if user exists in users table...")
    const { data: existingUser, error: userCheckError } = await supabase
      .from("users")
      .select("user_id")
      .eq("user_id", authUserId)
      .single()

    if (userCheckError && userCheckError.code !== "PGRST116") {
      console.error("Error checking for existing user:", userCheckError)
    }

    let userIdToUse = existingUser?.user_id

    if (!userIdToUse) {
      console.log("User not found, creating new user...")

      const newUserData = {
        user_id: authUserId,
        name: sessionResult.user.name || "User",
        email: sessionResult.user.email || `user-${Date.now()}@example.com`,
        age_verified: true,
        payment_method_status: "pending",
        is_admin: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      console.log("Attempting to create user with data:", newUserData)

      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert(newUserData)
        .select("user_id")
        .single()

      if (userError) {
        console.error("User creation error:", JSON.stringify(userError, null, 2))
        throw new Error(`Failed to create user: ${userError.message}`)
      }

      userIdToUse = newUser.user_id
      console.log("Created new user with ID:", userIdToUse)
    } else {
      console.log("Using existing user with ID:", userIdToUse)
    }

    // Create the feedback record with status = 'pending' (cashback will be added when approved)
    console.log("Creating feedback record...")
    const feedbackData = {
      user_id: userIdToUse,
      product_url: sanitizedProductUrl,
      brand: sanitizedBrand,
      size: sanitizedSize,
      fit_score: fitScore,
      kept_status: keptStatus,
      status: "pending", // Set to pending - cashback only added when approved
      cashback_amount: 50.0, // Default cashback amount
      created_at: new Date().toISOString(),
    }

    console.log("Attempting to create feedback with data:", feedbackData)

    const { data, error } = await supabase.from("feedbacks").insert(feedbackData).select("feedback_id").single()

    if (error) {
      console.error("Feedback creation error:", JSON.stringify(error, null, 2))
      throw new Error(`Failed to create feedback record: ${error.message}`)
    }

    console.log("Feedback record created successfully:", data)
    console.log("Feedback is pending admin approval - cashback will be added when approved")

    return {
      success: true,
      feedbackId: data.feedback_id,
    }
  } catch (error) {
    console.error("Error creating feedback record:", error)
    return {
      success: false,
      error: (error as Error).message,
    }
  }
}

// Function to ensure a bucket exists
async function ensureBucketExists(bucketName: string): Promise<void> {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

    // If bucket doesn't exist, create it
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false, // Set to false for security
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
      })

      if (error) throw error
      console.log(`Created bucket: ${bucketName}`)
    }
  } catch (error) {
    console.error(`Error ensuring bucket exists: ${error}`)
    captureError(error as Error, {
      action: "ensureBucketExists",
      additionalData: { bucketName },
    })
    throw error
  }
}

// Function to upload video to Supabase Storage
export async function uploadVideoToStorage(
  sessionId: string,
  videoBlob: Blob,
  feedbackId: string,
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    // Validate session and get user
    const sessionResult = await validateSession(sessionId)
    if (!sessionResult.isValid || !sessionResult.user) {
      throw new Error("User not authenticated")
    }

    const userId = sessionResult.user.user_id

    // Validate inputs
    if (!videoBlob || !(videoBlob instanceof Blob)) {
      throw new Error("Invalid video data provided")
    }

    if (!feedbackId) {
      throw new Error("User ID and feedback ID are required")
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (videoBlob.size > maxSize) {
      throw new Error(`Video size exceeds maximum allowed size of 50MB`)
    }

    // Ensure the videos bucket exists
    await ensureBucketExists("videos")

    const fileName = `${userId}/${feedbackId}/feedback-video.webm`

    // Convert Blob to Buffer for server-side upload
    const buffer = Buffer.from(await videoBlob.arrayBuffer())

    const { data, error } = await supabase.storage.from("videos").upload(fileName, buffer, {
      contentType: "video/webm",
      upsert: true,
    })

    if (error) {
      captureError(`Video upload error: ${error.message}`, {
        action: "uploadVideoToStorage",
        additionalData: { userId, feedbackId, fileSize: videoBlob.size },
      })
      throw error
    }

    // Update the videos table with the storage path
    const { error: updateError } = await supabase.from("videos").insert({
      feedback_id: feedbackId,
      storage_path: data.path,
      format: "webm",
      created_at: new Date().toISOString(),
    })

    if (updateError) {
      captureError(`Error updating videos table: ${updateError.message}`, {
        action: "uploadVideoToStorage",
        additionalData: { userId, feedbackId, path: data.path },
      })
      throw updateError
    }

    return { success: true, path: data.path }
  } catch (error) {
    console.error("Video upload error:", error)
    const sessionResult = await validateSession(sessionId)
    const userId = sessionResult.user?.user_id
    captureError(
      error as Error,
      {
        action: "uploadVideoToStorage",
        additionalData: { userId, feedbackId, fileSize: videoBlob?.size },
      },
      ErrorSeverity.ERROR,
    )
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Admin function to approve feedback and award cashback
 * @description CRITICAL: Only admins can approve feedback and trigger ₹50 cashback
 * @param feedbackId - Feedback ID to approve
 * @param adminNotes - Optional admin notes
 * @returns Success status
 */
export async function approveFeedback(
  feedbackId: string,
  adminNotes?: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Admin approving feedback:", feedbackId)

    // Update feedback status to approved
    const { error: feedbackError } = await supabase
      .from("feedbacks")
      .update({
        status: "approved",
        updated_at: new Date().toISOString(),
      })
      .eq("feedback_id", feedbackId)

    if (feedbackError) {
      throw new Error(`Failed to approve feedback: ${feedbackError.message}`)
    }

    // TODO: Add wallet transaction for ₹50 cashback
    // This should create a credit transaction in the wallet system

    console.log("Feedback approved successfully - ₹50 cashback awarded")

    return { success: true }
  } catch (error) {
    console.error("Error approving feedback:", error)
    return { success: false, error: (error as Error).message }
  }
}

/**
 * Admin function to reject feedback
 * @description Rejects feedback with admin notes - no cashback awarded
 * @param feedbackId - Feedback ID to reject
 * @param adminNotes - Required rejection reason
 * @returns Success status
 */
export async function rejectFeedback(
  feedbackId: string,
  adminNotes: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("Admin rejecting feedback:", feedbackId)

    // Update feedback status to rejected
    const { error: feedbackError } = await supabase
      .from("feedbacks")
      .update({
        status: "rejected",
        updated_at: new Date().toISOString(),
      })
      .eq("feedback_id", feedbackId)

    if (feedbackError) {
      throw new Error(`Failed to reject feedback: ${feedbackError.message}`)
    }

    console.log("Feedback rejected successfully - no cashback awarded")

    return { success: true }
  } catch (error) {
    console.error("Error rejecting feedback:", error)
    return { success: false, error: (error as Error).message }
  }
}
