"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { GradientButton } from "@/components/ui/gradient-button"
import { CheckCircle, Clock, DollarSign } from "lucide-react"

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

export default function FeedbackSuccess() {
  const router = useRouter()
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setIsLoaded(true)
  }, [])

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
            <h1 className="text-3xl font-bold font-serif mb-2">Success!</h1>
            <p className="text-sm opacity-90">Your feedback has been submitted</p>
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
          {/* Success Message */}
          <div className={`text-center mb-8 ${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <div className="bg-white rounded-3xl p-8 shadow-[0_4px_14px_rgba(0,0,0,0.08)] mb-6">
              <div className="text-6xl mb-4">🎉</div>
              <h2 className="text-2xl font-bold text-[#1D1A2F] mb-4 font-serif">Feedback Submitted!</h2>
              <p className="text-gray-600 mb-6">
                Thank you for sharing your try-on experience. Your feedback helps others make better shopping decisions.
              </p>

              {/* Status Cards */}
              <div className="space-y-4 mb-6">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 flex items-center gap-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-green-800">Video Uploaded</h3>
                    <p className="text-sm text-green-600">Your try-on video has been successfully uploaded</p>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center gap-3">
                  <Clock className="w-6 h-6 text-yellow-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-yellow-800">Under Review</h3>
                    <p className="text-sm text-yellow-600">Our team will review your feedback within 24 hours</p>
                  </div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4 flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-purple-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-purple-800">₹50 Cashback</h3>
                    <p className="text-sm text-purple-600">You'll receive your reward after approval</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <GradientButton
                  onClick={() => router.push("/dashboard")}
                  className="w-full py-3 text-base font-semibold rounded-full"
                >
                  View Dashboard
                </GradientButton>

                <button
                  onClick={() => router.push("/submit-feedback")}
                  className="w-full bg-white border-2 border-[#4A2B6B] text-[#4A2B6B] py-3 rounded-full font-semibold text-base hover:bg-[#4A2B6B] hover:text-white transition-colors"
                >
                  Submit Another Feedback
                </button>
              </div>
            </div>
          </div>

          {/* What's Next */}
          <div className={`${isLoaded ? "opacity-100" : "opacity-0"}`}>
            <div className="bg-white rounded-3xl p-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
              <h3 className="text-lg font-bold text-[#1D1A2F] mb-4 font-serif">What happens next?</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#4A2B6B] text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    1
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1D1A2F]">Review Process</h4>
                    <p className="text-sm text-gray-600">
                      Our team reviews your video for quality and authenticity within 24 hours
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#4A2B6B] text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    2
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1D1A2F]">Approval Notification</h4>
                    <p className="text-sm text-gray-600">
                      You'll receive an email notification once your feedback is approved
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-[#4A2B6B] text-white rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                    3
                  </div>
                  <div>
                    <h4 className="font-semibold text-[#1D1A2F]">Cashback Credit</h4>
                    <p className="text-sm text-gray-600">
                      ₹50 will be credited to your account and available for payout
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
