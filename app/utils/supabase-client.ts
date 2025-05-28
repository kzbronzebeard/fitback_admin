"use client"

import { createClient } from "@supabase/supabase-js"

// Client-side Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Export the createClient function for other components that might need it
export { createClient } from "@supabase/supabase-js"
