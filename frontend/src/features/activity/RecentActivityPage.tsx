import { createElement } from "react"
import { useUserActivities } from "@/features/expenses/queries"
import { useMe } from "@/features/auth/queries"
import { Loader2, ArrowDown, Wallet, Calendar, ChevronDown } from "lucide-react"
import type { ActivityItem, SettlementActivity } from "@/features/expenses/types"
import { Link } from "react-router-dom"
import { formatDate } from "@/lib/format"
import { getCategoryIcon } from "@/features/expenses/constants"

function ActivityCard({ item, meId }: { item: ActivityItem; meId: number | undefined }) {
    let iconBgClass: string
    let statusColorClass: string
    let statusText: string
    let Icon: typeof Wallet

    let actor: string
    let actionText: string
    let amountStr: string
    let reasonText: string

    const dateStr = item.type === "expense" ? item.expense_date : item.settled_at
    const dateObj = new Date(dateStr)
    const timeStr = dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })

    if (item.type === "expense") {
        const net = parseFloat(item.my_net)
        const isMe = item.primary_payer_info?.id === meId
        actor = isMe ? "You" : item.primary_payer_info?.name || "Someone"
        actionText = "paid"
        amountStr = `₹${parseFloat(item.total_amount).toFixed(2)}`
        
        reasonText = `For ${item.title} · ${item.group_name || "Group"}`

        if (!item.is_involved) {
            statusText = "NOT INVOLVED"
            statusColorClass = "text-slate-400"
            iconBgClass = "bg-slate-200 text-slate-500"
            Icon = getCategoryIcon(item.category?.icon)
        } else if (net > 0) {
            statusText = "YOU ARE OWED"
            statusColorClass = "text-emerald-500"
            iconBgClass = "bg-emerald-500 text-white"
            Icon = getCategoryIcon(item.category?.icon)
        } else if (net < 0) {
            statusText = "YOU OWE"
            statusColorClass = "text-rose-500"
            iconBgClass = "bg-rose-500 text-white"
            Icon = getCategoryIcon(item.category?.icon)
        } else {
            statusText = "SETTLED"
            statusColorClass = "text-slate-500"
            iconBgClass = "bg-slate-500 text-white"
            Icon = getCategoryIcon(item.category?.icon)
        }
    } else {
        const s = item as SettlementActivity
        amountStr = `₹${parseFloat(s.amount).toFixed(2)}`

        if (s.my_role === "payer") {
            actor = "You"
            actionText = "settled"
            reasonText = `To ${s.paid_to_info.name}`
            statusText = "YOU PAID"
            statusColorClass = "text-slate-600"
            iconBgClass = "bg-slate-700 text-white"
            Icon = Wallet
        } else if (s.my_role === "receiver") {
            actor = s.paid_by_info.name
            actionText = "settled"
            reasonText = "To You"
            statusText = "YOU RECEIVED"
            statusColorClass = "text-emerald-500"
            iconBgClass = "bg-emerald-500 text-white"
            Icon = ArrowDown
        } else {
            actor = s.paid_by_info.name
            actionText = "settled"
            reasonText = `To ${s.paid_to_info.name}`
            statusText = "SETTLEMENT"
            statusColorClass = "text-slate-500"
            iconBgClass = "bg-slate-500 text-white"
            Icon = Wallet
        }
    }

    return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-[0_2px_8px_rgb(0,0,0,0.04)] flex gap-4 items-center w-full transition-shadow hover:shadow-[0_4px_12px_rgb(0,0,0,0.08)] relative z-10">
            <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${iconBgClass}`}>
                {createElement(Icon, { className: "w-5 h-5" })}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-800 truncate">
                    <span className="font-semibold">{actor}</span> {actionText} <span className="font-semibold">{amountStr}</span>
                </p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {reasonText}
                </p>
            </div>
            <div className="text-right shrink-0">
                <div className="text-xs text-slate-400 font-medium">{timeStr}</div>
                <div className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${statusColorClass}`}>
                    {statusText}
                </div>
            </div>
        </div>
    )
}

export function RecentActivityPage() {
    const { data: activitiesRes, isLoading } = useUserActivities()
    const { data: meRes } = useMe()
    const meId = meRes?.data?.id

    const activities = activitiesRes?.data || []
    
    // Sort activities by the exact date used for grouping to ensure perfect alternating sequence
    const sortedActivities = [...activities].sort((a, b) => {
        const dateA = a.type === 'expense' ? a.expense_date : a.settled_at
        const dateB = b.type === 'expense' ? b.expense_date : b.settled_at
        return new Date(dateB).getTime() - new Date(dateA).getTime()
    })
    
    // Group activities by specific dates instead of month-year
    const groupedActivities = sortedActivities.reduce((acc, activity) => {
        const dateStr = activity.type === 'expense' ? activity.expense_date : activity.settled_at
        const dayStr = formatDate(dateStr, meRes?.data?.date_format || 'MMM dd, yyyy').toUpperCase()
        if (!acc[dayStr]) acc[dayStr] = []
        acc[dayStr].push(activity)
        return acc
    }, {} as Record<string, ActivityItem[]>)

    return (
        <div className="p-6 md:p-12 max-w-6xl mx-auto min-h-screen bg-white">
            <div className="mb-10 flex flex-col items-start">
                <h1 className="text-3xl font-bold tracking-tight text-[#1e293b]">Recent Activity</h1>
                <p className="text-slate-500 text-sm font-medium mt-2">Your global activity feed across all groups</p>
                
                <div className="mt-6 bg-slate-100 text-slate-700 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 cursor-pointer hover:bg-slate-200 transition-colors">
                    May 2026 <Calendar className="w-4 h-4 ml-1" /> <ChevronDown className="w-4 h-4" />
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="size-8 animate-spin text-slate-300" />
                </div>
            ) : activities.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-slate-500 font-medium">No recent activity yet</p>
                </div>
            ) : (
                <div className="relative pb-10">
                    {/* Central timeline line */}
                    <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-px bg-slate-200" />

                    <div className="space-y-6">
                        {Object.entries(groupedActivities).map(([dayLabel, dayActivities]) => (
                            <div key={dayLabel} className="relative z-10">
                                {/* Date Badge */}
                                <div className="flex justify-center mb-6">
                                    <span className="bg-slate-100 text-slate-500 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest relative z-20">
                                        {dayLabel}
                                    </span>
                                </div>
                                
                                <div className="space-y-4">
                                    {dayActivities.map((item) => {
                                        const globalIdx = sortedActivities.indexOf(item)
                                        const isLeft = globalIdx % 2 === 0
                                        
                                        // A simple ring dot on the timeline
                                        const timelineDot = (
                                            <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 bg-white z-20">
                                                <div className="w-[14px] h-[14px] rounded-full border-2 border-slate-400 bg-white shadow-sm flex items-center justify-center">
                                                    <div className="w-[6px] h-[6px] rounded-full bg-slate-400" />
                                                </div>
                                            </div>
                                        )

                                        return (
                                            <div key={`${item.type}-${item.id}`} className="relative flex justify-between items-center w-full group">
                                                {/* Left Side */}
                                                <div className="w-[45%] flex justify-end relative">
                                                    {isLeft && (
                                                        <>
                                                            <Link to={`/groups/${item.group}`} className="w-full relative z-10 block">
                                                                <ActivityCard item={item} meId={meId} />
                                                            </Link>
                                                            {/* Connecting Line */}
                                                            <div className="absolute top-1/2 right-0 translate-x-full w-[11.11%] h-px bg-slate-200 z-0 group-hover:bg-slate-300 transition-colors" />
                                                        </>
                                                    )}
                                                </div>

                                                {/* Center Dot */}
                                                {timelineDot}

                                                {/* Right Side */}
                                                <div className="w-[45%] flex justify-start relative">
                                                    {!isLeft && (
                                                        <>
                                                            <Link to={`/groups/${item.group}`} className="w-full relative z-10 block">
                                                                <ActivityCard item={item} meId={meId} />
                                                            </Link>
                                                            {/* Connecting Line */}
                                                            <div className="absolute top-1/2 left-0 -translate-x-full w-[11.11%] h-px bg-slate-200 z-0 group-hover:bg-slate-300 transition-colors" />
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* End of timeline indicator */}
                    <div className="mt-16 flex items-center justify-center relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-200"></div>
                        </div>
                        <div className="relative bg-white px-4 text-xs font-medium text-slate-400">
                            You've reached the end of your activity
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
