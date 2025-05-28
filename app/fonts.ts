import { DM_Serif_Display, Inter } from "next/font/google"

export const dmSerifDisplay = DM_Serif_Display({
  weight: ["400"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-serif",
})

export const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})
