/**
 * Get the public URL for a Supabase storage file
 * @param bucketName - The name of the storage bucket
 * @param filePath - The path to the file in the bucket
 * @returns The public URL or fallback placeholder
 */
export function getSupabaseImageUrl(bucketName: string, filePath: string): string {
  try {
    // Check if we have the required environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.warn("Supabase environment variables not found, using fallback")
      return `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(filePath)}`
    }

    // Construct the public URL manually to avoid client creation issues
    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`
    return publicUrl
  } catch (error) {
    console.error("Error getting Supabase image URL:", error)
    return `/placeholder.svg?height=300&width=400&text=${encodeURIComponent(filePath)}`
  }
}

/**
 * Format file size in bytes to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes"

  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

/**
 * Generate a random string for tokens
 */
export function generateRandomString(length = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Truncate text to specified length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}
