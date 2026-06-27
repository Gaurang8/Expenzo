import { useQuery, useInfiniteQuery } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess, PaginatedData } from "@/lib/types"
import type { ActivityItem, Expense, Settlement, GroupBalancesResponse, Category } from "./types"


export function useGroupActivities(groupId: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["groups", groupId, "activities"],
    queryFn: async ({ pageParam = 1 }) => {
      return api.get<PaginatedData<ActivityItem>>(`/expenses/groups/${groupId}/activities/?page=${pageParam}`)
    },
    getNextPageParam: (lastPage) => lastPage.data.has_next ? lastPage.data.page + 1 : undefined,
    initialPageParam: 1,
    enabled: !!groupId,
    staleTime: 30 * 1000,
  })
}

export type ActivityPaginatedData = PaginatedData<ActivityItem> & { available_months?: string[] }

export function useUserActivities(monthFilter?: string) {
  return useInfiniteQuery({
    queryKey: ["user", "activities", monthFilter],
    queryFn: async ({ pageParam = 1 }) => {
      const url = monthFilter && monthFilter !== "All Time" 
        ? `/expenses/activities/?page=${pageParam}&month=${encodeURIComponent(monthFilter)}`
        : `/expenses/activities/?page=${pageParam}`
      return api.get<ActivityPaginatedData>(url)
    },
    getNextPageParam: (lastPage) => lastPage.data.has_next ? lastPage.data.page + 1 : undefined,
    initialPageParam: 1,
    staleTime: 30 * 1000,
  })
}


/** GET /expenses/:expenseId/ */
export function useExpenseDetail(expenseId: string | undefined) {
  return useQuery<ApiSuccess<Expense>, ApiError>({
    queryKey: ["expenses", expenseId],
    queryFn: () => api.get<Expense>(`/expenses/${expenseId}/`),
    enabled: !!expenseId,
  })
}

/** GET /expenses/settlements/:settlementId/ */
export function useSettlementDetail(settlementId: string | undefined) {
  return useQuery<ApiSuccess<Settlement>, ApiError>({
    queryKey: ["settlements", settlementId],
    queryFn: () => api.get<Settlement>(`/expenses/settlements/${settlementId}/`),
    enabled: !!settlementId,
  })
}
export function useGroupBalances(groupId: string | undefined) {
  return useQuery<ApiSuccess<GroupBalancesResponse>, ApiError>({
    queryKey: ["groups", groupId, "balances"],
    queryFn: () => api.get<GroupBalancesResponse>(`/expenses/groups/${groupId}/balances/`),
    enabled: !!groupId,
    staleTime: 30 * 1000, // 30 seconds
  })
}
export function useCategories() {
  return useQuery<ApiSuccess<Category[]>, ApiError>({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>(`/expenses/categories/`),
    staleTime: 5 * 60 * 1000,
  })
}
