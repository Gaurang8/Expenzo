import { useQuery } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess, PaginatedData } from "@/lib/types"
import type { 
  AdminDashboardData,
  AdminUser, 
  AdminGroup, 
  AdminExpense, 
  AdminSettlement, 
  AdminCategory,
  PlatformSettings
} from "./types"

export function useAdminDashboard() {
  return useQuery<ApiSuccess<AdminDashboardData>, ApiError>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api.get<AdminDashboardData>(`/admin/dashboard/`),
    staleTime: 5 * 60 * 1000,
  })
}

export function useAdminUsers(queryParams: string) {
  return useQuery<ApiSuccess<PaginatedData<AdminUser>>, ApiError>({
    queryKey: ["admin", "users", queryParams],
    queryFn: () => api.get<PaginatedData<AdminUser>>(`/admin/users/?${queryParams}`),
    staleTime: 30 * 1000,
  })
}

export function useAdminGroups(queryParams: string) {
  return useQuery<ApiSuccess<PaginatedData<AdminGroup>>, ApiError>({
    queryKey: ["admin", "groups", queryParams],
    queryFn: () => api.get<PaginatedData<AdminGroup>>(`/admin/groups/?${queryParams}`),
    staleTime: 30 * 1000,
  })
}

export function useAdminExpenses(queryParams: string) {
  return useQuery<ApiSuccess<PaginatedData<AdminExpense>>, ApiError>({
    queryKey: ["admin", "expenses", queryParams],
    queryFn: () => api.get<PaginatedData<AdminExpense>>(`/admin/expenses/?${queryParams}`),
    staleTime: 30 * 1000,
  })
}

export function useAdminSettlements(queryParams: string) {
  return useQuery<ApiSuccess<PaginatedData<AdminSettlement>>, ApiError>({
    queryKey: ["admin", "settlements", queryParams],
    queryFn: () => api.get<PaginatedData<AdminSettlement>>(`/admin/settlements/?${queryParams}`),
    staleTime: 30 * 1000,
  })
}

export function useAdminCategories(queryParams: string) {
  return useQuery<ApiSuccess<PaginatedData<AdminCategory>>, ApiError>({
    queryKey: ["admin", "categories", queryParams],
    queryFn: () => api.get<PaginatedData<AdminCategory>>(`/admin/categories/?${queryParams}`),
    staleTime: 30 * 1000,
  })
}

export function useAdminPlatformSettings() {
  return useQuery<ApiSuccess<PlatformSettings>, ApiError>({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<PlatformSettings>(`/admin/settings/`),
    staleTime: 5 * 60 * 1000,
  })
}
