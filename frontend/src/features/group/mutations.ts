import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"
import type { Group, CreateGroupPayload } from "./types"

/** POST /groups/ */
export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<Group>, ApiError, CreateGroupPayload>({
    mutationFn: (payload) => api.post<Group>("/groups/", payload),
    onSuccess: () => {
      // Invalidate and refetch groups list
      queryClient.invalidateQueries({ queryKey: ["groups"] })
    },
  })
}
