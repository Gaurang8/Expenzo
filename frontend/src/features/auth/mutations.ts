import { useMutation } from "@tanstack/react-query"
import { api, ApiError } from "@/lib/api"
import type { ApiSuccess } from "@/lib/types"
import type { User } from "@/store/auth-store"
import { useAuthStore } from "@/store/auth-store"
import { queryClient } from "@/providers/query-client"
import { toast } from "@/lib/toast"

export const useUpdateSettings = () => {
    const setUser = useAuthStore(state => state.setUser)
    
    return useMutation<ApiSuccess<User>, ApiError, Partial<User> | FormData>({
        mutationFn: (payload) => api.patch<User>("/accounts/me/", payload),
        onSuccess: (res) => {
            if (res.data) {
                setUser(res.data)
                queryClient.invalidateQueries({ queryKey: ["user"] })
                toast.success(res.message || "Settings updated successfully")
            }
        },
        onError: (err) => {
            toast.apiError(err)
        }
    })
}
