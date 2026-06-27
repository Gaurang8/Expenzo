import React from "react"
import type { LucideIcon } from "lucide-react"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface StatCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  description?: string
  trend?: {
    value: number
    label: string
  }
  isLoading?: boolean
  className?: string
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  trend, 
  isLoading,
  className 
}: StatCardProps) {
  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-slate-200/60 bg-white/60 p-6 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.05)] backdrop-blur-xl transition-all hover:shadow-md", className)}>
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-indigo-50 blur-2xl pointer-events-none"></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-500">{title}</h3>
          <div className="p-2.5 bg-linear-to-br from-indigo-50 to-indigo-100/50 rounded-xl border border-indigo-100/50 text-indigo-600 shadow-xs">
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-4">
          {isLoading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <div className="text-3xl font-bold tracking-tight text-slate-900">{value}</div>
          )}
        </div>
      {(description || trend) && (
        <div className="mt-2 flex items-center text-xs text-slate-500">
          {trend && (
            <span className={cn(
              "font-medium mr-2",
              trend.value > 0 ? "text-emerald-600" : trend.value < 0 ? "text-rose-600" : "text-slate-600"
            )}>
              {trend.value > 0 ? "+" : ""}{trend.value}%
            </span>
          )}
          {description && <span>{description}</span>}
        </div>
      )}
      </div>
    </div>
  )
}

interface AdminPageHeaderProps {
  title: string
  description?: string
  action?: React.ReactNode
}

export function AdminPageHeader({ title, description, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        {description && (
          <p className="text-slate-500 mt-2 text-sm">{description}</p>
        )}
      </div>
      {action && (
        <div>{action}</div>
      )}
    </div>
  )
}
