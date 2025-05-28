import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { ApiResponse, UserProfile, CreateUserRequest } from "@/app/types/api"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/users - Get all users (admin only)
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<UserProfile[]>>> {
  try {
    // Check if user is admin (implement your auth check here)
    const isAdmin = await checkIfAdmin(request)
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 })
    }

    const { data, error } = await supabase.from("users").select("*")

    if (error) throw error

    const users: UserProfile[] = data.map((user) => ({
      userId: user.user_id,
      authUserId: user.auth_user_id,
      name: user.name,
      email: user.email,
      heightCm: user.height_cm,
      weightKg: user.weight_kg,
      gender: user.gender,
      bodyType: user.body_type,
      country: user.country,
      ageVerified: user.age_verified,
      upiId: user.upi_id,
      mobileNumber: user.mobile_number,
      paymentMethodStatus: user.payment_method_status || "pending",
      createdAt: user.created_at,
      updatedAt: user.updated_at,
    }))

    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("Error fetching users:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// POST /api/users - Create a new user
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<UserProfile>>> {
  try {
    const body: CreateUserRequest = await request.json()

    // Get the authenticated user ID from the session
    const authUserId = await getAuthUserId(request)
    if (!authUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { data, error } = await supabase
      .from("users")
      .insert({
        auth_user_id: authUserId,
        name: body.name,
        email: body.email,
        height_cm: body.heightCm,
        weight_kg: body.weightKg,
        gender: body.gender,
        body_type: body.bodyType,
        country: body.country,
        age_verified: body.ageVerified,
        upi_id: body.upiId,
        mobile_number: body.mobileNumber,
        payment_method_status: body.upiId || body.mobileNumber ? "pending" : "pending",
        profile_completed: !!(body.heightCm && body.weightKg && body.gender && body.bodyType),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

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
      paymentMethodStatus: data.payment_method_status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("Error creating user:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// Helper function to check if user is admin
async function checkIfAdmin(request: NextRequest): Promise<boolean> {
  try {
    const authUserId = await getAuthUserId(request)
    if (!authUserId) return false

    const { data } = await supabase.from("users").select("is_admin").eq("auth_user_id", authUserId).single()

    return data?.is_admin === true
  } catch (error) {
    console.error("Error checking admin status:", error)
    return false
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
