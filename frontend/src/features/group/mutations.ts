import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"
import type { Group, CreateGroupPayload, GroupInvitation } from "./types"

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

/** POST /groups/invitations/:id/accept/ */
export function useAcceptInvitation() {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<null>, ApiError, number>({
    mutationFn: (invitationId) => api.post(`/groups/invitations/${invitationId}/accept/`, {}),
    onSuccess: () => {
      // Invalidate all group and invitation related data
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      queryClient.invalidateQueries({ queryKey: ["user-invitations"] })
    },
  })
}

/** POST /groups/invitations/:id/reject/ */
export function useRejectInvitation() {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<null>, ApiError, number>({
    mutationFn: (invitationId) => api.post(`/groups/invitations/${invitationId}/reject/`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
      queryClient.invalidateQueries({ queryKey: ["user-invitations"] })
    },
  })
}

/** POST /groups/:groupId/invite/ */
export function useInviteMember(groupId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<GroupInvitation>, ApiError, { email: string }>({
    mutationFn: (payload) => api.post<GroupInvitation>(`/groups/${groupId}/invite/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "invitations"] })
    },
  })
}
