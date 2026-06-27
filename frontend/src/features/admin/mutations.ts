import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import { toast } from "sonner"
import { extractErrorMessage } from "@/lib/types"
import type { AdminUser, AdminGroup, AdminCategory } from "./types"

export function useEditAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminUser> }) =>
      api.patch(`/admin/users/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success("User updated successfully")
    },
    onError: (error: ApiError) => toast.error(extractErrorMessage(error.body)),
  })
}

export function useDeleteAdminUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/users/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success("User deleted successfully")
    },
    onError: (error: ApiError) => toast.error(extractErrorMessage(error.body)),
  })
}

export function useToggleUserActive() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post(`/admin/users/${id}/toggle-active/`, {}),
    onSuccess: (res: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success(res.message || "User status updated")
    },
    onError: (error: ApiError) => toast.error(extractErrorMessage(error.body)),
  })
}

export function useToggleUserStaff() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.post(`/admin/users/${id}/toggle-staff/`, {}),
    onSuccess: (res: { message?: string }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] })
      toast.success(res.message || "User role updated")
    },
    onError: (error: ApiError) => toast.error(extractErrorMessage(error.body)),
  })
}

export function useEditAdminGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminGroup> }) =>
      api.patch(`/admin/groups/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] })
      toast.success("Group updated successfully")
    },
    onError: (error: ApiError) => toast.error(extractErrorMessage(error.body)),
  })
}

export function useDeleteAdminGroup() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/groups/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "groups"] })
      toast.success("Group deleted successfully")
    },
    onError: (error: ApiError) => toast.error(extractErrorMessage(error.body)),
  })
}

export function useDeleteAdminExpense() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/expenses/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "expenses"] })
      toast.success("Expense deleted successfully")
    },
    onError: (error: ApiError) => toast.error(extractErrorMessage(error.body)),
  })
}

export function useDeleteAdminSettlement() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/settlements/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "settlements"] })
      toast.success("Settlement deleted successfully")
    },
    onError: (error: ApiError) => toast.error(extractErrorMessage(error.body)),
  })
}

export function useCreateAdminCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: Partial<AdminCategory>) => api.post(`/admin/categories/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      toast.success("Category created successfully")
    },
    onError: (error: ApiError) => toast.error(extractErrorMessage(error.body)),
  })
}

export function useEditAdminCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<AdminCategory> }) =>
      api.patch(`/admin/categories/${id}/`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      toast.success("Category updated successfully")
    },
    onError: (error: ApiError) => toast.error(extractErrorMessage(error.body)),
  })
}

export function useDeleteAdminCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/admin/categories/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] })
      toast.success("Category deleted successfully")
    },
    onError: (error: ApiError) => toast.error(extractErrorMessage(error.body)),
  })
}
