"use client"

import type React from "react"

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: React.ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden flex flex-col items-center bg-[#F5EFE6]">
      <style jsx>{`
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
      `}</style>
      <div className="w-full max-w-md mx-auto h-full flex flex-col relative">
        {/* Purple gradient header with satin effects */}
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
            <h1 className="text-3xl font-bold font-serif mb-2">{title}</h1>
            <p className="text-sm opacity-90">Try-on clothes. Earn real money</p>
          </div>
        </div>

        {/* Overlapping content card */}
        <div
          className="flex-1 px-6 py-8 flex flex-col rounded-3xl relative z-10 fadeIn"
          style={{
            backgroundColor: "#FFFAF2",
            marginTop: "-5%",
            boxShadow: "0 -10px 30px rgba(0, 0, 0, 0.1), 0 4px 20px rgba(0, 0, 0, 0.05)",
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}

export default AuthLayout
