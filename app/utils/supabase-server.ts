import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client for server-side operations
export function createServerSupabaseClient() {
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
