import { useQuery } from "@tanstack/react-query"
import { api } from "@/lib/api"
import type { DashboardHistoryItem } from "./types"

export const useDashboardHistory = () => {
  return useQuery({
    queryKey: ["dashboardHistory"],
    queryFn: async () => {
      const res = await api.get<DashboardHistoryItem[]>("/expenses/dashboard/history/")
      return res.data
    },
  })
}
