import { toast as sonner } from "sonner"
import { ApiError } from "@/lib/api"
import { extractErrorMessage } from "@/lib/types"

// ── Durations (ms) ────────────────────────────────────────────────────────────
const DURATION = {
  short: 3000,
  default: 4000,
  long: 6000,
} as const

// ── Convenience wrappers ──────────────────────────────────────────────────────

export const toast = {
  success(message: string, description?: string) {
    sonner.success(message, { description, duration: DURATION.default, position: "bottom-center" })
  },

  error(message: string, description?: string) {
    sonner.error(message, { description, duration: DURATION.long, position: "bottom-center" })
  },

  info(message: string, description?: string) {
    sonner.info(message, { description, duration: DURATION.default, position: "bottom-center" })
  },

  warning(message: string, description?: string) {
    sonner.warning(message, { description, duration: DURATION.default, position: "bottom-center" })
  },

  /**
   * Automatically extract a human-readable message from an unknown error.
   * Handles ApiError (field errors + top-level message) and plain Error objects.
   */
  apiError(err: unknown, fallback = "Something went wrong") {
    if (err instanceof ApiError) {
      sonner.error(extractErrorMessage(err.body), { duration: DURATION.long, position: "bottom-center" })
    } else if (err instanceof Error) {
      sonner.error(err.message || fallback, { duration: DURATION.long, position: "bottom-center" })
    } else {
      sonner.error(fallback, { duration: DURATION.long, position: "bottom-center" })
    }
  },

  promise: sonner.promise,
  dismiss: sonner.dismiss,
}
