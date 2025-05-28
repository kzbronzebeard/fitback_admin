"use client"

import Image from "next/image"
import { useState } from "react"
import { getSupabaseImageUrl } from "@/app/utils/supabase-image"

interface SupabaseImageProps {
  bucket: string
  fileName: string
  alt: string
  width?: number
  height?: number
  className?: string
  fallbackText?: string
  priority?: boolean
}

export function SupabaseImage({
  bucket,
  fileName,
  alt,
  width = 400,
  height = 300,
  className = "",
  fallbackText,
  priority = false,
}: SupabaseImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageUrl] = useState(() => getSupabaseImageUrl(bucket, fileName))

  const fallbackUrl = `/placeholder.svg?height=${height}&width=${width}&text=${encodeURIComponent(fallbackText || alt)}`

  if (imageError) {
    return (
      <div
        className={`bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center ${className}`}
      >
        <div className="text-center text-gray-600 p-4">
          <div className="text-4xl mb-2">🖼️</div>
          <p className="text-sm font-medium">{fallbackText || alt}</p>
        </div>
      </div>
    )
  }

  return (
    <Image
      src={imageUrl || "/placeholder.svg"}
      alt={alt}
      width={width}
      height={height}
      className={className}
      priority={priority}
      onError={() => {
        console.error("Supabase image failed to load:", imageUrl)
        setImageError(true)
      }}
      onLoad={() => console.log("Supabase image loaded successfully:", imageUrl)}
    />
  )
}
