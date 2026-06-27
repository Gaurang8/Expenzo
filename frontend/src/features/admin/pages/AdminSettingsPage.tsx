
import { useAdminPlatformSettings } from "../queries"
import { AdminPageHeader } from "../components/AdminPageHeader"
import { StatusBadge } from "../components/StatusBadge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Server, Database, Activity, Globe } from "lucide-react"

export function AdminSettingsPage() {
  const { data: response, isLoading } = useAdminPlatformSettings()
  const data = response?.data

  if (isLoading) {
    return (
      <div className="space-y-6">
        <AdminPageHeader title="Platform Settings" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-slate-100 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader 
        title="Platform Settings" 
        description="System configuration and health metrics."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Server className="w-5 h-5 text-indigo-500" />
              Environment
            </CardTitle>
            <CardDescription>Core platform configuration</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-slate-500">App Name</span>
                <span className="text-sm font-semibold text-slate-900">{data?.app_name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-slate-500">Environment</span>
                <StatusBadge 
                  status={data?.environment === "Production" ? "active" : "custom"} 
                  className="capitalize"
                />
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-slate-500">Debug Mode</span>
                <span className="text-sm font-semibold text-slate-900">
                  {data?.debug_mode ? "Enabled" : "Disabled"}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-slate-500">Frontend URL</span>
                <div className="flex items-center gap-1 text-sm font-medium text-indigo-600">
                  <Globe className="w-3 h-3" />
                  <a href={data?.frontend_url} target="_blank" rel="noreferrer" className="hover:underline">
                    {data?.frontend_url}
                  </a>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-emerald-500" />
              System Health
            </CardTitle>
            <CardDescription>Status of core services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Database className="w-4 h-4" /> PostgreSQL
                </span>
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {data?.system_health?.database}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Server className="w-4 h-4" /> Redis Cache
                </span>
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {data?.system_health?.redis}
                </span>
              </div>
              <div className="flex justify-between items-center py-2 border-b">
                <span className="text-sm font-medium text-slate-500 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Celery Workers
                </span>
                <span className="text-sm font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                  {data?.system_health?.celery}
                </span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm font-medium text-slate-500">Python Version</span>
                <span className="text-sm font-semibold text-slate-900">
                  {data?.system_health?.python_version}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
