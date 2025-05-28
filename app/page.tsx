"use client"
import { GradientButton } from "@/components/ui/gradient-button"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Shield } from "lucide-react"
import { getImageUrl, HERO_IMAGE_FILENAMES } from "./utils/supabase-image"

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

export default function WelcomeScreen() {
  const router = useRouter()
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
    if (isNavigating) return // Prevent multiple clicks

    console.log("Start earning button clicked")
    setIsNavigating(true)

    // Simple, direct navigation without fallbacks or delays
    router.push("/auth/signup")
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
          }}
        >
          {/* Headline */}
          <div className={`mt-4 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <h2 className="text-[#1D1A2F] text-4xl font-serif leading-tight">
              Try on clothes.
              <br />
              Earn real money.
            </h2>
          </div>

          {/* Illustration */}
          <div
            className={`mt-2 mb-2 relative flex justify-center ${isLoaded ? "opacity-100 transform transition-all duration-700 ease-out" : "opacity-0"}`}
          >
            <div className="relative w-full" style={{ maxWidth: "400px" }}>
              {!imageError && imageUrl ? (
                <Image
                  key={currentImageIndex}
                  src={imageUrl || "/placeholder.svg"}
                  alt="Person taking a mirror selfie"
                  width={600}
                  height={450}
                  quality={100}
                  className="w-full h-auto object-contain"
                  style={{ maxHeight: "180px" }}
                  priority
                  onError={handleImageError}
                  onLoad={() => console.log("Image loaded successfully:", imageUrl)}
                />
              ) : (
                <div className="w-full h-44 bg-gradient-to-br from-[#F5EFE6] via-[#F0E6D6] to-[#F5EFE6] rounded-2xl flex items-center justify-center border-2 border-[#4A2B6B]/20 shadow-lg">
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
          </div>

          {/* How it works - Compact Version */}
          <div className={`mt-2 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <h3 className="text-[#1D1A2F] text-xl font-bold mb-3 px-1 font-serif">How it works</h3>

            {/* Compact 3-step layout */}
            <div className="space-y-2">
              {/* Step 1 */}
              <div className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E8F3E8] flex items-center justify-center text-[#4A2B6B] font-semibold text-sm">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-[#1D1A2F] leading-tight">Record a short try-on video</p>
                    <p className="text-xs text-gray-600 mt-1">Record yourself trying on clothes you bought online</p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E8F3E8] flex items-center justify-center text-[#4A2B6B] font-semibold text-sm">
                    2
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-[#1D1A2F] leading-tight">Wait 24 hours for approval</p>
                    <p className="text-xs text-gray-600 mt-1">Our team reviews your video for quality and feedback</p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-2xl p-3 shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#E8F3E8] flex items-center justify-center text-[#4A2B6B] font-semibold text-sm">
                    3
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-medium text-[#1D1A2F] leading-tight">Get ₹50 cashback per video</p>
                    <p className="text-xs text-gray-600 mt-1">Earn real money for each approved video submission</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className={`mt-4 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <GradientButton
              onClick={handleGetStarted}
              className="w-full py-6 text-xl font-semibold rounded-full"
              disabled={isNavigating}
            >
              {isNavigating ? "Loading..." : "Start earning"}
            </GradientButton>
          </div>

          {/* Security note */}
          <div
            className={`mt-4 flex justify-center items-center gap-1 text-[#6B7280] ${isLoaded ? "opacity-100" : "opacity-0"}`}
          >
            <Shield size={16} />
            <p className="text-sm">Bank-grade encryption</p>
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

              {/* FAQ Item 4 - Contact Information */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
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
