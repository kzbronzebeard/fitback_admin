/**
 * Image optimization utility
 *
 * This file contains utilities for optimizing images and ensuring proper loading
 */

import type { StaticImageData } from "next/image"

// Define standard image sizes for responsive loading
export const imageSizes = {
  small: 400,
  medium: 800,
  large: 1200,
}

// Helper to generate srcSet for responsive images
export function generateSrcSet(basePath: string, formats = ["webp", "jpg"]): string {
  return formats
    .map((format) =>
      Object.entries(imageSizes)
        .map(([size, width]) => `${basePath}-${size}.${format} ${width}w`)
        .join(", "),
    )
    .join(", ")
}

// Image loading priority helper
export function getImagePriority(imagePath: string): boolean {
  // Prioritize loading for critical above-the-fold images
  const criticalImages = ["fitback_welcome_illustration_mirror2.png", "woman-selfie-illustration.png", "logo.png"]

  return criticalImages.some((img) => imagePath.includes(img))
}

// Image placeholder generator
export function getImagePlaceholder(width: number, height: number): StaticImageData {
  return {
    src: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${width} ${height}'%3E%3C/svg%3E`,
    height: height,
    width: width,
  }
}
