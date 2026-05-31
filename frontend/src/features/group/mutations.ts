import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"
import type { Group, CreateGroupPayload, GroupInvitation } from "./types"

/** POST /groups/ */
export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<Group>, ApiError, FormData | CreateGroupPayload>({
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

/** DELETE /groups/members/:memberId/remove/ */
export function useRemoveMember(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<null>, ApiError, number>({
    mutationFn: (memberId) => api.delete(`/groups/members/${memberId}/remove/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "members"] })
      // queryClient.invalidateQueries({ queryKey: ["groups"], exact: true })
    },
  })
}

/** POST /groups/:groupId/leave/ */
export function useLeaveGroup(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<null>, ApiError, void>({
    mutationFn: () => api.post(`/groups/${groupId}/leave/`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups"] })
    },
  })
}

/** POST /groups/:groupId/transfer-ownership/ */
export function useTransferOwnership(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<null>, ApiError, { user_id: number }>({
    mutationFn: (payload) => api.post(`/groups/${groupId}/transfer-ownership/`, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "members"] })
      queryClient.invalidateQueries({ queryKey: ["groups"] })
    },
  })
}

/** PATCH /groups/members/:memberId/role/ */
export function useUpdateMemberRole(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<null>, ApiError, { memberId: number, role: 'admin' | 'member' }>({
    mutationFn: ({ memberId, role }) => api.patch(`/groups/members/${memberId}/role/`, { role }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["groups", groupId, "members"] })
      queryClient.invalidateQueries({ queryKey: ["groups"] })
    },
  })
}
/** PATCH /groups/:groupId/ */
export function useUpdateGroup(groupId: string) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<Group>, ApiError, FormData | Partial<CreateGroupPayload>>({
    mutationFn: (payload) => api.patch<Group>(`/groups/${groupId}/`, payload),
    onSuccess: () => {
      // Surgically invalidate only the group metadata, not members/invitations/etc.
      queryClient.invalidateQueries({ queryKey: ["groups", groupId], exact: true })
      // Also refresh the sidebar list entry
      queryClient.invalidateQueries({ queryKey: ["groups"], exact: true })
    },

  })
}

/**
 * Optimized hook to get all mutations for a group
 */
export function useGroupMutations(groupId: string) {
  const updateGroup = useUpdateGroup(groupId)
  const inviteMember = useInviteMember(groupId)
  const removeMember = useRemoveMember(groupId)
  const leaveGroup = useLeaveGroup(groupId)
  const transferOwnership = useTransferOwnership(groupId)
  const updateMemberRole = useUpdateMemberRole(groupId)

  return {
    updateGroup,
    inviteMember,
    removeMember,
    leaveGroup,
    transferOwnership,
    updateMemberRole
  }
}

