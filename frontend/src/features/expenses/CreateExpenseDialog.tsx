import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, ChevronLeft, Search, Users, Percent, Wallet, Calendar, AlertCircle } from "lucide-react"
import { useCreateExpense, useUpdateExpense } from "./mutations"
import { useMe } from "@/features/auth/queries"
import { toast } from "@/lib/toast"
import type { GroupMember } from "@/features/group/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import type { CreateExpensePayload, ExpenseParticipantPayload } from "./types"
import { formatCurrency, getInitials } from "@/lib/format"
import type { Expense } from "./types"

type Step = 'main' | 'who_paid' | 'split_type' | 'split_details'

const expenseSchema = z.object({
  title: z.string().optional(),
  expense_date: z.string(),
  split_type: z.enum(["equal", "exact", "percentage"]),
  payers: z.record(z.string(), z.object({
    user: z.number(),
    amount: z.string(),
    selected: z.boolean()
  })),
  participants: z.record(z.string(), z.object({
    user: z.number(),
    selected: z.boolean(),
    percentage: z.string().optional(),
    exact_amount: z.string().optional()
  }))
})

type ExpenseFormValues = z.infer<typeof expenseSchema>

interface ExpenseFormDialogProps {
  groupId: string
  members: GroupMember[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  initialData?: Expense
}

export function ExpenseFormDialog({ 
  groupId, 
  members, 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange,
  initialData 
}: ExpenseFormDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = externalOpen !== undefined
  const open = isControlled ? externalOpen : internalOpen
  const setOpen = isControlled ? externalOnOpenChange! : setInternalOpen

  const [step, setStep] = useState<Step>('main')

  const { mutate: createExpense, isPending: isCreating } = useCreateExpense(groupId)
  const { mutate: updateExpense, isPending: isUpdating } = useUpdateExpense(groupId, initialData?.id.toString())
  const isPending = isCreating || isUpdating
  const { data: meRes } = useMe()
  const me = meRes?.data

  const { register, setValue, watch, reset } = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: "",
      expense_date: new Date().toISOString().split('T')[0],
      split_type: "equal",
      payers: {},
      participants: {}
    }
  })

  // Watch values for computations
  const payers = watch("payers")
  const participants = watch("participants")
  const splitType = watch("split_type")

  const [searchQuery, setSearchQuery] = useState("")

  // Initialize states when dialog opens
  useEffect(() => {
    if (open && me && members.length > 0) {
      setStep('main')
      setSearchQuery("")

      const initialPayers: ExpenseFormValues['payers'] = {}
      const initialParticipants: ExpenseFormValues['participants'] = {}

      if (initialData) {
        members.forEach(m => {
          const payer = initialData.payers.find(p => p.user === m.user)
          const participant = initialData.participants.find(p => p.user === m.user)
          
          initialPayers[m.user.toString()] = { 
            user: m.user, 
            amount: payer?.paid_amount || "", 
            selected: !!payer 
          }
          initialParticipants[m.user.toString()] = { 
            user: m.user, 
            selected: !!participant, 
            percentage: participant?.percentage || "", 
            exact_amount: participant?.owed_amount || "" 
          }
        })

        reset({
          title: initialData.title,
          expense_date: initialData.expense_date.split('T')[0],
          split_type: initialData.split_type,
          payers: initialPayers,
          participants: initialParticipants
        })
      } else {
        members.forEach(m => {
          initialPayers[m.user.toString()] = { user: m.user, amount: "", selected: m.user === me.id }
          initialParticipants[m.user.toString()] = { user: m.user, selected: true, percentage: "", exact_amount: "" }
        })

        reset({
          title: "",
          expense_date: new Date().toISOString().split('T')[0],
          split_type: "equal",
          payers: initialPayers,
          participants: initialParticipants
        })
      }
    }
  }, [open, me, members, reset, initialData])

  const totalPaid = useMemo(() => {
    return Object.values(payers || {})
      .filter(p => p.selected)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)
  }, [payers])

  const totalPercentage = useMemo(() => {
    return Object.values(participants || {})
      .filter(p => p.selected)
      .reduce((sum, p) => sum + (parseFloat(p.percentage || "0") || 0), 0)
  }, [participants])

  const totalExact = useMemo(() => {
    return Object.values(participants || {})
      .filter(p => p.selected)
      .reduce((sum, p) => sum + (parseFloat(p.exact_amount || "0") || 0), 0)
  }, [participants])

  const activeParticipantsCount = Object.values(participants || {}).filter(p => p.selected).length
  const equalAmountPerPerson = activeParticipantsCount > 0 ? totalPaid / activeParticipantsCount : 0

  const handleCreate = (data: ExpenseFormValues) => {
    if (totalPaid <= 0) {
      toast.error("Total amount must be greater than 0")
      return
    }

    if (data.split_type === "percentage" && Math.abs(totalPercentage - 100) > 0.01) {
      toast.error("Total percentage must equal 100%")
      return
    }

    if (data.split_type === "exact" && Math.abs(totalExact - totalPaid) > 0.01) {
      toast.error("Total exact amounts must equal total paid amount")
      return
    }

    const payload: CreateExpensePayload = {
      title: data.title?.trim() || "Expense",
      expense_date: data.expense_date,
      split_type: data.split_type,
      total_amount: totalPaid.toFixed(2),
      payers: Object.values(data.payers)
        .filter(p => p.selected && parseFloat(p.amount || "0") > 0)
        .map(p => ({ user: p.user, paid_amount: parseFloat(p.amount || "0").toFixed(2) })),
      participants: Object.values(data.participants)
        .filter(p => {
          if (!p.selected) return false
          if (data.split_type === "exact") return parseFloat(p.exact_amount || "0") > 0
          if (data.split_type === "percentage") return parseFloat(p.percentage || "0") > 0
          return true // for equal split, keep all selected
        })
        .map(p => {
          const res: ExpenseParticipantPayload = { user: p.user }
          if (data.split_type === "exact") res.owed_amount = parseFloat(p.exact_amount || "0").toFixed(2)
          if (data.split_type === "percentage") res.percentage = parseFloat(p.percentage || "0").toFixed(2)
          return res
        })
    }

    if (initialData) {
      updateExpense(payload, {
        onSuccess: () => {
          toast.success("Expense updated successfully")
          setOpen(false)
        },
        onError: (err) => {
          toast.apiError(err)
        }
      })
    } else {
      createExpense(payload, {
        onSuccess: () => {
          toast.success("Expense added successfully")
          setOpen(false)
        },
        onError: (err) => {
          toast.apiError(err)
        }
      })
    }
  }

  const renderMainStep = () => {
    const selectedPayers = Object.values(payers).filter(p => p.selected)

    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
          <div className="flex -space-x-2">
            {members.slice(0, 3).map(m => (
              <Avatar key={m.id} className="size-8 border-2 border-white ring-1 ring-slate-100 shadow-sm">
                <AvatarImage src={m.user_info.avatar || undefined} />
                <AvatarFallback className="text-[10px] bg-slate-100">{getInitials(m.user_info.name)}</AvatarFallback>
              </Avatar>
            ))}
          </div>
          <div className="text-sm font-medium text-slate-600">
            You are adding a payment in <br /><span className="text-slate-900 font-bold">this group</span>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Who Paid?</div>
          <div className="space-y-3">
            {selectedPayers.map(p => {
              const member = members.find(m => m.user === p.user)
              const isMe = p.user === me?.id
              return (
                <div key={p.user} className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarImage src={member?.user_info.avatar || undefined} />
                    <AvatarFallback>{getInitials(member?.user_info.name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 truncate">
                      {isMe ? "You" : member?.user_info.name}
                    </span>
                    {isMe && <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">YOU</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                      <Input
                        type="number"
                        className="w-24 pl-6 text-right font-semibold h-9 rounded-lg"
                        placeholder="0.00"
                        value={p.amount}
                        onChange={(e) => setValue('payers', { ...payers, [String(p.user)]: { ...p, amount: e.target.value } })}
                      />
                    </div>
                    {selectedPayers.length > 1 && (
                      <button onClick={() => setValue('payers', { ...payers, [String(p.user)]: { ...p, selected: false } })} className="text-slate-400 hover:text-rose-500">
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}

            <Button variant="outline" className="w-full border-dashed text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50" onClick={() => setStep('who_paid')}>
              <Plus className="size-4 mr-2" /> Add another payer
            </Button>

            <div className="flex justify-between items-center pt-2 px-1">
              <span className="text-sm font-medium text-slate-600">Total paid by all</span>
              <span className="text-lg font-bold text-emerald-500">{formatCurrency(totalPaid)}</span>
            </div>
          </div>
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Payment Details</div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Note (optional)</label>
              <Input
                placeholder="What is this payment for?"
                className="h-12 rounded-xl"
                {...register("title")}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 mb-1.5 block">Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                <Input
                  type="date"
                  className="pl-10 h-12 rounded-xl"
                  {...register("expense_date")}
                />
              </div>
            </div>
          </div>
        </div>

        <Button
          className="w-full h-12 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-base font-semibold"
          onClick={() => {
            if (totalPaid <= 0) {
              toast.error("Please enter the amount paid")
              return
            }
            setStep('split_type')
          }}
        >
          Next
        </Button>
      </div>
    )
  }

  const renderWhoPaidStep = () => {
    const filteredMembers = members.filter(m => m.user_info.name?.toLowerCase().includes(searchQuery.toLowerCase()) || m.user_info.email.toLowerCase().includes(searchQuery.toLowerCase()))
    return (
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <Input
            placeholder="Search members"
            className="pl-10 h-12 rounded-xl bg-slate-50 border-transparent focus:bg-white"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3 px-1">Select Payers</div>
          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {filteredMembers.map(m => {
              const key = String(m.user)
              const p = payers[key]
              if (!p) return null
              const isMe = m.user === me?.id
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl cursor-pointer"
                  onClick={() => setValue('payers', { ...payers, [key]: { ...p, selected: !p.selected } })}
                >
                  <div className={`size-5 rounded flex items-center justify-center border transition-colors ${p.selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                    {p.selected && <svg className="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                  </div>
                  <Avatar className="size-8">
                    <AvatarImage src={m.user_info.avatar || undefined} />
                    <AvatarFallback>{m.user_info.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 truncate">{isMe ? "You" : m.user_info.name}</span>
                    {isMe && <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">YOU</span>}
                  </div>
                  {p.selected ? (
                    <div className="relative w-24" onClick={e => e.stopPropagation()}>
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                      <Input
                        type="number"
                        className="pl-5 text-right font-semibold h-8 rounded-md bg-white"
                        placeholder="0.00"
                        value={p.amount}
                        onChange={(e) => setValue('payers', { ...payers, [key]: { ...p, amount: e.target.value } })}
                      />
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400 font-medium">{formatCurrency(0)}</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex justify-between items-center mb-6">
          <span className="text-sm font-medium text-slate-600">Total paid by all</span>
          <span className="text-lg font-bold text-emerald-500">{formatCurrency(totalPaid)}</span>
        </div>

        <Button className="w-full h-12 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-base font-semibold" onClick={() => setStep('main')}>
          Done
        </Button>
      </div>
    )
  }

  const renderSplitTypeStep = () => {
    return (
      <div className="space-y-6">
        <div className="bg-slate-50 p-4 rounded-xl text-center">
          <div className="text-sm text-slate-500 font-medium mb-1">Total amount</div>
          <div className="text-3xl font-bold text-slate-800">{formatCurrency(totalPaid)}</div>
        </div>

        <div>
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Choose Split Type</div>
          <div className="space-y-3">
            <div
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${splitType === 'equal' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
              onClick={() => setValue('split_type', 'equal')}
            >
              <div className="bg-indigo-100 text-indigo-600 p-2.5 rounded-lg"><Users className="size-5" /></div>
              <div>
                <div className="font-bold text-slate-800 text-sm mb-0.5">Split equally</div>
                <div className="text-xs text-slate-500 font-medium">Split the amount equally among all selected members</div>
              </div>
            </div>

            <div
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${splitType === 'percentage' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
              onClick={() => setValue('split_type', 'percentage')}
            >
              <div className="bg-emerald-100 text-emerald-600 p-2.5 rounded-lg"><Percent className="size-5" /></div>
              <div>
                <div className="font-bold text-slate-800 text-sm mb-0.5">Split percentage-wise</div>
                <div className="text-xs text-slate-500 font-medium">Split the amount based on percentage</div>
              </div>
            </div>

            <div
              className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${splitType === 'exact' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}
              onClick={() => setValue('split_type', 'exact')}
            >
              <div className="bg-amber-100 text-amber-600 p-2.5 rounded-lg"><Wallet className="size-5" /></div>
              <div>
                <div className="font-bold text-slate-800 text-sm mb-0.5">Split exact</div>
                <div className="text-xs text-slate-500 font-medium">Enter exact amount for each member</div>
              </div>
            </div>
          </div>
        </div>

        <Button className="w-full h-12 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-base font-semibold" onClick={() => setStep('split_details')}>
          Continue
        </Button>
      </div>
    )
  }

  const renderSplitDetailsStep = () => {
    const isAllSelected = activeParticipantsCount === members.length

    const toggleAll = () => {
      const nextState = !isAllSelected
      const nextParticipants = { ...participants }
      Object.keys(nextParticipants).forEach(k => {
        nextParticipants[k] = { ...nextParticipants[k], selected: nextState }
      })
      setValue('participants', nextParticipants)
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
          <div>
            <div className="text-xs text-slate-500 font-medium mb-1">Total amount</div>
            <div className="text-xl font-bold text-slate-800">{formatCurrency(totalPaid)}</div>
          </div>
          <div className="text-right">
            {splitType === 'equal' && (
              <>
                <div className="text-xs text-slate-500 font-medium mb-1">Each person pays</div>
                <div className="text-xl font-bold text-slate-800">{formatCurrency(equalAmountPerPerson)}</div>
                <div className="text-[10px] text-indigo-600 font-bold">({activeParticipantsCount} members)</div>
              </>
            )}
            {splitType === 'percentage' && (
              <>
                <div className="text-xs text-slate-500 font-medium mb-1">Total percentage</div>
                <div className={`text-xl font-bold ${Math.abs(totalPercentage - 100) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}`}>{totalPercentage}%</div>
              </>
            )}
            {splitType === 'exact' && (
              <>
                <div className="text-xs text-slate-500 font-medium mb-1">Total entered</div>
                <div className={`text-xl font-bold ${Math.abs(totalExact - totalPaid) < 0.01 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatCurrency(totalExact)}</div>
              </>
            )}
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-3 px-1">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Members</div>
            {splitType === 'equal' && (
              <div className="flex items-center gap-2 cursor-pointer group" onClick={toggleAll}>
                <span className="text-xs font-bold text-indigo-600 group-hover:text-indigo-700">Select all</span>
                <div className={`size-4 rounded flex items-center justify-center border transition-colors ${isAllSelected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}>
                  {isAllSelected && <svg className="size-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                </div>
              </div>
            )}
            {splitType === 'percentage' && <span className="text-[10px] font-bold text-emerald-500">Total must be 100%</span>}
            {splitType === 'exact' && <span className="text-[10px] font-bold text-emerald-500">Total must be {formatCurrency(totalPaid)}</span>}
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
            {members.map(m => {
              const key = String(m.user)
              const p = participants[key]
              if (!p) return null
              const isMe = m.user === me?.id
              return (
                <div key={m.id} className="flex items-center gap-3 py-1">
                  <Avatar className="size-8">
                    <AvatarImage src={m.user_info.avatar || undefined} />
                    <AvatarFallback>{m.user_info.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 truncate">{isMe ? "You" : m.user_info.name}</span>
                    {isMe && <span className="bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm">YOU</span>}
                  </div>

                  {splitType === 'equal' && (
                    <div className="flex items-center gap-3">
                      {p.selected ? (
                        <span className="text-sm font-bold text-slate-600">{formatCurrency(equalAmountPerPerson)}</span>
                      ) : (
                        <span className="text-sm font-medium text-slate-300">{formatCurrency(0)}</span>
                      )}
                      <div
                        className={`size-5 rounded flex items-center justify-center border cursor-pointer transition-colors ${p.selected ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 bg-white'}`}
                        onClick={() => setValue('participants', { ...participants, [key]: { ...p, selected: !p.selected } })}
                      >
                        {p.selected && <svg className="size-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                      </div>
                    </div>
                  )}

                  {splitType === 'percentage' && (
                    <div className="flex items-center gap-2">
                      <div className="relative w-16">
                        <Input
                          type="number"
                          className="pr-6 text-right font-semibold h-8 rounded-md"
                          value={p.percentage ?? ""}
                          onChange={(e) => setValue('participants', { ...participants, [key]: { ...p, percentage: e.target.value, selected: true } })}
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
                      </div>
                      <span className="w-16 text-right text-xs font-bold text-slate-400">
                        {formatCurrency((parseFloat(p.percentage || "0") * totalPaid) / 100)}
                      </span>
                    </div>
                  )}

                  {splitType === 'exact' && (
                    <div className="relative w-28">
                      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-500 text-sm">₹</span>
                      <Input
                        type="number"
                        className="pl-5 text-right font-semibold h-8 rounded-md"
                        placeholder="0.00"
                        value={p.exact_amount ?? ""}
                        onChange={(e) => setValue('participants', { ...participants, [key]: { ...p, exact_amount: e.target.value, selected: true } })}
                      />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-indigo-50/50 text-indigo-700 rounded-lg p-3 flex items-start gap-2 text-xs font-medium">
          <AlertCircle className="size-4 shrink-0 mt-0.5" />
          {splitType === 'equal' && `Amount will be split equally among ${activeParticipantsCount} members`}
          {splitType === 'percentage' && `Total percentage must be 100%`}
          {splitType === 'exact' && `Total entered amount must be equal to total amount`}
        </div>

        <Button
          className="w-full h-12 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-base font-semibold"
          onClick={() => handleCreate({
            title: watch('title') || '',
            expense_date: watch('expense_date'),
            split_type: watch('split_type'),
            payers: watch('payers'),
            participants: watch('participants')
          })}
          disabled={isPending}
        >
          {isPending ? "Creating..." : "Done"}
        </Button>
      </div>
    )
  }

  const titles = {
    main: initialData ? "Update expense" : "Add payment",
    who_paid: "Who paid?",
    split_type: "Split expense",
    split_details: splitType === 'equal' ? 'Split equally' : splitType === 'percentage' ? 'Split percentage-wise' : 'Split exact'
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="rounded-lg font-semibold h-12 px-4 cursor-pointer bg-indigo-700 hover:bg-indigo-600 shadow-lg shadow-indigo-100">
            <Plus className="mr-2 size-5" />
            Add expense
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[540px] p-6 bg-white gap-0">
        <DialogHeader className="mb-6">
          <div className="flex items-center justify-between">
            {step !== 'main' ? (
              <div className="flex items-center gap-2 cursor-pointer text-slate-800 hover:text-slate-600" onClick={() => setStep(step === 'who_paid' || step === 'split_type' ? 'main' : 'split_type')}>
                <ChevronLeft className="size-5" />
                <DialogTitle className="text-xl font-bold">{titles[step]}</DialogTitle>
              </div>
            ) : (
              <DialogTitle className="text-xl font-bold">{titles[step]}</DialogTitle>
            )}
          </div>
        </DialogHeader>

        {step === 'main' && renderMainStep()}
        {step === 'who_paid' && renderWhoPaidStep()}
        {step === 'split_type' && renderSplitTypeStep()}
        {step === 'split_details' && renderSplitDetailsStep()}

      </DialogContent>
    </Dialog>
  )
}
