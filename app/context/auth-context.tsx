"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"

interface User {
  user_id: string
  email: string
  name: string
  is_admin: boolean
  email_verified: boolean
  sessionId?: string // Add sessionId to user object
}

interface AuthContextType {
  user: User | null
  sessionId: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (sessionId: string, userData: User) => void
  logout: () => void
  extendUserSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastExtensionTime, setLastExtensionTime] = useState<number | null>(null)

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession()
  }, [])

  // Extend session on activity
  useEffect(() => {
    if (sessionId) {
      const handleActivity = () => {
        extendUserSession()
      }

      // Listen for user activity
      window.addEventListener("click", handleActivity)
      window.addEventListener("keydown", handleActivity)
      window.addEventListener("scroll", handleActivity)

      return () => {
        window.removeEventListener("click", handleActivity)
        window.removeEventListener("keydown", handleActivity)
        window.removeEventListener("scroll", handleActivity)
      }
    }
  }, [sessionId])

  const checkExistingSession = async () => {
    try {
      const storedSessionId = localStorage.getItem("fitback_session_id")
      const storedLastExtension = localStorage.getItem("fitback_last_extension")

      if (!storedSessionId) {
        setIsLoading(false)
        return
      }

      // Restore last extension time
      if (storedLastExtension) {
        setLastExtensionTime(Number.parseInt(storedLastExtension))
      }

      console.log("[AUTH CONTEXT] Checking existing session:", storedSessionId)

      const response = await fetch("/api/auth/validate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: storedSessionId }),
      })

      const result = await response.json()

      if (result.success && result.user) {
        setUser(result.user)
        setSessionId(storedSessionId)
        console.log("[AUTH CONTEXT] Session restored for user:", result.user.email)
      } else {
        // Invalid session, clear storage
        localStorage.removeItem("fitback_session_id")
        localStorage.removeItem("fitback_last_extension")
        console.log("[AUTH CONTEXT] Invalid session cleared")
      }
    } catch (error) {
      console.error("[AUTH CONTEXT] Error checking session:", error)
      localStorage.removeItem("fitback_session_id")
      localStorage.removeItem("fitback_last_extension")
    } finally {
      setIsLoading(false)
    }
  }

  // Update the login function to store sessionId in user object
  const login = (newSessionId: string, userData: User) => {
    console.log("[AUTH CONTEXT] Logging in user:", userData.email)
    const userWithSession = { ...userData, sessionId: newSessionId }
    setUser(userWithSession)
    setSessionId(newSessionId)
    localStorage.setItem("fitback_session_id", newSessionId)
  }

  const logout = async () => {
    console.log("[AUTH CONTEXT] Logging out user")

    if (sessionId) {
      try {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId }),
        })
      } catch (error) {
        console.error("[AUTH CONTEXT] Error during logout:", error)
      }
    }

    setUser(null)
    setSessionId(null)
    setLastExtensionTime(null)
    localStorage.removeItem("fitback_session_id")
    localStorage.removeItem("fitback_last_extension")

    // Redirect to login page after logout
    window.location.href = "/auth/login"
  }

  const extendUserSession = async () => {
    if (!sessionId) return

    // Check if we've extended in the last 24 hours
    const now = Date.now()
    const lastExtension = lastExtensionTime || Number.parseInt(localStorage.getItem("fitback_last_extension") || "0")
    const twentyFourHours = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

    // Only extend if more than 24 hours have passed
    if (now - lastExtension < twentyFourHours) {
      return
    }

    try {
      console.log("[AUTH CONTEXT] Extending session (24h throttle)")
      const response = await fetch("/api/auth/extend-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })

      const result = await response.json()

      if (result.success) {
        // Update last extension time
        setLastExtensionTime(now)
        localStorage.setItem("fitback_last_extension", now.toString())
        console.log("[AUTH CONTEXT] Session extended successfully")
      } else {
        console.log("[AUTH CONTEXT] Session extension failed, logging out")
        logout()
      }
    } catch (error) {
      console.error("[AUTH CONTEXT] Error extending session:", error)
    }
  }

  const value: AuthContextType = {
    user,
    sessionId,
    isLoading,
    isAuthenticated: !!user && !!sessionId,
    login,
    logout,
    extendUserSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
