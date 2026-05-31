import { useNavigate, useLocation, Link } from "react-router-dom"
import {
  Users,
  LogOut,
  ChevronsUpDown,
  Bell,
  Sparkles,
  History,
  Split,
  ChevronsRight,
  ChevronsLeft,
  Settings
} from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"

import { useAuthStore } from "@/store/auth-store"
import { useNotifications } from "@/features/notifications/queries"
import { useUserActivities } from "@/features/expenses/queries"
import { useMe } from "@/features/auth/queries"
import type { SettlementActivity } from "@/features/expenses/types"
import type { Notification } from "@/features/notifications/types"
import type { PaginatedData, ApiSuccess } from "@/lib/types"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { getInitials, formatShortDate } from "@/lib/format"


const items = [
  {
    title: "Groups",
    url: ROUTES.HOME,
    icon: Users,
  },
  {
    title: "Notifications",
    url: ROUTES.NOTIFICATIONS,
    icon: Bell,
  },
  {
    title: "Activity",
    url: ROUTES.ACTIVITY,
    icon: History,
  }
]

export function AppSidebar() {
  const { user, logout } = useAuthStore()
  const { data: notificationsRes } = useNotifications()
  const notifications = notificationsRes?.pages?.flatMap((page: ApiSuccess<PaginatedData<Notification>>) => page.data.results) || ([] as Notification[])
  const unreadCount = notifications.filter((n: Notification) => !n.is_read).length || 0

  const navigate = useNavigate()
  const location = useLocation()

  const { data: activitiesRes } = useUserActivities()
  const { data: meRes } = useMe()
  const meId = meRes?.data?.id
  const activities = activitiesRes?.data || []

  const recentActivity = [...activities].sort((a, b) => {
    const dateA = a.type === 'expense' ? a.expense_date : a.settled_at
    const dateB = b.type === 'expense' ? b.expense_date : b.settled_at
    return new Date(dateB).getTime() - new Date(dateA).getTime()
  }).slice(0, 3).map(item => {
    if (item.type === "expense") {
      const isMe = item.primary_payer_info?.id === meId
      return {
        id: `exp-${item.id}`,
        payee: isMe ? "You" : item.primary_payer_info?.name || "Someone",
        amount: `₹${parseFloat(item.total_amount).toFixed(2)}`,
        receiver: "the group",
        reason: item.title,
        group_name: item.group_name || "Group",
        date: formatShortDate(item.expense_date, user?.date_format || 'MMM dd, yyyy'),
        paid_by_me: isMe,
        action: "paid"
      }
    } else {
      const s = item as SettlementActivity
      let payee: string
      let receiver: string
      let paid_by_me: boolean
      if (s.my_role === "payer") {
        payee = "You"
        receiver = s.paid_to_info.name
        paid_by_me = true
      } else if (s.my_role === "receiver") {
        payee = s.paid_by_info.name
        receiver = "You"
        paid_by_me = false
      } else {
        payee = s.paid_by_info.name
        receiver = s.paid_to_info.name
        paid_by_me = false
      }
      return {
        id: `set-${s.id}`,
        payee,
        amount: `₹${parseFloat(s.amount).toFixed(2)}`,
        receiver,
        reason: "Settlement",
        group_name: s.group_name || "Group",
        date: formatShortDate(s.settled_at, user?.date_format || 'MMM dd, yyyy'),
        paid_by_me,
        action: "paid"
      }
    }
  })

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-20 border-b flex items-center flex-row px-4">
        <Split className=" ml-2 mr-1 size-5 text-indigo-700 stroke-3" />
        <h1 className="font-bold text-xl truncate">Expanzo</h1>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup className="p-0 mt-2">
          <SidebarGroupLabel className="pr-4 pl-8 py-6 font-semibold text-slate-500">MENU</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="">
              {items.map((item) => {
                const isActive = location.pathname === item.url || (item.url === ROUTES.HOME && location.pathname.startsWith('/groups/'))

                return (
                  <SidebarMenuItem key={item.title}
                    className={cn(
                      'border-l-4 border-transparent my-1 px-2',
                      isActive && "border-l-4 border-indigo-700"
                    )}
                  >
                    <SidebarMenuButton
                      asChild
                      tooltip={item.title}
                      isActive={isActive}
                      className={cn(
                        "font-semibold! bg-transparent! pl-6 hover:text-indigo-700 h-full",
                        isActive && "text-indigo-700! bg-indigo-50! hover:bg-indigo-50!"
                      )}
                    >
                      <Link to={item.url} className="flex flex-1 items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <div className={cn("bg-gray-200 h-8 w-8 rounded-full flex items-center justify-center", isActive && "bg-indigo-100 text-indigo-700")}>
                            <item.icon className="size-4" />
                          </div>
                          <span>{item.title}</span>
                        </div>
                        {item.title === "Notifications" && unreadCount > 0 && (
                          <span className="flex h-5 w-5 mr-4 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white">
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                        )}
                      </Link>

                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="p-0 mt-8">
          <SidebarGroupLabel className="pr-4 pl-8 py-4 font-semibold text-slate-500">RECENT ACTIVITY</SidebarGroupLabel>
          <SidebarGroupContent className=" px-4 ">
            {recentActivity?.map((item) => (
              <div key={item.id} className="px-4 py-3 text-slate-600">
                <span className=" text-black font-medium">
                  {item?.payee}
                </span>
                &nbsp;{item.action}&nbsp;
                <span className={
                  cn(
                    item?.paid_by_me ? "text-red-500" : "text-green-500",
                    "font-medium"
                  )
                }>
                  {item?.amount}
                </span>
                &nbsp;to&nbsp;
                <span
                  className="text-black font-medium"
                >
                  {item?.receiver}
                </span>
                &nbsp;for&nbsp;
                <span
                  className="text-black font-medium"
                >
                  <ChevronsLeft className="inline size-3" />
                  {item?.reason} <ChevronsRight className="inline size-3" />
                </span>
                &nbsp;in&nbsp;
                <span
                  className="text-black font-medium"
                >
                  <ChevronsLeft className="inline size-3" />
                  {item?.group_name} <ChevronsRight className="inline size-3" />
                </span>
                <p className="text-xs text-slate-400 mt-1">
                  {item?.date}
                </p>
              </div>
            ))}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src={user?.avatar || undefined} alt={user?.full_name} />
                    <AvatarFallback className=" rounded-lg">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user?.full_name}</span>
                    <span className="truncate text-xs">{user?.email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                side="bottom"
                sideOffset={8}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.full_name} />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user?.full_name}</span>
                      <span className="truncate text-xs">{user?.email}</span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>
                    <Sparkles />
                    Upgrade to Pro
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem asChild>
                    <Link to={ROUTES.SETTINGS} className="cursor-pointer">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Bell />
                    Notifications
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                >
                  <LogOut />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
