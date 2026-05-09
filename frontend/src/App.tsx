import "./App.css";
import LoginPage from "./features/login";
import SignupPage from "./features/signup";
import { BrowserRouter, Routes, Route } from "react-router-dom"
import { Toaster } from "sonner"
import { AuthProvider } from "./providers/auth-provider"
import { ROUTES } from "./lib/routes"

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <AuthProvider>
        <Routes>
          <Route path={ROUTES.HOME} element={<h2>Home page</h2>} />

          <Route
            path={ROUTES.LOGIN}
            element={<LoginPage />}
          />
          <Route
            path={ROUTES.REGISTER}
            element={<SignupPage />}
          />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App