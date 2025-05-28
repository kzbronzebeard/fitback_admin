"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { GradientButton } from "@/components/ui/gradient-button"
import { resetPassword } from "../../actions/auth"
import { AuthLayout } from "../components/auth-layout"
import { Eye, EyeOff, Lock, CheckCircle, XCircle } from "lucide-react"

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [token, setToken] = useState("")
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const urlToken = searchParams.get("token")
    if (urlToken) {
      setToken(urlToken)
    } else {
      setError("Invalid reset link. Please request a new password reset.")
    }
  }, [searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
    setPasswordErrors([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setPasswordErrors([])

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      setIsLoading(false)
      return
    }

    try {
      const result = await resetPassword(token, formData.password)

      if (result.success) {
        setSuccess(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push("/auth/login")
        }, 3000)
      } else {
        if (result.passwordErrors) {
          setPasswordErrors(result.passwordErrors)
        } else {
          setError(result.error || "Failed to reset password")
        }
      }
    } catch (error) {
      setError("An unexpected error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordErrors.length === 0 && formData.password.length > 0) return "text-green-600"
    if (passwordErrors.length <= 2) return "text-yellow-600"
    return "text-red-600"
  }

  if (success) {
    return (
      <AuthLayout title="Password Reset!" subtitle="Your password has been updated">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-serif font-bold text-[#4A2B6B]">Password Reset!</h2>
            <p className="text-gray-700 text-lg">
              Your password has been successfully reset. You can now sign in with your new password.
            </p>
            <p className="text-sm text-gray-600">Redirecting to sign in page...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  if (!token) {
    return (
      <AuthLayout title="Invalid Link" subtitle="This reset link is not valid">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-serif font-bold text-[#4A2B6B]">Invalid Reset Link</h2>
            <p className="text-gray-700 text-lg">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
          </div>
          <Link href="/auth/forgot-password">
            <GradientButton className="w-full h-14 text-lg font-semibold rounded-xl">
              Request New Reset Link
            </GradientButton>
          </Link>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Set New Password" subtitle="Enter your new password below">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* New Password Field */}
        <div className="space-y-3">
          <label htmlFor="password" className="text-base font-semibold text-[#4A2B6B] flex items-center gap-2">
            <Lock className="w-5 h-5" />
            New Password
          </label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Enter your new password"
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

          {/* Password Requirements */}
          {formData.password && (
            <div className="text-sm space-y-2 bg-gray-50 p-4 rounded-xl">
              <div className={`flex items-center gap-2 ${getPasswordStrengthColor()}`}>
                {passwordErrors.length === 0 && formData.password.length > 0 ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span className="font-medium">Password Strength</span>
              </div>
              {passwordErrors.length > 0 && (
                <ul className="text-red-600 space-y-1 ml-6">
                  {passwordErrors.map((error, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <XCircle className="w-3 h-3" />
                      {error}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Confirm Password Field */}
        <div className="space-y-3">
          <label htmlFor="confirmPassword" className="text-base font-semibold text-[#4A2B6B] flex items-center gap-2">
            <Lock className="w-5 h-5" />
            Confirm New Password
          </label>
          <div className="relative">
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm your new password"
              required
              className="h-14 text-lg border-2 border-gray-200 focus:border-[#4A2B6B] focus:ring-[#4A2B6B] rounded-xl bg-white pr-14"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#4A2B6B] transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </button>
          </div>

          {/* Password Match Indicator */}
          {formData.confirmPassword && (
            <div className="text-sm">
              {formData.password === formData.confirmPassword ? (
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Passwords match</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="w-4 h-4" />
                  <span className="font-medium">Passwords do not match</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            <p className="text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <GradientButton
          type="submit"
          disabled={isLoading || formData.password !== formData.confirmPassword}
          className="w-full h-14 text-lg font-semibold rounded-xl"
        >
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Resetting Password...
            </div>
          ) : (
            "Reset Password"
          )}
        </GradientButton>

        {/* Back to Login */}
        <div className="text-center pt-4">
          <Link href="/auth/login" className="text-[#4A2B6B] hover:text-[#6B46C1] font-semibold transition-colors">
            Back to Sign In
          </Link>
        </div>
      </form>
    </AuthLayout>
  )
}
