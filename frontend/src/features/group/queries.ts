import { useQuery } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"
import type { Group, GroupMember, GroupInvitation } from "./types"

/** GET /groups/ */
export function useGroups() {
  return useQuery<ApiSuccess<Group[]>, ApiError>({
    queryKey: ["groups"],
    queryFn: () => api.get<Group[]>("/groups/"),
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
