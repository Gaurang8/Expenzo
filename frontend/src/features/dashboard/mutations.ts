import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { DashboardResponse } from "./types"

export const useGenerateDashboard = () => {
  return useMutation({
    mutationFn: async (prompt: string) => {
      const res = await api.post<DashboardResponse>("/expenses/dashboard/generate/", { prompt })
      return res.data
    },
  })
}

export const useSaveDashboard = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload: { prompt: string; dashboard_data: DashboardResponse }) => {
      const res = await api.post("/expenses/dashboard/history/", payload)
      return res.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboardHistory"] })
    },
  })
}
