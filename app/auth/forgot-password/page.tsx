"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { GradientButton } from "@/components/ui/gradient-button"
import { forgotPassword } from "../../actions/auth"
import { AuthLayout } from "../components/auth-layout"
import { Mail, ArrowLeft, CheckCircle } from "lucide-react"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const result = await forgotPassword(email)

      if (result.success) {
        setSuccess(true)
        setMessage(result.message || "Password reset link sent!")
      } else {
        setError(result.error || "Failed to send reset email")
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <AuthLayout title="Check Your Email" subtitle="Password reset link sent">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-serif font-bold text-[#4A2B6B]">Check Your Email</h2>
            <p className="text-gray-700 text-lg">{message}</p>
            <p className="text-base text-gray-600">
              We've sent a password reset link to <strong className="text-[#4A2B6B]">{email}</strong>
            </p>
          </div>
          <Link href="/auth/login">
            <GradientButton className="w-full h-14 text-lg font-semibold rounded-xl">Back to Sign In</GradientButton>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Enter your email to receive a reset link">
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="h-14 text-lg border-2 border-gray-200 focus:border-[#4A2B6B] focus:ring-[#4A2B6B] rounded-xl bg-white"
          />
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
              Sending Reset Link...
            </div>
          ) : (
            "Send Reset Link"
          )}
        </GradientButton>

        {/* Back to Login */}
        <div className="text-center pt-4">
          <Link
            href="/auth/login"
            className="text-[#4A2B6B] hover:text-[#6B46C1] font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
