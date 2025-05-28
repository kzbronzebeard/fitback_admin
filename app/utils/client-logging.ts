/**
 * Client-side logging utilities
 */

// Define log levels
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
}

// Log context interface
interface LogContext {
  userId?: string
  path?: string
  component?: string
  [key: string]: any
}

// Send log to server
async function sendLogToServer(level: LogLevel, message: string, context: LogContext = {}) {
  try {
    // Add current path to context if available
    if (typeof window !== "undefined" && !context.path) {
      context.path = window.location.pathname
    }

    // Prepare log data
    const logData = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
    }

    // Send log to server endpoint
    await fetch("/api/logging", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(logData),
    })
  } catch (error) {
    // Fall back to console if server logging fails
    console.error("Failed to send log to server:", error)
    console[level](`[LOG] ${message}`, context)
  }
}

// Debug log
export function logDebug(message: string, context: LogContext = {}) {
  // Log to console in development
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[DEBUG] ${message}`, context)
  }

  // Send to server in production
  if (process.env.NODE_ENV === "production") {
    sendLogToServer(LogLevel.DEBUG, message, context)
  }
}

// Info log
export function logInfo(message: string, context: LogContext = {}) {
  console.info(`[INFO] ${message}`, context)
  sendLogToServer(LogLevel.INFO, message, context)
}

// Warning log
export function logWarn(message: string, context: LogContext = {}) {
  console.warn(`[WARN] ${message}`, context)
  sendLogToServer(LogLevel.WARN, message, context)
}

// Error log
export function logError(message: string, context: LogContext = {}) {
  console.error(`[ERROR] ${message}`, context)
  sendLogToServer(LogLevel.ERROR, message, context)
}

// Log performance metrics
export function logPerformance(metricName: string, durationMs: number, context: LogContext = {}) {
  const message = `Performance: ${metricName} took ${durationMs}ms`

  // Log to console
  console.info(message, context)

  // Send to server with performance context
  sendLogToServer(LogLevel.INFO, message, {
    ...context,
    metricType: "performance",
    durationMs,
  })
}
