"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, Clock, TrendingUp, UserPlus } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"

interface DashboardData {
  users: {
    total: number
    last24h: number
    last7days: number
  }
  feedbacks: {
    total: number
    pending: number
    last24h: {
      total: number
      pending: number
      approved: number
      rejected: number
      rewarded: number
    }
    last7days: {
      total: number
      pending: number
      approved: number
      rejected: number
      rewarded: number
    }
  }
  systemStatus: string
}

export default function AdminDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  // Admin email whitelist
  const ADMIN_EMAILS = ["p10khanazka@iima.ac.in", "team@tashion.ai", "chhekur@gmail.com"]

  // Check admin access
  useEffect(() => {
    console.log("[ADMIN DASHBOARD] Auth state:", { user, isLoading })

    if (isLoading) {
      return // Still loading, wait
    }

    if (!user) {
      console.log("[ADMIN DASHBOARD] No user, redirecting to login")
      router.push("/auth/login")
      return
    }

    const isAdmin = ADMIN_EMAILS.includes(user.email?.toLowerCase() || "")
    console.log("[ADMIN DASHBOARD] Admin check:", { email: user.email, isAdmin })

    if (!isAdmin) {
      console.log("[ADMIN DASHBOARD] Not admin, access denied")
      setAccessDenied(true)
      return
    }

    // User is admin, load dashboard data
    fetchDashboardData()
  }, [user, isLoading, router])

  const fetchDashboardData = async () => {
    try {
      setIsLoadingData(true)

      // Get session ID from localStorage
      const sessionId = localStorage.getItem("fitback_session_id")

      // Fetch real data from API
      const response = await fetch("/api/admin/dashboard", {
        headers: {
          "x-session-id": sessionId || "",
        },
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const result = await response.json()

      if (result.success && result.data) {
        setDashboardData(result.data)
        setLastUpdated(new Date())
      } else {
        console.error("[ADMIN DASHBOARD] API returned error:", result.error)
      }
    } catch (error) {
      console.error("[ADMIN DASHBOARD] Error fetching dashboard data:", error)
    } finally {
      setIsLoadingData(false)
    }
  }

  // Loading state
  if (isLoading || isLoadingData) {
    return (
      <div className="container py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Access denied state
  if (accessDenied) {
    return (
      <div className="container py-10">
        <Card>
          <CardHeader>
            <CardTitle>Access Denied</CardTitle>
            <CardDescription>You don't have permission to access the admin dashboard.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">Admin access is restricted to authorized personnel only.</p>
            <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Admin dashboard content
  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.name || user?.email}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/feedbacks">Feedback Console</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/admin/users">User Console</Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.users?.total || 0}</div>
            <p className="text-sm text-gray-500">+{dashboardData?.users?.last7days || 0} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Users (24h)</CardTitle>
            <UserPlus className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.users?.last24h || 0}</div>
            <p className="text-sm text-gray-500">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedbacks</CardTitle>
            <FileText className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.feedbacks?.total || 0}</div>
            <p className="text-sm text-gray-500">All time submissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.feedbacks?.pending || 0}</div>
            <p className="text-sm text-gray-500">Awaiting approval</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="actions">Quick Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest platform activity</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-sm">• New user registrations (24h): {dashboardData?.users?.last24h || 0}</p>
                <p className="text-sm">• New user registrations (7 days): {dashboardData?.users?.last7days || 0}</p>
                <p className="text-sm">• Pending feedback reviews: {dashboardData?.feedbacks?.pending || 0}</p>
                <p className="text-sm">• Recent feedbacks (24h): {dashboardData?.feedbacks?.last24h?.total || 0}</p>
                <p className="text-sm">• System status: {dashboardData?.systemStatus || "Unknown"}</p>
                {lastUpdated && (
                  <p className="text-xs text-gray-400 mt-4">Last updated: {lastUpdated.toLocaleTimeString()}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Platform Analytics</CardTitle>
              <CardDescription>Key metrics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">User Growth</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Last 24 hours</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-xl font-bold">{dashboardData?.users?.last24h || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">Last 7 days</span>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                      </div>
                      <p className="text-xl font-bold">{dashboardData?.users?.last7days || 0}</p>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium mb-2">Feedback Activity (Last 7 days)</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Total</p>
                      <p className="text-xl font-bold">{dashboardData?.feedbacks?.last7days?.total || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Pending</p>
                      <p className="text-xl font-bold">{dashboardData?.feedbacks?.last7days?.pending || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Approved</p>
                      <p className="text-xl font-bold">{dashboardData?.feedbacks?.last7days?.approved || 0}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="text-sm text-gray-500">Rejected</p>
                      <p className="text-xl font-bold">{dashboardData?.feedbacks?.last7days?.rejected || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="actions">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common administrative tasks</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild>
                <Link href="/admin/feedbacks">Review Feedbacks</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin/users">Manage Users</Link>
              </Button>
              <Button onClick={fetchDashboardData} variant="outline">
                Refresh Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
