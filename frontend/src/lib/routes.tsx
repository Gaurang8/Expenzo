import React from "react"
import LoginPage from "@/features/login"
import SignupPage from "@/features/signup"
import Group from "@/features/group"

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  GROUP_DETAIL: "/groups/:groupId",
} as const

export type RouteKeys = keyof typeof ROUTES
export type RoutePaths = typeof ROUTES[RouteKeys]

export interface RouteConfig {
  path: string
  component: React.ComponentType
  authRequired: boolean
  isLayoutEnabled: boolean
  label?: string
}

export const routesMap: RouteConfig[] = [
  {
    path: ROUTES.HOME,
    component: Group,
    authRequired: true,
    isLayoutEnabled: true,
    label: "Home",
  },
  {
    path: ROUTES.LOGIN,
    component: LoginPage,
    authRequired: false,
    isLayoutEnabled: false,
    label: "Login",
  },
  {
    path: ROUTES.REGISTER,
    component: SignupPage,
    authRequired: false,
    isLayoutEnabled: false,
    label: "Register",
  },
  {
    path: ROUTES.GROUP_DETAIL,
    component: Group,
    authRequired: true,
    isLayoutEnabled: true,
  },
]
