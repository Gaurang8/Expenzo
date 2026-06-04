import React from "react"
import LoginPage from "@/features/login"
import SignupPage from "@/features/signup"
import Group from "@/features/group"
import NotificationsPage from "@/features/notifications"
import { RecentActivityPage } from "@/features/activity/RecentActivityPage"
import SettingsPage from "@/features/settings"
import ForgotPasswordPage from "@/features/forgot-password"
import ResetPasswordPage from "@/features/reset-password"

export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
  GROUP_DETAIL: "/groups/:groupId",
  NOTIFICATIONS: "/notifications",
  ACTIVITY: "/activities",
  SETTINGS: "/settings",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password/:uid/:token",
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
    path: ROUTES.FORGOT_PASSWORD,
    component: ForgotPasswordPage,
    authRequired: false,
    isLayoutEnabled: false,
    label: "Forgot Password",
  },
  {
    path: ROUTES.RESET_PASSWORD,
    component: ResetPasswordPage,
    authRequired: false,
    isLayoutEnabled: false,
    label: "Reset Password",
  },
  {
    path: ROUTES.GROUP_DETAIL,
    component: Group,
    authRequired: true,
    isLayoutEnabled: true,
  },
  {
    path: ROUTES.NOTIFICATIONS,
    component: NotificationsPage,
    authRequired: true,
    isLayoutEnabled: true,
    label: "Notifications",
  },
  {
    path: ROUTES.ACTIVITY,
    component: RecentActivityPage,
    authRequired: true,
    isLayoutEnabled: true,
    label: "Recent Activity",
  },
  {
    path: ROUTES.SETTINGS,
    component: SettingsPage,
    authRequired: true,
    isLayoutEnabled: true,
    label: "Settings",
  },
]
