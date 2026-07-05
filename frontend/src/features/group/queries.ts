import { useQuery } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"
import type { Group, GroupMember, GroupInvitation } from "./types"

/** GET /groups/ */
export function useGroups() {
  return useQuery<ApiSuccess<Group[]>, ApiError>({
    queryKey: ["groups"],
    queryFn: () => api.get<Group[]>("/groups/"),
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}


/** GET /groups/:groupId/members/ */
export function useGroupMembers(groupId: string | undefined) {
  return useQuery<ApiSuccess<GroupMember[]>, ApiError>({
    queryKey: ["groups", groupId, "members"],
    queryFn: () => api.get<GroupMember[]>(`/groups/${groupId}/members/`),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/** GET /groups/:groupId/invitations/ */
export function useGroupInvitations(groupId: string | undefined) {
  return useQuery<ApiSuccess<GroupInvitation[]>, ApiError>({
    queryKey: ["groups", groupId, "invitations"],
    queryFn: () => api.get<GroupInvitation[]>(`/groups/${groupId}/invitations/`),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })
}

/** GET /groups/invitations/me/ */
export function useUserInvitations() {
  return useQuery<ApiSuccess<GroupInvitation[]>, ApiError>({
    queryKey: ["user-invitations"],
    queryFn: () => api.get<GroupInvitation[]>("/groups/invitations/me/"),
  })
}

/** 
 * Optimized hook to get a complete group context
 */
export function useGroupDetail(groupId: string | undefined) {
  const groupQuery = useQuery<ApiSuccess<Group>, ApiError>({
    queryKey: ["groups", groupId],
    queryFn: () => api.get<Group>(`/groups/${groupId}/`),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  })


  const membersQuery = useGroupMembers(groupId)
  const invitationsQuery = useGroupInvitations(groupId)

  return {
    group: groupQuery.data?.data,
    members: membersQuery.data?.data || [],
    invitations: invitationsQuery.data?.data || [],
    isLoading: groupQuery.isLoading || membersQuery.isLoading || invitationsQuery.isLoading,
    queries: {
      group: groupQuery,
      members: membersQuery,
      invitations: invitationsQuery
    }
  }
}

/** GET /expenses/groups/:groupId/chat/history/ */
export function useGroupAIChatHistory(groupId: string | undefined) {
  return useQuery<ApiSuccess<import('./types').AIChatMessage[]>, ApiError>({
    queryKey: ["groups", groupId, "ai-chat"],
    queryFn: () => api.get<import('./types').AIChatMessage[]>(`/expenses/groups/${groupId}/chat/history/`),
    enabled: !!groupId,
    staleTime: 0,
  })
}


