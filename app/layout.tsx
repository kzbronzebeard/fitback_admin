import type React from "react"
import "./globals.css"
import ClientLayout from "./client-layout"
import { dmSerifDisplay, inter } from "./fonts"

export const metadata = {
  title: "Fitback",
  description: "Try on clothes. Earn real rewards.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://fitback.app"),
  openGraph: {
    title: "Fitback",
    description: "Try on clothes. Earn real rewards.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Fitback",
    locale: "en_US",
    type: "website",
  },
    generator: 'v0.dev'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${dmSerifDisplay.variable} ${inter.variable}`}>
      <head>
        {/* Preload critical assets */}
        <link rel="preload" href="/fitback_welcome_illustration_mirror2.png" as="image" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  )
}
