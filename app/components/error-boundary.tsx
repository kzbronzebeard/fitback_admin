"use client"

import type React from "react"
import { Component, type ErrorInfo, type ReactNode } from "react"
import { captureError, ErrorSeverity } from "@/app/utils/monitoring"

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  component?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to our error tracking system
    captureError(
      error,
      {
        component: this.props.component || "unknown",
        additionalData: {
          componentStack: errorInfo.componentStack,
        },
      },
      ErrorSeverity.ERROR,
    )

    // Call the onError prop if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      // Render fallback UI if provided, otherwise render a default error message
      return (
        this.props.fallback || (
          <div className="p-6 rounded-lg bg-red-50 border border-red-200">
            <h2 className="text-xl font-semibold text-red-800 mb-2">Something went wrong</h2>
            <p className="text-red-600 mb-4">
              We've logged this error and will look into it. Please try refreshing the page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Refresh Page
            </button>
          </div>
        )
      )
    }

    return this.props.children
  }
}

// Higher-order component for wrapping components with error boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ErrorBoundaryProps, "children"> = {},
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  )

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || "Component"
  WithErrorBoundary.displayName = `WithErrorBoundary(${displayName})`

  return WithErrorBoundary
}
