import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Wallet, Search, Check, ChevronLeft } from "lucide-react"
import { toast } from "@/lib/toast"
import { useCreateSettlement } from "./mutations"
import type { GroupMember } from "@/features/group/types"
import { useAuthStore } from "@/store/auth-store"

const settleSchema = z.object({
  amount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: "Amount must be a positive number",
  }),
  description: z.string().optional(),
  settled_at: z.string(),
})

type SettleFormValues = z.infer<typeof settleSchema>

interface SettleUpDialogProps {
  groupId: string
  members: GroupMember[]
}

export const SettleUpDialog = ({ groupId, members }: SettleUpDialogProps) => {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<'select_receiver' | 'details'>('select_receiver')
  const [selectedReceiver, setSelectedReceiver] = useState<GroupMember | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  
  const currentUser = useAuthStore((state) => state.user)
  const createSettlement = useCreateSettlement(groupId)

  const form = useForm<SettleFormValues>({
    resolver: zodResolver(settSchema),
    defaultValues: {
      amount: "",
      description: "",
      settled_at: new Date().toISOString(),
    },
  })

  const filteredMembers = members.filter(m => 
    m.user !== currentUser?.id && (
      m.user_info.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      m.user_info.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  const handleSelectReceiver = (member: GroupMember) => {
    setSelectedReceiver(member)
    setStep('details')
  }

  const onSubmit = (data: SettleFormValues) => {
    if (!selectedReceiver) return

    createSettlement.mutate({
      paid_to: selectedReceiver.user,
      amount: data.amount,
      description: data.description,
      settled_at: data.settled_at,
    }, {
      onSuccess: () => {
        toast.success("Payment recorded successfully")
        setOpen(false)
        reset()
      },
      onError: (err) => {
        toast.apiError(err)
      }
    })
  }

  const reset = () => {
    setStep('select_receiver')
    setSelectedReceiver(null)
    setSearchQuery("")
    form.reset()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="rounded-lg h-12 px-4 cursor-pointer font-semibold border-slate-200 hover:bg-slate-50">
          <Wallet className="mr-2 size-5 text-slate-600" />
          Make payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[420px] p-6 bg-white gap-0">
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-2">
            {step === 'details' && (
              <Button variant="ghost" size="icon" className="size-8 -ml-2" onClick={() => setStep('select_receiver')}>
                <ChevronLeft className="size-5" />
              </Button>
            )}
            <DialogTitle className="text-xl font-bold">
              {step === 'select_receiver' ? 'Settle Up' : 'Payment Details'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 'select_receiver' ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input
                placeholder="Search member..."
                className="pl-10 h-11 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-500 rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar space-y-1">
              {filteredMembers.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-sm">No members found</div>
              ) : (
                filteredMembers.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-xl cursor-pointer transition-colors group"
                    onClick={() => handleSelectReceiver(m)}
                  >
                    <Avatar className="size-10 border-2 border-white shadow-sm">
                      <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user_info.email}`} />
                      <AvatarFallback className="bg-slate-100 text-slate-500">{m.user_info.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{m.user_info.name}</p>
                      <p className="text-xs text-slate-500 truncate">{m.user_info.email}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col items-center gap-4 py-4 bg-slate-50 rounded-2xl border border-slate-100 mb-2">
              <div className="flex items-center gap-4">
                <Avatar className="size-12 border-2 border-white shadow-md">
                   <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser?.email}`} />
                   <AvatarFallback>Y</AvatarFallback>
                </Avatar>
                <div className="h-px w-12 bg-slate-200 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-full border border-slate-100 shadow-sm">
                    <Check className="size-3 text-indigo-600" />
                  </div>
                </div>
                <Avatar className="size-12 border-2 border-white shadow-md">
                   <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedReceiver?.user_info.email}`} />
                   <AvatarFallback>{selectedReceiver?.user_info.name.charAt(0)}</AvatarFallback>
                </Avatar>
              </div>
              <p className="text-sm font-medium text-slate-600">
                You are paying <span className="font-bold text-slate-900">{selectedReceiver?.user_info.name}</span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount" className="text-sm font-bold text-slate-700 ml-1">Amount</Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">₹</span>
                  <Input
                    id="amount"
                    placeholder="0.00"
                    className="pl-8 h-14 text-2xl font-bold bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
                    {...form.register("amount")}
                  />
                </div>
                {form.formState.errors.amount && (
                  <p className="text-xs font-medium text-rose-500 ml-1">{form.formState.errors.amount.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-bold text-slate-700 ml-1 text-slate-400">Note (optional)</Label>
                <Textarea
                  id="description"
                  placeholder="What was this for?"
                  className="min-h-[80px] bg-white border-slate-200 focus-visible:ring-indigo-500 rounded-xl resize-none"
                  {...form.register("description")}
                />
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-lg rounded-xl shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
              disabled={createSettlement.isPending}
            >
              {createSettlement.isPending ? "Recording..." : "Confirm Payment"}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
