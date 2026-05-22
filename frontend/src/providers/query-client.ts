import { QueryClient } from "@tanstack/react-query"

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10 * 1000, // 10 seconds global default
      refetchOnWindowFocus: false, // Prevent re-fetching every time user clicks back to browser
      retry: 1, // Minimize retry spam
    },
  },
})
