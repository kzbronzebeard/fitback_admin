import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    try {
      console.log("[AUTH CALLBACK] Processing auth code")

      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error("[AUTH CALLBACK] Error exchanging code:", error)
        return NextResponse.redirect(`${requestUrl.origin}/auth?error=auth_callback_error`)
      }

      if (data.user) {
        console.log("[AUTH CALLBACK] User authenticated:", data.user.email)

        // Check if user profile exists, create if not
        const { data: existingProfile } = await supabase
          .from("users")
          .select("user_id")
          .eq("auth_user_id", data.user.id)
          .single()

        if (!existingProfile) {
          console.log("[AUTH CALLBACK] Creating user profile for new user")

          const { error: profileError } = await supabase.from("users").insert({
            auth_user_id: data.user.id,
            name: data.user.user_metadata?.name || data.user.email?.split("@")[0] || "User",
            email: data.user.email!,
            age_verified: false,
            is_admin: ["p10khanazka@iima.ac.in", "chhekur@gmail.com"].includes(data.user.email!.toLowerCase()),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })

          if (profileError) {
            console.error("[AUTH CALLBACK] Error creating profile:", profileError)
          } else {
            console.log("[AUTH CALLBACK] User profile created successfully")
          }
        }

        // Redirect to create-profile page
        return NextResponse.redirect(`${requestUrl.origin}/create-profile`)
      }
    } catch (error) {
      console.error("[AUTH CALLBACK] Unexpected error:", error)
      return NextResponse.redirect(`${requestUrl.origin}/auth?error=server_error`)
    }
  }

  // Return the user to an error page with instructions
  return NextResponse.redirect(`${requestUrl.origin}/auth?error=no_code_provided`)
}
