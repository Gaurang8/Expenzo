import { useMutation, useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/auth-store"
import { toast } from "@/lib/toast"

export const useCreateSubscriptionOrder = () => {
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post<{ order_id: string; amount: number; key_id: string }>("/accounts/subscription/create-order/", {})
      return data
    },
  })
}

export const useVerifySubscriptionPayment = () => {
  const queryClient = useQueryClient()
  const { setUser, user } = useAuthStore()

  return useMutation({
    mutationFn: async (payload: {
      razorpay_payment_id: string
      razorpay_order_id: string
      razorpay_signature: string
    }) => {
      const { data } = await api.post("/accounts/subscription/verify-payment/", payload)
      return data
    },
    onSuccess: () => {
      // Update local user state
      if (user) {
        setUser({ ...user, subscription_plan: "PRO" })
      }
      queryClient.invalidateQueries({ queryKey: ["me"] })
      toast.success("Successfully upgraded to PRO!")
    },
    onError: (error: unknown) => {
      toast.apiError(error)
    }
  })
}
