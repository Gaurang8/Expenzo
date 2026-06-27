import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow } from "date-fns"
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  Shield, 
  Trash2, 
  LogOut, 
  ArrowRightLeft, 
  PlusCircle 
} from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useNotifications } from "./queries"
import { useNotificationMutations } from "./mutations"
import type { Notification } from "./types"
import type { PaginatedData, ApiSuccess } from "@/lib/types"
import { useIntersectionObserver } from "@/hooks/use-intersection-observer"

const typeIcons = {
    role_change: Shield,
    member_removed: Trash2,
    member_left: LogOut,
    ownership_transfer: ArrowRightLeft,
    expense_added: PlusCircle,
    settlement_confirmed: CheckCircle2,
}

const typeColors = {
    role_change: "text-indigo-600 bg-indigo-50",
    member_removed: "text-rose-600 bg-rose-50",
    member_left: "text-orange-600 bg-orange-50",
    ownership_transfer: "text-blue-600 bg-blue-50",
    expense_added: "text-emerald-600 bg-emerald-50",
    settlement_confirmed: "text-teal-600 bg-teal-50",
}

const NotificationsPage = () => {
    const { 
        data: notificationsRes, 
        isLoading,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage
    } = useNotifications()
    
    const notifications = notificationsRes?.pages?.flatMap((page: ApiSuccess<PaginatedData<Notification>>) => page.data.results) || ([] as Notification[])
    const { markAsRead, markAllAsRead } = useNotificationMutations()
    const { ref, isIntersecting } = useIntersectionObserver()

    useEffect(() => {
        if (isIntersecting && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage])

    const navigate = useNavigate()

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead.mutateAsync()
            toast.success("All notifications marked as read")
        } catch {
            toast.error("Failed to update notifications")
        }
    }

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.is_read) {
            markAsRead.mutate(notification.id)
        }
        if (notification.link) {
            navigate(notification.link)
        }
    }

    if (isLoading) {
        return (
            <div className="flex h-full items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        )
    }

    const unreadCount = notifications.filter((n: Notification) => !n.is_read).length || 0


    return (
        <div className="max-w-6xl mx-auto p-6 md:p-12 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Notifications</h1>
                    <p className="text-slate-500 mt-1 uppercase text-xs font-bold tracking-widest">
                        {unreadCount} UNREAD ALERTS
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={handleMarkAllAsRead}
                        className="rounded-full px-4 border-slate-200 hover:bg-slate-50"
                        disabled={markAllAsRead.isPending}
                    >
                        Mark all as read
                    </Button>
                )}
            </div>

            <div className="flex flex-col gap-3">
                {notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200">
                        <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                            <Bell className="size-8 text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-medium tracking-tight">All caught up!</p>
                        <p className="text-slate-400 text-sm">No notifications yet.</p>
                    </div>
                ) : (
                    <div className="space-y-8 pb-20">
                        {/* UNREAD SECTION */}
                        {notifications.filter((n: Notification) => !n.is_read).length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">New</h2>
                                {notifications.filter((n: Notification) => !n.is_read).map((notification: Notification) => {
                                    const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell
                                    const colorClass = typeColors[notification.type as keyof typeof typeColors] || "text-slate-600 bg-slate-100"

                                    return (
                                        <Card 
                                            key={notification.id}
                                            className="group cursor-pointer border-none transition-all duration-300 hover:shadow-md bg-indigo-50/30 ring-1 ring-indigo-100/50"
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <CardContent className="p-4 flex gap-4">
                                                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
                                                    <Icon className="size-6" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-bold text-[15px] text-slate-900">
                                                            {notification.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="size-3.5 text-slate-400" />
                                                            <span className="text-xs text-slate-400 font-medium uppercase tracking-tighter">
                                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                            </span>
                                                            <div className="size-2 rounded-full bg-indigo-600 animate-pulse" />
                                                        </div>
                                                    </div>
                                                    <p className="text-[14px] text-slate-500 leading-relaxed" dangerouslySetInnerHTML={{ __html: notification.message }} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}

                        {/* READ SECTION */}
                        {notifications.filter((n: Notification) => n.is_read).length > 0 && (
                            <div className="space-y-3">
                                <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Earlier</h2>
                                {notifications.filter((n: Notification) => n.is_read).map((notification: Notification) => {
                                    const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell
                                    const colorClass = typeColors[notification.type as keyof typeof typeColors] || "text-slate-600 bg-slate-100"

                                    return (
                                        <Card 
                                            key={notification.id}
                                            className="group cursor-pointer border-none transition-all duration-300 hover:shadow-md bg-white opacity-60 hover:opacity-100"
                                            onClick={() => handleNotificationClick(notification)}
                                        >
                                            <CardContent className="p-4 flex gap-4">
                                                <div className={`size-12 rounded-xl flex items-center justify-center shrink-0 ${colorClass} opacity-80`}>
                                                    <Icon className="size-6" />
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <h3 className="font-semibold text-[15px] text-slate-600">
                                                            {notification.title}
                                                        </h3>
                                                        <div className="flex items-center gap-2">
                                                            <Clock className="size-3.5 text-slate-300" />
                                                            <span className="text-xs text-slate-400 font-medium uppercase tracking-tighter">
                                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <p className="text-[14px] text-slate-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: notification.message }} />
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}

                        {/* PAGINATION CONTROL */}
                        {hasNextPage && (
                            <div ref={ref as React.RefObject<HTMLDivElement>} className="flex justify-center pt-8 border-t border-slate-100 pb-8">
                                <div className="flex items-center gap-2 text-indigo-600 font-semibold text-sm">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600"></div>
                                    Loading more...
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

export default NotificationsPage
