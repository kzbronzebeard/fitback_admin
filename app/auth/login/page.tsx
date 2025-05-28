"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { GradientButton } from "@/components/ui/gradient-button"
import { signIn } from "../../actions/auth"
import { AuthLayout } from "../components/auth-layout"
import { Eye, EyeOff, Mail, Lock, LogIn } from "lucide-react"
import { useAuth } from "../../context/auth-context"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
  }

  const checkUserFeedbacks = async (userId: string, sessionId: string) => {
    try {
      const response = await fetch("/api/user/feedbacks", {
        headers: {
          "x-session-id": sessionId,
          "Content-Type": "application/json",
        },
      })
      const result = await response.json()

      if (result.success && result.feedbacks && result.feedbacks.length > 0) {
        // User has submitted feedbacks, go to dashboard
        return "/dashboard"
      } else {
        // No feedbacks, go to submit feedback page
        return "/submit-feedback"
      }
    } catch (error) {
      console.error("Error checking user feedbacks:", error)
      // Default to dashboard on error
      return "/dashboard"
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await signIn(formData.email, formData.password)

      if (result.success && result.sessionId && result.user) {
        // Log the user in with auth context
        login(result.sessionId, {
          user_id: result.user.user_id,
          email: result.user.email,
          name: result.user.name || "",
          is_admin: result.user.is_admin || false,
          email_verified: true,
        })

        // Check if user has submitted feedbacks to determine redirect
        const redirectPath = await checkUserFeedbacks(result.user.user_id, result.sessionId)

        console.log("[LOGIN] Redirecting to:", redirectPath)
        router.push(redirectPath)
      } else {
        setError(result.error || "Failed to sign in")
      }
    } catch (error) {
      console.error("[LOGIN] Unexpected error:", error)
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthLayout title="Welcome Back" subtitle="Sign in to continue earning rewards">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email Field */}
        <div className="space-y-3">
          <label htmlFor="email" className="text-base font-semibold text-[#4A2B6B] flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Address
          </label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleInputChange}
            placeholder="your@email.com"
            required
            className="h-14 text-lg border-2 border-gray-200 focus:border-[#4A2B6B] focus:ring-[#4A2B6B] rounded-xl bg-white"
          />
        </div>

        {/* Password Field */}
        <div className="space-y-3">
          <label htmlFor="password" className="text-base font-semibold text-[#4A2B6B] flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Password
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
              className="h-14 text-lg border-2 border-gray-200 focus:border-[#4A2B6B] focus:ring-[#4A2B6B] rounded-xl bg-white pr-14"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#4A2B6B] transition-colors"
            >
              {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Forgot Password Link */}
        <div className="text-right">
          <Link
            href="/auth/forgot-password"
            className="text-[#4A2B6B] hover:text-[#6B46C1] font-semibold transition-colors"
          >
            Forgot your password?
          </Link>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <GradientButton type="submit" disabled={isLoading} className="w-full h-14 text-lg font-semibold rounded-xl">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Signing In...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <LogIn className="w-5 h-5" />
              Sign In
            </div>
          )}
        </GradientButton>

        {/* Signup Link */}
        <div className="text-center pt-4">
          <p className="text-gray-700 text-lg">
            Don't have an account?{" "}
            <Link href="/auth/signup" className="text-[#4A2B6B] hover:text-[#6B46C1] font-semibold transition-colors">
              Sign up for free
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}
