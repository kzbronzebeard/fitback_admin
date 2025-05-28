import { type NextRequest, NextResponse } from "next/server"
import { captureError, ErrorSeverity } from "@/app/utils/monitoring"

// Define log levels
enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

// Define log entry structure
interface LogEntry {
  level: LogLevel
  message: string
  timestamp?: string
  context?: Record<string, any>
}

// POST /api/logging - Client-side logging endpoint
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse log data from request
    const logData: LogEntry = await request.json()

    // Ensure required fields are present
    if (!logData.level || !logData.message) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    // Add timestamp if not provided
    if (!logData.timestamp) {
      logData.timestamp = new Date().toISOString()
    }

    // Process log based on level
    switch (logData.level) {
      case LogLevel.ERROR:
        captureError(logData.message, logData.context || {}, ErrorSeverity.ERROR)
        console.error(`[CLIENT LOG] ${logData.message}`, logData.context)
        break
      case LogLevel.WARN:
        captureError(logData.message, logData.context || {}, ErrorSeverity.WARNING)
        console.warn(`[CLIENT LOG] ${logData.message}`, logData.context)
        break
      case LogLevel.INFO:
        console.info(`[CLIENT LOG] ${logData.message}`, logData.context)
        break
      case LogLevel.DEBUG:
        console.debug(`[CLIENT LOG] ${logData.message}`, logData.context)
        break
      default:
        console.log(`[CLIENT LOG] ${logData.message}`, logData.context)
    }

    // In production, this would store logs in a database or send to a logging service

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error processing log:", error)
    return NextResponse.json({ success: false, error: "Failed to process log" }, { status: 500 })
  }
}
