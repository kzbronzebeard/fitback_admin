/**
 * Input validation utilities
 *
 * This file contains validation functions for user inputs
 */

// URL validation
export function isValidUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url)
    return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"
  } catch {
    return false
  }
}

// Email validation
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email)
}

// Feedback validation
export function validateFeedbackInput(input: {
  productUrl?: string
  brand?: string
  size?: string
  fitScore?: number
  keptStatus?: string
}): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}

  // Validate product URL
  if (!input.productUrl) {
    errors.productUrl = "Product URL is required"
  } else if (!isValidUrl(input.productUrl)) {
    errors.productUrl = "Please enter a valid URL"
  }

  // Validate brand
  if (!input.brand) {
    errors.brand = "Brand is required"
  } else if (input.brand.length < 2) {
    errors.brand = "Brand name must be at least 2 characters"
  }

  // Validate size
  if (!input.size) {
    errors.size = "Size is required"
  }

  // Validate fit score
  if (input.fitScore === undefined) {
    errors.fitScore = "Fit score is required"
  } else if (input.fitScore < 1 || input.fitScore > 5) {
    errors.fitScore = "Fit score must be between 1 and 5"
  }

  // Validate kept status
  if (!input.keptStatus) {
    errors.keptStatus = "Please select whether you kept or returned the item"
  } else if (!["kept", "returned", "want-to-return"].includes(input.keptStatus)) {
    errors.keptStatus = "Invalid selection"
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  }
}

// User input sanitization
export function sanitizeInput(input: string): string {
  // Remove potentially dangerous characters
  return input
    .replace(/[<>]/g, "") // Remove < and > to prevent HTML injection
    .trim() // Remove leading/trailing whitespace
}

// Validate file size and type
export function validateFile(
  file: File,
  maxSizeMB: number,
  allowedTypes: string[],
): {
  isValid: boolean
  error?: string
} {
  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size exceeds the maximum allowed size of ${maxSizeMB}MB`,
    }
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type not allowed. Allowed types: ${allowedTypes.join(", ")}`,
    }
  }

  return { isValid: true }
}
