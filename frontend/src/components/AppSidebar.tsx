import { useNavigate, useLocation } from "react-router-dom"
import {
  Users,
  LogOut,
  ChevronsUpDown,
  CreditCard,
  Bell,
  Sparkles,
  BadgeCheck,
  History,
  Split,
  ChevronsRight,
  ChevronsLeft
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
import type { Notification } from "@/features/notifications/types"
import type { PaginatedData, ApiSuccess } from "@/lib/types"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"
import { getInitials } from "@/lib/format"


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
    url: "/activites",
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



  const recentActivity = [
    {
      payee: "You",
      amount: "₹200",
      receiver: "Jatin Kantariya",
      reason: "Lunch at Tower 1",
      group_name: "Office Friends",
      date: "May 10",
      paid_by_me: true
    },
    {
      payee: "Sahil Sutariya",
      amount: "₹100",
      receiver: "You",
      reason: "Bus Tickets",
      group_name: "Office Friends",
      date: "May 09",
      paid_by_me: false
    },
    {
      payee: "Sahil Sutariya",
      amount: "₹100",
      receiver: "You",
      reason: "Bus Tickets",
      group_name: "Office Friends",
      date: "May 09",
      paid_by_me: false
    }

  ]

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
              {items.map((item) => (
                <SidebarMenuItem key={item.title}
                  className={cn(
                    'border-l-4 border-transparent py-2',
                    location.pathname == item.url && "border-l-4 border-indigo-700"
                  )}
                >
                  <SidebarMenuButton
                    asChild
                    tooltip={item.title}
                    isActive={location.pathname === item.url}
                    className={cn(
                      "font-semibold! bg-transparent! pl-6 hover:text-indigo-700",
                      location.pathname == item.url && "text-indigo-700!"
                    )}
                  >
                    <a href={item.url} className="flex flex-1 items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-200 h-8 w-8 rounded-full flex items-center justify-center">
                          <item.icon className="size-4" />
                        </div>
                        <span>{item.title}</span>
                      </div>
                      {item.title === "Notifications" && unreadCount > 0 && (
                        <span className="flex h-5 w-5 mr-4 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white">
                          {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                      )}
                    </a>

                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup className="p-0 mt-8">
          <SidebarGroupLabel className="pr-4 pl-8 py-4 font-semibold text-slate-500">RECENT ACTIVITY</SidebarGroupLabel>
          <SidebarGroupContent className=" px-4 ">
            {recentActivity?.map((item) => (
              <div key={item.date} className="px-4 py-3 text-slate-600">
                <span className=" text-black font-medium">
                  {item?.payee}
                </span>
                &nbsp;loaned&nbsp;
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
                    <AvatarImage src={user?.full_name} alt={user?.full_name} />
                    <AvatarFallback className=" rounded-lg">
                      {getInitials(user?.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{user.full_name}</span>
                    <span className="truncate text-xs">{user.email}</span>
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
                      <AvatarImage src={user.full_name} alt={user.full_name} />
                      <AvatarFallback className="rounded-lg">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-medium">{user.full_name}</span>
                      <span className="truncate text-xs">{user.email}</span>
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
                  <DropdownMenuItem>
                    <BadgeCheck />
                    Account
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <CreditCard />
                    Billing
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
