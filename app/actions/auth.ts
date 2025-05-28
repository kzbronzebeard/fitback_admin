"use server"

import { createClient } from "@supabase/supabase-js"
import { hashPassword, verifyPassword, validatePasswordStrength, generateSecureToken } from "../utils/password-utils"
import { createSession, deleteAllUserSessions } from "../utils/session-manager"
import { ADMIN_EMAILS } from "../utils/supabase"
import { sendVerificationEmail, sendPasswordResetEmail, sendWelcomeEmail } from "../utils/email-service"

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export async function signUp(email: string, name: string, password: string) {
  try {
    console.log("[AUTH ACTION] Starting signup for:", email)

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: "Password requirements not met",
        passwordErrors: passwordValidation.errors,
      }
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("email, email_verified")
      .eq("email", email.toLowerCase())
      .single()

    if (existingUser) {
      if (existingUser.email_verified) {
        return { success: false, error: "An account with this email already exists" }
      } else {
        // User exists but email not verified, we can resend verification
        console.log("[AUTH ACTION] User exists but not verified, will resend verification")
      }
    }

    // Hash password
    const passwordHash = await hashPassword(password)

    // Generate verification token
    const verificationToken = generateSecureToken()

    // Create or update user record
    const userData = {
      name: name.trim(),
      email: email.toLowerCase(),
      password_hash: passwordHash,
      email_verified: false,
      verification_token: verificationToken,
      is_admin: ADMIN_EMAILS.includes(email.toLowerCase()),
      age_verified: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    let userId: string

    if (existingUser) {
      // Update existing unverified user
      const { data, error } = await supabase
        .from("users")
        .update(userData)
        .eq("email", email.toLowerCase())
        .select("user_id")
        .single()

      if (error) throw error
      userId = data.user_id
    } else {
      // Create new user
      const { data, error } = await supabase.from("users").insert(userData).select("user_id").single()

      if (error) throw error
      userId = data.user_id
    }

    // Send verification email using Resend
    const emailResult = await sendVerificationEmail(email.toLowerCase(), name.trim(), verificationToken)

    if (!emailResult.success) {
      console.error("[AUTH ACTION] Error sending verification email:", emailResult.error)
      // Don't fail the signup if email fails, user can retry
    }

    console.log("[AUTH ACTION] Signup successful, verification email sent to:", email)
    return {
      success: true,
      message: "Account created! Please check your email to verify your account.",
      userId,
    }
  } catch (error) {
    console.error("[AUTH ACTION] Error during signup:", error)
    return { success: false, error: "Failed to create account. Please try again." }
  }
}

export async function resendVerificationEmail(email: string) {
  try {
    console.log("[AUTH ACTION] Resending verification email to:", email)

    // Check if user exists and is not verified
    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, email_verified, verification_token")
      .eq("email", email.toLowerCase())
      .single()

    if (error || !user) {
      return { success: false, error: "No account found with this email address" }
    }

    if (user.email_verified) {
      return { success: false, error: "This email is already verified" }
    }

    // Generate new verification token
    const verificationToken = generateSecureToken()

    // Update user with new token
    await supabase.from("users").update({ verification_token: verificationToken }).eq("user_id", user.user_id)

    // Send verification email using Resend
    const emailResult = await sendVerificationEmail(email.toLowerCase(), "there", verificationToken)

    if (!emailResult.success) {
      console.error("[AUTH ACTION] Error resending verification email:", emailResult.error)
      return { success: false, error: "Failed to send verification email" }
    }

    console.log("[AUTH ACTION] Verification email resent successfully")
    return { success: true, message: "Verification email sent! Please check your inbox." }
  } catch (error) {
    console.error("[AUTH ACTION] Error resending verification email:", error)
    return { success: false, error: "Failed to resend verification email" }
  }
}

export async function verifyEmail(token: string) {
  try {
    console.log("[AUTH ACTION] Verifying email with token")

    // Find user with verification token
    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, email, email_verified, name")
      .eq("verification_token", token)
      .single()

    if (error || !user) {
      return { success: false, error: "Invalid or expired verification link" }
    }

    if (user.email_verified) {
      return { success: false, error: "Email is already verified" }
    }

    // Mark email as verified and clear token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        email_verified: true,
        verification_token: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.user_id)

    if (updateError) throw updateError

    // Create session for the user
    const sessionResult = await createSession(user.user_id)

    if (!sessionResult.success) {
      console.error("[AUTH ACTION] Failed to create session after verification")
      return { success: false, error: "Verification successful but failed to log in" }
    }

    // Send welcome email
    await sendWelcomeEmail(user.email, user.name || "there")

    console.log("[AUTH ACTION] Email verified successfully for:", user.email)
    return {
      success: true,
      message: "Email verified successfully! Welcome to Fitback!",
      sessionId: sessionResult.session?.session_id,
      user: {
        user_id: user.user_id,
        email: user.email,
      },
    }
  } catch (error) {
    console.error("[AUTH ACTION] Error verifying email:", error)
    return { success: false, error: "Failed to verify email" }
  }
}

export async function signIn(email: string, password: string) {
  try {
    console.log("[AUTH ACTION] Sign in attempt for:", email)

    // Get user with password hash
    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, email, password_hash, email_verified, name, is_admin, is_blocked")
      .eq("email", email.toLowerCase())
      .single()

    if (error || !user) {
      return { success: false, error: "Invalid email or password" }
    }

    if (!user.email_verified) {
      return { success: false, error: "Please verify your email before signing in" }
    }

    // Check if user is blocked
    if (user.is_blocked) {
      return {
        success: false,
        error: "Your account has been suspended. Please contact support for assistance.",
      }
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password_hash)

    if (!isPasswordValid) {
      return { success: false, error: "Invalid email or password" }
    }

    // Delete any existing sessions for this user
    await deleteAllUserSessions(user.user_id)

    // Create new session
    const sessionResult = await createSession(user.user_id)

    if (!sessionResult.success) {
      return { success: false, error: "Failed to create session" }
    }

    console.log("[AUTH ACTION] Sign in successful for:", email)
    return {
      success: true,
      message: "Welcome back!",
      sessionId: sessionResult.session?.session_id,
      user: {
        user_id: user.user_id,
        email: user.email,
        name: user.name,
        is_admin: user.is_admin,
      },
    }
  } catch (error) {
    console.error("[AUTH ACTION] Error during sign in:", error)
    return { success: false, error: "Failed to sign in" }
  }
}

export async function forgotPassword(email: string) {
  try {
    console.log("[AUTH ACTION] Password reset requested for:", email)

    // Check if user exists and is verified
    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, email_verified")
      .eq("email", email.toLowerCase())
      .single()

    if (error || !user) {
      // Don't reveal if email exists or not for security
      return { success: true, message: "If an account with this email exists, you will receive a password reset link." }
    }

    if (!user.email_verified) {
      return { success: false, error: "Please verify your email first" }
    }

    // Generate reset token with expiration
    const resetToken = generateSecureToken()
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    // Update user with reset token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        reset_token: resetToken,
        reset_token_expires: resetTokenExpires,
      })
      .eq("user_id", user.user_id)

    if (updateError) throw updateError

    // Send reset email using Resend
    const emailResult = await sendPasswordResetEmail(email.toLowerCase(), "there", resetToken)

    if (!emailResult.success) {
      console.error("[AUTH ACTION] Error sending reset email:", emailResult.error)
      return { success: false, error: "Failed to send reset email" }
    }

    console.log("[AUTH ACTION] Password reset email sent")
    return { success: true, message: "Password reset link sent to your email" }
  } catch (error) {
    console.error("[AUTH ACTION] Error in forgot password:", error)
    return { success: false, error: "Failed to send reset email" }
  }
}

export async function resetPassword(token: string, newPassword: string) {
  try {
    console.log("[AUTH ACTION] Resetting password with token")

    // Validate new password
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return {
        success: false,
        error: "Password requirements not met",
        passwordErrors: passwordValidation.errors,
      }
    }

    // Find user with valid reset token
    const { data: user, error } = await supabase
      .from("users")
      .select("user_id, email")
      .eq("reset_token", token)
      .gt("reset_token_expires", new Date().toISOString())
      .single()

    if (error || !user) {
      return { success: false, error: "Invalid or expired reset link" }
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user with new password and clear reset token
    const { error: updateError } = await supabase
      .from("users")
      .update({
        password_hash: passwordHash,
        reset_token: null,
        reset_token_expires: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.user_id)

    if (updateError) throw updateError

    // Delete all existing sessions for security
    await deleteAllUserSessions(user.user_id)

    console.log("[AUTH ACTION] Password reset successful for:", user.email)
    return { success: true, message: "Password reset successful! Please sign in with your new password." }
  } catch (error) {
    console.error("[AUTH ACTION] Error resetting password:", error)
    return { success: false, error: "Failed to reset password" }
  }
}

export async function signOut(sessionId: string) {
  try {
    console.log("[AUTH ACTION] Signing out session:", sessionId)

    const { error } = await supabase.from("user_sessions").delete().eq("session_id", sessionId)

    if (error) {
      console.error("[AUTH ACTION] Error signing out:", error)
      return { success: false, error: "Failed to sign out" }
    }

    console.log("[AUTH ACTION] Sign out successful")
    return { success: true }
  } catch (error) {
    console.error("[AUTH ACTION] Error during sign out:", error)
    return { success: false, error: "Failed to sign out" }
  }
}

// Additional action functions for form handling
export async function actionSignInWithEmail(formData: FormData) {
  const email = String(formData.get("email"))
  const password = String(formData.get("password"))

  const result = await signIn(email, password)
  return result
}

export async function actionSignUpWithEmail(formData: FormData) {
  const email = String(formData.get("email"))
  const name = String(formData.get("name")) || "User"
  const password = String(formData.get("password"))

  const result = await signUp(email, name, password)
  return result
}

export async function actionSignOut() {
  // This would need session ID from context, but for now return success
  return { success: true }
}
