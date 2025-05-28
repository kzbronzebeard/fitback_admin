// Common response types
export type ApiResponse<T = any> = {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// User types (updated for simplified schema)
export type UserProfile = {
  userId: string
  authUserId: string
  name?: string
  email?: string
  heightCm?: number
  weightKg?: number
  gender?: "male" | "female" | "other"
  bodyType?: string
  country?: string
  ageVerified: boolean
  upiId?: string
  mobileNumber?: string
  paymentMethodStatus: "pending" | "verified" | "invalid"
  createdAt: string
  updatedAt: string
}

export type CreateUserRequest = {
  name: string
  email: string
  heightCm?: number
  weightKg?: number
  gender?: "male" | "female" | "other"
  bodyType?: string
  country?: string
  ageVerified: boolean
  upiId?: string
  mobileNumber?: string
}

export type UpdateUserRequest = Partial<CreateUserRequest> & {
  paymentMethodStatus?: "pending" | "verified" | "invalid"
}

// Feedback types (simplified)
export type KeptStatus = "kept" | "returned" | "want_to_return"

export type FeedbackStatus = "pending" | "approved" | "rejected" | "submitted"

export type Feedback = {
  feedbackId: string
  userId: string
  productUrl: string
  brand?: string
  size?: string
  fitScore?: number
  keptStatus: KeptStatus
  status: FeedbackStatus // Add this field
  isFinal: boolean // Add this field
  originalFeedbackId?: string // Add this field
  pointsAwarded?: number // Add this field
  cashbackAmount: number
  createdAt: string
  updatedAt?: string // Add this field
  adminNotes?: string // Add this field
  videoPath?: string // Add this field
  videoFormat?: string // Add this field
}

export type CreateFeedbackRequest = {
  productUrl: string
  brand: string
  size: string
  fitScore: number
  keptStatus: KeptStatus
  // Remove cashbackAmount since it's set automatically
}

// Video types (with video type)
export type VideoType = "original" | "edited"

export type Video = {
  videoId: string
  feedbackId: string
  storagePath: string
  format?: string
  videoType: VideoType
  createdAt: string
}

export type CreateVideoRequest = {
  feedbackId: string
  storagePath: string
  format?: string
  videoType: VideoType
}

// Wallet transaction types
export type TransactionType = "credit" | "debit"

export type WalletTransaction = {
  transactionId: string
  userId: string
  amount: number
  type: TransactionType
  description?: string
  referenceFeedbackId?: string
  createdAt: string
}

// Wallet balance view type
export type WalletBalance = {
  userId: string
  availableBalance: number
  totalEarned: number
  totalPaidOut: number
}

// Payout types
export type PayoutStatus = "pending" | "completed" | "failed" | "cancelled"
export type PaymentMethod = "upi" | "mobile"

export type Payout = {
  payoutId: string
  userId: string
  amount: number
  paymentMethod: PaymentMethod
  paymentIdentifier: string
  status: PayoutStatus
  scheduledFor?: string
  processedAt?: string
  adminNotes?: string
  createdAt: string
}

export type CreatePayoutRequest = {
  amount: number
  paymentMethod: PaymentMethod
  paymentIdentifier: string
  scheduledFor?: string
}

export type UpdatePayoutRequest = {
  status?: PayoutStatus
  processedAt?: string
  adminNotes?: string
}

// Add the missing admin review types that your APIs are using

export type AdminReviewStatus = "approved" | "rejected"

export type AdminReview = {
  reviewId: string
  feedbackId: string
  status: AdminReviewStatus
  reviewedBy: string
  notes?: string
  reviewedAt: string
}

export type CreateAdminReviewRequest = {
  feedbackId: string
  status: AdminReviewStatus
  notes?: string
}
