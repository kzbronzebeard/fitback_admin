"use client"

import { useEffect } from "react"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"

export default function AdminUsers() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // Check admin access
  useEffect(() => {
    if (!loading && (!user || !["p10khanazka@iima.ac.in", "team@tashion.ai"].includes(user.email))) {
      router.push("/")
      return
    }
  }, [user, loading, router])

  return (
    <div>
      <h1>Admin Users Page</h1>
      {/* Add your admin users content here */}
    </div>
  )
}
