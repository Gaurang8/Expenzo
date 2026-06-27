import React from "react"
import LoginPage from "@/features/login"
import SignupPage from "@/features/signup"
import Group from "@/features/group"
import NotificationsPage from "@/features/notifications"
import { RecentActivityPage } from "@/features/activity/RecentActivityPage"
import SettingsPage from "@/features/settings"
import ForgotPasswordPage from "@/features/forgot-password"
import ResetPasswordPage from "@/features/reset-password"
import { AdminDashboard } from "@/features/admin/pages/AdminDashboard"
import { AdminUsersPage } from "@/features/admin/pages/AdminUsersPage"
import { AdminGroupsPage } from "@/features/admin/pages/AdminGroupsPage"
import { AdminExpensesPage } from "@/features/admin/pages/AdminExpensesPage"
import { AdminCategoriesPage } from "@/features/admin/pages/AdminCategoriesPage"
import { AdminSettingsPage } from "@/features/admin/pages/AdminSettingsPage"

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
  // Admin Routes
  ADMIN_DASHBOARD: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_GROUPS: "/admin/groups",
  ADMIN_EXPENSES: "/admin/expenses",
  ADMIN_CATEGORIES: "/admin/categories",
  ADMIN_SETTINGS: "/admin/settings",
} as const


export type RouteKeys = keyof typeof ROUTES
export type RoutePaths = typeof ROUTES[RouteKeys]

export interface RouteConfig {
  path: string
  component: React.ComponentType
  authRequired: boolean
  isLayoutEnabled: boolean
  label?: string
  adminRequired?: boolean
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
  // Admin Routes
  {
    path: ROUTES.ADMIN_DASHBOARD,
    component: AdminDashboard,
    authRequired: true,
    isLayoutEnabled: true,
    adminRequired: true,
    label: "Admin Dashboard",
  },
  {
    path: ROUTES.ADMIN_USERS,
    component: AdminUsersPage,
    authRequired: true,
    isLayoutEnabled: true,
    adminRequired: true,
    label: "Admin Users",
  },
  {
    path: ROUTES.ADMIN_GROUPS,
    component: AdminGroupsPage,
    authRequired: true,
    isLayoutEnabled: true,
    adminRequired: true,
    label: "Admin Groups",
  },
  {
    path: ROUTES.ADMIN_EXPENSES,
    component: AdminExpensesPage,
    authRequired: true,
    isLayoutEnabled: true,
    adminRequired: true,
    label: "Admin Expenses",
  },
  {
    path: ROUTES.ADMIN_CATEGORIES,
    component: AdminCategoriesPage,
    authRequired: true,
    isLayoutEnabled: true,
    adminRequired: true,
    label: "Admin Categories",
  },
  {
    path: ROUTES.ADMIN_SETTINGS,
    component: AdminSettingsPage,
    authRequired: true,
    isLayoutEnabled: true,
    adminRequired: true,
    label: "Admin Settings",
  },
]
