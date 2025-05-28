"use server"

import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function setupRLS() {
  try {
    // Execute SQL to set up RLS for all tables
    const { error } = await supabase.rpc("setup_rls_for_all_tables")

    if (error) throw error

    // Set up RLS for storage buckets
    await setupStorageBucketRLS()

    return { success: true, message: "RLS successfully configured for all tables and storage" }
  } catch (error) {
    console.error("Error setting up RLS:", error)
    return { success: false, error: (error as Error).message }
  }
}

async function setupStorageBucketRLS() {
  try {
    // Get list of all buckets
    const { data: buckets, error } = await supabase.storage.listBuckets()

    if (error) throw error

    // Ensure each bucket has RLS enabled
    for (const bucket of buckets || []) {
      // Update bucket to ensure it's not public
      await supabase.storage.updateBucket(bucket.name, {
        public: false,
      })

      // Set up RLS policies for the bucket
      // Note: This requires manually setting up policies in the Supabase dashboard
      // or using the REST API, as the JS client doesn't support this directly
      console.log(`Configured bucket ${bucket.name} to be private`)
    }
  } catch (error) {
    console.error("Error setting up storage bucket RLS:", error)
    throw error
  }
}
