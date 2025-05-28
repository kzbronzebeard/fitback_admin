"use client"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthDebugPage() {
  const [debugInfo, setDebugInfo] = useState<any>({})
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuthConfig = async () => {
      try {
        // Get current session
        const { data: session, error: sessionError } = await supabase.auth.getSession()

        // Get current user
        const { data: user, error: userError } = await supabase.auth.getUser()

        // Test a simple query to check connection
        const { data: testData, error: testError } = await supabase.from("users").select("count").limit(1)

        setDebugInfo({
          environment: process.env.NODE_ENV,
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          currentOrigin: window.location.origin,
          session: session ? "Found" : "None",
          sessionError: sessionError?.message,
          user: user ? "Found" : "None",
          userError: userError?.message,
          databaseConnection: testError ? "Failed" : "Success",
          databaseError: testError?.message,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        setDebugInfo({
          error: "Failed to check auth config",
          details: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    checkAuthConfig()
  }, [supabase])

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Card>
          <CardHeader>
            <CardTitle>Authentication Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(debugInfo).map(([key, value]) => (
                  <div key={key} className="p-3 bg-gray-100 rounded">
                    <div className="font-semibold text-sm text-gray-600 uppercase">
                      {key.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                    <div className="mt-1 font-mono text-sm">
                      {typeof value === "boolean" ? (value ? "✅ Yes" : "❌ No") : value || "❌ Not Set"}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded">
                <h3 className="font-semibold text-blue-800 mb-2">Troubleshooting Steps:</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Check that NEXT_PUBLIC_SUPABASE_URL is set correctly</li>
                  <li>• Verify NEXT_PUBLIC_SUPABASE_ANON_KEY is configured</li>
                  <li>• Ensure your domain is added to Supabase Auth settings</li>
                  <li>• Check Supabase email templates are configured</li>
                  <li>• Verify SMTP settings in Supabase dashboard</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
