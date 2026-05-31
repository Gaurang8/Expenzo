import React from "react"
import { Outlet } from "react-router-dom"
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"

export function MainLayout() {
  return (
    <SidebarProvider style={{
      "--sidebar-width": "20rem",
    } as React.CSSProperties}>
      <AppSidebar />
      <main className="flex-1 overflow-auto bg-background">
        <div className="flex items-center gap-4 mb-6 md:hidden">
          <SidebarTrigger />
          <h2 className="text-lg font-semibold">Expanzo</h2>
        </div>
        <Outlet />
      </main>
    </SidebarProvider>
  )
}
