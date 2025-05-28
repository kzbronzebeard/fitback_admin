"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/app/context/auth-context"
import { useRouter } from "next/navigation"
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"

export default function AdminFeedbacks() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [feedbacks, setFeedbacks] = useState([])
  const [open, setOpen] = useState(false)
  const [selectedFeedbackId, setSelectedFeedbackId] = useState(null)
  const [replyText, setReplyText] = useState("")

  // Check admin access
  useEffect(() => {
    if (!loading && (!user || !["p10khanazka@iima.ac.in", "team@tashion.ai"].includes(user.email))) {
      router.push("/")
      return
    }
  }, [user, loading, router])

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const response = await fetch("/api/admin/feedbacks", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`)
        }

        const data = await response.json()
        setFeedbacks(data)
      } catch (error) {
        console.error("Failed to fetch feedbacks:", error)
      }
    }

    fetchFeedbacks()
  }, [])

  const handleOpenDialog = (id) => {
    setSelectedFeedbackId(id)
    setOpen(true)
  }

  const handleCloseDialog = () => {
    setOpen(false)
    setSelectedFeedbackId(null)
    setReplyText("")
  }

  const handleReplySubmit = async () => {
    try {
      const response = await fetch(`/api/feedbacks/${selectedFeedbackId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reply: replyText }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`)
      }

      // Update the feedbacks state with the new reply
      setFeedbacks((prevFeedbacks) =>
        prevFeedbacks.map((feedback) =>
          feedback._id === selectedFeedbackId ? { ...feedback, reply: replyText } : feedback,
        ),
      )

      toast.success("Reply sent successfully!")
      handleCloseDialog()
    } catch (error) {
      console.error("Failed to submit reply:", error)
      toast.error("Failed to send reply. Please try again.")
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  if (!user) {
    return <div>Unauthorized</div>
  }

  return (
    <div className="container py-10">
      <h1 className="text-3xl font-bold mb-4">Admin Feedbacks</h1>
      <Table>
        <TableCaption>A list of feedbacks from users.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Feedback</TableHead>
            <TableHead>Reply</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {feedbacks.map((feedback) => (
            <TableRow key={feedback._id}>
              <TableCell>{feedback.name}</TableCell>
              <TableCell>{feedback.email}</TableCell>
              <TableCell>{feedback.feedback}</TableCell>
              <TableCell>{feedback.reply || "No Reply"}</TableCell>
              <TableCell className="text-right">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" onClick={() => handleOpenDialog(feedback._id)}>
                      Reply
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Reply to Feedback</DialogTitle>
                      <DialogDescription>Write your reply to the feedback.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply here."
                      />
                    </div>
                    <Button onClick={handleReplySubmit}>Submit Reply</Button>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
