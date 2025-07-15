import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

const SESSION_DURATION_DAYS = 30
const SESSION_DURATION_MS = SESSION_DURATION_DAYS * 24 * 60 * 60 * 1000

export interface UserSession {
  session_id: string
  user_id: string
  expires_at: string
  last_activity: string
  created_at: string
}

export async function createSession(
  userId: string,
): Promise<{ success: boolean; session?: UserSession; error?: string }> {
  try {
    console.log("[SESSION MANAGER] Creating session for user:", userId)

    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()

    const { data, error } = await supabase
      .from("user_sessions")
      .insert({
        user_id: userId,
        expires_at: expiresAt,
        last_activity: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("[SESSION MANAGER] Error creating session:", error)
      return { success: false, error: error.message }
    }

    console.log("[SESSION MANAGER] Session created successfully:", data.session_id)
    return { success: true, session: data }
  } catch (error) {
    console.error("[SESSION MANAGER] Unexpected error creating session:", error)
    return { success: false, error: "Failed to create session" }
  }
}

export async function validateSession(sessionId: string): Promise<{
  isValid: boolean
  session?: UserSession
  user?: any
  error?: string
}> {
  try {
    console.log("[SESSION MANAGER] Validating session:", sessionId)

    // Get session with user data
    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select(`
        *,
        users (
          user_id,
          name,
          email,
          age_verified,
          is_admin,
          email_verified
        )
      `)
      .eq("session_id", sessionId)
      .single()

    if (sessionError || !sessionData) {
      console.log("[SESSION MANAGER] Session not found:", sessionId)
      return { isValid: false, error: "Session not found" }
    }

    // Check if session is expired
    const now = new Date()
    const expiresAt = new Date(sessionData.expires_at)

    if (now > expiresAt) {
      console.log("[SESSION MANAGER] Session expired:", sessionId)
      // Clean up expired session
      await supabase.from("user_sessions").delete().eq("session_id", sessionId)
      return { isValid: false, error: "Session expired" }
    }

    console.log("[SESSION MANAGER] Session valid:", sessionId)
    return {
      isValid: true,
      session: sessionData,
      user: sessionData.users,
    }
  } catch (error) {
    console.error("[SESSION MANAGER] Error validating session:", error)
    return { isValid: false, error: "Failed to validate session" }
  }
}

export async function extendSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[SESSION MANAGER] Extending session:", sessionId)

    const newExpiresAt = new Date(Date.now() + SESSION_DURATION_MS).toISOString()
    const lastActivity = new Date().toISOString()

    const { error } = await supabase
      .from("user_sessions")
      .update({
        expires_at: newExpiresAt,
        last_activity: lastActivity,
      })
      .eq("session_id", sessionId)

    if (error) {
      console.error("[SESSION MANAGER] Error extending session:", error)
      return { success: false, error: error.message }
    }

    console.log("[SESSION MANAGER] Session extended successfully")
    return { success: true }
  } catch (error) {
    console.error("[SESSION MANAGER] Unexpected error extending session:", error)
    return { success: false, error: "Failed to extend session" }
  }
}

export async function deleteSession(sessionId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[SESSION MANAGER] Deleting session:", sessionId)

    const { error } = await supabase.from("user_sessions").delete().eq("session_id", sessionId)

    if (error) {
      console.error("[SESSION MANAGER] Error deleting session:", error)
      return { success: false, error: error.message }
    }

    console.log("[SESSION MANAGER] Session deleted successfully")
    return { success: true }
  } catch (error) {
    console.error("[SESSION MANAGER] Unexpected error deleting session:", error)
    return { success: false, error: "Failed to delete session" }
  }
}

export async function deleteAllUserSessions(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    console.log("[SESSION MANAGER] Deleting all sessions for user:", userId)

    const { error } = await supabase.from("user_sessions").delete().eq("user_id", userId)

    if (error) {
      console.error("[SESSION MANAGER] Error deleting user sessions:", error)
      return { success: false, error: error.message }
    }

    console.log("[SESSION MANAGER] All user sessions deleted successfully")
    return { success: true }
  } catch (error) {
    console.error("[SESSION MANAGER] Unexpected error deleting user sessions:", error)
    return { success: false, error: "Failed to delete user sessions" }
  }
}

export async function cleanupExpiredSessions(): Promise<{ success: boolean; deletedCount?: number; error?: string }> {
  try {
    console.log("[SESSION MANAGER] Cleaning up expired sessions")

    const { data, error } = await supabase
      .from("user_sessions")
      .delete()
      .lt("expires_at", new Date().toISOString())
      .select("session_id")

    if (error) {
      console.error("[SESSION MANAGER] Error cleaning up expired sessions:", error)
      return { success: false, error: error.message }
    }

    const deletedCount = data?.length || 0
    console.log("[SESSION MANAGER] Cleaned up expired sessions:", deletedCount)
    return { success: true, deletedCount }
  } catch (error) {
    console.error("[SESSION MANAGER] Unexpected error cleaning up sessions:", error)
    return { success: false, error: "Failed to cleanup expired sessions" }
  }
}
