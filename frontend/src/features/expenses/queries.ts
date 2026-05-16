import { useQuery } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"
import type { ActivityItem, Expense, Settlement, GroupBalance, GroupBalancesResponse } from "./types"

export function useGroupActivities(groupId: string | undefined) {
  return useQuery<ApiSuccess<ActivityItem[]>, ApiError>({
    queryKey: ["groups", groupId, "activities"],
    queryFn: () => api.get<ActivityItem[]>(`/expenses/groups/${groupId}/activities/`),
    enabled: !!groupId,
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
  })
}
