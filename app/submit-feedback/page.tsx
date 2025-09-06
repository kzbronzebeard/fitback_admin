"use client"

import type React from "react"
import { useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/app/context/auth-context"
import { createFeedbackRecord } from "@/app/actions/feedback"
import { uploadLargeVideoToBlob } from "@/app/utils/vercel-blob-upload"
import { GradientButton } from "@/components/ui/gradient-button"
import { Progress } from "@/components/ui/progress"

const allStyles = `
  .satin-header::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      135deg,
      rgba(255, 255, 255, 0) 20%,
      rgba(255, 255, 255, 0.1) 30%,
      rgba(255, 255, 255, 0.2) 40%,
      rgba(255, 255, 255, 0.1) 50%,
      rgba(255, 255, 255, 0) 60%
    );
    pointer-events: none;
  }

  .satin-header::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
    opacity: 0.05;
    mix-blend-mode: overlay;
    pointer-events: none;
  }

  .slider::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #4A2B6B;
    cursor: pointer;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .slider::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #4A2B6B;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
  }

  .upload-zone {
    border: 2px dashed #d1d5db;
    transition: all 0.3s ease;
  }

  .upload-zone:hover {
    border-color: #4A2B6B;
    background-color: #f9fafb;
  }

  .upload-zone.drag-over {
    border-color: #4A2B6B;
    background-color: #f3f4f6;
    transform: scale(1.02);
  }
`

const guideSteps = [
  {
    title: "Choose any clothing item",
    description:
      "You can try on any piece of clothing from your wardrobe or recent purchase. For your reward to be processed, you must provide a link to the product page of the same item from the same brand in your feedback.",
  },
  {
    title: "Show how the garment fits",
    description:
      "Record a video showing how the garment fits on different parts of your body. Mention if it's tight, loose, or just right around specific areas.",
  },
  {
    title: "Describe the material",
    description:
      "Talk about how the fabric feels - is it soft, stiff, breathable, or stretchy? This helps others understand the comfort level of the garment.",
  },
  {
    title: "Try different poses",
    description:
      "Show the garment from different angles and in different poses to give a complete picture of the fit and how it moves with your body.",
  },
]

const fashionFacts = [
  "The zipper was invented in 1893 but wasn't widely used in fashion until the 1930s!",
  "Coco Chanel popularized the 'little black dress' in 1926, calling it 'Chanel's Ford'.",
  "The average person owns 148 pieces of clothing but only wears 20% regularly.",
  "Denim was originally created for gold miners during the California Gold Rush.",
  "The fashion industry is the second most polluting industry in the world after oil.",
  "High heels were originally worn by men in the 10th century for horse riding.",
  "The color purple was once so expensive that only royalty could afford it.",
  "Fast fashion brands produce 52 collections per year - that's one new collection per week!",
  "The first fashion magazine was published in Germany in 1586.",
  "Polyester takes 200+ years to decompose, making sustainable fashion crucial.",
]

type KeptStatus = "kept" | "returned" | "want_to_return"
type VideoSource = "record" | "upload"

interface FeedbackForm {
  productUrl: string
  brand: string
  size: string
  fitScore?: number
  keptStatus: KeptStatus
  additionalComments: string
}

interface UploadProgress {
  uploadedBytes: number
  totalBytes: number
  percentage: number
  speed?: number
  eta?: number
}

export default function SubmitFeedback() {
  const { user, isAuthenticated, isLoading, sessionId } = useAuth()
  const router = useRouter()

  // Video refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Video source and states
  const [videoSource, setVideoSource] = useState<VideoSource>("record")
  const [isRecording, setIsRecording] = useState(false)
  const [recordedVideo, setRecordedVideo] = useState<Blob | null>(null)
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null)
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null)
  const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [showRecordingModal, setShowRecordingModal] = useState(false)
  const [cameraPermission, setCameraPermission] = useState<"granted" | "denied" | "prompt">("prompt")

  // Mobile and camera states
  const [isMobile, setIsMobile] = useState(false)
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user")

  // Form states
  const [formData, setFormData] = useState<FeedbackForm>({
    productUrl: "",
    brand: "",
    size: "",
    keptStatus: "kept",
    additionalComments: "",
  })

  // UI states
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [expandedGuidelines, setExpandedGuidelines] = useState<Set<number>>(new Set())
  const [currentStep, setCurrentStep] = useState(1)
  const [currentFactIndex, setCurrentFactIndex] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)

  // Enhanced upload states
  const [uploadSpeed, setUploadSpeed] = useState<number>(0)
  const [uploadETA, setUploadETA] = useState<number>(0)
  const [retryAttempt, setRetryAttempt] = useState(0)

  // Helper functions
  const getCurrentVideo = (): Blob | File | null => {
    return videoSource === "record" ? recordedVideo : uploadedVideo
  }

  const getCurrentVideoUrl = (): string | null => {
    return videoSource === "record" ? recordedVideoUrl : uploadedVideoUrl
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const formatFileSize = (bytes: number) => {
    const mb = bytes / (1024 * 1024)
    return `${mb.toFixed(1)}MB`
  }

  const formatSpeed = (bytesPerSecond: number) => {
    const mbps = bytesPerSecond / (1024 * 1024)
    return `${mbps.toFixed(1)} MB/s`
  }

  const formatETA = (seconds: number) => {
    if (seconds < 60) return `${Math.round(seconds)}s`
    const mins = Math.floor(seconds / 60)
    const secs = Math.round(seconds % 60)
    return `${mins}m ${secs}s`
  }

  // Recording functions
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }, [isRecording])

  const requestCameraPermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: facingMode,
        },
        audio: true,
      })

      streamRef.current = stream
      setCameraPermission("granted")

      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }

      return true
    } catch (error) {
      console.error("Camera permission denied:", error)
      setCameraPermission("denied")
      return false
    }
  }

  const startRecording = async () => {
    if (!streamRef.current) {
      const hasPermission = await requestCameraPermission()
      if (!hasPermission) return
    }

    if (!streamRef.current) return

    try {
      chunksRef.current = []
      const mediaRecorder = new MediaRecorder(streamRef.current, {
        mimeType: "video/webm;codecs=vp9",
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" })
        setRecordedVideo(blob)
        setRecordedVideoUrl(URL.createObjectURL(blob))
        setShowRecordingModal(false)

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop())
          streamRef.current = null
        }
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Failed to start recording. Please try again.")
    }
  }

  const openRecordingModal = async () => {
    setShowRecordingModal(true)
    await requestCameraPermission()
  }

  const closeRecordingModal = () => {
    setShowRecordingModal(false)
    setIsRecording(false)

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }

  const retakeVideo = () => {
    if (videoSource === "record") {
      setRecordedVideo(null)
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl)
        setRecordedVideoUrl(null)
      }
      setRecordingTime(0)
    } else {
      setUploadedVideo(null)
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl)
        setUploadedVideoUrl(null)
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  // File upload handling
  const validateVideoFile = (file: File): string | null => {
    const allowedTypes = ["video/webm", "video/mp4", "video/quicktime", "video/x-msvideo", "video/avi"]
    if (!allowedTypes.includes(file.type)) {
      return "Please upload a valid video file (MP4, WebM, MOV, or AVI)"
    }

    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return "Video file must be smaller than 50MB"
    }

    return null
  }

  const handleFileUpload = (file: File) => {
    console.log("File selected:", file)

    const validationError = validateVideoFile(file)
    if (validationError) {
      setErrors({ ...errors, video: validationError })
      return
    }

    // Clear any existing uploaded video
    if (uploadedVideoUrl) {
      URL.revokeObjectURL(uploadedVideoUrl)
    }

    setUploadedVideo(file)
    setUploadedVideoUrl(URL.createObjectURL(file))

    // Clear any errors
    if (errors.video) {
      setErrors({ ...errors, video: "" })
    }

    console.log("Video uploaded successfully:", {
      name: file.name,
      size: file.size,
      type: file.type,
    })
  }

  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      handleFileUpload(file)
    }
  }

  // Drag and drop handlers
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    setIsDragOver(false)

    const files = event.dataTransfer.files
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  // Video source switching
  const switchVideoSource = (source: VideoSource) => {
    console.log("Switching video source to:", source)
    setVideoSource(source)

    // Clear current video when switching
    if (source === "record") {
      setUploadedVideo(null)
      if (uploadedVideoUrl) {
        URL.revokeObjectURL(uploadedVideoUrl)
        setUploadedVideoUrl(null)
      }
    } else {
      setRecordedVideo(null)
      if (recordedVideoUrl) {
        URL.revokeObjectURL(recordedVideoUrl)
        setRecordedVideoUrl(null)
      }
      setRecordingTime(0)
    }
  }

  // Form handling
  const handleInputChange = (field: keyof FeedbackForm, value: string | number) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: "" })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    const currentVideo = getCurrentVideo()
    console.log("Form validation - current video:", currentVideo)

    if (!currentVideo) {
      newErrors.video = "Please record or upload a video showing the garment fit"
    }

    if (!formData.productUrl.trim()) {
      newErrors.productUrl = "Product URL is required for cashback processing"
    }

    if (!formData.brand.trim()) {
      newErrors.brand = "Brand name is required"
    }

    if (!formData.size.trim()) {
      newErrors.size = "Size information is required"
    }

    if (!formData.fitScore) {
      newErrors.fitScore = "Please rate the fit"
    }

    console.log("Form validation errors:", newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const toggleGuideline = (index: number) => {
    setExpandedGuidelines((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSubmitError(null)

    console.log("=== FORM SUBMISSION DEBUG ===")
    console.log("Session ID:", sessionId)
    console.log("User:", user)
    console.log("Is Authenticated:", isAuthenticated)
    console.log("Form Data:", formData)
    console.log("Video Source:", videoSource)
    console.log("Current Video:", getCurrentVideo())
    console.log("Video Size:", getCurrentVideo()?.size)

    if (!validateForm()) {
      console.log("Form validation failed")
      return
    }

    const currentVideo = getCurrentVideo()
    if (!currentVideo) {
      setSubmitError("Please record or upload a video")
      console.log("No video available")
      return
    }

    if (videoSource === "record" && recordingTime < 10) {
      setSubmitError("Recorded video must be at least 10 seconds long")
      console.log("Recorded video too short:", recordingTime)
      return
    }

    if (!sessionId) {
      setSubmitError("Authentication error. Please log in again.")
      console.log("No session ID available")
      return
    }

    const videoSizeMB = currentVideo.size / (1024 * 1024)
    const MAX_FILE_SIZE_MB = 50

    if (videoSizeMB > MAX_FILE_SIZE_MB) {
      setSubmitError(
        `Video file is too large (${videoSizeMB.toFixed(1)}MB). Please use a smaller video file (under ${MAX_FILE_SIZE_MB}MB).`,
      )
      console.log("Video file too large:", videoSizeMB)
      return
    }

    setIsSubmitting(true)

    try {
      console.log("Creating feedback record...")

      const feedbackResult = await createFeedbackRecord(
        sessionId,
        formData.productUrl,
        formData.brand,
        formData.size,
        formData.fitScore!,
        formData.keptStatus,
      )

      console.log("Feedback creation result:", feedbackResult)

      if (!feedbackResult.success || !feedbackResult.feedbackId) {
        throw new Error(feedbackResult.error || "Failed to create feedback record")
      }

      setIsUploading(true)
      setRetryAttempt(0)
      console.log("Upload started - video size:", videoSizeMB, "MB")

      // Convert Blob to File if needed
      const videoFile =
        currentVideo instanceof File
          ? currentVideo
          : new File([currentVideo], "feedback-video.webm", { type: "video/webm" })

      // Enhanced upload with progress monitoring
      const uploadResult = await uploadLargeVideoToBlob(videoFile, feedbackResult.feedbackId, sessionId, (progress) => {
        setUploadProgress(progress)
        if (progress.speed) setUploadSpeed(progress.speed)
        if (progress.eta) setUploadETA(progress.eta)
      })

      console.log("Upload result:", uploadResult)

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || "Failed to upload video")
      }

      console.log("Video uploaded successfully")
      router.push("/feedback-success")
    } catch (error) {
      console.error("Error submitting feedback:", error)

      // Extract retry attempt from error message if present
      const errorMessage = error instanceof Error ? error.message : "Failed to submit feedback. Please try again."
      if (errorMessage.includes("attempt")) {
        const match = errorMessage.match(/attempt (\d+)/)
        if (match) {
          setRetryAttempt(Number.parseInt(match[1]))
        }
      }

      setSubmitError(errorMessage)
    } finally {
      setIsSubmitting(false)
      setIsUploading(false)
      setUploadProgress(null)
      setUploadSpeed(0)
      setUploadETA(0)
    }
  }

  // Effects
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= 60) {
            stopRecording()
            return 60
          }
          return prev + 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [isRecording, stopRecording])

  useEffect(() => {
    const checkMobile = () => {
      const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera
      const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent.toLowerCase(),
      )
      setIsMobile(isMobileDevice)
    }
    checkMobile()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (isUploading) {
      interval = setInterval(() => {
        setCurrentFactIndex((prev) => (prev + 1) % fashionFacts.length)
      }, 3000)
    }
    return () => clearInterval(interval)
  }, [isUploading])

  // Auth check
  if (isLoading) {
    return (
      <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-[#F5EFE6]">
        <div className="w-full max-w-md mx-auto h-full flex flex-col relative">
          <div className="flex-1 px-6 py-6 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A2B6B] mb-4"></div>
            <p className="text-[#4A2B6B] font-medium">Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-[#F5EFE6]">
      <style jsx>{allStyles}</style>
      <div className="w-full max-w-md mx-auto h-full flex flex-col relative">
        {/* Header */}
        <div
          className="w-full text-white px-6 rounded-3xl z-0 flex items-center justify-center satin-header"
          style={{
            background: "linear-gradient(135deg, #4A2B6B 0%, #4A2B6B 85%, #F7E7CE 150%)",
            boxShadow: "0 4px 14px rgba(0,0,0,0.1)",
            height: "20vh",
            minHeight: "120px",
            paddingTop: "2rem",
            paddingBottom: "2rem",
            marginTop: "1rem",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div className="text-center">
            <h1 className="text-3xl font-bold font-serif mb-2">Submit Feedback</h1>
            <p className="text-sm opacity-90">Record your review and earn ₹50</p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div
          className="bg-white rounded-3xl p-4 mx-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)] relative z-20"
          style={{ marginTop: "-5%" }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= 1 ? "bg-[#4A2B6B] text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > 1 ? "✓" : "1"}
              </div>
              <span className={`text-sm font-medium ${currentStep >= 1 ? "text-[#4A2B6B]" : "text-gray-500"}`}>
                Add Video
              </span>
            </div>

            <div className={`flex-1 h-1 mx-4 rounded-full ${currentStep >= 2 ? "bg-[#4A2B6B]" : "bg-gray-200"}`}></div>

            <div className="flex items-center space-x-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  currentStep >= 2 ? "bg-[#4A2B6B] text-white" : "bg-gray-200 text-gray-500"
                }`}
              >
                {currentStep > 2 ? "✓" : "2"}
              </div>
              <span className={`text-sm font-medium ${currentStep >= 2 ? "text-[#4A2B6B]" : "text-gray-500"}`}>
                Product Details
              </span>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div
          className="flex-1 px-6 py-6 flex flex-col rounded-3xl relative z-10"
          style={{
            backgroundColor: "#F5EFE6",
            boxShadow: "0 8px 20px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.08)",
            marginTop: "-5%",
            marginBottom: "1rem",
          }}
        >
          {currentStep === 1 ? (
            <>
              {/* Step 1: Video Recording/Upload */}

              {/* Recording Guidelines */}
              <div className="bg-white rounded-3xl p-4 mb-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
                <h2 className="text-lg font-bold text-[#1D1A2F] mb-3 font-serif">📖 Recording Guidelines</h2>
                <p className="text-xs text-gray-600 mb-3">Include these elements in your video to get Rs 50!</p>

                <div className="space-y-2">
                  {guideSteps.map((step, index) => {
                    const isExpanded = expandedGuidelines.has(index)
                    return (
                      <div key={index} className="bg-[#F5EFE6] rounded-xl overflow-hidden transition-all duration-200">
                        <button
                          onClick={() => toggleGuideline(index)}
                          className="w-full p-3 text-left hover:bg-[#F0E5D6] transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex-shrink-0">
                                <div className="w-5 h-5 bg-[#4A2B6B] text-white rounded-full flex items-center justify-center text-xs font-bold">
                                  {index + 1}
                                </div>
                              </div>
                              <h3 className="text-xs font-semibold text-[#1D1A2F]">{step.title}</h3>
                            </div>
                            <div
                              className={`transform transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                            >
                              <svg
                                className="w-4 h-4 text-[#4A2B6B]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </div>
                        </button>
                        {isExpanded && (
                          <div className="px-3 pb-3 animate-in slide-in-from-top-2 duration-200">
                            <div className="pl-8">
                              <p className="text-xs text-gray-600 leading-relaxed">{step.description}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Video Source Toggle */}
              <div className="bg-white rounded-3xl p-6 mb-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
                <h2 className="text-xl font-bold text-[#1D1A2F] mb-4 font-serif">🎥 Add Your Video</h2>

                {/* Premium Toggle Buttons */}
                <div className="relative bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl p-1 mb-6 shadow-inner">
                  <div className="flex relative">
                    <button
                      onClick={() => switchVideoSource("record")}
                      className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 relative ${
                        videoSource === "record"
                          ? "bg-white text-[#4A2B6B] shadow-lg shadow-purple-100 transform scale-[1.02]"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-lg">📹</span>
                        <span>Record Now</span>
                      </div>
                    </button>
                    <button
                      onClick={() => switchVideoSource("upload")}
                      className={`flex-1 py-4 px-6 rounded-xl font-semibold text-sm transition-all duration-300 relative ${
                        videoSource === "upload"
                          ? "bg-white text-[#4A2B6B] shadow-lg shadow-purple-100 transform scale-[1.02]"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span className="text-lg">📁</span>
                        <span>Upload File</span>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Video Content Based on Source */}
                {videoSource === "record" ? (
                  // Recording Section
                  <div>
                    {!recordedVideo ? (
                      <div className="text-center">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 mb-4 border border-green-100">
                          <div className="text-4xl mb-3">📹</div>
                          <h4 className="text-lg font-semibold text-[#1D1A2F] mb-2">Ready to record?</h4>
                          <p className="text-gray-600 text-sm mb-4">Show us how the garment fits</p>
                          <GradientButton
                            onClick={openRecordingModal}
                            className="px-6 py-3 text-base font-semibold rounded-full shadow-lg"
                          >
                            🎬 Start Recording
                          </GradientButton>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-4 border border-green-100">
                          <div className="text-3xl mb-2">✅</div>
                          <h4 className="text-lg font-semibold text-[#1D1A2F] mb-2">Video Recorded!</h4>
                          <p className="text-gray-600 text-sm mb-2">Duration: {formatTime(recordingTime)}</p>
                          <p className="text-gray-500 text-xs mb-4">Size: {formatFileSize(recordedVideo.size)}</p>

                          {recordedVideoUrl && (
                            <video
                              src={recordedVideoUrl}
                              controls
                              className="w-full max-w-xs mx-auto rounded-lg shadow-lg mb-4"
                              style={{ maxHeight: "200px" }}
                            />
                          )}

                          <button
                            onClick={retakeVideo}
                            className="bg-orange-500 text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-orange-600 transition-colors shadow-md"
                          >
                            🔄 Retake Video
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  // Upload Section
                  <div>
                    {!uploadedVideo ? (
                      <div className="text-center">
                        {/* Drag & Drop Zone */}
                        <div
                          className={`upload-zone bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 mb-4 border-2 cursor-pointer transition-all duration-300 ${
                            isDragOver ? "drag-over" : ""
                          }`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <div className="text-4xl mb-3">📁</div>
                          <h4 className="text-lg font-semibold text-[#1D1A2F] mb-2">Upload your video</h4>
                          <p className="text-gray-600 text-sm mb-4">Drag & drop your video here or click to browse</p>

                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*"
                            onChange={handleFileInputChange}
                            className="hidden"
                          />

                          <GradientButton className="px-6 py-3 text-base font-semibold rounded-full shadow-lg">
                            📂 Choose Video File
                          </GradientButton>

                          <p className="text-xs text-gray-500 mt-3">
                            Supported formats: MP4, WebM, MOV, AVI • Max size: 50MB
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 mb-4 border border-blue-100">
                          <div className="text-3xl mb-2">✅</div>
                          <h4 className="text-lg font-semibold text-[#1D1A2F] mb-2">Video Uploaded!</h4>
                          <p className="text-gray-600 text-sm mb-2">File: {uploadedVideo.name}</p>
                          <p className="text-gray-500 text-xs mb-4">Size: {formatFileSize(uploadedVideo.size)}</p>

                          {uploadedVideoUrl && (
                            <video
                              src={uploadedVideoUrl}
                              controls
                              className="w-full max-w-xs mx-auto rounded-lg shadow-lg mb-4"
                              style={{ maxHeight: "200px" }}
                            />
                          )}

                          <button
                            onClick={retakeVideo}
                            className="bg-orange-500 text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-orange-600 transition-colors shadow-md"
                          >
                            🔄 Choose Different File
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Continue Button */}
                {getCurrentVideo() && (
                  <div className="mt-6">
                    <GradientButton
                      onClick={() => setCurrentStep(2)}
                      className="w-full py-4 text-lg font-semibold rounded-full shadow-lg"
                    >
                      💰 Continue to earn ₹50
                    </GradientButton>
                    <p className="text-xs text-gray-500 mt-2 text-center">You are almost there! 🎉</p>
                  </div>
                )}

                {errors.video && <p className="text-red-500 text-sm mt-2 text-center">{errors.video}</p>}
              </div>
            </>
          ) : (
            <>
              {/* Step 2: Product Details Form */}
              <div className="bg-white rounded-3xl p-6 shadow-[0_4px_14px_rgba(0,0,0,0.08)]">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[#1D1A2F] font-serif">📝 Product Details</h2>
                  <button onClick={() => setCurrentStep(1)} className="text-[#4A2B6B] text-sm hover:underline">
                    ← Back to video
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Product URL */}
                  <div>
                    <label className="block text-sm font-semibold text-[#4A2B6B] mb-2">🔗 Product URL *</label>
                    <input
                      type="url"
                      placeholder="https://example.com/product-page"
                      value={formData.productUrl}
                      onChange={(e) => handleInputChange("productUrl", e.target.value)}
                      className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                        errors.productUrl ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-[#4A2B6B]"
                      } focus:outline-none`}
                    />
                    {errors.productUrl && <p className="text-red-500 text-xs mt-1">{errors.productUrl}</p>}
                    <p className="text-xs text-gray-500 mt-1">Link to the exact product page for verification</p>
                  </div>

                  {/* Brand and Size */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-[#4A2B6B] mb-2">🏷️ Brand *</label>
                      <input
                        type="text"
                        placeholder="e.g., Nike, Zara"
                        value={formData.brand}
                        onChange={(e) => handleInputChange("brand", e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                          errors.brand ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-[#4A2B6B]"
                        } focus:outline-none`}
                      />
                      {errors.brand && <p className="text-red-500 text-xs mt-1">{errors.brand}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#4A2B6B] mb-2">📏 Size *</label>
                      <input
                        type="text"
                        placeholder="e.g., M, L, 32"
                        value={formData.size}
                        onChange={(e) => handleInputChange("size", e.target.value)}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-colors text-sm ${
                          errors.size ? "border-red-300 bg-red-50" : "border-gray-200 focus:border-[#4A2B6B]"
                        } focus:outline-none`}
                      />
                      {errors.size && <p className="text-red-500 text-xs mt-1">{errors.size}</p>}
                    </div>
                  </div>

                  {/* Fit Score Slider */}
                  <div className="col-span-2">
                    <label className="block text-sm font-semibold text-[#4A2B6B] mb-3">⭐ How does it fit? *</label>

                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={formData.fitScore || 3}
                        onChange={(e) => handleInputChange("fitScore", Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                        style={{
                          background: formData.fitScore
                            ? `linear-gradient(to right, #4A2B6B 0%, #4A2B6B ${((formData.fitScore - 1) / 4) * 100}%, #e5e7eb ${((formData.fitScore - 1) / 4) * 100}%, #e5e7eb 100%)`
                            : "#e5e7eb",
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Too Tight</span>
                        <span>Tight</span>
                        <span>Perfect</span>
                        <span>Loose</span>
                        <span>Too Loose</span>
                      </div>
                    </div>

                    {formData.fitScore && (
                      <div className="mt-2 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-[#4A2B6B] text-white">
                          {formData.fitScore === 1
                            ? "😰 Too Tight"
                            : formData.fitScore === 2
                              ? "😐 Tight"
                              : formData.fitScore === 3
                                ? "😊 Perfect Fit"
                                : formData.fitScore === 4
                                  ? "😐 Loose"
                                  : "😰 Too Loose"}
                        </span>
                      </div>
                    )}

                    {errors.fitScore && <p className="text-red-500 text-xs mt-1">{errors.fitScore}</p>}
                  </div>

                  {/* Additional Comments */}
                  <div>
                    <label className="block text-sm font-semibold text-[#4A2B6B] mb-2">💭 Comments (Optional)</label>
                    <textarea
                      placeholder="Any additional thoughts about the product..."
                      value={formData.additionalComments}
                      onChange={(e) => handleInputChange("additionalComments", e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:border-[#4A2B6B] focus:outline-none resize-none text-sm"
                    />
                  </div>

                  {/* Enhanced Upload Progress */}
                  {isUploading && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                      <div className="text-center">
                        <div className="mb-4">
                          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mb-3">
                            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                          </div>
                          <h3 className="text-lg font-semibold text-purple-800 mb-2">
                            {retryAttempt > 0
                              ? `Retrying upload (attempt ${retryAttempt + 1})...`
                              : "Uploading your video..."}
                          </h3>

                          {uploadProgress ? (
                            <div className="mb-3">
                              <Progress value={uploadProgress.percentage} className="w-full mb-2" />
                              <div className="space-y-1">
                                <p className="text-sm text-purple-600 font-medium">
                                  {uploadProgress.percentage}% Complete
                                </p>
                                <div className="flex justify-center space-x-4 text-xs text-purple-500">
                                  <span>
                                    {formatFileSize(uploadProgress.uploadedBytes)} /{" "}
                                    {formatFileSize(uploadProgress.totalBytes)}
                                  </span>
                                  {uploadSpeed > 0 && <span>Speed: {formatSpeed(uploadSpeed)}</span>}
                                  {uploadETA > 0 && <span>ETA: {formatETA(uploadETA)}</span>}
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mb-3">
                              <Progress value={0} className="w-full mb-2" />
                              <p className="text-sm text-purple-600">Preparing upload...</p>
                            </div>
                          )}
                        </div>

                        <div className="bg-white rounded-lg p-4 shadow-sm">
                          <div className="flex items-center mb-2">
                            <span className="text-2xl mr-2">💡</span>
                            <span className="text-sm font-medium text-gray-700">Fashion Fact:</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed">{fashionFacts[currentFactIndex]}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Display */}
                  {submitError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-700 text-sm">{submitError}</p>
                      {retryAttempt > 0 && (
                        <p className="text-red-600 text-xs mt-1">
                          Upload will retry automatically with optimized settings.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-4">
                    <GradientButton
                      type="submit"
                      disabled={isSubmitting || isUploading || !getCurrentVideo()}
                      className="w-full py-4 text-lg font-semibold rounded-full shadow-lg"
                    >
                      {isSubmitting ? "🔄 Submitting..." : isUploading ? "⬆️ Uploading..." : "💰 Submit & Earn ₹50"}
                    </GradientButton>

                    <div className="mt-3 text-center text-xs text-gray-500">
                      <p>✅ Reviewed by our team • 💰 ₹50 after approval</p>
                      <p className="mt-1">⏱️ Upload timeout: 90 seconds • 🔄 Auto-retry on failure</p>
                    </div>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recording Modal */}
      {showRecordingModal && (
        <div className="fixed inset-0 bg-black z-50 flex flex-col">
          <div className="bg-gradient-to-r from-[#4A2B6B] to-[#6B46C1] text-white p-4 flex justify-between items-center">
            <h2 className="text-xl font-bold">🎥 Recording Your Feedback</h2>
            <button onClick={closeRecordingModal} className="text-white hover:text-gray-200 text-2xl">
              ✕
            </button>
          </div>

          <div className="flex-1 relative">
            <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />

            <div className="absolute inset-0 flex flex-col justify-between p-6">
              <div className="bg-black bg-opacity-30 rounded-xl p-4 text-white">
                <h3 className="font-semibold mb-2">💡 Recording Tips:</h3>
                <div className="text-sm space-y-1">
                  <p>• Show front, side, and back views</p>
                  <p>• Talk about fitting on different body parts, comfort and feel of material</p>
                  <p>• Keep camera steady with good lighting</p>
                </div>
              </div>

              <div className="text-center">
                <div className="bg-black bg-opacity-50 rounded-full px-6 py-3 text-white text-xl font-bold mb-4 inline-block">
                  {formatTime(recordingTime)} / 1:00
                </div>

                <div className="flex justify-center items-center space-x-6">
                  {!isRecording ? (
                    <button
                      onClick={startRecording}
                      disabled={cameraPermission !== "granted"}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-6 shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      <div className="w-8 h-8 bg-white rounded-full"></div>
                    </button>
                  ) : (
                    <button
                      onClick={stopRecording}
                      disabled={recordingTime < 10}
                      className="bg-red-500 hover:bg-red-600 text-white rounded-full p-6 shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50"
                    >
                      <div className="w-8 h-8 bg-white rounded-sm"></div>
                    </button>
                  )}
                </div>

                <div className="mt-4 text-white text-center">
                  {cameraPermission === "denied" && (
                    <p className="bg-red-500 bg-opacity-75 rounded-lg px-4 py-2">
                      Camera permission denied. Please enable camera access.
                    </p>
                  )}
                  {isRecording && recordingTime < 10 && (
                    <p className="bg-yellow-500 bg-opacity-75 rounded-lg px-4 py-2">
                      Record for at least 10 seconds (minimum required)
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
