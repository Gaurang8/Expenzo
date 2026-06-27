
import { Users, FolderTree, CreditCard, Activity, ArrowUpRight } from "lucide-react"
import { useAdminDashboard } from "../queries"
import { StatCard, AdminPageHeader } from "../components/AdminPageHeader"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatDistanceToNow } from "date-fns"

export function AdminDashboard() {
  const { data: response, isLoading } = useAdminDashboard()
  const data = response?.data

  return (
    <div>
      <AdminPageHeader 
        title="Dashboard" 
        description="Platform-wide metrics and activity overview."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Users"
          value={data?.kpis.total_users || 0}
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Groups"
          value={data?.kpis.total_groups || 0}
          icon={FolderTree}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Expenses"
          value={`₹${parseFloat(data?.kpis.total_expenses || "0").toFixed(2)}`}
          icon={CreditCard}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Settlements"
          value={`₹${parseFloat(data?.kpis.total_settlements || "0").toFixed(2)}`}
          icon={Activity}
          isLoading={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 rounded-2xl border-slate-200/60 bg-white/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-tight text-slate-900">Top Groups by Expense Volume</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : data?.top_groups.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No group data available</div>
            ) : (
              <div className="divide-y">
                {data?.top_groups.map((group, idx) => (
                  <div key={group.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold text-base shadow-xs border border-indigo-100/50">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 text-base">{group.name}</p>
                        <p className="text-sm text-slate-500 font-medium">{group.members_count} members</p>
                      </div>
                    </div>
                    <div className="font-bold text-slate-900 text-base">
                      ₹{parseFloat(group.total_spent || "0").toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200/60 bg-white/60 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] backdrop-blur-xl">
          <CardHeader>
            <CardTitle className="text-xl font-bold tracking-tight text-slate-900">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-12 bg-slate-100 rounded animate-pulse" />
                ))}
              </div>
            ) : data?.recent_activity.length === 0 ? (
              <div className="text-center py-8 text-slate-500">No recent activity</div>
            ) : (
              <div className="space-y-4">
                {data?.recent_activity.map(activity => (
                  <div key={activity.id} className="flex gap-4 p-2 hover:bg-slate-50/50 rounded-xl transition-colors">
                    <div className="mt-0.5">
                      {activity.type === "expense" ? (
                        <div className="p-2 bg-rose-50 text-rose-600 rounded-xl shadow-xs border border-rose-100/50">
                          <ArrowUpRight className="w-4 h-4" />
                        </div>
                      ) : (
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl shadow-xs border border-emerald-100/50">
                          <Activity className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-slate-900 line-clamp-2">{activity.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-bold text-sm text-slate-700">₹{parseFloat(activity.amount || "0").toFixed(2)}</span>
                        <span className="text-slate-300">•</span>
                        <span className="text-sm font-medium text-slate-500">
                          {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
