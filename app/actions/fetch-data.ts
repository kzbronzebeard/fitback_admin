"use server"

import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Fetch feedback records
export async function fetchFeedbackRecords(limit = 10) {
  try {
    const { data, error } = await supabase
      .from("feedbacks")
      .select(`
        *,
        videos(*),
        users(name, email)
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching feedback records:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Fetch user records
export async function fetchUserRecords(limit = 10) {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error

    return { success: true, data }
  } catch (error) {
    console.error("Error fetching user records:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Check if tables exist by trying to query them
export async function checkTablesExist() {
  try {
    // List of tables we expect to exist
    const expectedTables = ["users", "feedbacks", "videos", "video_validations", "wallet_transactions", "reward_spins"]
    const existingTables = []

    // Try to query each table
    for (const table of expectedTables) {
      try {
        // Just try to get the count from each table
        const { count, error } = await supabase.from(table).select("*", { count: "exact", head: true })

        // If no error, the table exists
        if (!error) {
          existingTables.push(table)
        }
      } catch (e) {
        // Table doesn't exist or other error, skip it
        console.warn(`Error checking table ${table}:`, e)
      }
    }

    return {
      success: true,
      data: existingTables,
    }
  } catch (error) {
    console.error("Error checking tables:", error)
    return { success: false, error: (error as Error).message }
  }
}

// Create tables if they don't exist
export async function createTablesIfNotExist() {
  try {
    // Execute SQL directly to create tables
    const { error } = await supabase.sql(`
      -- Create users table if it doesn't exist
      CREATE TABLE IF NOT EXISTS users (
        user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_user_id TEXT UNIQUE,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        age_verified BOOLEAN DEFAULT FALSE,
        is_admin BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create feedbacks table if it doesn't exist
      CREATE TABLE IF NOT EXISTS feedbacks (
        feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        product_url TEXT NOT NULL,
        brand TEXT NOT NULL,
        size TEXT NOT NULL,
        fit_score INTEGER NOT NULL,
        kept_status TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'submitted',
        is_final BOOLEAN DEFAULT TRUE,
        original_feedback_id UUID REFERENCES feedbacks(feedback_id) ON DELETE SET NULL,
        points_awarded INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create videos table if it doesn't exist
      CREATE TABLE IF NOT EXISTS videos (
        video_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feedback_id UUID REFERENCES feedbacks(feedback_id) ON DELETE CASCADE,
        storage_path TEXT NOT NULL,
        format TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create video_validations table if it doesn't exist
      CREATE TABLE IF NOT EXISTS video_validations (
        validation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        feedback_id UUID REFERENCES feedbacks(feedback_id) ON DELETE CASCADE,
        has_human BOOLEAN NOT NULL,
        has_garment BOOLEAN NOT NULL,
        has_face BOOLEAN NOT NULL,
        has_occlusion BOOLEAN NOT NULL,
        has_blur BOOLEAN NOT NULL,
        has_noise BOOLEAN NOT NULL,
        is_valid BOOLEAN NOT NULL,
        reasons TEXT[] NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create wallet_transactions table if it doesn't exist
      CREATE TABLE IF NOT EXISTS wallet_transactions (
        transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        amount INTEGER NOT NULL,
        type TEXT NOT NULL,
        source TEXT NOT NULL,
        reference_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create reward_spins table if it doesn't exist
      CREATE TABLE IF NOT EXISTS reward_spins (
        spin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
        points_spent INTEGER NOT NULL,
        reward_amount INTEGER NOT NULL,
        reward_tier TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    if (error) throw error

    return { success: true, message: "Tables created successfully" }
  } catch (error) {
    console.error("Error creating tables:", error)

    // Try creating tables one by one as a fallback
    try {
      const tables = [
        `CREATE TABLE IF NOT EXISTS users (
          user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          auth_user_id TEXT UNIQUE,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          age_verified BOOLEAN DEFAULT FALSE,
          is_admin BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS feedbacks (
          feedback_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
          product_url TEXT NOT NULL,
          brand TEXT NOT NULL,
          size TEXT NOT NULL,
          fit_score INTEGER NOT NULL,
          kept_status TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'submitted',
          is_final BOOLEAN DEFAULT TRUE,
          original_feedback_id UUID REFERENCES feedbacks(feedback_id) ON DELETE SET NULL,
          points_awarded INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS videos (
          video_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          feedback_id UUID REFERENCES feedbacks(feedback_id) ON DELETE CASCADE,
          storage_path TEXT NOT NULL,
          format TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS video_validations (
          validation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          feedback_id UUID REFERENCES feedbacks(feedback_id) ON DELETE CASCADE,
          has_human BOOLEAN NOT NULL,
          has_garment BOOLEAN NOT NULL,
          has_face BOOLEAN NOT NULL,
          has_occlusion BOOLEAN NOT NULL,
          has_blur BOOLEAN NOT NULL,
          has_noise BOOLEAN NOT NULL,
          is_valid BOOLEAN NOT NULL,
          reasons TEXT[] NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS wallet_transactions (
          transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
          amount INTEGER NOT NULL,
          type TEXT NOT NULL,
          source TEXT NOT NULL,
          reference_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
        `CREATE TABLE IF NOT EXISTS reward_spins (
          spin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID REFERENCES users(user_id) ON DELETE CASCADE,
          points_spent INTEGER NOT NULL,
          reward_amount INTEGER NOT NULL,
          reward_tier TEXT NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        )`,
      ]

      for (const tableSQL of tables) {
        const { error } = await supabase.sql(tableSQL)
        if (error) console.warn(`Error creating table: ${error.message}`)
      }

      return { success: true, message: "Tables created individually" }
    } catch (fallbackError) {
      return {
        success: false,
        error: `${(error as Error).message}. Fallback also failed: ${(fallbackError as Error).message}`,
      }
    }
  }
}
