"use server"

import { createClient } from "@supabase/supabase-js"
import type { UserProfile } from "../types/api"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Get user profile by auth user ID
export async function getUserProfile(
  authUserId: string,
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    console.log("[USER PROFILE] Getting profile for auth user:", authUserId)

    const { data, error } = await supabase.from("users").select("*").eq("auth_user_id", authUserId).single()

    if (error) {
      console.error("[USER PROFILE] Database error:", error)
      throw error
    }

    if (!data) {
      return { success: false, error: "User profile not found" }
    }

    const userProfile: UserProfile = {
      userId: data.user_id,
      authUserId: data.auth_user_id,
      name: data.name,
      email: data.email,
      heightCm: data.height_cm,
      weightKg: data.weight_kg,
      gender: data.gender,
      bodyType: data.body_type,
      country: data.country,
      ageVerified: data.age_verified,
      upiId: data.upi_id,
      mobileNumber: data.mobile_number,
      paymentMethodStatus: data.payment_method_status || "pending",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    console.log("[USER PROFILE] Profile retrieved successfully")
    return { success: true, data: userProfile }
  } catch (error) {
    console.error("[USER PROFILE] Error getting user profile:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Update user profile
export async function updateUserProfile(
  authUserId: string,
  updates: Partial<UserProfile>,
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    console.log("[USER PROFILE] Updating profile for auth user:", authUserId)

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    // Map the updates to database column names
    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.email !== undefined) updateData.email = updates.email
    if (updates.heightCm !== undefined) updateData.height_cm = updates.heightCm
    if (updates.weightKg !== undefined) updateData.weight_kg = updates.weightKg
    if (updates.gender !== undefined) updateData.gender = updates.gender
    if (updates.bodyType !== undefined) updateData.body_type = updates.bodyType
    if (updates.country !== undefined) updateData.country = updates.country
    if (updates.ageVerified !== undefined) updateData.age_verified = updates.ageVerified
    if (updates.upiId !== undefined) updateData.upi_id = updates.upiId
    if (updates.mobileNumber !== undefined) updateData.mobile_number = updates.mobileNumber
    if (updates.paymentMethodStatus !== undefined) updateData.payment_method_status = updates.paymentMethodStatus

    // Update profile completion status if relevant fields are updated
    if (updates.heightCm || updates.weightKg || updates.gender || updates.bodyType) {
      updateData.profile_completed = true
    }

    const { data, error } = await supabase
      .from("users")
      .update(updateData)
      .eq("auth_user_id", authUserId)
      .select()
      .single()

    if (error) {
      console.error("[USER PROFILE] Update error:", error)
      throw error
    }

    const userProfile: UserProfile = {
      userId: data.user_id,
      authUserId: data.auth_user_id,
      name: data.name,
      email: data.email,
      heightCm: data.height_cm,
      weightKg: data.weight_kg,
      gender: data.gender,
      bodyType: data.body_type,
      country: data.country,
      ageVerified: data.age_verified,
      upiId: data.upi_id,
      mobileNumber: data.mobile_number,
      paymentMethodStatus: data.payment_method_status || "pending",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    console.log("[USER PROFILE] Profile updated successfully")
    return { success: true, data: userProfile }
  } catch (error) {
    console.error("[USER PROFILE] Error updating user profile:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Check if user has completed their profile
export async function checkProfileCompletion(
  authUserId: string,
): Promise<{ success: boolean; isComplete?: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("profile_completed, height_cm, weight_kg, gender, body_type")
      .eq("auth_user_id", authUserId)
      .maybeSingle()

    if (error) throw error

    // If no user profile exists yet, profile is not complete
    if (!data) {
      return { success: true, isComplete: false }
    }

    const isComplete = data.profile_completed && data.height_cm && data.weight_kg && data.gender && data.body_type

    return { success: true, isComplete: !!isComplete }
  } catch (error) {
    console.error("[USER PROFILE] Error checking profile completion:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Create user profile (for first-time profile creation)
export async function createUserProfile(
  authUserId: string,
  profileData: Partial<UserProfile>,
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    console.log("[USER PROFILE] Creating profile for auth user:", authUserId)

    const insertData: any = {
      auth_user_id: authUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profile_completed: true,
    }

    // Map the profile data to database column names
    if (profileData.name !== undefined) insertData.name = profileData.name
    if (profileData.email !== undefined) insertData.email = profileData.email
    if (profileData.heightCm !== undefined) insertData.height_cm = profileData.heightCm
    if (profileData.weightKg !== undefined) insertData.weight_kg = profileData.weightKg
    if (profileData.gender !== undefined) insertData.gender = profileData.gender
    if (profileData.bodyType !== undefined) insertData.body_type = profileData.bodyType
    if (profileData.country !== undefined) insertData.country = profileData.country
    if (profileData.ageVerified !== undefined) insertData.age_verified = profileData.ageVerified
    if (profileData.upiId !== undefined) insertData.upi_id = profileData.upiId
    if (profileData.mobileNumber !== undefined) insertData.mobile_number = profileData.mobileNumber
    if (profileData.paymentMethodStatus !== undefined)
      insertData.payment_method_status = profileData.paymentMethodStatus

    const { data, error } = await supabase.from("users").insert(insertData).select().single()

    if (error) {
      console.error("[USER PROFILE] Create error:", error)
      throw error
    }

    const userProfile: UserProfile = {
      userId: data.user_id,
      authUserId: data.auth_user_id,
      name: data.name,
      email: data.email,
      heightCm: data.height_cm,
      weightKg: data.weight_kg,
      gender: data.gender,
      bodyType: data.body_type,
      country: data.country,
      ageVerified: data.age_verified,
      upiId: data.upi_id,
      mobileNumber: data.mobile_number,
      paymentMethodStatus: data.payment_method_status || "pending",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    console.log("[USER PROFILE] Profile created successfully")
    return { success: true, data: userProfile }
  } catch (error) {
    console.error("[USER PROFILE] Error creating user profile:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Upsert user profile (create or update)
export async function upsertUserProfile(
  authUserId: string,
  profileData: Partial<UserProfile>,
): Promise<{ success: boolean; data?: UserProfile; error?: string }> {
  try {
    console.log("[USER PROFILE] Upserting profile for auth user:", authUserId)

    const upsertData: any = {
      auth_user_id: authUserId,
      updated_at: new Date().toISOString(),
      profile_completed: true,
    }

    // Map the profile data to database column names
    if (profileData.name !== undefined) upsertData.name = profileData.name
    if (profileData.email !== undefined) upsertData.email = profileData.email
    if (profileData.heightCm !== undefined) upsertData.height_cm = profileData.heightCm
    if (profileData.weightKg !== undefined) upsertData.weight_kg = profileData.weightKg
    if (profileData.gender !== undefined) upsertData.gender = profileData.gender
    if (profileData.bodyType !== undefined) upsertData.body_type = profileData.bodyType
    if (profileData.country !== undefined) upsertData.country = profileData.country
    if (profileData.ageVerified !== undefined) upsertData.age_verified = profileData.ageVerified
    if (profileData.upiId !== undefined) upsertData.upi_id = profileData.upiId
    if (profileData.mobileNumber !== undefined) upsertData.mobile_number = profileData.mobileNumber
    if (profileData.paymentMethodStatus !== undefined)
      upsertData.payment_method_status = profileData.paymentMethodStatus

    // Set created_at only for new records
    if (!profileData.userId) {
      upsertData.created_at = new Date().toISOString()
    }

    const { data, error } = await supabase
      .from("users")
      .upsert(upsertData, {
        onConflict: "auth_user_id",
        ignoreDuplicates: false,
      })
      .select()
      .single()

    if (error) {
      console.error("[USER PROFILE] Upsert error:", error)
      throw error
    }

    const userProfile: UserProfile = {
      userId: data.user_id,
      authUserId: data.auth_user_id,
      name: data.name,
      email: data.email,
      heightCm: data.height_cm,
      weightKg: data.weight_kg,
      gender: data.gender,
      bodyType: data.body_type,
      country: data.country,
      ageVerified: data.age_verified,
      upiId: data.upi_id,
      mobileNumber: data.mobile_number,
      paymentMethodStatus: data.payment_method_status || "pending",
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    console.log("[USER PROFILE] Profile upserted successfully")
    return { success: true, data: userProfile }
  } catch (error) {
    console.error("[USER PROFILE] Error upserting user profile:", error)
    return { success: false, error: (error as Error).message }
  }
}
