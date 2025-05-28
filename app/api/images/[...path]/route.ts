import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const imagePath = params.path.join("/")
    console.log("=== IMAGE PROXY DEBUG ===")
    console.log("Requested image path:", imagePath)
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log("Service role key exists:", !!process.env.SUPABASE_SERVICE_ROLE_KEY)

    // List files in the images bucket to see what's available
    const { data: fileList, error: listError } = await supabase.storage.from("images").list()
    console.log("Files in images bucket:", fileList?.map((f) => f.name) || [])
    if (listError) {
      console.error("Error listing files:", listError)
    }

    // Try to get the specific image
    const { data, error } = await supabase.storage.from("images").download(imagePath)

    if (error) {
      console.error("Supabase storage error:", error)

      // If the specific image doesn't exist, try common alternatives
      const alternatives = [
        "woman_selfie.jpg",
        "woman_selfie.jpeg",
        "woman-selfie.png",
        "woman-selfie.jpg",
        "hero.png",
        "hero.jpg",
      ]

      for (const alt of alternatives) {
        if (alt !== imagePath) {
          console.log("Trying alternative:", alt)
          const { data: altData, error: altError } = await supabase.storage.from("images").download(alt)
          if (!altError && altData) {
            console.log("Found alternative image:", alt)
            const arrayBuffer = await altData.arrayBuffer()
            return new NextResponse(arrayBuffer, {
              status: 200,
              headers: {
                "Content-Type": getContentType(alt),
                "Cache-Control": "public, max-age=31536000, immutable",
                "Cross-Origin-Resource-Policy": "cross-origin",
                "Access-Control-Allow-Origin": "*",
              },
            })
          }
        }
      }

      // If no alternatives found, return a placeholder
      return generatePlaceholderImage(imagePath)
    }

    if (!data) {
      console.log("No data returned from Supabase")
      return generatePlaceholderImage(imagePath)
    }

    console.log("Successfully fetched image:", imagePath)
    const arrayBuffer = await data.arrayBuffer()

    return new NextResponse(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": getContentType(imagePath),
        "Cache-Control": "public, max-age=31536000, immutable",
        "Cross-Origin-Resource-Policy": "cross-origin",
        "Access-Control-Allow-Origin": "*",
      },
    })
  } catch (error) {
    console.error("Image proxy error:", error)
    return generatePlaceholderImage(params.path.join("/"))
  }
}

function getContentType(filename: string): string {
  const extension = filename.split(".").pop()?.toLowerCase()
  switch (extension) {
    case "png":
      return "image/png"
    case "jpg":
    case "jpeg":
      return "image/jpeg"
    case "gif":
      return "image/gif"
    case "webp":
      return "image/webp"
    case "svg":
      return "image/svg+xml"
    default:
      return "image/jpeg"
  }
}

function generatePlaceholderImage(filename: string): NextResponse {
  // Generate a simple SVG placeholder
  const svg = `
    <svg width="600" height="400" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#F5EFE6"/>
      <rect x="50" y="50" width="500" height="300" fill="#4A2B6B" opacity="0.1" rx="20"/>
      <text x="300" y="180" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="#4A2B6B">👗</text>
      <text x="300" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#4A2B6B">Fashion Selfie</text>
      <text x="300" y="250" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#666">Image: ${filename}</text>
    </svg>
  `

  return new NextResponse(svg, {
    status: 200,
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=300", // Cache for 5 minutes only
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Access-Control-Allow-Origin": "*",
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
  })
}
