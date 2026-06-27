import { create } from "zustand"
import { queryClient } from "@/providers/query-client"

export interface User {
  id: number
  email: string
  full_name: string
  date_format?: string
  avatar?: string | null
  is_staff?: boolean
  is_superuser?: boolean
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (isLoading: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  logout: () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("refresh_token")
    queryClient.clear()
    set({ user: null, isAuthenticated: false, isLoading: false })
  },
}))


