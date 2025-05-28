import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { ApiResponse, WalletTransaction } from "@/app/types/api"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/wallet - Get wallet balance and transactions
export async function GET(request: NextRequest): Promise<
  NextResponse<
    ApiResponse<{
      balance: number
      transactions: WalletTransaction[]
    }>
  >
> {
  try {
    // Get the authenticated user
    const authUserId = await getAuthUserId(request)
    if (!authUserId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    // Get the user's ID from the database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("user_id")
      .eq("auth_user_id", authUserId)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 })
    }

    // Get all transactions for the user
    const { data, error } = await supabase
      .from("wallet_transactions")
      .select("*")
      .eq("user_id", userData.user_id)
      .order("created_at", { ascending: false })

    if (error) throw error

    // Calculate balance
    let balance = 0
    const transactions: WalletTransaction[] = data.map((tx) => {
      // Add to balance if credit, subtract if debit
      if (tx.type === "credit") {
        balance += tx.amount
      } else {
        balance -= tx.amount
      }

      return {
        transactionId: tx.transaction_id,
        userId: tx.user_id,
        amount: tx.amount,
        type: tx.type,
        source: tx.source,
        referenceId: tx.reference_id,
        createdAt: tx.created_at,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        balance,
        transactions,
      },
    })
  } catch (error) {
    console.error("Error fetching wallet data:", error)
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
