"use client"
import { GradientButton } from "@/components/ui/gradient-button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Shield } from "lucide-react"
import { getImageUrl, HERO_IMAGE_FILENAMES } from "./utils/supabase-image"
import { useAuth } from "@/app/context/auth-context"

// Add satin sheen effect at the top of the file
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
    animation: sheenMove 4.3s ease-in-out infinite;
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

@keyframes cardLift {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-4px); }
  100% { transform: translateY(0px); }
}

@keyframes sheenMove {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

@keyframes bannerShimmer {
  0% { transform: translateX(-100%); }
  50% { transform: translateX(100%); }
  100% { transform: translateX(-100%); }
}

.banner-shimmer::before {
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
    rgba(255, 255, 255, 0.3) 40%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 60%
  );
  pointer-events: none;
  animation: bannerShimmer 3s ease-in-out infinite;
}

.card-animate-1 {
  animation: cardLift 1.5s ease-in-out forwards;
  animation-delay: 2s;
}

.card-animate-2 {
  animation: cardLift 1.5s ease-in-out forwards;
  animation-delay: 2.5s;
}

.card-animate-3 {
  animation: cardLift 1.5s ease-in-out forwards;
  animation-delay: 3s;
}

.card-animate-4 {
  animation: cardLift 1.5s ease-in-out forwards;
  animation-delay: 3.5s;
}
`

export default function WelcomeScreen() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [imageError, setImageError] = useState(false)
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [isNavigating, setIsNavigating] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [imageUrl, setImageUrl] = useState("")

  // Set isLoaded to true after component mounts
  useEffect(() => {
    setIsLoaded(true)
    // Use environment-aware image URL
    const heroImageUrl = getImageUrl("images", "woman_selfie.png")
    console.log("Loading hero image:", heroImageUrl)
    setImageUrl(heroImageUrl)
    setImageError(false) // Start by trying to load the image
  }, [])

  // Auto-rotate carousel
  useEffect(() => {
    if (!isLoaded) return

    const interval = setInterval(() => {
      setActiveCardIndex((prevIndex) => (prevIndex + 1) % 3)
    }, 5000) // Change card every 5 seconds

    return () => clearInterval(interval)
  }, [isLoaded])

  const handleGetStarted = () => {
    if (isNavigating || isLoading) return // Prevent multiple clicks and wait for auth check

    console.log("Start earning button clicked")
    setIsNavigating(true)

    // Check authentication state and route accordingly
    if (isAuthenticated) {
      console.log("User is authenticated, redirecting to dashboard")
      router.push("/dashboard")
    } else {
      console.log("User is not authenticated, redirecting to signup")
      router.push("/auth/signup")
    }
  }

  const handleImageError = () => {
    console.error(`Image failed to load: ${imageUrl}`)

    // Try the next filename in the list
    if (currentImageIndex < HERO_IMAGE_FILENAMES.length - 1) {
      const nextIndex = currentImageIndex + 1
      const nextImageUrl = getImageUrl("images", HERO_IMAGE_FILENAMES[nextIndex])
      console.log(`Trying next image (${nextIndex + 1}/${HERO_IMAGE_FILENAMES.length}):`, nextImageUrl)
      setCurrentImageIndex(nextIndex)
      setImageUrl(nextImageUrl)
    } else {
      console.log("All image URLs failed, using designed fallback")
      setImageError(true)
    }
  }

  // Modify the return statement to include the style tag and update the header div
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
          <h1 className="text-4xl font-bold font-serif">Fitback</h1>
        </div>

        {/* Main content */}
        <div
          className="flex-1 px-6 py-4 flex flex-col rounded-3xl relative z-10"
          style={{
            backgroundColor: "#F5EFE6", // Lighter than champagne_lite
            boxShadow: "0 8px 20px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)",
            marginTop: "-5%",
            marginBottom: "1rem",
            paddingBottom: "140px", // Add space for sticky CTA card
          }}
        >
          {/* Hero Section - Merged Headline and Image */}
          <div className={`mt-4 relative ${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <div className="relative flex items-center min-h-[200px] overflow-hidden rounded-2xl">
              {/* Image on the right */}
              <div className="absolute right-0 top-0 bottom-0 w-3/5 flex items-center justify-center">
                {!imageError && imageUrl ? (
                  <Image
                    key={currentImageIndex}
                    src={imageUrl || "/placeholder.svg"}
                    alt="Person taking a mirror selfie"
                    width={1092}
                    height={819}
                    quality={100}
                    className="w-full h-auto object-contain opacity-30"
                    style={{ maxHeight: "200px" }}
                    priority
                    onError={handleImageError}
                    onLoad={() => console.log("Image loaded successfully:", imageUrl)}
                  />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-[#F5EFE6] via-[#F0E6D6] to-[#F5EFE6] rounded-2xl flex items-center justify-center border-2 border-[#4A2B6B]/20 shadow-lg opacity-30">
                    <div className="text-center text-[#4A2B6B]">
                      <div className="text-7xl mb-3">👗</div>
                      <p className="text-lg font-semibold text-[#4A2B6B]">Fashion Selfie</p>
                      <p className="text-sm mt-2 text-[#1D1A2F]/70 max-w-48">
                        Try on clothes & earn money for your feedback
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Text overlay on the left */}
              <div className="relative z-10 w-full pr-4">
                <h2 className="text-[#1D1A2F] text-3xl font-serif leading-tight font-bold">
                  Record your fit.
                  <br />
                  Earn unlimited money.
                  <br />
                  Fix online fashion.
                </h2>
              </div>
            </div>
          </div>

          {/* Unlimited Earnings Banner */}
          <div className={`mt-6 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <div className="bg-gradient-to-r from-[#4A2B6B]/20 to-[#7E5BEF]/20 rounded-2xl p-2 text-[#4A2B6B] shadow-sm border border-[#4A2B6B]/10 relative overflow-hidden banner-shimmer">
              <div className="flex items-center justify-center gap-2">
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
                >
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <h3 className="text-base font-bold">Unlimited Earning Potential</h3>
              </div>
              <p className="text-center text-xs opacity-80 mt-1">Submit as many videos as you want • No daily limits</p>
            </div>
          </div>

          {/* How it works - Compact Version */}
          <div className={`mt-6 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <h3 className="text-[#1D1A2F] text-xl font-bold mb-3 px-1 font-serif">How it works</h3>

            {/* Compact 3-step layout */}
            <div className="space-y-2">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] card-animate-1 relative">
                {/* Small tooltip bubble */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-[#4A2B6B] text-white text-xs px-2 py-1 rounded-lg shadow-lg whitespace-nowrap z-10">
                  <div className="flex items-center gap-1">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
                      <line x1="9" y1="9" x2="9.01" y2="9" />
                      <line x1="15" y1="9" x2="15.01" y2="9" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    No face needed!
                  </div>
                  {/* Arrow pointing down */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-2 border-r-2 border-t-4 border-transparent border-t-[#4A2B6B]"></div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E8F3E8] flex items-center justify-center text-[#4A2B6B] relative">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m22 8-6 4 6 4V8Z" />
                      <rect width="14" height="12" x="2" y="6" rx="2" ry="2" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-[#1D1A2F] leading-tight">
                      Record 1min faceless video in your outfit
                    </p>
                    <p className="text-xs text-gray-600 mt-1">Talk about how it fits & material. Show poses.</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] card-animate-2">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E8F3E8] flex items-center justify-center text-[#4A2B6B]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12,6 12,12 16,14" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-[#1D1A2F] leading-tight">Wait 24 hours for approval</p>
                    <p className="text-xs text-gray-600 mt-1">Our team reviews your video for quality and feedback</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] card-animate-3">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E8F3E8] flex items-center justify-center text-[#4A2B6B]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M6 3h12l4 6-10 13L2 9l4-6Z" />
                      <path d="M11 3 8 9l4 13 4-13-3-6" />
                      <path d="M2 9h20" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-[#1D1A2F] leading-tight">Get ₹50 per video - unlimited!</p>
                    <p className="text-xs text-gray-600 mt-1">
                      No daily limits. Submit as many videos as you want and earn more
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)] card-animate-4">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E8F3E8] flex items-center justify-center text-[#4A2B6B]">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-[#1D1A2F] leading-tight">
                      Your data trains AI fit prediction
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      Encrypted recordings are anonymized to predict how any fashion fits any person
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Privacy Section */}
          <div className={`mt-8 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <h3 className="text-[#1D1A2F] text-xl font-bold mb-3 px-1 font-serif">Your Privacy, Our Priority.</h3>

            <div className="flex items-center gap-4">
              {/* Lock Image on the left */}
              <div className="flex-shrink-0 w-20 h-auto flex items-center justify-center self-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-300 via-gray-400 to-gray-500 rounded-lg flex items-center justify-center shadow-md">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              </div>

              {/* Content on the right */}
              <div className="flex-1">
                <div className="space-y-2">
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4A2B6B] mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">Bank-grade encryption ensures your data is secure.</p>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4A2B6B] mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">
                      You have full control over your submissions - Delete your data anytime
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4A2B6B] mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">
                      Your data is never sold or used without your explicit consent
                    </p>
                  </div>

                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#4A2B6B] mt-2 flex-shrink-0"></div>
                    <p className="text-sm text-gray-700">Your data is never shared with other users</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className={`mt-8 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <h3 className="text-[#1D1A2F] text-xl font-bold mb-4 px-1 font-serif">Frequently Asked Questions</h3>

            <div className="space-y-3">
              {/* FAQ Item 1 (previously Item 3) - Data Usage */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
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

              {/* FAQ Item 2 (previously Item 1) - Why Feedback Matters */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
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

              {/* FAQ Item 3 (previously Item 2) - What You Get */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
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

              {/* FAQ Item 4 - Unlimited Submissions */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
                <button
                  className="w-full px-4 py-3 text-left flex justify-between items-center"
                  onClick={() => setExpandedFaq(expandedFaq === 4 ? null : 4)}
                >
                  <span className="font-medium text-[#1D1A2F] flex items-center gap-2">
                    <span className="text-[#7E5BEF]">🚀</span> Can I submit unlimited videos?
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
                    <p className="mb-2">Absolutely! There are no limits on how many videos you can submit.</p>
                    <ul className="list-disc pl-5 space-y-1 mb-2">
                      <li>Submit as many outfit videos as you want</li>
                      <li>Earn ₹50 for each approved video</li>
                      <li>No daily, weekly, or monthly caps</li>
                      <li>The more you contribute, the more you earn!</li>
                    </ul>
                    <p>
                      Quality matters more than quantity - focus on clear videos with detailed fit commentary for the
                      best approval rates.
                    </p>
                  </div>
                )}
              </div>

              {/* FAQ Item 4 - Contact Information */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
                <button
                  className="w-full px-4 py-3 text-left flex justify-between items-center"
                  onClick={() => setExpandedFaq(expandedFaq === 5 ? null : 5)}
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
                    className={`transition-transform ${expandedFaq === 5 ? "rotate-180" : ""}`}
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>

                {expandedFaq === 5 && (
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

      {/* Sticky CTA Card */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-6 py-4">
        <div className="w-full max-w-md mx-auto">
          <div
            className={`bg-white rounded-2xl p-4 shadow-[0_8px_24px_rgba(0,0,0,0.12)] ${isLoaded ? "opacity-100" : "opacity-0"}`}
          >
            <GradientButton
              onClick={handleGetStarted}
              className="w-full py-6 text-xl font-semibold rounded-full mb-3"
              disabled={isNavigating || isLoading}
            >
              {isNavigating ? "Loading..." : isLoading ? "Checking..." : "Start earning"}
            </GradientButton>

            {/* Security note */}
            <div className="flex justify-center items-center gap-1 text-[#6B7280]">
              <Shield size={16} />
              <p className="text-sm">Bank-grade encryption</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
