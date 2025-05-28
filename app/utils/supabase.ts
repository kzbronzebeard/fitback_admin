import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { createClient } from "@supabase/supabase-js"

// Client-side Supabase client
export const createClientSupabase = () => createClientComponentClient()

// Server-side Supabase client with service role
export const createServerSupabase = () => {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey)
}

// Admin email list
export const ADMIN_EMAILS = ["p10khanazka@iima.ac.in", "chhekur@gmail.com", "team@tashion.ai"]

// Check if user is admin
export const isAdminUser = (email: string | undefined): boolean => {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
