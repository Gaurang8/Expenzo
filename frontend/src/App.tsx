import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { AuthProvider } from "./providers/auth-provider"
import { routesMap } from "./lib/routes"
import { MainLayout } from "./components/layouts/MainLayout"
import { AdminLayout } from "./features/admin/layout/AdminLayout"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
        <AuthProvider>
          <Routes>
            <Route element={<MainLayout />}>
              {routesMap.filter(r => r.isLayoutEnabled && !r.adminRequired).map((route) => {
                const Component = route.component
                return <Route key={route.path} path={route.path} element={<Component />} />
              })}
            </Route>

            <Route element={<AdminLayout />}>
              {routesMap.filter(r => r.isLayoutEnabled && r.adminRequired).map((route) => {
                const Component = route.component
                return <Route key={route.path} path={route.path} element={<Component />} />
              })}
            </Route>

            {routesMap.filter(r => !r.isLayoutEnabled).map((route) => {
              const Component = route.component
              return <Route key={route.path} path={route.path} element={<Component />} />
            })}
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App