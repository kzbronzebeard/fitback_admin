// Mock authentication service for development environment
import type { User } from "@supabase/supabase-js"

// Mock user storage
const MOCK_USERS_KEY = "mock_auth_users"
const MOCK_CURRENT_USER_KEY = "mock_auth_current_user"

// Mock user interface
interface MockUser {
  id: string
  email: string
  password?: string
  created_at: string
}

// Get mock users from localStorage
const getMockUsers = (): MockUser[] => {
  if (typeof window === "undefined") return []

  try {
    const storedUsers = localStorage.getItem(MOCK_USERS_KEY)
    const users = storedUsers ? JSON.parse(storedUsers) : []
    console.log("[MOCK AUTH] Retrieved users from localStorage:", users)
    return users
  } catch (error) {
    console.error("[MOCK AUTH] Error getting mock users:", error)
    return []
  }
}

// Save mock users to localStorage
const saveMockUsers = (users: MockUser[]) => {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users))
    console.log("[MOCK AUTH] Saved users to localStorage:", users)
  } catch (error) {
    console.error("[MOCK AUTH] Error saving mock users:", error)
  }
}

// Get current mock user
const getCurrentMockUser = (): MockUser | null => {
  if (typeof window === "undefined") return null

  try {
    const storedUser = localStorage.getItem(MOCK_CURRENT_USER_KEY)
    const user = storedUser ? JSON.parse(storedUser) : null
    console.log("[MOCK AUTH] Retrieved current user from localStorage:", user)
    return user
  } catch (error) {
    console.error("[MOCK AUTH] Error getting current mock user:", error)
    return null
  }
}

// Save current mock user
const saveCurrentMockUser = (user: MockUser | null) => {
  if (typeof window === "undefined") return

  try {
    if (user) {
      localStorage.setItem(MOCK_CURRENT_USER_KEY, JSON.stringify(user))
      console.log("[MOCK AUTH] Saved current user to localStorage:", user)
    } else {
      localStorage.removeItem(MOCK_CURRENT_USER_KEY)
      console.log("[MOCK AUTH] Removed current user from localStorage")
    }
  } catch (error) {
    console.error("[MOCK AUTH] Error saving current mock user:", error)
  }
}

// Convert mock user to Supabase User format
const mockUserToSupabaseUser = (mockUser: MockUser): User => {
  const supabaseUser = {
    id: mockUser.id,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: mockUser.created_at,
    email: mockUser.email,
    email_confirmed_at: mockUser.created_at,
    phone: "",
    confirmed_at: mockUser.created_at,
    last_sign_in_at: new Date().toISOString(),
    role: "authenticated",
    updated_at: new Date().toISOString(),
    identities: [],
    factors: [],
  } as User

  console.log("[MOCK AUTH] Converted mock user to Supabase format:", supabaseUser)
  return supabaseUser
}

// Mock authentication functions
export const mockAuth = {
  // Sign up with email
  signUp: async (email: string): Promise<{ user: User | null; error: Error | null }> => {
    console.log("[MOCK AUTH] Starting signUp for email:", email)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    try {
      const users = getMockUsers()

      // Check if user already exists
      const existingUser = users.find((user) => user.email === email)
      if (existingUser) {
        console.log("[MOCK AUTH] User already exists with this email:", email)
        // In mock mode, we'll just return success anyway
      }

      // Create new mock user
      const newUser: MockUser = {
        id: `mock-${Date.now().toString(36)}`,
        email,
        created_at: new Date().toISOString(),
      }

      // Save to mock storage
      users.push(newUser)
      saveMockUsers(users)

      console.log("[MOCK AUTH] Sign up successful for:", email, "Created user:", newUser)
      return { user: null, error: null } // Return null user to simulate email verification needed
    } catch (err) {
      console.error("[MOCK AUTH] Sign up error:", err)
      return { user: null, error: err as Error }
    }
  },

  // Sign in with email and password
  signIn: async (email: string, password: string): Promise<{ user: User | null; error: Error | null }> => {
    console.log("[MOCK AUTH] Starting signIn for email:", email)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    try {
      const users = getMockUsers()
      let user = users.find((u) => u.email === email)

      // In development, we'll allow any password for existing users
      // or auto-create a user if it doesn't exist
      if (!user) {
        // Auto-create user in development
        user = {
          id: `mock-${Date.now().toString(36)}`,
          email,
          password,
          created_at: new Date().toISOString(),
        }

        users.push(user)
        saveMockUsers(users)
        console.log("[MOCK AUTH] Auto-created user for signIn:", user)
      }

      // Set as current user
      saveCurrentMockUser(user)

      const supabaseUser = mockUserToSupabaseUser(user)
      console.log("[MOCK AUTH] Sign in successful for:", email, "Returning user:", supabaseUser)
      return { user: supabaseUser, error: null }
    } catch (err) {
      console.error("[MOCK AUTH] Sign in error:", err)
      return { user: null, error: err as Error }
    }
  },

  // Sign out
  signOut: async (): Promise<{ error: Error | null }> => {
    console.log("[MOCK AUTH] Starting signOut")

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    try {
      saveCurrentMockUser(null)
      console.log("[MOCK AUTH] Sign out successful")
      return { error: null }
    } catch (err) {
      console.error("[MOCK AUTH] Sign out error:", err)
      return { error: err as Error }
    }
  },

  // Get current session
  getSession: async (): Promise<{ user: User | null }> => {
    const mockUser = getCurrentMockUser()
    console.log("[MOCK AUTH] Getting session, current user:", mockUser?.email || "none")

    if (mockUser) {
      const supabaseUser = mockUserToSupabaseUser(mockUser)
      console.log("[MOCK AUTH] Returning session with user:", supabaseUser)
      return { user: supabaseUser }
    }

    console.log("[MOCK AUTH] No current session")
    return { user: null }
  },

  // Verify magic link (simulate successful verification)
  verifyMagicLink: async (email: string): Promise<{ user: User | null; error: Error | null }> => {
    console.log("[MOCK AUTH] Starting verifyMagicLink for email:", email)

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    try {
      const users = getMockUsers()
      let user = users.find((u) => u.email === email)

      if (!user) {
        console.log("[MOCK AUTH] User not found for verification, creating new user:", email)
        // Auto-create user if it doesn't exist
        user = {
          id: `mock-${Date.now().toString(36)}`,
          email,
          created_at: new Date().toISOString(),
        }

        users.push(user)
        saveMockUsers(users)
      } else {
        console.log("[MOCK AUTH] Found existing user for verification:", user)
      }

      // Set as current user
      saveCurrentMockUser(user)

      const supabaseUser = mockUserToSupabaseUser(user)
      console.log("[MOCK AUTH] Magic link verification successful for:", email, "Returning user:", supabaseUser)
      return { user: supabaseUser, error: null }
    } catch (err) {
      console.error("[MOCK AUTH] Magic link verification error:", err)
      return { user: null, error: err as Error }
    }
  },
}
