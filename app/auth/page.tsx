"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function AuthRedirect() {
  const router = useRouter()

  useEffect(() => {
    // Redirect to the new login page
    router.replace("/auth/login")
  }, [router])

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-[#F5EFE6]">
      <div className="w-full max-w-md mx-auto h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A2B6B] mx-auto mb-4"></div>
          <p className="text-[#4A2B6B] font-medium">Redirecting...</p>
        </div>
      </div>
    </div>
  )
}
