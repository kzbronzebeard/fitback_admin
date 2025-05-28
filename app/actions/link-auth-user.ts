"use server"

import { createServerActionClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

export async function linkAuthUserToProfile(userId: string) {
  const supabase = createServerActionClient({ cookies })

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, error: "No authenticated session found" }
    }

    const authId = session.user.id

    // Update the user record to link it with the auth user
    const { error } = await supabase
      .from("users")
      .update({
        auth_id: authId,
        email: session.user.email,
      })
      .eq("id", userId)

    if (error) throw error

    return { success: true }
  } catch (error: any) {
    console.error("Error linking auth user to profile:", error)
    return { success: false, error: error.message }
  }
}
