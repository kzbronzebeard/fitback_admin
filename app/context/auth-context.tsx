"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useRef } from "react"
import Cookies from "js-cookie"

interface User {
  user_id: string
  email: string
  name: string
  is_admin: boolean
  email_verified: boolean
  sessionId?: string
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

// Cookie configuration
const COOKIE_OPTIONS = {
  expires: 30, // 30 days
  path: "/",
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
}

// Create a stable auth state that persists between re-renders
const globalAuthState = {
  user: null as User | null,
  sessionId: null as string | null,
  isInitialized: false,
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log("[AUTH DEBUG] AuthProvider initializing")

  // Use refs to track initialization state
  const initRef = useRef(false)

  // Use state with initial values from global state
  const [user, setUser] = useState<User | null>(globalAuthState.user)
  const [sessionId, setSessionId] = useState<string | null>(globalAuthState.sessionId)
  const [isLoading, setIsLoading] = useState(!globalAuthState.isInitialized)
  const [lastExtensionTime, setLastExtensionTime] = useState<number | null>(null)

  // Check for existing session on mount, but only if not already initialized
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true

      if (!globalAuthState.isInitialized) {
        checkExistingSession()
      } else {
        console.log("[AUTH DEBUG] Using cached auth state, skipping session check")
        setIsLoading(false)
      }
    }
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
    console.log("[AUTH DEBUG] checkExistingSession started, isLoading:", true)
    try {
      // Get session from both cookie and localStorage for backward compatibility
      const cookieSessionId = Cookies.get("fitback_session_id")
      const storedSessionId = localStorage.getItem("fitback_session_id")

      // Prefer cookie, fall back to localStorage
      const sessionId = cookieSessionId || storedSessionId

      console.log("[AUTH DEBUG] Found sessionId:", sessionId ? "exists" : "none")

      if (!sessionId) {
        setIsLoading(false)
        globalAuthState.isInitialized = true
        return
      }

      // If session was in localStorage but not in cookie, set it in cookie
      if (storedSessionId && !cookieSessionId) {
        Cookies.set("fitback_session_id", storedSessionId, COOKIE_OPTIONS)
      }

      const storedLastExtension = localStorage.getItem("fitback_last_extension")
      if (storedLastExtension) {
        setLastExtensionTime(Number.parseInt(storedLastExtension))
      }

      console.log("[AUTH CONTEXT] Checking existing session:", sessionId)

      const response = await fetch("/api/auth/validate-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      })

      const result = await response.json()

      console.log(
        "[AUTH DEBUG] Session validation result:",
        result.success ? "valid" : "invalid",
        result.user ? `user: ${result.user.email}` : "no user",
      )

      if (result.success && result.user) {
        // Update both local state and global state
        setUser(result.user)
        setSessionId(sessionId)

        // Update global state to persist between re-renders
        globalAuthState.user = result.user
        globalAuthState.sessionId = sessionId

        console.log("[AUTH CONTEXT] Session restored for user:", result.user.email)
      } else {
        // Invalid session, clear storage
        Cookies.remove("fitback_session_id")
        localStorage.removeItem("fitback_session_id")
        localStorage.removeItem("fitback_last_extension")
        console.log("[AUTH CONTEXT] Invalid session cleared")
      }
    } catch (error) {
      console.error("[AUTH CONTEXT] Error checking session:", error)
      Cookies.remove("fitback_session_id")
      localStorage.removeItem("fitback_session_id")
      localStorage.removeItem("fitback_last_extension")
    } finally {
      console.log("[AUTH DEBUG] checkExistingSession completed, setting isLoading to false")
      setIsLoading(false)
      globalAuthState.isInitialized = true
    }
  }

  const login = (newSessionId: string, userData: User) => {
    console.log("[AUTH DEBUG] Login called for user:", userData.email)
    console.log("[AUTH CONTEXT] Logging in user:", userData.email)
    const userWithSession = { ...userData, sessionId: newSessionId }

    // Update both local state and global state
    setUser(userWithSession)
    setSessionId(newSessionId)

    // Update global state to persist between re-renders
    globalAuthState.user = userWithSession
    globalAuthState.sessionId = newSessionId
    globalAuthState.isInitialized = true

    // Set in both cookie and localStorage
    Cookies.set("fitback_session_id", newSessionId, COOKIE_OPTIONS)
    localStorage.setItem("fitback_session_id", newSessionId)
  }

  const logout = async () => {
    console.log("[AUTH DEBUG] Logout called")
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

    // Update both local state and global state
    setUser(null)
    setSessionId(null)
    setLastExtensionTime(null)

    // Update global state to persist between re-renders
    globalAuthState.user = null
    globalAuthState.sessionId = null

    // Clear both cookie and localStorage
    Cookies.remove("fitback_session_id")
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

  useEffect(() => {
    console.log(
      "[AUTH DEBUG] Auth state changed - user:",
      user?.email || "none",
      "sessionId:",
      sessionId ? "exists" : "none",
      "isLoading:",
      isLoading,
      "isAuthenticated:",
      !!user && !!sessionId,
    )
  }, [user, sessionId, isLoading])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
