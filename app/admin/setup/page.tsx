"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { setupDatabaseSecurity } from "@/app/actions/setup-security"
import { AlertCircle, CheckCircle } from "lucide-react"

export default function SecuritySetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string } | null>(null)

  const handleSetupSecurity = async () => {
    setIsLoading(true)
    try {
      const result = await setupDatabaseSecurity()
      setResult(result)
    } catch (error) {
      setResult({
        success: false,
        error: (error as Error).message || "An unknown error occurred",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Database Security Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-6 text-gray-600">
            This utility will enable Row Level Security (RLS) for all tables and storage buckets in your Supabase
            database. This ensures that users can only access their own data.
          </p>

          <Button onClick={handleSetupSecurity} disabled={isLoading} className="w-full bg-[#7E5BEF] hover:bg-[#6D4AD8]">
            {isLoading ? "Setting up security..." : "Setup Database Security"}
          </Button>

          {result && (
            <div
              className={`mt-4 p-3 rounded-md ${
                result.success ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              }`}
            >
              <div className="flex items-center">
                {result.success ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                <p>{result.success ? result.message : `Error: ${result.error}`}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
