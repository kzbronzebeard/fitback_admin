"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import { GradientButton } from "@/components/ui/gradient-button"
import {
  Video,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Edit3,
  Save,
  X,
  HelpCircle,
  BarChart3,
  TrendingUp,
  Calendar,
} from "lucide-react"
import { updateUserProfile, getUserProfile, checkProfileCompletion } from "@/app/actions/user-profile"

// Add satin sheen effect
const allStyles = `
  .satin-header::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0) 20%,
      rgba(255, 255, 255, 0.1) 30%,
      rgba(255, 255, 255, 0.2) 40%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0) 60%
    );
    pointer-events: none;
  }

  .satin-header::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.05;
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  .premium-gradient {
    background: linear-gradient(135deg, #4A2B6B 0%, #6B46C1 50%, #4A2B6B 100%);
    background-size: 200% 200%;
    animation: gradientShift 3s ease infinite;
  }

  @keyframes gradientShift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }

  .metric-card {
    transition: all 0.3s ease;
  }

  .metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0,0,0,0.12);
  }

  .divider-line {
    background: linear-gradient(90deg, transparent 0%, #E5E7EB 20%, #E5E7EB 80%, transparent 100%);
    height: 1px;
    margin: 1.5rem 0;
  }
`

interface Feedback {
  feedback_id: string
  product_url: string
  brand: string
  size: string
  fit_score: number
  kept_status: string
  status: string
  cashback_amount: number
  created_at: string
  updated_at?: string
  admin_message?: string
  cashbackAmount: number
}

interface UserStats {
  totalFeedbacks: number
  pendingFeedbacks: number
  approvedFeedbacks: number
  rejectedFeedbacks: number
  totalEarnings: number
  totalPaidOut: number
  pendingPayout: number
}

export default function Dashboard() {
  const { user, isLoading, hasAttemptedAuth, sessionId } = useAuth()
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([])
  const [stats, setStats] = useState<UserStats>({
    totalFeedbacks: 0,
    pendingFeedbacks: 0,
    approvedFeedbacks: 0,
    rejectedFeedbacks: 0,
    totalEarnings: 0,
    totalPaidOut: 0,
    pendingPayout: 0,
  })
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [expandedFeedbacks, setExpandedFeedbacks] = useState<Set<string>>(new Set())
  const [paymentDetails, setPaymentDetails] = useState({ upiId: "", mobileNumber: "" })
  const [isEditingPayment, setIsEditingPayment] = useState(false)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const faqRef = useRef<HTMLDivElement>(null)
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false) // Default to false to show nudge

  useEffect(() => {
    // Only redirect if we've attempted auth, there's no session ID, and no user
    if (hasAttemptedAuth && !sessionId && !user) {
      router.push("/auth/login")
    }
  }, [user, hasAttemptedAuth, sessionId, router])

  useEffect(() => {
    if (user) {
      fetchUserFeedbacks()
      fetchUserProfile()
      fetchProfileCompletion()
    }
  }, [user])

  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchUserFeedbacks()
      }, 30000)

      return () => clearInterval(interval)
    }
  }, [user])

  useEffect(() => {
    if (feedbacks.length > 0 && feedbacks.length <= 3) {
      setExpandedFeedbacks(new Set(feedbacks.map((f) => f.feedback_id)))
    } else {
      setExpandedFeedbacks(new Set())
    }
  }, [feedbacks])

  const fetchUserProfile = async () => {
    if (!user?.user_id) return

    try {
      const result = await getUserProfile(user.user_id)
      if (result.success && result.data) {
        setPaymentDetails({
          upiId: result.data.upiId || "",
          mobileNumber: result.data.mobileNumber || "",
        })
      }
    } catch (error) {
      console.error("Error fetching user profile:", error)
    }
  }

  const fetchProfileCompletion = async () => {
    if (!user?.user_id) return

    try {
      console.log("🔍 Checking profile completion for user:", user.user_id)
      const result = await checkProfileCompletion(user.user_id)
      console.log("📋 Profile completion result:", result)

      if (result.success) {
        setIsProfileComplete(result.isComplete || false)
        console.log("✅ Profile complete status set to:", result.isComplete)
      } else {
        console.error("❌ Failed to check profile completion:", result.error)
        // If user doesn't exist yet, profile is definitely not complete
        setIsProfileComplete(false)
      }
    } catch (error) {
      console.error("💥 Error checking profile completion:", error)
      setIsProfileComplete(false) // Default to incomplete on error
    }
  }

  useEffect(() => {
    // Re-check profile completion when component becomes visible
    const handleVisibilityChange = () => {
      if (!document.hidden && user?.user_id) {
        console.log("🔄 Page became visible, re-checking profile completion")
        fetchProfileCompletion()
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [user?.user_id])

  const fetchUserFeedbacks = async () => {
    try {
      const sessionId = localStorage.getItem("fitback_session_id")
      const response = await fetch("/api/user/feedbacks", {
        headers: {
          "x-session-id": sessionId || "",
          "Content-Type": "application/json",
        },
      })
      if (response.ok) {
        const data = await response.json()
        if (data.success && data.feedbacks) {
          setFeedbacks(data.feedbacks)
        } else {
          console.error("Failed to fetch feedbacks:", data.error)
          setFeedbacks([])
        }

        // Calculate comprehensive stats
        const feedbackList = data.success ? data.feedbacks : []
        const totalFeedbacks = feedbackList.length
        const pendingFeedbacks = feedbackList.filter(
          (f: Feedback) => f.status === "pending" || f.status === "submitted" || f.status === "under_review",
        ).length
        const approvedFeedbacks = feedbackList.filter(
          (f: Feedback) => f.status === "approved" || f.status === "rewarded",
        ).length
        const rejectedFeedbacks = feedbackList.filter((f: Feedback) => f.status === "rejected").length
        const totalEarnings = feedbackList
          .filter((f: Feedback) => f.status === "approved" || f.status === "rewarded")
          .reduce((sum: number, f: Feedback) => sum + f.cashbackAmount, 0)

        // For now, assume no payouts have been made (this would come from a payouts table)
        const totalPaidOut = 0
        const pendingPayout = totalEarnings - totalPaidOut

        setStats({
          totalFeedbacks,
          pendingFeedbacks,
          approvedFeedbacks,
          rejectedFeedbacks,
          totalEarnings,
          totalPaidOut,
          pendingPayout,
        })
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleSavePaymentDetails = async () => {
    console.log("🔧 DEBUG: Save button clicked")
    console.log("1. Save clicked, user.user_id:", user?.user_id)
    console.log("2. Current paymentDetails state:", paymentDetails)
    console.log("3. Current isEditingPayment state:", isEditingPayment)

    // Add this new logging to see the full user object structure
    console.log("🔍 FULL USER OBJECT:", user)
    console.log("🔍 USER PROPERTIES:", user ? Object.keys(user) : "user is null/undefined")
    console.log("🔍 USER.USER_ID:", user?.user_id)
    console.log("🔍 USER.USERS_ID:", user?.users_id)
    console.log("🔍 USER.ID:", user?.id)

    if (!user?.user_id) return

    setPaymentLoading(true)
    try {
      // Clean the input values
      const cleanUpiId = paymentDetails.upiId.trim()
      const cleanMobileNumber = paymentDetails.mobileNumber.trim()

      console.log("4. Cleaned values - UPI:", cleanUpiId, "Mobile:", cleanMobileNumber)
      console.log("5. Sending data to API:", {
        upiId: cleanUpiId || undefined,
        mobileNumber: cleanMobileNumber || undefined,
      })

      // Allow saving even if only one field is filled or both are empty
      const result = await updateUserProfile(user.user_id, {
        upiId: cleanUpiId || undefined,
        mobileNumber: cleanMobileNumber || undefined,
      })

      console.log("6. API result:", result)
      console.log("7. API success:", result.success)
      console.log("8. API data:", result.data)
      if (!result.success) {
        console.error("9. API error:", result.error)
      }

      if (result.success) {
        // Update local state with the cleaned values
        console.log("10. About to update local state with:", { upiId: cleanUpiId, mobileNumber: cleanMobileNumber })
        setPaymentDetails({
          upiId: cleanUpiId,
          mobileNumber: cleanMobileNumber,
        })

        setIsEditingPayment(false)
        console.log("Payment details saved successfully:", result.data)
        console.log("11. Local state updated, setting isEditingPayment to false")

        // Optional: Add a success message (you can remove this if you don't want it)
        // alert("Payment details saved successfully!")
      } else {
        console.error("Failed to update payment details:", result.error)
        alert("Failed to save payment details. Please try again.")
      }
    } catch (error) {
      console.error("Error updating payment details:", error)
      console.error("12. Exception caught:", error)
      alert("An error occurred while saving. Please try again.")
    } finally {
      setPaymentLoading(false)
      console.log("13. Setting paymentLoading to false")
    }
  }

  const scrollToFaq = () => {
    faqRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const toggleFeedbackExpansion = (feedbackId: string) => {
    setExpandedFeedbacks((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(feedbackId)) {
        newSet.delete(feedbackId)
      } else {
        newSet.add(feedbackId)
      }
      return newSet
    })
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
      case "submitted":
      case "under_review":
        return (
          <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Under Review
          </div>
        )
      case "approved":
      case "rewarded":
        return (
          <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Rewarded
          </div>
        )
      case "rejected":
        return (
          <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Rejected
          </div>
        )
      default:
        return <div className="bg-gray-100 text-gray-800 px-3 py-1 rounded-full text-xs font-medium">{status}</div>
    }
  }

  const canEditFeedback = (feedback: Feedback) => {
    const submittedAt = new Date(feedback.created_at)
    const now = new Date()
    const hoursDiff = (now.getTime() - submittedAt.getTime()) / (1000 * 60 * 60)
    return hoursDiff < 24 && (feedback.status === "pending" || feedback.status === "submitted")
  }

  const getNextPayoutDate = () => {
    const today = new Date()
    const dayOfWeek = today.getDay() // 0 = Sunday, 5 = Friday
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7 || 7 // Next Friday
    const nextFriday = new Date(today)
    nextFriday.setDate(today.getDate() + daysUntilFriday)
    return nextFriday.toLocaleDateString("en-US", {
      weekday: "long",
      month: "short",
      day: "numeric",
    })
  }

  const getPayoutMessage = () => {
    if (stats.pendingPayout >= 100) {
      return `₹${stats.pendingPayout} • ${getNextPayoutDate()}`
    } else {
      const remaining = 100 - stats.pendingPayout
      return `₹${remaining} more needed for payout`
    }
  }

  if (isLoading || isLoadingData) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-[#F5EFE6]">
        <div className="w-full max-w-md mx-auto h-full flex flex-col relative">
          <div className="flex-1 px-6 py-6 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A2B6B] mb-4"></div>
            <p className="text-[#4A2B6B] font-medium">Loading dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-[#F5EFE6]">
      <style jsx>{allStyles}</style>
      <div className="w-full max-w-md mx-auto h-full flex flex-col relative">
        {/* Header */}
        <div
          className="w-full text-white px-6 rounded-3xl z-0 flex items-center justify-center satin-header"
          style={{
            background: "linear-gradient(135deg, #4A2B6B 0%, #4A2B6B 85%, #F7E7CE 150%)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
            height: "20vh",
            minHeight: "120px",
            paddingTop: "2rem",
            paddingBottom: "2rem",
            marginTop: "1rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold font-serif mb-2">Dashboard</h1>
            <p className="text-sm opacity-90">Welcome back, {user.name || user.email}!</p>
          </div>
        </div>

        {/* Main content */}
        <div
          className="flex-1 px-6 py-6 flex flex-col rounded-3xl relative z-10"
          style={{
            backgroundColor: "#F5EFE6",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)",
            marginTop: "-5%",
            marginBottom: "1rem",
          }}
        >
          {/* Premium Summary Card */}
          <div className="bg-white rounded-3xl p-6 mb-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)] metric-card">
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-6 h-6 text-[#4A2B6B]" />
              <h2 className="text-lg font-bold text-[#1D1A2F] font-serif">Summary</h2>
            </div>

            {/* Earnings Summary */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="text-sm font-semibold text-gray-700">Earnings Overview</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-700 mb-1">₹{stats.totalEarnings}</div>
                  <div className="text-xs font-medium text-green-600">Total Earned</div>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 text-center">
                  <div className="text-2xl font-bold text-blue-700 mb-1">₹{stats.totalPaidOut}</div>
                  <div className="text-xs font-medium text-blue-600">Paid Out</div>
                </div>
              </div>
            </div>

            {/* Next Payout */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-5 h-5 text-[#4A2B6B]" />
                <h3 className="text-sm font-semibold text-gray-700">Next Payout</h3>
              </div>
              {!isProfileComplete ? (
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 text-center border border-orange-200">
                  <div className="text-orange-700 text-sm font-medium mb-2">Complete Your Profile First</div>
                  <div className="text-orange-600 text-xs mb-3">
                    Payouts require a complete profile with body measurements
                  </div>
                  <button
                    onClick={() => router.push("/create-profile")}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                  >
                    Complete Profile
                  </button>
                </div>
              ) : (
                <div
                  className={`rounded-2xl p-4 text-center ${
                    stats.pendingPayout >= 100
                      ? "bg-gradient-to-br from-purple-50 to-purple-100"
                      : "bg-gradient-to-br from-gray-50 to-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Calendar className="w-4 h-4 text-gray-600" />
                    <span
                      className={`text-sm font-medium ${stats.pendingPayout >= 100 ? "text-[#4A2B6B]" : "text-gray-600"}`}
                    >
                      {getPayoutMessage()}
                    </span>
                  </div>
                  {stats.pendingPayout >= 100 && (
                    <div className="mt-2">
                      <div className="w-full bg-purple-200 rounded-full h-2">
                        <div className="bg-[#4A2B6B] h-2 rounded-full w-full"></div>
                      </div>
                    </div>
                  )}
                  {stats.pendingPayout < 100 && (
                    <div className="mt-2">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gray-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(stats.pendingPayout / 100) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="divider-line"></div>

            {/* Try-On Activity */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Video className="w-5 h-5 text-[#4A2B6B]" />
                <h3 className="text-sm font-semibold text-gray-700">Try-On Performance</h3>
              </div>
              <div className="grid grid-cols-4 gap-3">
                <div className="bg-gradient-to-br from-[#4A2B6B]/10 to-[#4A2B6B]/20 rounded-2xl p-3 text-center">
                  <div className="text-xl font-bold text-[#4A2B6B] mb-1">{stats.totalFeedbacks}</div>
                  <div className="text-xs font-medium text-[#4A2B6B]">Total</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-3 text-center">
                  <div className="text-xl font-bold text-green-700 mb-1">{stats.approvedFeedbacks}</div>
                  <div className="text-xs font-medium text-green-600 flex items-center justify-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    <span>Approved</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-3 text-center">
                  <div className="text-xl font-bold text-red-700 mb-1">{stats.rejectedFeedbacks}</div>
                  <div className="text-xs font-medium text-red-600 flex items-center justify-center gap-1">
                    <XCircle className="w-3 h-3" />
                    <span>Rejected</span>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-3 text-center">
                  <div className="text-xl font-bold text-yellow-700 mb-1">{stats.pendingFeedbacks}</div>
                  <div className="text-xs font-medium text-yellow-600 flex items-center justify-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Review</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-3xl p-6 mb-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <h2 className="text-lg font-bold text-[#1D1A2F] mb-4 font-serif">Quick Actions</h2>
            <div className="space-y-3">
              {!isProfileComplete && (
                <button
                  onClick={() => router.push("/create-profile")}
                  className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white py-3 rounded-full font-semibold text-base hover:from-orange-600 hover:to-orange-700 transition-colors flex items-center justify-center gap-2"
                >
                  👤 Complete Your Profile First
                </button>
              )}
              <GradientButton
                onClick={() => router.push("/submit-feedback")}
                className="w-full py-3 text-base font-semibold rounded-full"
                disabled={!isProfileComplete}
              >
                📹 Submit New Feedback
              </GradientButton>
              <button
                onClick={scrollToFaq}
                className="w-full bg-white border-2 border-[#4A2B6B] text-[#4A2B6B] py-3 rounded-full font-semibold text-base hover:bg-[#4A2B6B] hover:text-white transition-colors flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                Help & FAQ
              </button>
            </div>
          </div>

          {/* Payment Details Card */}
          <div className="bg-white rounded-3xl p-6 mb-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#1D1A2F] font-serif flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Details
              </h2>
              {!isEditingPayment && (
                <button
                  onClick={() => setIsEditingPayment(true)}
                  className="text-[#4A2B6B] hover:text-[#4A2B6B]/80 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>

            {isEditingPayment ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">UPI ID</label>
                  <input
                    type="text"
                    value={paymentDetails.upiId}
                    onChange={(e) => setPaymentDetails((prev) => ({ ...prev, upiId: e.target.value }))}
                    placeholder="your-upi@paytm"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A2B6B] focus:border-transparent"
                  />
                </div>

                {/* OR Divider */}
                <div className="flex items-center my-4">
                  <div className="flex-1 border-t border-gray-300"></div>
                  <span className="px-3 text-sm font-medium text-gray-500 bg-white">OR</span>
                  <div className="flex-1 border-t border-gray-300"></div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mobile Number</label>
                  <input
                    type="tel"
                    value={paymentDetails.mobileNumber}
                    onChange={(e) => setPaymentDetails((prev) => ({ ...prev, mobileNumber: e.target.value }))}
                    placeholder="+91 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4A2B6B] focus:border-transparent"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSavePaymentDetails}
                    className="flex-1 bg-[#4A2B6B] text-white py-2 rounded-lg font-medium hover:bg-[#4A2B6B]/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {paymentLoading ? "Saving..." : "Save"}
                  </button>
                  <button
                    onClick={() => setIsEditingPayment(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentDetails.upiId || paymentDetails.mobileNumber ? (
                  <>
                    {paymentDetails.upiId && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">UPI ID:</span>
                        <span className="text-sm text-gray-600">{paymentDetails.upiId}</span>
                      </div>
                    )}
                    {paymentDetails.mobileNumber && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Mobile:</span>
                        <span className="text-sm text-gray-600">{paymentDetails.mobileNumber}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500 text-sm mb-3">No payment details added yet</p>
                    <button
                      onClick={() => setIsEditingPayment(true)}
                      className="text-[#4A2B6B] hover:underline text-sm font-medium"
                    >
                      Add payment details
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Feedback History */}
          <div className="bg-white rounded-3xl p-6 mb-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <h2 className="text-lg font-bold text-[#1D1A2F] mb-4 font-serif">Your Feedback History</h2>

            {feedbacks.length === 0 ? (
              <div className="text-center py-8">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4 text-sm">No feedback submitted yet</p>
                <GradientButton
                  onClick={() => router.push("/submit-feedback")}
                  className="px-6 py-3 text-base font-semibold rounded-full"
                >
                  Submit Your First Feedback
                </GradientButton>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => {
                  const isExpanded = expandedFeedbacks.has(feedback.feedback_id)
                  const canEdit = canEditFeedback(feedback)
                  const isUnderReview =
                    feedback.status === "pending" ||
                    feedback.status === "submitted" ||
                    feedback.status === "under_review"

                  return (
                    <div
                      key={feedback.feedback_id}
                      className="bg-gray-50 border border-gray-200 rounded-2xl overflow-hidden hover:bg-gray-100 transition-colors"
                    >
                      {/* Collapsed View */}
                      <button
                        onClick={() => toggleFeedbackExpansion(feedback.feedback_id)}
                        className="w-full p-4 text-left flex justify-between items-center"
                      >
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#4A2B6B] text-sm mb-1">{feedback.brand}</h4>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs text-gray-600">Size: {feedback.size}</span>
                          </div>
                          <div className="flex items-center gap-2">{getStatusBadge(feedback.status)}</div>
                        </div>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          className={`transition-transform ${isExpanded ? "rotate-180" : ""}`}
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </button>

                      {/* Expanded View */}
                      {isExpanded && (
                        <div className="px-4 pb-4 border-t border-gray-200 bg-white">
                          <div className="pt-4 space-y-4">
                            {/* Product Link */}
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Product</h5>
                              <a
                                href={feedback.product_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#4A2B6B] hover:underline text-sm font-medium inline-flex items-center gap-1"
                              >
                                View Product Page
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                  />
                                </svg>
                              </a>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 gap-3 text-sm">
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Size:</span>
                                <span className="text-gray-600">{feedback.size}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Fit Score:</span>
                                <span className="text-gray-600">{feedback.fit_score}/10</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Keep Status:</span>
                                <span className="text-gray-600 capitalize">
                                  {feedback.kept_status?.replace("_", " ") || "Unknown"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Submitted:</span>
                                <span className="text-gray-600">
                                  {new Date(feedback.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="font-medium text-gray-700">Cashback:</span>
                                {feedback.status === "approved" || feedback.status === "rewarded" ? (
                                  <span className="text-green-600 font-semibold">₹{feedback.cashback_amount}</span>
                                ) : (
                                  <span className="text-gray-500">₹{feedback.cashback_amount} (pending)</span>
                                )}
                              </div>
                            </div>

                            {/* Status Messages */}
                            {feedback.status === "rejected" && (
                              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                                <h6 className="text-sm font-medium text-red-800 mb-1">Rejection Reason</h6>
                                <p className="text-sm text-red-700">
                                  {feedback.admin_message ||
                                    "Your feedback did not meet our quality guidelines. Please ensure clear video quality and detailed fit commentary."}
                                </p>
                              </div>
                            )}

                            {isUnderReview && (
                              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                                <h6 className="text-sm font-medium text-yellow-800 mb-1">Under Review</h6>
                                <p className="text-sm text-yellow-700">
                                  Our team is reviewing your feedback. This typically takes 24-48 hours.
                                </p>
                              </div>
                            )}

                            {feedback.status === "approved" || feedback.status === "rewarded" ? (
                              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                <h6 className="text-sm font-medium text-green-800 mb-1">Approved & Rewarded</h6>
                                <p className="text-sm text-green-700">
                                  Great job! Your feedback has been approved and ₹{feedback.cashback_amount} has been
                                  added to your earnings.
                                </p>
                              </div>
                            ) : null}

                            {/* Edit Option */}
                            {canEdit && isUnderReview && (
                              <div className="pt-2 border-t border-gray-100">
                                <div className="flex justify-between items-center">
                                  <span className="text-xs text-orange-600 font-medium">
                                    Editable for{" "}
                                    {Math.max(
                                      0,
                                      24 -
                                        Math.floor(
                                          (new Date().getTime() - new Date(feedback.created_at).getTime()) /
                                            (1000 * 60 * 60),
                                        ),
                                    )}
                                    h
                                  </span>
                                  <button
                                    onClick={() => router.push(`/submit-feedback?edit=${feedback.feedback_id}`)}
                                    className="text-sm text-[#4A2B6B] hover:underline flex items-center gap-1 font-medium"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                    Edit Feedback
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* FAQ Section */}
          <div ref={faqRef} className="bg-white rounded-3xl p-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <h2 className="text-lg font-bold text-[#1D1A2F] mb-4 font-serif">Frequently Asked Questions</h2>

            <div className="space-y-3">
              {/* FAQ Item 1 - Data Usage */}
              <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <button
                  className="w-full px-4 py-3 text-left flex justify-between items-center"
                  onClick={() => setExpandedFaq(expandedFaq === 1 ? null : 1)}
                >
                  <span className="font-medium text-[#1D1A2F] flex items-center gap-2">
                    <span className="text-[#7E5BEF]">🔐</span> How will my data be used?
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${expandedFaq === 1 ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {expandedFaq === 1 && (
                  <div className="px-4 pb-4 text-sm text-gray-600">
                    <p className="mb-2">Your videos and feedback will:</p>
                    <ul className="list-disc pl-5 space-y-1 mb-2">
                      <li>Help train our fit-prediction & visualisation AI</li>
                      <li>Power smarter shopping suggestions for you and others</li>
                      <li>Never be sold to advertisers or used without your consent</li>
                      <li>Your data is stored anonymously and using bank-grade encryption.</li>
                    </ul>
                    <p>You're always in control — you can delete your data anytime from your profile.</p>
                  </div>
                )}
              </div>

              {/* FAQ Item 2 - Why Feedback Matters */}
              <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <button
                  className="w-full px-4 py-3 text-left flex justify-between items-center"
                  onClick={() => setExpandedFaq(expandedFaq === 2 ? null : 2)}
                >
                  <span className="font-medium text-[#1D1A2F] flex items-center gap-2">
                    <span className="text-[#7E5BEF]">🪄</span> Why Your Feedback Matters
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${expandedFaq === 2 ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {expandedFaq === 2 && (
                  <div className="px-4 pb-4 text-sm text-gray-600">
                    <p className="mb-2">Ever bought something online and thought, "Will this even fit me?"</p>
                    <p className="mb-2">You're not alone — fit is the #1 reason people return clothes.</p>
                    <p className="mb-2">
                      That's where you come in. When you record a quick video and talk about how your outfit fits and
                      feels, you're helping our system learn how real clothes fit real bodies.
                    </p>
                    <p>
                      Think of it like training a super-smart stylist who knows your shape, your comfort zone, and your
                      personal style.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 3 - What You Get */}
              <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <button
                  className="w-full px-4 py-3 text-left flex justify-between items-center"
                  onClick={() => setExpandedFaq(expandedFaq === 3 ? null : 3)}
                >
                  <span className="font-medium text-[#1D1A2F] flex items-center gap-2">
                    <span className="text-[#7E5BEF]">💡</span> What do I get out of this?
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${expandedFaq === 3 ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {expandedFaq === 3 && (
                  <div className="px-4 pb-4 text-sm text-gray-600">
                    <p className="mb-2">Assured rewards, to start with! But also, here's what you are helping build-</p>
                    <ul className="list-disc pl-5 space-y-1 mb-2">
                      <li>Tailored styling and fit tips - powered by AI & real humans!</li>
                      <li>Virtually try on different styles in different sizes</li>
                    </ul>
                    <p>And yes — less fashion waste, too 🌍</p>
                  </div>
                )}
              </div>

              {/* FAQ Item 4 - Contact Information */}
              <div className="bg-gray-50 rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                <button
                  className="w-full px-4 py-3 text-left flex justify-between items-center"
                  onClick={() => setExpandedFaq(expandedFaq === 4 ? null : 4)}
                >
                  <span className="font-medium text-[#1D1A2F] flex items-center gap-2">
                    <span className="text-[#7E5BEF]">👋</span> Who can I talk to?
                  </span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`transition-transform ${expandedFaq === 4 ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {expandedFaq === 4 && (
                  <div className="px-4 pb-4 text-sm text-gray-600">
                    <p className="mb-2">
                      Reach our founder, Khanaz, directly on LinkedIn{" "}
                      <a
                        href="https://www.linkedin.com/in/khanaz-k-a-41477629/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#7E5BEF] hover:underline"
                      >
                        here
                      </a>
                    </p>
                    <p className="mb-2">
                      Or email us at:{" "}
                      <a href="mailto:team@tashion.ai" className="text-[#7E5BEF] hover:underline">
                        team@tashion.ai
                      </a>
                    </p>
                    <p>
                      Or call us at:{" "}
                      <a href="tel:+919567764258" className="text-[#7E5BEF] hover:underline">
                        +91-9567764258
                      </a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
