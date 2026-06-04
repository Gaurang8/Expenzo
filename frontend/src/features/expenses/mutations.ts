import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"
import type { CreateExpensePayload, Expense, CreateSettlementPayload, Settlement, Category } from "./types"

export function useCreateExpense(groupId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<Expense>, ApiError, CreateExpensePayload>({
    mutationFn: (data) => {
      if (!groupId) throw new Error("Group ID is required")
      return api.post<Expense>(`/expenses/groups/${groupId}/create/`, data)
    },
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "activities"] })
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "balances"] })
      }
    },
  })
}

/** POST /expenses/groups/:groupId/settlements/create/ */
export function useCreateSettlement(groupId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<Settlement>, ApiError, CreateSettlementPayload>({
    mutationFn: (data) => {
      if (!groupId) throw new Error("Group ID is required")
      return api.post<Settlement>(`/expenses/groups/${groupId}/settlements/create/`, data)
    },
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "activities"] })
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "balances"] })
      }
    },
  })
}

export function useDeleteExpense(groupId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<null>, ApiError, number>({
    mutationFn: (id) => api.delete<null>(`/expenses/${id}/`),
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "activities"] })
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "balances"] })
      }
    },
  })
}

export function useDeleteSettlement(groupId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<null>, ApiError, number>({
    mutationFn: (id) => api.delete<null>(`/expenses/settlements/${id}/`),
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "activities"] })
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "balances"] })
      }
    },
  })
}

export function useUpdateExpense(groupId: string | undefined, expenseId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<Expense>, ApiError, CreateExpensePayload>({
    mutationFn: (data) => {
      if (!expenseId) throw new Error("Expense ID is required")
      return api.patch<Expense>(`/expenses/${expenseId}/`, data)
    },
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "activities"] })
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "balances"] })
      }
      if (expenseId) {
        queryClient.invalidateQueries({ queryKey: ["expenses", expenseId] })
      }
    },
  })
}

export function useUpdateSettlement(groupId: string | undefined, settlementId: string | undefined) {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<Settlement>, ApiError, CreateSettlementPayload>({
    mutationFn: (data) => {
      if (!settlementId) throw new Error("Settlement ID is required")
      return api.patch<Settlement>(`/expenses/settlements/${settlementId}/`, data)
    },
    onSuccess: () => {
      if (groupId) {
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "activities"] })
        queryClient.invalidateQueries({ queryKey: ["groups", groupId, "balances"] })
      }
      if (settlementId) {
        queryClient.invalidateQueries({ queryKey: ["settlements", settlementId] })
      }
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()

  return useMutation<ApiSuccess<Category>, ApiError, { name: string; icon: string }>({
    mutationFn: (data) => api.post<Category>("/expenses/categories/", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] })
    },
  })
}

