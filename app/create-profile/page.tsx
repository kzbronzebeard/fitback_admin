"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { upsertUserProfile } from "@/app/actions/user-profile"
import { GradientButton } from "@/components/ui/gradient-button"

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
`

interface ProfileData {
  age: string
  gender: string
  height: string
  heightUnit: "cm" | "ft-in"
  heightFeet: string
  heightInches: string
  weight: string
  weightUnit: "kg" | "lbs"
  bodyShape: string
  shoppingFrequency: string
  mobileNumber: string
}

export default function CreateProfile() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [formData, setFormData] = useState<ProfileData>({
    age: "",
    gender: "",
    height: "",
    heightUnit: "cm",
    heightFeet: "",
    heightInches: "",
    weight: "",
    weightUnit: "kg",
    bodyShape: "",
    shoppingFrequency: "",
    mobileNumber: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const convertHeightToCm = (feet: string, inches: string): number => {
    const ft = Number.parseFloat(feet) || 0
    const inch = Number.parseFloat(inches) || 0
    return Math.round(ft * 30.48 + inch * 2.54)
  }

  const convertWeightToKg = (lbs: string): number => {
    return Math.round(Number.parseFloat(lbs) * 0.453592)
  }

  const getBodyShapes = (gender: string) => {
    switch (gender) {
      case "female":
        return [
          { id: "pear", name: "Pear", description: "Hips wider than shoulders" },
          { id: "apple", name: "Apple", description: "Midsection wider than hips/shoulders" },
          { id: "hourglass", name: "Hourglass", description: "Balanced shoulders and hips, defined waist" },
          { id: "rectangle", name: "Rectangle", description: "Similar shoulder, waist, and hip width" },
        ]
      case "male":
        return [
          { id: "trapezoid", name: "Trapezoid", description: "Shoulders widest, gentle taper to hips" },
          {
            id: "inverted-triangle",
            name: "Inverted Triangle (V)",
            description: "Broad shoulders/chest, narrow waist/hips",
          },
          { id: "rectangle", name: "Rectangle (H)", description: "Shoulders, chest and hips about equal" },
          { id: "oval", name: "Oval / Diamond", description: "Fuller mid-section, slimmer limbs" },
        ]
      case "non-binary":
        return [
          { id: "slim", name: "Slim", description: "Lean overall build" },
          { id: "average", name: "Average", description: "Balanced proportions" },
          { id: "curvy", name: "Curvy", description: "Defined curves and fuller figure" },
          { id: "athletic", name: "Athletic", description: "Toned and muscular build" },
        ]
      default:
        return []
    }
  }

  const shoppingFrequencies = [
    { id: "multiple-monthly", label: "Multiple times a month" },
    { id: "once-monthly", label: "Once a month" },
    { id: "few-months", label: "Once every few months" },
    { id: "few-times-years", label: "Only a few times in the last few years" },
    { id: "never", label: "Never shopped online" },
  ]

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  useEffect(() => {
    // Reset body shape when gender changes
    if (formData.bodyShape && formData.gender) {
      const currentShapes = getBodyShapes(formData.gender)
      const isValidShape = currentShapes.some((shape) => shape.id === formData.bodyShape)
      if (!isValidShape) {
        setFormData((prev) => ({ ...prev, bodyShape: "" }))
      }
    }
  }, [formData.gender])

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.age.trim()) {
      newErrors.age = "Age is required"
    } else if (isNaN(Number(formData.age)) || Number(formData.age) < 18 || Number(formData.age) > 100) {
      newErrors.age = "Please enter a valid age between 18 and 100"
    }

    if (!formData.gender) {
      newErrors.gender = "Gender is required"
    }

    // Height validation
    if (formData.heightUnit === "cm") {
      if (!formData.height.trim()) {
        newErrors.height = "Height is required"
      } else if (isNaN(Number(formData.height)) || Number(formData.height) < 100 || Number(formData.height) > 240) {
        newErrors.height = "Please enter a valid height between 100-240 cm"
      }
    } else {
      if (!formData.heightFeet.trim() || !formData.heightInches.trim()) {
        newErrors.height = "Both feet and inches are required"
      } else if (
        isNaN(Number(formData.heightFeet)) ||
        isNaN(Number(formData.heightInches)) ||
        Number(formData.heightFeet) < 3 ||
        Number(formData.heightFeet) > 8 ||
        Number(formData.heightInches) < 0 ||
        Number(formData.heightInches) >= 12
      ) {
        newErrors.height = "Please enter valid height (3-8 feet, 0-11 inches)"
      }
    }

    // Weight validation
    if (!formData.weight.trim()) {
      newErrors.weight = "Weight is required"
    } else {
      const weight = Number(formData.weight)
      if (isNaN(weight)) {
        newErrors.weight = "Please enter a valid weight"
      } else if (formData.weightUnit === "kg" && (weight < 30 || weight > 200)) {
        newErrors.weight = "Please enter a valid weight between 30-200 kg"
      } else if (formData.weightUnit === "lbs" && (weight < 66 || weight > 440)) {
        newErrors.weight = "Please enter a valid weight between 66-440 lbs"
      }
    }

    if (!formData.bodyShape) {
      newErrors.bodyShape = "Body shape is required"
    }

    if (!formData.shoppingFrequency) {
      newErrors.shoppingFrequency = "Shopping frequency is required"
    }

    if (!formData.mobileNumber.trim()) {
      newErrors.mobileNumber = "Mobile number is required"
    } else if (!/^\d{10}$/.test(formData.mobileNumber.replace(/\s/g, ""))) {
      newErrors.mobileNumber = "Please enter a valid 10-digit mobile number"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    console.log("🧪 DEBUG: Current user object:", user)
    console.log("🧪 DEBUG: User ID check:", user?.user_id)

    if (!user?.user_id) {
      setErrors({ submit: "User not found. Please log in again." })
      return
    }

    setIsSubmitting(true)

    try {
      // Convert height to cm
      let heightCm: number
      if (formData.heightUnit === "cm") {
        heightCm = Number(formData.height)
      } else {
        heightCm = convertHeightToCm(formData.heightFeet, formData.heightInches)
      }

      // Convert weight to kg
      let weightKg: number
      if (formData.weightUnit === "kg") {
        weightKg = Number(formData.weight)
      } else {
        weightKg = convertWeightToKg(formData.weight)
      }

      const result = await upsertUserProfile(user.user_id, {
        heightCm: heightCm,
        weightKg: weightKg,
        gender: formData.gender as "male" | "female" | "other",
        bodyType: formData.bodyShape,
        mobileNumber: formData.mobileNumber,
        // Add shopping frequency to user metadata or create new field
      })

      if (result.success) {
        router.push("/dashboard")
      } else {
        setErrors({ submit: result.error || "Failed to create profile" })
      }
    } catch (error) {
      console.error("Error creating profile:", error)
      setErrors({ submit: "An unexpected error occurred. Please try again." })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-[#F5EFE6]">
        <div className="w-full max-w-md mx-auto h-full flex flex-col relative">
          <div className="flex-1 px-6 py-6 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A2B6B] mb-4"></div>
            <p className="text-[#4A2B6B] font-medium">Loading...</p>
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
            <h1 className="text-3xl font-bold font-serif mb-2">Complete Profile</h1>
            <p className="text-sm opacity-90">Tell us a bit about yourself</p>
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
          <div className="bg-white rounded-3xl p-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Age and Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#4A2B6B] mb-2">Age *</label>
                  <input
                    type="number"
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                      errors.age ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-[#4A2B6B]"
                    } focus:outline-none`}
                  />
                  {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#4A2B6B] mb-2">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => handleInputChange("gender", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                      errors.gender ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-[#4A2B6B]"
                    } focus:outline-none`}
                  >
                    <option value="">Select</option>
                    <option value="female">Female</option>
                    <option value="male">Male</option>
                    <option value="non-binary">Non-binary</option>
                  </select>
                  {errors.gender && <p className="text-red-500 text-xs mt-1">{errors.gender}</p>}
                </div>
              </div>

              {/* Height */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-[#4A2B6B]">Height *</label>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => handleInputChange("heightUnit", "cm")}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        formData.heightUnit === "cm" ? "bg-[#4A2B6B] text-white" : "text-gray-600 hover:text-[#4A2B6B]"
                      }`}
                    >
                      cm
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("heightUnit", "ft-in")}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        formData.heightUnit === "ft-in"
                          ? "bg-[#4A2B6B] text-white"
                          : "text-gray-600 hover:text-[#4A2B6B]"
                      }`}
                    >
                      ft-in
                    </button>
                  </div>
                </div>

                {formData.heightUnit === "cm" ? (
                  <input
                    type="number"
                    placeholder="170"
                    value={formData.height}
                    onChange={(e) => handleInputChange("height", e.target.value)}
                    className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                      errors.height ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-[#4A2B6B]"
                    } focus:outline-none`}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      placeholder="5"
                      value={formData.heightFeet}
                      onChange={(e) => handleInputChange("heightFeet", e.target.value)}
                      className={`px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                        errors.height ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-[#4A2B6B]"
                      } focus:outline-none`}
                    />
                    <input
                      type="number"
                      placeholder="7"
                      value={formData.heightInches}
                      onChange={(e) => handleInputChange("heightInches", e.target.value)}
                      className={`px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                        errors.height ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-[#4A2B6B]"
                      } focus:outline-none`}
                    />
                  </div>
                )}
                {errors.height && <p className="text-red-500 text-xs mt-1">{errors.height}</p>}
              </div>

              {/* Weight */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-[#4A2B6B]">Weight *</label>
                  <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                      type="button"
                      onClick={() => handleInputChange("weightUnit", "kg")}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        formData.weightUnit === "kg" ? "bg-[#4A2B6B] text-white" : "text-gray-600 hover:text-[#4A2B6B]"
                      }`}
                    >
                      kg
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange("weightUnit", "lbs")}
                      className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                        formData.weightUnit === "lbs" ? "bg-[#4A2B6B] text-white" : "text-gray-600 hover:text-[#4A2B6B]"
                      }`}
                    >
                      lbs
                    </button>
                  </div>
                </div>
                <input
                  type="number"
                  placeholder={formData.weightUnit === "kg" ? "65" : "143"}
                  value={formData.weight}
                  onChange={(e) => handleInputChange("weight", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                    errors.weight ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-[#4A2B6B]"
                  } focus:outline-none`}
                />
                {errors.weight && <p className="text-red-500 text-xs mt-1">{errors.weight}</p>}
              </div>

              {/* Body Shape */}
              <div>
                <label className="block text-sm font-semibold text-[#4A2B6B] mb-3">Body Shape *</label>
                {formData.gender ? (
                  <div className="grid grid-cols-2 gap-3">
                    {getBodyShapes(formData.gender).map((shape) => (
                      <button
                        key={shape.id}
                        type="button"
                        onClick={() => handleInputChange("bodyShape", shape.id)}
                        className={`p-4 rounded-xl border-2 transition-colors text-left ${
                          formData.bodyShape === shape.id
                            ? "border-[#4A2B6B] bg-purple-50"
                            : "border-gray-200 hover:border-[#4A2B6B]"
                        }`}
                      >
                        <div className="font-medium text-sm text-[#4A2B6B]">{shape.name}</div>
                        <div className="text-xs text-gray-600 mt-1">{shape.description}</div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500 italic">Please select gender first</div>
                )}
                {errors.bodyShape && <p className="text-red-500 text-xs mt-1">{errors.bodyShape}</p>}
              </div>

              {/* Shopping Frequency */}
              <div>
                <label className="block text-sm font-semibold text-[#4A2B6B] mb-2">
                  Online Fashion Shopping Frequency *
                </label>
                <select
                  value={formData.shoppingFrequency}
                  onChange={(e) => handleInputChange("shoppingFrequency", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                    errors.shoppingFrequency ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-[#4A2B6B]"
                  } focus:outline-none`}
                >
                  <option value="">Select frequency</option>
                  {shoppingFrequencies.map((freq) => (
                    <option key={freq.id} value={freq.id}>
                      {freq.label}
                    </option>
                  ))}
                </select>
                {errors.shoppingFrequency && <p className="text-red-500 text-xs mt-1">{errors.shoppingFrequency}</p>}
              </div>

              {/* Mobile Number */}
              <div>
                <label className="block text-sm font-semibold text-[#4A2B6B] mb-2">Mobile Number *</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  value={formData.mobileNumber}
                  onChange={(e) => handleInputChange("mobileNumber", e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                    errors.mobileNumber ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-[#4A2B6B]"
                  } focus:outline-none`}
                />
                {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
              </div>

              {/* Error Display */}
              {errors.submit && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-700 text-sm">{errors.submit}</p>
                </div>
              )}

              {/* Submit Button */}
              <div className="pt-4">
                <GradientButton
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 text-lg font-semibold rounded-full"
                >
                  {isSubmitting ? "Creating Profile..." : "Complete Profile"}
                </GradientButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
