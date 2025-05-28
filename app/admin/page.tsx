// app/admin/page.tsx
"use client"

import { useRouter } from "next/navigation"
import { useEffect } from "react"

// Update import to use correct auth context
import { useAuth } from "@/app/context/auth-context"

const AdminPage = () => {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user || user.role !== "admin") {
        router.push("/login")
      }
    }
  }, [user, loading, router])

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Redirecting to login...</div>
  }

  if (user.role !== "admin") {
    return <div>Unauthorized</div>
  }

  return (
    <div>
      <h1>Admin Dashboard</h1>
      <p>Welcome, Admin!</p>
    </div>
  )
}

export default AdminPage
