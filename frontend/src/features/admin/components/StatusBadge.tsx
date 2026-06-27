import { cn } from "@/lib/utils"

interface StatusBadgeProps {
  status: "active" | "inactive" | "staff" | "user" | "default" | "custom" | boolean
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  let label = ""
  let colorClass = ""

  if (typeof status === "boolean") {
    label = status ? "Active" : "Inactive"
    colorClass = status 
      ? "bg-emerald-100 text-emerald-800 border-emerald-200" 
      : "bg-slate-100 text-slate-800 border-slate-200"
  } else {
    switch (status) {
      case "active":
        label = "Active"
        colorClass = "bg-emerald-100 text-emerald-800 border-emerald-200"
        break
      case "inactive":
        label = "Inactive"
        colorClass = "bg-slate-100 text-slate-800 border-slate-200"
        break
      case "staff":
        label = "Admin"
        colorClass = "bg-indigo-100 text-indigo-800 border-indigo-200"
        break
      case "user":
        label = "User"
        colorClass = "bg-slate-100 text-slate-800 border-slate-200"
        break
      case "default":
        label = "Default"
        colorClass = "bg-blue-100 text-blue-800 border-blue-200"
        break
      case "custom":
        label = "Custom"
        colorClass = "bg-amber-100 text-amber-800 border-amber-200"
        break
    }
  }

  return (
    <span className={cn(
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border",
      colorClass,
      className
    )}>
      {label}
    </span>
  )
}
