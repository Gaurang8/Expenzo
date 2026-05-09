import React, { useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useAuthStore } from "@/store/auth-store"
import { useMe } from "@/features/auth/queries"
import { toast } from "@/lib/toast"
import { ROUTES } from "@/lib/routes"

const PUBLIC_ROUTES = [ROUTES.LOGIN, ROUTES.REGISTER]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, logout, isLoading, setLoading } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const token = localStorage.getItem("access_token")

  const isPublicRoute = (PUBLIC_ROUTES as string[]).includes(location.pathname)

  const { data, isError, isSuccess } = useMe({
    enabled: !!token,
  })

  useEffect(() => {
    if (!token) {
      if (!isPublicRoute) {
        setLoading(false)
        navigate(ROUTES.LOGIN)
      } else {
        setLoading(false)
      }
      return
    }

    if (isSuccess && data) {
      setUser(data.data)
    }

    if (isError) {
      logout()
      if (!isPublicRoute) {
        toast.error("Session expired. Please login again.")
        navigate(ROUTES.LOGIN)
      }
    }
  }, [token, data, isSuccess, isError, isPublicRoute, setUser, logout, navigate, setLoading])

  // Show nothing or a loading spinner while checking auth on private routes
  if (isLoading && !isPublicRoute && token) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  return <>{children}</>
}
