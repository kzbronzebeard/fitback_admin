"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, RefreshCw, Database, CheckCircle } from "lucide-react"
import {
  fetchFeedbackRecords,
  fetchUserRecords,
  checkTablesExist,
  createTablesIfNotExist,
} from "@/app/actions/fetch-data"

export default function DataCheckPage() {
  const [feedbackData, setFeedbackData] = useState<any[]>([])
  const [userData, setUserData] = useState<any[]>([])
  const [tables, setTables] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [createTablesStatus, setCreateTablesStatus] = useState<{ success: boolean; message: string } | null>(null)

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // Check if tables exist
      const tablesResult = await checkTablesExist()
      if (!tablesResult.success) {
        setError(`Failed to check tables: ${tablesResult.error}`)
        setTables([])
        // Continue to try to fetch data anyway
      } else {
        setTables(tablesResult.data)
      }

      // Fetch feedback data
      const feedbackResult = await fetchFeedbackRecords()
      if (!feedbackResult.success) {
        console.warn(`Failed to fetch feedback data: ${feedbackResult.error}`)
        // Don't throw, just set empty data
        setFeedbackData([])
      } else {
        setFeedbackData(feedbackResult.data || [])
      }

      // Fetch user data
      const userResult = await fetchUserRecords()
      if (!userResult.success) {
        console.warn(`Failed to fetch user data: ${userResult.error}`)
        // Don't throw, just set empty data
        setUserData([])
      } else {
        setUserData(userResult.data || [])
      }
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTables = async () => {
    try {
      setCreateTablesStatus(null)
      const result = await createTablesIfNotExist()

      if (result.success) {
        setCreateTablesStatus({
          success: true,
          message: "Tables created successfully. Refreshing data...",
        })
        // Reload data after creating tables
        await loadData()
      } else {
        setCreateTablesStatus({
          success: false,
          message: `Failed to create tables: ${result.error}`,
        })
      }
    } catch (err) {
      setCreateTablesStatus({
        success: false,
        message: (err as Error).message,
      })
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  return (
    <div className="container mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Database Data Check</h1>
        <Button onClick={loadData} disabled={loading} className="flex items-center gap-2">
          {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh Data
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {createTablesStatus && (
        <Alert variant={createTablesStatus.success ? "default" : "destructive"} className="mb-6">
          {createTablesStatus.success ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{createTablesStatus.message}</AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Tables
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : tables.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {tables.map((table) => (
                <div key={table} className="bg-gray-100 rounded-md p-2 text-sm">
                  {table}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500 mb-4">No tables found in the database.</p>
              <Button onClick={handleCreateTables}>Create Required Tables</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="feedback" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="feedback">Feedback Data ({feedbackData.length})</TabsTrigger>
          <TabsTrigger value="users">User Data ({userData.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback">
          <Card>
            <CardHeader>
              <CardTitle>Feedback Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : feedbackData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">ID</th>
                        <th className="border p-2 text-left">User</th>
                        <th className="border p-2 text-left">Brand</th>
                        <th className="border p-2 text-left">Size</th>
                        <th className="border p-2 text-left">Status</th>
                        <th className="border p-2 text-left">Created At</th>
                        <th className="border p-2 text-left">Has Video</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedbackData.map((feedback) => (
                        <tr key={feedback.feedback_id}>
                          <td className="border p-2">{feedback.feedback_id.substring(0, 8)}...</td>
                          <td className="border p-2">{feedback.users?.name || "Unknown"}</td>
                          <td className="border p-2">{feedback.brand}</td>
                          <td className="border p-2">{feedback.size}</td>
                          <td className="border p-2">{feedback.status}</td>
                          <td className="border p-2">{new Date(feedback.created_at).toLocaleString()}</td>
                          <td className="border p-2">
                            {feedback.videos && feedback.videos.length > 0 ? (
                              <span className="text-green-600">Yes</span>
                            ) : (
                              <span className="text-red-600">No</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No feedback records found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Records</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-4">
                  <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : userData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border p-2 text-left">ID</th>
                        <th className="border p-2 text-left">Name</th>
                        <th className="border p-2 text-left">Email</th>
                        <th className="border p-2 text-left">Age Verified</th>
                        <th className="border p-2 text-left">Created At</th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.map((user) => (
                        <tr key={user.user_id}>
                          <td className="border p-2">{user.user_id.substring(0, 8)}...</td>
                          <td className="border p-2">{user.name}</td>
                          <td className="border p-2">{user.email}</td>
                          <td className="border p-2">{user.age_verified ? "Yes" : "No"}</td>
                          <td className="border p-2">{new Date(user.created_at).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500">No user records found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
