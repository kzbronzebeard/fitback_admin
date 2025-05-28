"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { GradientButton } from "@/components/ui/gradient-button"
import { signUp } from "../../actions/auth"
import { AuthLayout } from "../components/auth-layout"
import { Eye, EyeOff, Mail, User, Lock, CheckCircle, XCircle } from "lucide-react"

export default function SignupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: "",
    name: "",
    password: "",
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [passwordErrors, setPasswordErrors] = useState<string[]>([])
  const [success, setSuccess] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setErrors([])
    setPasswordErrors([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setErrors([])
    setPasswordErrors([])

    try {
      const result = await signUp(formData.email, formData.name, formData.password)

      if (result.success) {
        setSuccess(true)
        // Redirect to verify email page after 2 seconds
        setTimeout(() => {
          router.push(`/auth/verify-email?email=${encodeURIComponent(formData.email)}`)
        }, 2000)
      } else {
        if (result.passwordErrors) {
          setPasswordErrors(result.passwordErrors)
        } else {
          setErrors([result.error || "Failed to create account"])
        }
      }
    } catch (error) {
      setErrors(["An unexpected error occurred. Please try again."])
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrength = () => {
    const password = formData.password
    if (!password) return null

    const hasLowerCase = /[a-z]/.test(password)
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    const isAlphanumeric = hasLowerCase && hasNumbers
    const hasAlphaOnly = /^[a-zA-Z]+$/.test(password)

    if (password.length < 6 || hasAlphaOnly) {
      return { level: "low", color: "text-red-600", bgColor: "bg-red-100" }
    } else if ((password.length >= 6 && password.length < 10) || (isAlphanumeric && !hasSpecialChar)) {
      return { level: "medium", color: "text-yellow-600", bgColor: "bg-yellow-100" }
    } else if (isAlphanumeric && hasSpecialChar && password.length >= 6) {
      return { level: "high", color: "text-green-600", bgColor: "bg-green-100" }
    }

    return { level: "low", color: "text-red-600", bgColor: "bg-red-100" }
  }

  const getPasswordNudges = () => {
    const password = formData.password
    if (!password) return []

    const nudges = []
    const hasLowerCase = /[a-z]/.test(password)
    const hasUpperCase = /[A-Z]/.test(password)
    const hasNumbers = /\d/.test(password)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

    if (password.length < 6) {
      nudges.push("Add more characters (minimum 6)")
    }
    if (!hasLowerCase) {
      nudges.push("Add lowercase letters")
    }
    if (!hasUpperCase) {
      nudges.push("Add uppercase letters")
    }
    if (!hasNumbers) {
      nudges.push("Add numbers")
    }
    if (!hasSpecialChar) {
      nudges.push("Add special characters (!@#$%^&*)")
    }

    return nudges
  }

  if (success) {
    return (
      <AuthLayout title="Account Created!" subtitle="Check your email to verify">
        <div className="text-center space-y-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <div className="space-y-3">
            <h2 className="text-2xl font-serif font-bold text-[#4A2B6B]">Welcome to Fitback!</h2>
            <p className="text-gray-700 text-lg">
              We've sent a verification email to <strong className="text-[#4A2B6B]">{formData.email}</strong>
            </p>
            <p className="text-sm text-gray-600">Redirecting to verification page...</p>
          </div>
        </div>
      </AuthLayout>
    )
  }

  return (
    <AuthLayout title="Join Fitback" subtitle="Try on clothes. Earn real rewards.">
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

        {/* Name Field */}
        <div className="space-y-3">
          <label htmlFor="name" className="text-base font-semibold text-[#4A2B6B] flex items-center gap-2">
            <User className="w-5 h-5" />
            Full Name
          </label>
          <Input
            id="name"
            name="name"
            type="text"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="Your full name"
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
              placeholder="Create a strong password"
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
            <div
              className={`text-sm space-y-3 p-4 rounded-xl border-2 ${getPasswordStrength()?.bgColor || "bg-gray-50"} ${getPasswordStrength()?.level === "high" ? "border-green-200" : getPasswordStrength()?.level === "medium" ? "border-yellow-200" : "border-red-200"}`}
            >
              <div className={`flex items-center gap-2 ${getPasswordStrength()?.color || "text-gray-600"}`}>
                {getPasswordStrength()?.level === "high" ? (
                  <CheckCircle className="w-4 h-4" />
                ) : getPasswordStrength()?.level === "medium" ? (
                  <div className="w-4 h-4 rounded-full bg-yellow-500" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span className="font-semibold capitalize">
                  {getPasswordStrength()?.level || "weak"} Password Strength
                </span>
              </div>

              {getPasswordNudges().length > 0 && (
                <div className="space-y-1">
                  <p className="text-gray-700 font-medium">To make your password stronger:</p>
                  <ul className="space-y-1 ml-4">
                    {getPasswordNudges().map((nudge, index) => (
                      <li key={index} className="flex items-center gap-2 text-gray-600">
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                        {nudge}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {getPasswordStrength()?.level === "high" && (
                <p className="text-green-700 font-medium flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Great! Your password is strong and secure.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Error Messages */}
        {errors.length > 0 && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
            {errors.map((error, index) => (
              <p key={index} className="text-red-700 font-medium flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                {error}
              </p>
            ))}
          </div>
        )}

        {/* Submit Button */}
        <GradientButton type="submit" disabled={isLoading} className="w-full h-14 text-lg font-semibold rounded-xl">
          {isLoading ? (
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Creating Account...
            </div>
          ) : (
            "Verify Email and Signup"
          )}
        </GradientButton>

        {/* Login Link */}
        <div className="text-center pt-4">
          <p className="text-gray-700 text-lg">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-[#4A2B6B] hover:text-[#6B46C1] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  )
}
