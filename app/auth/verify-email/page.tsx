"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { GradientButton } from "@/components/ui/gradient-button"
import { resendVerificationEmail, verifyEmail } from "../../actions/auth"
import { AuthLayout } from "../components/auth-layout"
import { Mail, CheckCircle, RefreshCw, Edit3 } from "lucide-react"

// Import auth context safely
let useAuth: any
try {
  const authModule = require("../../context/new-auth-context")
  useAuth = authModule.useAuth
} catch (error) {
  console.warn("Auth context not available:", error)
  useAuth = () => ({ login: () => {} })
}

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login } = useAuth()

  const [email, setEmail] = useState(searchParams.get("email") || "")
  const [isEditing, setIsEditing] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")
  const [verificationSuccess, setVerificationSuccess] = useState(false)

  // Check for verification token in URL
  useEffect(() => {
    const token = searchParams.get("token")
    if (token) {
      handleEmailVerification(token)
    }
  }, [searchParams])

  const handleEmailVerification = async (token: string) => {
    setIsVerifying(true)
    setError("")

    try {
      const result = await verifyEmail(token)

      if (result.success) {
        setVerificationSuccess(true)
        setMessage(result.message || "Email verified successfully!")

        // Log the user in
        if (result.sessionId && result.user) {
          login(result.sessionId, result.user)

          // Redirect to dashboard after 2 seconds
          setTimeout(() => {
            router.push("/dashboard")
          }, 2000)
        }
      } else {
        setError(result.error || "Failed to verify email")
      }
    } catch (error) {
      setError("An unexpected error occurred during verification")
    } finally {
      setIsVerifying(false)
    }
  }

  const handleResendEmail = async () => {
    if (!email) {
      setError("Please enter your email address")
      return
    }

    setIsResending(true)
    setError("")
    setMessage("")

    try {
      const result = await resendVerificationEmail(email)

      if (result.success) {
        setMessage(result.message || "Verification email sent!")
        setIsEditing(false)
      } else {
        setError(result.error || "Failed to send verification email")
      }
    } catch (error) {
      setError("An unexpected error occurred")
    } finally {
      setIsResending(false)
    }
  }

  if (verificationSuccess) {
    return (
      <AuthLayout title="Welcome!" subtitle="Your account is now active">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-serif font-bold text-[#4A2B6B]">Welcome to Fitback!</h2>
            <p className="text-gray-700 text-lg">{message}</p>
            <p className="text-sm text-gray-600">Redirecting to your dashboard...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (isVerifying) {
    return (
      <AuthLayout title="Verifying..." subtitle="Please wait while we verify your email">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto">
            <div className="w-10 h-10 border-4 border-[#4A2B6B] border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-serif font-bold text-[#4A2B6B]">Verifying Email...</h2>
            <p className="text-gray-700 text-lg">Please wait while we verify your email address.</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Check Your Email" subtitle="We've sent a verification link">
      <div className="space-y-6">
        {/* Email Display/Edit */}
        <div className="bg-[#F5F2EF] rounded-xl p-5">
          {isEditing ? (
            <div className="space-y-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="h-12 text-lg border-2 border-gray-200 focus:border-[#4A2B6B] focus:ring-[#4A2B6B] rounded-xl bg-white"
              />
              <div className="flex gap-3">
                <GradientButton
                  onClick={handleResendEmail}
                  disabled={isResending}
                  className="flex-1 h-12 text-base font-semibold rounded-xl"
                >
                  {isResending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Sending...
                    </div>
                  ) : (
                    "Send Email"
                  )}
                </GradientButton>
                <button
                  onClick={() => setIsEditing(false)}
                  className="h-12 px-6 border-2 border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-[#4A2B6B]" />
                <span className="text-gray-800 font-semibold text-lg">{email}</span>
              </div>
              <button
                onClick={() => setIsEditing(true)}
                className="text-[#4A2B6B] hover:text-[#6B46C1] transition-colors p-2"
              >
                <Edit3 className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-[#4A2B6B] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              1
            </div>
            <p className="text-gray-700 text-lg pt-1">Check your email inbox for a verification link</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-[#4A2B6B] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              2
            </div>
            <p className="text-gray-700 text-lg pt-1">Click the verification link to activate your account</p>
          </div>
          <div className="flex items-start gap-4">
            <div className="w-8 h-8 bg-[#4A2B6B] text-white rounded-full flex items-center justify-center flex-shrink-0 font-bold">
              3
            </div>
            <p className="text-gray-700 text-lg pt-1">You'll be automatically signed in and redirected</p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4">
            <p className="text-green-700 font-medium flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {message}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Resend Button */}
        {!isEditing && (
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full h-14 border-2 border-[#4A2B6B] text-[#4A2B6B] hover:bg-[#4A2B6B] hover:text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50"
          >
            {isResending ? (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5 animate-spin" />
                Sending...
              </div>
            ) : (
              <div className="flex items-center justify-center gap-2">
                <RefreshCw className="w-5 h-5" />
                Didn't receive email? Resend
              </div>
            )}
          </button>
        )}

        {/* Back to Signup */}
        <div className="text-center pt-4">
          <p className="text-gray-700 text-lg">
            Want to use a different email?{" "}
            <Link href="/auth/signup" className="text-[#4A2B6B] hover:text-[#6B46C1] font-semibold transition-colors">
              Back to signup
            </Link>
          </p>
        </div>
      </div>
    </AuthLayout>
  )
}
