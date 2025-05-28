"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { signUp, resendVerificationEmail } from "../actions/auth"

export default function TestAuthPage() {
  const [email, setEmail] = useState("")
  const [name, setName] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSignUp = async () => {
    setLoading(true)
    setMessage("")

    try {
      const result = await signUp(email, name, password)

      if (result.success) {
        setMessage(`✅ ${result.message}`)
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    setLoading(true)
    setMessage("")

    try {
      const result = await resendVerificationEmail(email)

      if (result.success) {
        setMessage(`✅ ${result.message}`)
      } else {
        setMessage(`❌ ${result.error}`)
      }
    } catch (error) {
      setMessage(`❌ Error: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-purple-800">🧪 Auth Flow Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (8+ chars, uppercase, number)"
            />
          </div>

          <div className="space-y-2">
            <Button onClick={handleSignUp} disabled={loading || !email || !name || !password} className="w-full">
              {loading ? "Testing..." : "Test Signup"}
            </Button>

            <Button onClick={handleResendEmail} disabled={loading || !email} variant="outline" className="w-full">
              {loading ? "Sending..." : "Resend Verification"}
            </Button>
          </div>

          {message && (
            <div className="p-3 rounded-lg bg-gray-50 border">
              <p className="text-sm whitespace-pre-wrap">{message}</p>
            </div>
          )}

          <div className="text-xs text-gray-600 space-y-1">
            <p>
              <strong>Test Steps:</strong>
            </p>
            <p>1. Fill in test details above</p>
            <p>2. Click "Test Signup"</p>
            <p>3. Check your email for verification link</p>
            <p>4. Click verification link to complete</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
