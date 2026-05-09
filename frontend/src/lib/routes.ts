export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  REGISTER: "/register",
} as const

export type RouteKeys = keyof typeof ROUTES
export type RoutePaths = typeof ROUTES[RouteKeys]
