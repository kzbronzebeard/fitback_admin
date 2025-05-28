/**
 * Analytics tracking utilities
 */

// Event categories
export enum EventCategory {
  NAVIGATION = "navigation",
  ENGAGEMENT = "engagement",
  CONVERSION = "conversion",
  ERROR = "error",
  FEEDBACK = "feedback",
}

// User properties interface
interface UserProperties {
  userId?: string
  userAgent?: string
  referrer?: string
  [key: string]: any
}

// Event properties interface
interface EventProperties {
  category: EventCategory
  label?: string
  value?: number
  [key: string]: any
}

// Initialize analytics
let isAnalyticsInitialized = false
let userProps: UserProperties = {}

// Initialize analytics tracking
export function initAnalytics(initialUserProps: UserProperties = {}) {
  if (isAnalyticsInitialized) return

  // Set initial user properties
  userProps = {
    ...initialUserProps,
    userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
    referrer: typeof document !== "undefined" ? document.referrer : "",
    timestamp: new Date().toISOString(),
  }

  // In production, this would initialize a real analytics service
  console.log("[Analytics] Initialized with user properties:", userProps)

  // Track page views
  if (typeof window !== "undefined") {
    // Track initial page view
    trackPageView()

    // Set up navigation tracking
    const originalPushState = history.pushState
    history.pushState = (state, title, url) => {
      originalPushState.call(history, state, title, url)
      trackPageView()
    }

    window.addEventListener("popstate", trackPageView)
  }

  isAnalyticsInitialized = true
}

// Track page views
export function trackPageView() {
  if (typeof window === "undefined") return

  const pageData = {
    path: window.location.pathname,
    url: window.location.href,
    title: document.title,
    referrer: document.referrer,
    timestamp: new Date().toISOString(),
  }

  // In production, this would send data to a real analytics service
  console.log("[Analytics] Page View:", pageData)
}

// Track events
export function trackEvent(eventName: string, properties: EventProperties) {
  if (!isAnalyticsInitialized) {
    initAnalytics()
  }

  const eventData = {
    event: eventName,
    ...properties,
    timestamp: new Date().toISOString(),
  }

  // In production, this would send data to a real analytics service
  console.log("[Analytics] Event:", eventData)
}

// Update user properties
export function updateUserProperties(properties: UserProperties) {
  userProps = {
    ...userProps,
    ...properties,
    updated_at: new Date().toISOString(),
  }

  // In production, this would update user properties in a real analytics service
  console.log("[Analytics] Updated user properties:", properties)
}

// Track feedback submission
export function trackFeedbackSubmission(feedbackId: string, properties: Record<string, any> = {}) {
  trackEvent("feedback_submitted", {
    category: EventCategory.CONVERSION,
    feedbackId,
    ...properties,
  })
}

// Track errors
export function trackError(errorMessage: string, properties: Record<string, any> = {}) {
  trackEvent("error_occurred", {
    category: EventCategory.ERROR,
    errorMessage,
    ...properties,
  })
}
