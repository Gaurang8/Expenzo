import React from "react"
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { AuthProvider } from "./providers/auth-provider"
import { routesMap } from "./lib/routes"
import { MainLayout } from "./components/layouts/MainLayout"
import { TooltipProvider } from "@/components/ui/tooltip"

function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <Toaster position="top-right" richColors closeButton />
        <AuthProvider>
          <Routes>
            {routesMap.map((route) => {
              const Component = route.component
              const Layout = route.isLayoutEnabled ? MainLayout : React.Fragment

              return (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <Layout>
                      <Component />
                    </Layout>
                  }
                />
              )
            })}
          </Routes>
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  )
}

export default App