import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Wallet, Search, Check, ChevronLeft } from "lucide-react"
import { useCreateSettlement, useUpdateSettlement } from "./mutations"
import { toast } from "@/lib/toast"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { GroupMember } from "@/features/group/types"
import { useMe } from "@/features/auth/queries"
import { useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { getInitials } from "@/lib/format"
import type { Settlement } from "./types"

const settlementSchema = z.object({
  paid_by: z.number().min(1, "Please select who paid"),
  paid_to: z.number().min(1, "Please select who was paid"),
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, "Amount must be greater than 0"),
  description: z.string().optional(),
  settled_at: z.string(),
})

type SettlementFormValues = z.infer<typeof settlementSchema>

interface SettlementFormDialogProps {
  groupId: string
  members: GroupMember[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialData?: Settlement
}

export function SettlementFormDialog({ 
  groupId, 
  members,
  open: externalOpen,
  onOpenChange: externalOnOpenChange,
  initialData
}: SettlementFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen

  const [step, setStep] = useState<'main' | 'who_paid' | 'who_to'>('main')
  const [searchQuery, setSearchQuery] = useState('')

  const { data: meRes } = useMe()
  const me = meRes?.data
  const createSettlement = useCreateSettlement(groupId)
  const updateSettlement = useUpdateSettlement(groupId, initialData?.id.toString())
  const isPending = createSettlement.isPending || updateSettlement.isPending

  const { register, handleSubmit, setValue, control, reset, formState: { errors } } = useForm<SettlementFormValues>({
    resolver: zodResolver(settlementSchema),
    defaultValues: {
      paid_by: me?.id || 0,
      amount: '',
      description: '',
      settled_at: new Date().toISOString(),
    }
  })

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          paid_by: initialData.paid_by,
          paid_to: initialData.paid_to,
          amount: initialData.amount,
          description: initialData.description || '',
          settled_at: initialData.settled_at,
        })
      } else if (me?.id) {
        reset({
          paid_by: me.id,
          paid_to: 0,
          amount: '',
          description: '',
          settled_at: new Date().toISOString(),
        })
      }
    }
  }, [open, me, initialData, reset])

  const paidBy = useWatch({ control, name: 'paid_by' })
  const paidTo = useWatch({ control, name: 'paid_to' })

  const selectedPayer = members.find(m => m.user === paidBy)
  const selectedReceiver = members.find(m => m.user === paidTo)

  const handleCreate = (data: SettlementFormValues) => {
    if (initialData) {
      updateSettlement.mutate(data, {
        onSuccess: () => {
          toast.success("Settlement updated successfully")
          setOpen(false)
        },
        onError: (err) => {
          toast.apiError(err)
        }
      })
    } else {
      createSettlement.mutate(data, {
        onSuccess: () => {
          toast.success("Settlement recorded successfully")
          setOpen(false)
          resetForm()
        },
        onError: (err) => {
          toast.apiError(err)
        }
      })
    }
  }

  const resetForm = () => {
    setStep('main')
    reset()
  }

  const filteredMembers = members.filter(m =>
    m.user_info.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.user_info.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const renderMainStep = () => (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Who paid?</Label>
            <button
              onClick={() => setStep('who_paid')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group min-h-[56px]"
            >
              {selectedPayer ? (
                <div className="flex items-center gap-2 overflow-hidden">
                  <Avatar className="size-6">
                    <AvatarImage src={selectedPayer.user_info.avatar || undefined} />
                    <AvatarFallback className="text-[8px]">{getInitials(selectedPayer.user_info.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-slate-700 text-sm truncate">{selectedPayer.user_info.name === me?.full_name ? "You" : selectedPayer.user_info.name}</span>
                </div>
              ) : (
                <span className="text-slate-400 text-sm">Payer</span>
              )}
            </button>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Who was paid?</Label>
            <button
              onClick={() => setStep('who_to')}
              className="w-full flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group min-h-[56px]"
            >
              {selectedReceiver ? (
                <div className="flex items-center gap-2 overflow-hidden">
                  <Avatar className="size-6">
                    <AvatarImage src={selectedReceiver.user_info.avatar || undefined} />
                    <AvatarFallback className="text-[8px]">{getInitials(selectedReceiver.user_info.name)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold text-slate-700 text-sm truncate">{selectedReceiver.user_info.name === me?.full_name ? "You" : selectedReceiver.user_info.name}</span>
                </div>
              ) : (
                <span className="text-slate-400 text-sm">Receiver</span>
              )}
            </button>
          </div>
        </div>
        {(errors.paid_by || errors.paid_to) && (
          <p className="text-xs text-rose-500">Please select both payer and receiver</p>
        )}

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Amount</Label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-slate-300">₹</span>
            <Input
              type="number"
              {...register('amount')}
              placeholder="0.00"
              className={`h-16 pl-10 text-2xl font-bold rounded-2xl border-slate-100 focus:border-indigo-500 focus:ring-indigo-500 transition-all ${errors.amount ? 'border-rose-500' : ''}`}
            />
          </div>
          {errors.amount && <p className="text-xs text-rose-500 mt-1">{errors.amount.message}</p>}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Note (Optional)</Label>
          <Textarea
            {...register('description')}
            placeholder="What was this for?"
            className="rounded-2xl border-slate-100 focus:border-indigo-500 min-h-[100px] resize-none"
          />
        </div>
      </div>

      <Button
        onClick={handleSubmit(handleCreate)}
        disabled={isPending}
        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-lg shadow-lg shadow-indigo-100 transition-all active:scale-[0.98]"
      >
        {isPending ? (initialData ? "Updating..." : "Recording...") : (initialData ? "Update Settlement" : "Record Payment")}
      </Button>
    </div>
  )

  const renderSelectionStep = (target: 'paid_by' | 'paid_to') => (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search members..."
          className="pl-10 h-11 rounded-xl border-slate-100 focus:bg-slate-50 transition-colors"
        />
      </div>
      <div className="space-y-1 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {filteredMembers.map((m) => {
          const isSelected = (target === 'paid_by' ? paidBy : paidTo) === m.user
          return (
            <button
              key={m.id}
              onClick={() => {
                setValue(target, m.user)
                setStep('main')
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-indigo-50 transition-colors group"
            >
              <Avatar className="size-10 border-2 border-white shadow-sm">
                <AvatarImage src={m.user_info.avatar || undefined} />
                <AvatarFallback>{getInitials(m.user_info.name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">
                  {m.user === me?.id ? "You" : m.user_info.name}
                </p>
                <p className="text-xs text-slate-400">{m.user_info.email}</p>
              </div>
              {isSelected && (
                <div className="size-6 bg-indigo-600 rounded-full flex items-center justify-center text-white">
                  <Check className="size-3.5" strokeWidth={3} />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetForm() }}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-lg h-12 px-4 cursor-pointer font-semibold border-slate-200 hover:bg-slate-50">
            <Wallet className="mr-2 size-5 text-slate-600" />
            Make payment
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[540px] p-6 bg-white gap-0 border-none shadow-2xl">
        <DialogHeader className="mb-6">
          <div className="flex items-center gap-4">
            {step !== 'main' && (
              <button onClick={() => setStep('main')} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <ChevronLeft className="size-5 text-slate-600" />
              </button>
            )}
            <DialogTitle className="text-xl font-bold text-slate-800">
              {initialData ? "Update Settlement" : (step === 'main' ? 'Make Payment' : step === 'who_paid' ? 'Who paid?' : 'Who was paid?')}
            </DialogTitle>
          </div>
        </DialogHeader>

        {step === 'main' && renderMainStep()}
        {step === 'who_paid' && renderSelectionStep('paid_by')}
        {step === 'who_to' && renderSelectionStep('paid_to')}
      </DialogContent>
    </Dialog>
  )
}
