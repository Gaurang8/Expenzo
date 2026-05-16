import { useMutation } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"

// ── Request payload ───────────────────────────────────────────────────────────

export interface RegisterPayload {
  full_name: string
  email: string
  password: string
}

// ── Response data (mirrors UserSerializer) ────────────────────────────────────

export interface RegisterData {
  id: number
  email: string
  full_name: string
}

// ── Mutation hook ─────────────────────────────────────────────────────────────

/** POST /accounts/register/ */
export function useRegister() {
  return useMutation<ApiSuccess<RegisterData>, ApiError, RegisterPayload>({
    mutationFn: (payload) =>
      api.post<RegisterData>("/accounts/register/", payload),
  })
}
