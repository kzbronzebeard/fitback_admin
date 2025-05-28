import type React from "react"
import { AuthProvider } from "@/app/context/auth-context"

interface Props {
  children: React.ReactNode
}

const ClientLayout = ({ children }: Props) => {
  return <AuthProvider>{children}</AuthProvider>
}

export default ClientLayout
