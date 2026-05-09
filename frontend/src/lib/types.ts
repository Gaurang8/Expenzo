// ─────────────────────────────────────────────────────────────────────────────
// Canonical API envelope types
// Mirrors: backend/apps/common/responses.py  &  exceptions.py  &  pagination.py
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Every successful response from the backend looks like:
 * { success: true, message: string, data: T }
 */
export interface ApiSuccess<T = unknown> {
  success: true
  message: string
  data: T
}

/**
 * DRF validation errors are keyed by field name → array of error strings.
 * Non-field errors land under the "__all__" or "non_field_errors" key.
 *
 * { email: ["This field is required."], password: ["Too short."] }
 */
export type FieldErrors = Record<string, string[]>

/**
 * Every error response from the backend (custom_exception_handler) looks like:
 * { success: false, message: string, errors: FieldErrors | string | null }
 */
export interface ApiErrorBody {
  success: false
  message: string
  errors: FieldErrors | string | null
}

/**
 * Paginated data block inside ApiSuccess<PaginatedData<T>>
 * Mirrors: backend/apps/common/pagination.py → CustomPagination
 */
export interface PaginatedData<T = unknown> {
  count: number
  page: number
  limit: number
  total_pages: number
  has_next: boolean
  has_previous: boolean
  results: T[]
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience aliases
// ─────────────────────────────────────────────────────────────────────────────

/** A paginated success response */
export type PaginatedResponse<T> = ApiSuccess<PaginatedData<T>>

/**
 * Extract the first human-readable error string from an ApiErrorBody.
 * Priority: first field error → top-level message.
 */
export function extractErrorMessage(body: ApiErrorBody): string {
  if (typeof body.errors === "string") return body.errors

  if (body.errors && typeof body.errors === "object") {
    const firstKey = Object.keys(body.errors)[0]
    if (firstKey) {
      const msgs = body.errors[firstKey]
      return msgs[0] ?? body.message
    }
  }

  return body.message
}

/**
 * Extract per-field error messages as a flat Record<fieldName, string>
 * so react-hook-form's setError() can consume them directly.
 */
export function extractFieldErrors(
  body: ApiErrorBody,
): Record<string, string> {
  if (!body.errors || typeof body.errors !== "object") return {}

  return Object.fromEntries(
    Object.entries(body.errors).map(([field, msgs]) => [field, msgs[0] ?? ""]),
  )
}
