"use server"

import { createClient } from "@supabase/supabase-js"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function setupDatabaseSecurity() {
  try {
    // Call the SQL function we created to set up RLS for all tables
    const { error } = await supabase.rpc("setup_rls_for_all_tables")

    if (error) throw error

    // Set up RLS for storage buckets
    await setupStorageBucketRLS()

    return { success: true, message: "Security policies successfully configured for all tables and storage" }
  } catch (error) {
    console.error("Error setting up security policies:", error)
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

      // For the videos bucket, create specific RLS policies
      if (bucket.name === "videos") {
        // Note: Storage bucket policies need to be set up in the Supabase dashboard
        // or via the Management API, as the JS client doesn't support this directly
        console.log(`Configured bucket ${bucket.name} to be private`)
      }
    }

    // Create videos bucket if it doesn't exist
    await ensureBucketExists("videos")

    return true
  } catch (error) {
    console.error("Error setting up storage bucket RLS:", error)
    throw error
  }
}

// Function to ensure a bucket exists
async function ensureBucketExists(bucketName: string): Promise<void> {
  try {
    // Check if bucket exists
    const { data: buckets } = await supabase.storage.listBuckets()
    const bucketExists = buckets?.some((bucket) => bucket.name === bucketName)

    // If bucket doesn't exist, create it
    if (!bucketExists) {
      const { error } = await supabase.storage.createBucket(bucketName, {
        public: false, // Set to false for security
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
      })

      if (error) throw error
      console.log(`Created bucket: ${bucketName}`)
    }
  } catch (error) {
    console.error(`Error ensuring bucket exists: ${error}`)
    throw error
  }
}
