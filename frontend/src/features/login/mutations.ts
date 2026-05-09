import { useMutation } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"

// ── Login Payload ────────────────────────────────────────────────────────────

export interface LoginPayload {
  email: string
  password: string
}

// ── Login Data (mirrors backend response) ───────────────────────────────────

export interface LoginData {
  access: string
  refresh: string
  user: {
    id: string
    email: string
    full_name: string
  }
}

// ── Mutation hook ─────────────────────────────────────────────────────────────

/** POST /accounts/login/ */
export function useLogin() {
  return useMutation<ApiSuccess<LoginData>, ApiError, LoginPayload>({
    mutationFn: (payload) =>
      api.post<LoginData>("/accounts/login/", payload),
  })
}
