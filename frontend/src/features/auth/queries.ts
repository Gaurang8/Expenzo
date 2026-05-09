import { useQuery } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"
import type { User } from "@/store/auth-store"

/** GET /accounts/me/ */
export function useMe(options?: { enabled?: boolean }) {
  return useQuery<ApiSuccess<User>, ApiError>({
    queryKey: ["me"],
    queryFn: () => api.get<User>("/accounts/me/"),
    ...options,
  })
}
