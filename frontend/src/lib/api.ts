import type { ApiSuccess, ApiErrorBody } from "@/lib/types"

const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api"

export class ApiError extends Error {
  readonly status: number
  readonly body: ApiErrorBody

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = "ApiError"
    this.status = status
    this.body = body
  }
}

async function request<T>(
  path: string,
  options?: RequestInit,
): Promise<ApiSuccess<T>> {
  const url = `${BASE_URL}${path}`
  const token = localStorage.getItem("access_token")

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })

  const json = await res.json().catch(() => null)

  if (!res.ok) {
    const errorBody: ApiErrorBody = {
      success: false,
      message: json?.message ?? "Something went wrong",
      errors: json?.errors ?? null,
    }
    throw new ApiError(res.status, errorBody)
  }

  return json as ApiSuccess<T>
}

export const api = {
  post<T>(path: string, body: unknown, options?: RequestInit) {
    return request<T>(path, {
      method: "POST",
      body: JSON.stringify(body),
      ...options,
    })
  },

  get<T>(path: string, options?: RequestInit) {
    return request<T>(path, { method: "GET", ...options })
  },

  patch<T>(path: string, body: unknown, options?: RequestInit) {
    return request<T>(path, {
      method: "PATCH",
      body: JSON.stringify(body),
      ...options,
    })
  },

  put<T>(path: string, body: unknown, options?: RequestInit) {
    return request<T>(path, {
      method: "PUT",
      body: JSON.stringify(body),
      ...options,
    })
  },

  delete<T>(path: string, options?: RequestInit) {
    return request<T>(path, { method: "DELETE", ...options })
  },
}
