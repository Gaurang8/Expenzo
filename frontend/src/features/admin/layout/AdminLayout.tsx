import React from "react"
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Users,
  FolderTree,
  CreditCard,
  Tags,
  Settings,
  ArrowLeft,
  LogOut,
  Split,
  ChevronsUpDown
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
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/store/auth-store"
import { getInitials } from "@/lib/format"
import { ROUTES } from "@/lib/routes"
import { cn } from "@/lib/utils"

const adminItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Groups", url: "/admin/groups", icon: FolderTree },
  { title: "Transactions", url: "/admin/expenses", icon: CreditCard },
  { title: "Categories", url: "/admin/categories", icon: Tags },
  { title: "Settings", url: "/admin/settings", icon: Settings },
]

export function AdminLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate(ROUTES.LOGIN)
  }

  return (
    <SidebarProvider style={{ "--sidebar-width": "20rem" } as React.CSSProperties}>
      <Sidebar collapsible="icon">
        <SidebarHeader className="h-20 border-b flex items-center flex-row px-4">
          <Split className="ml-2 mr-1 size-5 text-indigo-700 stroke-3" />
          <h1 className="font-bold text-xl truncate">Expanzo <span className="text-sm font-medium text-slate-500 ml-1 bg-slate-100 px-2 py-0.5 rounded-full">Admin</span></h1>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className="p-0 mt-2">
            <SidebarGroupLabel className="pr-4 pl-8 py-6 font-semibold text-slate-500">MANAGEMENT</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => {
                  const isActive = location.pathname === item.url || (item.url !== "/admin" && location.pathname.startsWith(item.url))

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
                        <Link to={item.url} className="flex flex-1 items-center justify-between w-full py-2">
                          <div className="flex items-center gap-2">
                            <div className={cn("bg-gray-200 h-8 w-8 rounded-full flex items-center justify-center transition-colors", isActive && "bg-indigo-100 text-indigo-700")}>
                              <item.icon className="size-4" />
                            </div>
                            <span>{item.title}</span>
                          </div>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup className="p-0 mt-8 mb-4">
             <SidebarGroupLabel className="pr-4 pl-8 py-4 font-semibold text-slate-500">NAVIGATION</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem className="border-l-4 border-transparent my-1 px-2">
                  <SidebarMenuButton
                    asChild
                    tooltip="Back to App"
                    className="font-semibold! bg-transparent! pl-6 hover:text-indigo-700 h-full"
                  >
                    <Link to={ROUTES.HOME} className="flex flex-1 items-center justify-between w-full py-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-slate-200 h-8 w-8 rounded-full flex items-center justify-center">
                          <ArrowLeft className="size-4 text-slate-600" />
                        </div>
                        <span>Back to App</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-slate-100 p-2">
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground py-2"
                  >
                    <Avatar className="h-8 w-8 rounded-lg shadow-sm">
                      <AvatarImage src={user?.avatar || undefined} alt={user?.full_name} />
                      <AvatarFallback className="rounded-lg bg-indigo-100 text-indigo-700 font-medium">
                        {getInitials(user?.full_name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight ml-1">
                      <span className="truncate font-bold text-slate-900">{user?.full_name}</span>
                      <span className="truncate text-xs text-slate-500 font-medium">{user?.email}</span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4 text-slate-400" />
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
                        <AvatarFallback className="rounded-lg bg-indigo-100 text-indigo-700 font-medium">
                          {getInitials(user?.full_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="grid flex-1 text-left text-sm leading-tight">
                        <span className="truncate font-semibold">{user?.full_name}</span>
                        <span className="truncate text-xs text-slate-500">{user?.email}</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50 relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-linear-to-b from-indigo-50/50 to-transparent pointer-events-none -z-10"></div>
        <header className="h-16 md:hidden flex items-center px-4 border-b bg-white/80 backdrop-blur-md sticky top-0 z-10">
          <SidebarTrigger className="mr-4" />
          <div className="flex items-center gap-2">
            <Split className="h-5 w-5 text-indigo-600" />
            <h1 className="font-bold text-lg">Expanzo <span className="text-xs font-medium text-slate-500 ml-1">Admin</span></h1>
          </div>
        </header>
        
        <div className="flex-1 overflow-auto p-6 md:p-10 z-0">
          <div className="w-full max-w-[1600px] mx-auto space-y-6">
            <Outlet />
          </div>
        </div>
      </main>
    </SidebarProvider>
  )
}
