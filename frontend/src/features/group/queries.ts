import { useQuery } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"
import type { Group } from "./types"

/** GET /groups/ */
export function useGroups() {
  return useQuery<ApiSuccess<Group[]>, ApiError>({
    queryKey: ["groups"],
    queryFn: () => api.get<Group[]>("/groups/"),
  })
}
