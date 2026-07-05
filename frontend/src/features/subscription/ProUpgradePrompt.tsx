import { Sparkles, CheckCircle2, ShieldCheck, Zap, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/auth-store"
import { useCreateSubscriptionOrder, useVerifySubscriptionPayment } from "./mutations"
import { toast } from "@/lib/toast"

export function ProUpgradePrompt() {
  const { user } = useAuthStore()
  const { mutate: createOrder, isPending: isCreatingOrder } = useCreateSubscriptionOrder()
  const { mutate: verifyPayment } = useVerifySubscriptionPayment()

  const handleUpgrade = () => {
    if (user?.subscription_plan === "PRO") return

    createOrder(undefined, {
      onSuccess: (data) => {
        const options = {
          key: data.key_id,
          amount: data.amount,
          currency: "INR",
          name: "Expanzo",
          description: "Pro Subscription",
          order_id: data.order_id,
          handler: function (response: Record<string, string>) {
            verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature
            })
          },
          prefill: {
            name: user?.full_name,
            email: user?.email,
          },
          theme: {
            color: "#4f46e5"
          }
        }
        const RazorpayClient = (window as unknown as { Razorpay: new (options: Record<string, unknown>) => { open: () => void } }).Razorpay
        const rzp = new RazorpayClient(options)
        rzp.open()
      },
      onError: (err) => {
        toast.apiError(err)
      }
    })
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] h-full w-full bg-slate-50/50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100/60 text-center relative overflow-hidden">
        
        {/* Background Decorations */}
        <div className="absolute -top-24 -right-24 size-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 size-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center">
          <div className="size-16 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 mb-6">
            <Sparkles className="size-8" />
          </div>

          <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display tracking-tight">
            Unlock Expanzo Pro
          </h2>
          <p className="text-slate-500 text-sm mb-8 leading-relaxed">
            Upgrade to Pro to access AI-powered financial analytics and seamless group chat insights.
          </p>

          <div className="w-full space-y-4 mb-8 text-left">
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="mt-0.5 text-indigo-500"><Zap className="size-5" /></div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Dynamic AI Dashboards</h4>
                <p className="text-xs text-slate-500 mt-0.5">Generate custom charts and analysis instantly.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="mt-0.5 text-emerald-500"><ShieldCheck className="size-5" /></div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Group AI Chat</h4>
                <p className="text-xs text-slate-500 mt-0.5">Talk to your data and settle expenses with AI.</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="mt-0.5 text-amber-500"><CheckCircle2 className="size-5" /></div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Priority Support</h4>
                <p className="text-xs text-slate-500 mt-0.5">Get answers faster when you need them.</p>
              </div>
            </div>
          </div>

          <Button 
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl h-11"
            onClick={handleUpgrade}
            disabled={isCreatingOrder}
          >
            {isCreatingOrder ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 size-4" />
            )}
            Upgrade to Pro — ₹499/mo
          </Button>
        </div>
      </div>
    </div>
  )
}
