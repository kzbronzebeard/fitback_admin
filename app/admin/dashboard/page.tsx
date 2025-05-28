"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users, FileText, Clock, CheckCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"

export default function AdminDashboard() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [accessDenied, setAccessDenied] = useState(false)

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
      // For now, just set some mock data
      setDashboardData({
        users: { total: 123, recent: 12 },
        feedbacks: { total: 456, pending: 78 },
      })
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
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
            <p className="text-sm text-gray-500">+{dashboardData?.users?.recent || 0} this week</p>
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

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">Online</div>
            <p className="text-sm text-gray-500">All systems operational</p>
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
                <p className="text-sm">• New user registrations: {dashboardData?.users?.recent || 0}</p>
                <p className="text-sm">• Pending feedback reviews: {dashboardData?.feedbacks?.pending || 0}</p>
                <p className="text-sm">• System uptime: 99.9%</p>
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
              <p>Analytics dashboard coming soon...</p>
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
