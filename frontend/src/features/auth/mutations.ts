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

export const useForgotPassword = () => {
    return useMutation<ApiSuccess<null>, ApiError, { email: string }>({
        mutationFn: (payload) => api.post("/accounts/forgot-password/", payload),
    })
}

export const useResetPassword = () => {
    return useMutation<ApiSuccess<null>, ApiError, { uidb64: string; token: string; new_password: string }>({
        mutationFn: (payload) => api.post(`/accounts/reset-password/${payload.uidb64}/${payload.token}/`, { new_password: payload.new_password }),
    })
}

export const useChangePassword = () => {
    return useMutation<ApiSuccess<null>, ApiError, { old_password: string; new_password: string }>({
        mutationFn: (payload) => api.post("/accounts/change-password/", payload),
    })
}
