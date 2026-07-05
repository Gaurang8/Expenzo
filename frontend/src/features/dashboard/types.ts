export interface DashboardWidget {
  id: string
  title: string
  type: "bar" | "pie" | "donut" | "table" | "summary" | "list"
  column_span: number
  data: Record<string, unknown>[]
  description?: string
}

export interface DashboardResponse {
  title: string
  widgets: DashboardWidget[]
}

export interface DashboardHistoryItem {
  id: number
  prompt: string
  dashboard_data: DashboardResponse
  created_at: string
}
