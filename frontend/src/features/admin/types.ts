export interface AdminUser {
  id: number
  email: string
  full_name: string
  avatar: string | null
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  created_at: string
  groups_count: number
  expenses_count: number
  unsettled_amount: string
}

export interface AdminGroup {
  id: number
  name: string
  description: string
  avatar: string | null
  created_at: string
  members_count: number
  expenses_count: number
  total_spent: string
  created_by: number
  created_by_info: { id: number; name: string; email: string } | null
}

export interface AdminExpense {
  id: number
  title: string
  total_amount: string
  currency: string
  split_type: string
  expense_date: string
  created_at: string
  group: number
  group_name: string
  category: number | null
  category_name: string | null
  created_by_info: { id: number; name: string; email: string } | null
}

export interface AdminSettlement {
  id: number
  amount: string
  settled_at: string
  created_at: string
  group: number
  group_name: string
  paid_by_info: { id: number; name: string; email: string } | null
  paid_to_info: { id: number; name: string; email: string } | null
}

export interface AdminCategory {
  id: number
  name: string
  icon: string
  is_default: boolean
  created_at: string
  expenses_count: number
  created_by_info: { id: number; name: string; email: string } | null
}

export interface AdminDashboardKPIs {
  total_users: number
  total_groups: number
  total_expenses: string
  total_settlements: string
}

export interface GrowthDataPoint {
  month: string
  count: number
}

export interface DashboardCharts {
  users_growth: GrowthDataPoint[]
}

export interface TopGroup {
  id: number
  name: string
  members_count: number
  total_spent: string
}

export interface RecentActivity {
  id: string
  type: "expense" | "settlement"
  title: string
  amount: string
  created_at: string
}

export interface AdminDashboardData {
  kpis: AdminDashboardKPIs
  charts: DashboardCharts
  top_groups: TopGroup[]
  recent_activity: RecentActivity[]
}

export interface SortingState {
  field: string
  desc: boolean
}

export interface PlatformSettings {
  app_name: string
  environment: string
  debug_mode: boolean
  frontend_url: string
  system_health: {
    database: string
    redis: string
    celery: string
    python_version: string
  }
}
