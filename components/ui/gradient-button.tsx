import * as React from "react"
import { cn } from "@/lib/utils"
import { Button, type ButtonProps } from "@/components/ui/button"

export interface GradientButtonProps extends ButtonProps {}

const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <Button
        className={cn(
          "bg-gradient-to-r from-[#7E5BEF] to-[#5E3DCB] hover:from-[#8F6CF0] hover:to-[#6F4EDB] text-white shadow-md relative overflow-hidden",
          "before:content-[''] before:absolute before:inset-0 before:bg-[linear-gradient(90deg,rgba(255,255,255,0.03),rgba(255,255,255,0.15),rgba(255,255,255,0.03))] before:bg-[length:200%_100%] before:animate-[shine_2s_ease-in-out_infinite] before:mix-blend-overlay",
          "after:content-[''] after:absolute after:inset-0 after:bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiPjwvcmVjdD4KPHBhdGggZD0iTTAgNUw1IDBaTTYgNEw0IDZaTS0xIDFMMSAtMVoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9IjAuMDMiIHN0cm9rZS13aWR0aD0iMC41Ij48L3BhdGg+Cjwvc3ZnPg==')] after:opacity-20 after:mix-blend-overlay",
          "disabled:opacity-50 disabled:cursor-not-allowed disabled:before:animate-none disabled:hover:from-[#7E5BEF] disabled:hover:to-[#5E3DCB]",
          className,
        )}
        ref={ref}
        {...props}
      >
        {children}
      </Button>
    )
  },
)
GradientButton.displayName = "GradientButton"

// Add keyframes for the shine animation
if (typeof document !== "undefined") {
  const style = document.createElement("style")
  style.textContent = `
    @keyframes shine {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `
  document.head.appendChild(style)
}

export { GradientButton }
