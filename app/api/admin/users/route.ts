import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client with service role key
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Admin email whitelist
const ADMIN_EMAILS = ["p10khanazka@iima.ac.in", "team@tashion.ai"]
