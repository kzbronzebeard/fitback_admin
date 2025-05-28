import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { ApiResponse, UserProfile, UpdateUserRequest } from "@/app/types/api"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/users/[userId] - Get a specific user
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } },
): Promise<NextResponse<ApiResponse<UserProfile>>> {
  try {
    const userId = params.userId

    // Check if user is authorized to access this profile
    const authUserId = await getAuthUserId(request)
    const isAuthorized = await isUserAuthorized(authUserId, userId)

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { data, error } = await supabase.from("users").select("*").eq("user_id", userId).single()

    if (error) throw error
    if (!data) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    const user: UserProfile = {
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

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// PATCH /api/users/[userId] - Update a user
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string } },
): Promise<NextResponse<ApiResponse<UserProfile>>> {
  try {
    const userId = params.userId
    const body: UpdateUserRequest = await request.json()

    // Check if user is authorized to update this profile
    const authUserId = await getAuthUserId(request)
    const isAuthorized = await isUserAuthorized(authUserId, userId)

    if (!isAuthorized) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.email !== undefined) updateData.email = body.email
    if (body.heightCm !== undefined) updateData.height_cm = body.heightCm
    if (body.weightKg !== undefined) updateData.weight_kg = body.weightKg
    if (body.gender !== undefined) updateData.gender = body.gender
    if (body.bodyType !== undefined) updateData.body_type = body.bodyType
    if (body.country !== undefined) updateData.country = body.country
    if (body.ageVerified !== undefined) updateData.age_verified = body.ageVerified
    if (body.upiId !== undefined) updateData.upi_id = body.upiId
    if (body.mobileNumber !== undefined) updateData.mobile_number = body.mobileNumber
    if (body.paymentMethodStatus !== undefined) updateData.payment_method_status = body.paymentMethodStatus

    // Update profile completion status
    if (body.heightCm || body.weightKg || body.gender || body.bodyType) {
      updateData.profile_completed = true
    }

    const { data, error } = await supabase.from("users").update(updateData).eq("user_id", userId).select().single()

    if (error) throw error

    const user: UserProfile = {
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

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// DELETE /api/users/[userId] - Delete a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } },
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const userId = params.userId

    // Check if user is authorized to delete this profile
    const authUserId = await getAuthUserId(request)
    const isAdmin = await checkIfAdmin(authUserId)
    const isOwnProfile = await isUserAuthorized(authUserId, userId)

    // Only admins or the user themselves can delete a profile
    if (!isAdmin && !isOwnProfile) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { error } = await supabase.from("users").delete().eq("user_id", userId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// Helper function to get authenticated user ID
async function getAuthUserId(request: NextRequest): Promise<string | null> {
  // In a real app, you would extract this from the session or token
  // For now, we'll use a placeholder implementation
  const authHeader = request.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) return null

  const token = authHeader.substring(7)

  // Verify the token with Supabase Auth
  const { data, error } = await supabase.auth.getUser(token)
  if (error || !data.user) return null

  return data.user.id
}

// Helper function to check if user is admin
async function checkIfAdmin(authUserId: string | null): Promise<boolean> {
  if (!authUserId) return false

  try {
    const { data } = await supabase.from("users").select("is_admin").eq("auth_user_id", authUserId).single()

    return data?.is_admin === true
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
  }
}

// Helper function to check if user is authorized to access/modify a profile
async function isUserAuthorized(authUserId: string | null, targetUserId: string): Promise<boolean> {
  if (!authUserId) return false

  try {
    // Check if the authenticated user is an admin
    const isAdmin = await checkIfAdmin(authUserId)
    if (isAdmin) return true

    // Check if the authenticated user is accessing their own profile
    const { data } = await supabase.from("users").select("user_id").eq("auth_user_id", authUserId).single()

    return data?.user_id === targetUserId
  } catch (error) {
    console.error("Error checking user authorization:", error)
    return false
  }
}
