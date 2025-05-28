import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import type { ApiResponse, RewardSpin, CreateSpinRequest } from "@/app/types/api"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// GET /api/spins - Get all spins for the authenticated user
export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse<RewardSpin[]>>> {
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

    // Get all spins for the user
    const { data, error } = await supabase
      .from("reward_spins")
      .select("*")
      .eq("user_id", userData.user_id)
      .order("created_at", { ascending: false })

    if (error) throw error

    const spins: RewardSpin[] = data.map((spin) => ({
      spinId: spin.spin_id,
      userId: spin.user_id,
      pointsSpent: spin.points_spent,
      rewardAmount: spin.reward_amount,
      rewardTier: spin.reward_tier,
      createdAt: spin.created_at,
    }))

    return NextResponse.json({ success: true, data: spins })
  } catch (error) {
    console.error("Error fetching spins:", error)
    return NextResponse.json({ success: false, error: (error as Error).message }, { status: 500 })
  }
}

// POST /api/spins - Create a new spin
export async function POST(request: NextRequest): Promise<NextResponse<ApiResponse<RewardSpin>>> {
  try {
    const body: CreateSpinRequest = await request.json()

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

    // Check if user has enough points
    const { data: walletData, error: walletError } = await supabase.rpc("get_user_wallet_balance", {
      user_id_param: userData.user_id,
    })

    if (walletError) throw walletError

    const balance = walletData || 0
    if (balance < body.pointsToSpend) {
      return NextResponse.json({ success: false, error: "Insufficient points" }, { status: 400 })
    }

    // Determine reward tier based on total points
    const tier = determineTier(balance)

    // Calculate reward based on tier and random chance
    const reward = calculateReward(tier, body.pointsToSpend)

    // Begin transaction
    const { data, error } = await supabase.rpc("create_spin_with_transaction", {
      user_id_param: userData.user_id,
      points_spent_param: body.pointsToSpend,
      reward_amount_param: reward.amount,
      reward_tier_param: tier.name,
    })

    if (error) throw error

    // Return the spin data
    const spin: RewardSpin = {
      spinId: data.spin_id,
      userId: userData.user_id,
      pointsSpent: body.pointsToSpend,
      rewardAmount: reward.amount,
      rewardTier: tier.name,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, data: spin })
  } catch (error) {
    console.error("Error creating spin:", error)
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

// Helper function to determine tier based on points
function determineTier(totalPoints: number) {
  const TIERS = [
    { name: "Tier 1", min: 0, max: 19, cost: 10, maxReward: 20 },
    { name: "Tier 2", min: 20, max: 29, cost: 20, maxReward: 30 },
    { name: "Tier 3", min: 30, max: 39, cost: 30, maxReward: 40 },
    { name: "Tier 4", min: 40, max: 59, cost: 40, maxReward: 50 },
    { name: "Tier 5", min: 60, max: 99, cost: 60, maxReward: 100 },
    { name: "Premium", min: 100, max: Number.POSITIVE_INFINITY, cost: 100, maxReward: 250 },
  ]

  return TIERS.find((tier) => totalPoints >= tier.min && totalPoints <= tier.max) || TIERS[0]
}

// Helper function to calculate reward based on tier and random chance
function calculateReward(tier: any, pointsSpent: number) {
  // Define reward probabilities based on tier
  let rewards = []

  switch (tier.name) {
    case "Tier 1":
      rewards = [
        { amount: 10, probability: 90 },
        { amount: 20, probability: 10 },
      ]
      break
    case "Tier 2":
      rewards = [
        { amount: 10, probability: 50 },
        { amount: 20, probability: 40 },
        { amount: 30, probability: 10 },
      ]
      break
    case "Tier 3":
      rewards = [
        { amount: 10, probability: 40 },
        { amount: 20, probability: 30 },
        { amount: 30, probability: 20 },
        { amount: 40, probability: 10 },
      ]
      break
    case "Tier 4":
      rewards = [
        { amount: 10, probability: 25 },
        { amount: 20, probability: 25 },
        { amount: 30, probability: 20 },
        { amount: 40, probability: 10 },
        { amount: 50, probability: 10 },
      ]
      break
    case "Tier 5":
      rewards = [
        { amount: 10, probability: 5 },
        { amount: 20, probability: 15 },
        { amount: 30, probability: 15 },
        { amount: 40, probability: 15 },
        { amount: 50, probability: 25 },
        { amount: 100, probability: 25 },
      ]
      break
    case "Premium":
      rewards = [
        { amount: 30, probability: 5 },
        { amount: 40, probability: 15 },
        { amount: 50, probability: 20 },
        { amount: 100, probability: 50 },
        { amount: 250, probability: 5 },
      ]
      break
    default:
      rewards = [
        { amount: 10, probability: 90 },
        { amount: 20, probability: 10 },
      ]
  }

  // Calculate a weighted random reward
  const totalProbability = rewards.reduce((sum, reward) => sum + reward.probability, 0)
  let random = Math.random() * totalProbability

  for (const reward of rewards) {
    if (random < reward.probability) {
      return reward
    }
    random -= reward.probability
  }

  // Fallback to first reward
  return rewards[0]
}
