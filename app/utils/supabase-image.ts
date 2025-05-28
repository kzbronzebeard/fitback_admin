export const getSupabaseImageUrl = (bucketName: string, fileName: string): string => {
  // Use the environment variable that's already available
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!supabaseUrl) {
    console.error("NEXT_PUBLIC_SUPABASE_URL is not defined")
    return `/placeholder.svg?height=400&width=600&text=${encodeURIComponent(fileName)}`
  }

  const imageUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${fileName}`
  console.log("Generated image URL:", imageUrl)
  return imageUrl
}

// Environment-aware image URL function
export const getImageUrl = (bucketName: string, fileName: string): string => {
  // Detect v0 preview environment - FIXED HOSTNAME DETECTION
  const isV0Preview =
    typeof window !== "undefined" &&
    (window.location.hostname.includes("vusercontent.net") || window.location.hostname.includes("localhost"))

  if (isV0Preview) {
    // Use direct Supabase URL for v0 preview and localhost
    console.log("Using direct Supabase URL for v0/localhost environment")
    return getSupabaseImageUrl(bucketName, fileName)
  } else {
    // Use proxy API for production
    console.log("Using proxy API for production environment")
    return `/api/images/${fileName}`
  }
}

// Updated list of possible image filenames to try
export const HERO_IMAGE_FILENAMES = [
  "woman_selfie.png",
  "woman-selfie.png",
  "woman-selfie.jpg",
  "woman-selfie.jpeg",
  "hero-image.png",
  "hero-image.jpg",
  "selfie.png",
  "selfie.jpg",
  "fitback_hero.png",
  "fitback_hero.jpg",
]

// Guide image filenames
export const GUIDE_IMAGE_FILENAMES = {
  link: ["fitback_guide_link.png", "guide_link.png", "link.png"],
  fit: ["fitback_guide_fit.png", "guide_fit.png", "fit.png"],
  fabric: ["fitback_guide_fabric.png", "guide_fabric.png", "fabric.png"],
  pose: ["fitback_guide_pose.png", "guide_pose.png", "pose.png"],
}
