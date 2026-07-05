import { useState, useRef, useEffect } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import {
  Sparkles,
  Send,
  Loader2,
  Edit3,
  CheckCircle2,
  ArrowRight,
  Bot,
  Zap,
  TrendingUp,
  Users,
  Receipt,
  Wallet,
} from "lucide-react"
import { useGroupAIChatHistory } from "./queries"
import { useSendAIChatMessage, useActionAIChatMessage } from "./mutations"
import { useCreateExpense, useCreateSettlement } from "@/features/expenses/mutations"
import { useMe } from "@/features/auth/queries"
import { toast } from "@/lib/toast"
import type { GroupMember, ExtractedExpense, ExtractedSettlement } from "./types"
import type { CreateExpensePayload, CreateSettlementPayload, ExpenseParticipantPayload } from "@/features/expenses/types"
import { formatCurrency } from "@/lib/format"
import { ExpenseFormDialog } from "@/features/expenses/CreateExpenseDialog"
import { ProUpgradePrompt } from "@/features/subscription/ProUpgradePrompt"

interface GroupAIChatProps {
  groupId: string
  groupName: string
  members: GroupMember[]
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SUGGESTIONS = [
  { icon: Receipt, label: "Split 500 for dinner equally" },
  { icon: Users, label: "Jatin paid Gaurang ₹200" },
  { icon: TrendingUp, label: "What did we spend last month?" },
  { icon: Wallet, label: "Who owes the most in this group?" },
]

import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

/** Renders AI response text with robust markdown parsing */
function FormattedMessage({ content }: { content: string }) {
  return (
    <div className="text-sm leading-relaxed space-y-2">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          ul: (props) => <ul className="list-disc ml-5 space-y-1 my-2" {...props} />,
          ol: (props) => <ol className="list-decimal ml-5 space-y-1 my-2" {...props} />,
          table: (props) => (
            <div className="overflow-x-auto my-3 rounded border border-slate-200">
              <table className="w-full text-left text-xs whitespace-nowrap" {...props} />
            </div>
          ),
          thead: (props) => <thead className="bg-slate-50 text-slate-500 font-medium" {...props} />,
          th: (props) => <th className="px-3 py-2 border-b border-slate-200" {...props} />,
          tbody: (props) => <tbody className="divide-y divide-slate-100 bg-white" {...props} />,
          tr: (props) => <tr className="hover:bg-slate-50/50" {...props} />,
          td: (props) => <td className="px-3 py-2 text-slate-700 border-b border-slate-100" {...props} />,
          p: (props) => <p className="mb-2 last:mb-0" {...props} />,
          a: (props) => <a className="text-indigo-600 hover:underline" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-0.5">
      {[0, 1, 2].map(i => (
        <span
          key={i}
          className="inline-block w-2 h-2 rounded-full bg-indigo-400"
          style={{
            animation: "aiDot 1.2s infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes aiDot {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function Avatar({ role, name }: { role: "user" | "assistant"; name?: string }) {
  if (role === "assistant") {
    return (
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
        <Bot className="size-4 text-white" />
      </div>
    )
  }
  const initials = name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() ?? "U"
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-sm">
      <span className="text-[10px] font-bold text-white">{initials}</span>
    </div>
  )
}

export function GroupAIChat({ groupId, groupName, members, open, onOpenChange }: GroupAIChatProps) {
  const { data: historyRes, isLoading: historyLoading } = useGroupAIChatHistory(groupId)
  const messages = historyRes?.data || []
  const { data: meRes } = useMe()
  const me = meRes?.data

  const { mutate: sendMessage, isPending: isSending } = useSendAIChatMessage(groupId)
  const { mutate: actionMessage } = useActionAIChatMessage(groupId)
  const { mutate: createExpense, isPending: isCreatingExpense } = useCreateExpense(groupId)
  const { mutate: createSettlement, isPending: isCreatingSettlement } = useCreateSettlement(groupId)

  const [input, setInput] = useState("")
  const [pendingMessage, setPendingMessage] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const [editState, setEditState] = useState<{ msgId: number; payload: ExtractedExpense } | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  // Track which message cards have already been actioned to prevent duplicates
  const [confirmedIds, setConfirmedIds] = useState<Set<number>>(new Set())
  const [discardedIds, setDiscardedIds] = useState<Set<number>>(new Set())

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [historyRes?.data, isSending])

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [input])

  const handleSend = () => {
    if (!input.trim() || isSending) return
    const content = input.trim()
    setInput("")
    setPendingMessage(content)

    sendMessage({ content }, {
      onSuccess: () => {
        setPendingMessage("")
      },
      onError: (err) => {
        toast.apiError(err)
        setInput(content)
        setPendingMessage("")
      },
    })
  }

  const handleSuggestion = (text: string) => {
    setInput(text)
    textareaRef.current?.focus()
  }

  const handleConfirmExpense = (msgId: number, payload: ExtractedExpense) => {
    // Check local set or actual history message
    const msg = messages.find(m => m.id === msgId)
    if (isCreatingExpense || confirmedIds.has(msgId) || msg?.is_actioned) return

    const totalPaid = Object.values(payload.payers)
      .filter(p => p.selected)
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0)

    const apiPayload: CreateExpensePayload = {
      title: payload.title,
      category_id: payload.category_id,
      expense_date: payload.expense_date,
      split_type: payload.split_type,
      total_amount: totalPaid.toFixed(2),
      payers: Object.values(payload.payers)
        .filter(p => p.selected && parseFloat(p.amount) > 0)
        .map(p => ({ user: p.user, paid_amount: parseFloat(p.amount).toFixed(2) })),
      participants: Object.values(payload.participants)
        .filter(p => p.selected)
        .map(p => {
          const res: ExpenseParticipantPayload = { user: p.user }
          if (payload.split_type === "exact" && p.exact_amount) res.owed_amount = parseFloat(p.exact_amount).toFixed(2)
          if (payload.split_type === "percentage" && p.percentage) res.percentage = parseFloat(p.percentage).toFixed(2)
          return res
        })
    }

    createExpense(apiPayload, {
      onSuccess: () => {
        setConfirmedIds(prev => new Set(prev).add(msgId))
        actionMessage({ messageId: msgId })
        toast.success("Expense created successfully!")
      },
      onError: (err) => toast.apiError(err),
    })
  }

  const handleEditExpense = (msgId: number, payload: ExtractedExpense) => {
    setEditState({ msgId, payload })
    setIsEditDialogOpen(true)
  }

  const handleConfirmSettlement = (msgId: number, payload: ExtractedSettlement) => {
    const msg = messages.find(m => m.id === msgId)
    if (isCreatingSettlement || confirmedIds.has(msgId) || msg?.is_actioned) return
    const apiPayload: CreateSettlementPayload = {
      paid_by: payload.paid_by,
      paid_to: payload.paid_to,
      amount: parseFloat(payload.amount).toFixed(2),
      // Omit description if null/undefined — backend serializer rejects null
      ...(payload.description ? { description: payload.description } : {}),
      settled_at: payload.settled_at,
    }
    createSettlement(apiPayload, {
      onSuccess: () => {
        setConfirmedIds(prev => new Set(prev).add(msgId))
        actionMessage({ messageId: msgId })
        toast.success("Settlement recorded successfully!")
      },
      onError: (err) => toast.apiError(err),
    })
  }

  const handleDiscard = (msgId: number) => {
    const msg = messages.find(m => m.id === msgId)
    if (confirmedIds.has(msgId) || discardedIds.has(msgId) || msg?.is_actioned) return
    setDiscardedIds(prev => new Set(prev).add(msgId))
    actionMessage({ messageId: msgId })
  }

  const getMemberName = (userId: number) => {
    const member = members.find(m => m.user === userId || m.user_info?.id === userId)
    return member?.user_info?.name ?? `User #${userId}`
  }

  const getParticipantNames = (payload: ExtractedExpense) => {
    return Object.values(payload.participants)
      .filter(p => p.selected)
      .map(p => getMemberName(p.user))
      .join(", ")
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          className="w-full p-0 flex flex-col border-l border-slate-200/60"
          style={{
            background: "linear-gradient(180deg, #f8faff 0%, #f1f4fd 100%)",
            width: "100%",
            maxWidth: "600px",
          }}
        >
          {me?.subscription_plan !== "PRO" ? (
            <div className="flex-1 overflow-y-auto">
              <ProUpgradePrompt />
            </div>
          ) : (
            <>
              {/* ── Header ── */}
              <SheetHeader className="p-0 shrink-0">
                <div
                  className="relative px-5 pt-5 pb-4 overflow-hidden"
                  style={{
                    background: "linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #6d28d9 100%)",
                  }}
                >
                  {/* decorative blobs */}
                  <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5 blur-2xl" />
                  <div className="absolute bottom-0 left-10 w-20 h-20 rounded-full bg-violet-300/10 blur-xl" />

                  <div className="relative flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center ring-1 ring-white/20 shadow-lg">
                      <Sparkles className="size-5 text-white" />
                    </div>
                    <div>
                      <SheetTitle className="text-white text-base font-bold tracking-tight">
                        Expanzo AI
                      </SheetTitle>
                      <p className="text-indigo-200 text-xs font-medium mt-0.5">
                        Assistant · {groupName}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-white/80 text-[10px] font-semibold">Online</span>
                    </div>
                  </div>

                  {/* Powered-by badge */}
                  <div className="relative mt-3 flex items-center gap-1.5 text-indigo-200/70 text-[10px] font-medium">
                    <Zap className="size-3" />
                    Powered by Gemini · pgvector RAG
                  </div>
                </div>
              </SheetHeader>

              {/* ── Messages ── */}
              <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5" ref={scrollRef}>
                {historyLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Loader2 className="size-7 animate-spin text-indigo-400" />
                      <p className="text-xs font-medium">Loading conversation…</p>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  /* ── Empty state ── */
                  <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
                    <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center shadow-sm">
                      <Sparkles className="size-7 text-indigo-500" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold text-slate-700 text-sm">Hi! I'm your group assistant.</p>
                      <p className="text-slate-400 text-xs mt-1.5 leading-relaxed px-6">
                        Ask me to record expenses, settle payments, or answer questions about your group's history.
                      </p>
                    </div>

                    {/* Suggestion chips */}
                    <div className="w-full space-y-2.5 px-2">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">
                        Try asking
                      </p>
                      <div className="grid grid-cols-1 gap-2">
                        {SUGGESTIONS.map(({ icon: Icon, label }) => (
                          <button
                            key={label}
                            onClick={() => handleSuggestion(label)}
                            className="flex items-center gap-3 w-full text-left bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 rounded-xl px-4 py-3 transition-all duration-150 group shadow-sm"
                          >
                            <div className="w-7 h-7 rounded-lg bg-indigo-50 group-hover:bg-indigo-100 flex items-center justify-center transition-colors shrink-0">
                              <Icon className="size-3.5 text-indigo-500" />
                            </div>
                            <span className="text-xs text-slate-600 font-medium">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ── Message list ── */
                  messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                    >
                      <Avatar role={msg.role} name={me?.full_name} />

                      <div className={`flex flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"} max-w-[85%] min-w-0 overflow-auto`}>
                        {/* Bubble */}
                        <div
                          className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm min-w-0 ${msg.role === "user"
                            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm shadow-indigo-200"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-sm"
                            }`}
                        >
                          {msg.role === "assistant"
                            ? <FormattedMessage content={msg.content} />
                            : msg.content
                          }
                        </div>

                        {/* ── Expense Card ── */}
                        {msg.expense_payload && (
                          <div className="w-full bg-white rounded-2xl overflow-hidden shadow-md border border-indigo-100/80">
                            {/* Card header with gradient */}
                            <div className="bg-gradient-to-r from-indigo-500 to-violet-600 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-[10px] text-indigo-200 font-semibold uppercase tracking-wider mb-0.5">
                                    New Expense
                                  </p>
                                  <p className="font-bold text-white text-base leading-tight">
                                    {msg.expense_payload.title}
                                  </p>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-black text-white text-xl">
                                    {formatCurrency(
                                      Object.values(msg.expense_payload.payers)
                                        .filter(p => p.selected)
                                        .reduce((s, p) => s + (parseFloat(p.amount) || 0), 0)
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="px-4 py-3 space-y-2.5">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-medium">Split type</span>
                                <span className="capitalize font-semibold text-slate-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                                  {msg.expense_payload.split_type}
                                </span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-medium">Date</span>
                                <span className="font-semibold text-slate-700">{msg.expense_payload.expense_date}</span>
                              </div>
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-medium">Participants</span>
                                <span className="font-semibold text-slate-700 text-right max-w-[55%] truncate">
                                  {getParticipantNames(msg.expense_payload)}
                                </span>
                              </div>
                              {/* Payer breakdown */}
                              <div className="pt-1 border-t border-slate-100">
                                {Object.values(msg.expense_payload.payers).filter(p => p.selected).map(p => (
                                  <div key={p.user} className="flex justify-between text-xs py-0.5">
                                    <span className="text-slate-400">{getMemberName(p.user)} paid</span>
                                    <span className="font-bold text-indigo-600">{formatCurrency(parseFloat(p.amount))}</span>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="px-3 pb-3 flex gap-2">
                              {confirmedIds.has(msg.id) || (msg.is_actioned && !discardedIds.has(msg.id)) ? (
                                <div className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-emerald-50 border border-emerald-200">
                                  <CheckCircle2 className="size-4 text-emerald-500" />
                                  <span className="text-xs font-semibold text-emerald-600">Added to group</span>
                                </div>
                              ) : discardedIds.has(msg.id) ? (
                                <div className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-slate-50 border border-slate-200">
                                  <span className="text-xs font-semibold text-slate-500">Discarded</span>
                                </div>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    className="h-9 px-2 text-xs font-semibold border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    onClick={() => handleDiscard(msg.id)}
                                  >
                                    Discard
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="flex-1 h-9 text-xs font-semibold border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                                    onClick={() => handleEditExpense(msg.id, msg.expense_payload!)}
                                  >
                                    <Edit3 className="size-3.5 mr-1.5" /> Edit
                                  </Button>
                                  <Button
                                    className="flex-1 h-9 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                                    onClick={() => handleConfirmExpense(msg.id, msg.expense_payload!)}
                                    disabled={isCreatingExpense}
                                  >
                                    {isCreatingExpense
                                      ? <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                                      : <CheckCircle2 className="size-3.5 mr-1.5" />
                                    }
                                    {isCreatingExpense ? "Saving…" : "Confirm"}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}

                        {/* ── Settlement Card ── */}
                        {msg.settlement_payload && (
                          <div className="w-full bg-white rounded-2xl overflow-hidden shadow-md border border-emerald-100/80">
                            {/* Card header */}
                            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-4">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <p className="text-[10px] text-emerald-200 font-semibold uppercase tracking-wider mb-0.5">
                                    Payment
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm font-bold text-white">
                                      {getMemberName(msg.settlement_payload.paid_by)}
                                    </span>
                                    <ArrowRight className="size-4 text-emerald-200" />
                                    <span className="text-sm font-bold text-white">
                                      {getMemberName(msg.settlement_payload.paid_to)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <p className="font-black text-white text-xl">
                                    {formatCurrency(parseFloat(msg.settlement_payload.amount))}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Details */}
                            <div className="px-4 py-3 space-y-2">
                              <div className="flex justify-between text-xs">
                                <span className="text-slate-400 font-medium">Date</span>
                                <span className="font-semibold text-slate-700">{msg.settlement_payload.settled_at}</span>
                              </div>
                              {msg.settlement_payload.description && (
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-400 font-medium">Note</span>
                                  <span className="font-semibold text-slate-700">{msg.settlement_payload.description}</span>
                                </div>
                              )}
                            </div>

                            {/* Action */}
                            <div className="px-3 pb-3 flex gap-2">
                              {confirmedIds.has(msg.id) || (msg.is_actioned && !discardedIds.has(msg.id)) ? (
                                <div className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-emerald-50 border border-emerald-200">
                                  <CheckCircle2 className="size-4 text-emerald-500" />
                                  <span className="text-xs font-semibold text-emerald-600">Payment recorded</span>
                                </div>
                              ) : discardedIds.has(msg.id) ? (
                                <div className="flex-1 flex items-center justify-center gap-2 h-9 rounded-lg bg-slate-50 border border-slate-200">
                                  <span className="text-xs font-semibold text-slate-500">Discarded</span>
                                </div>
                              ) : (
                                <>
                                  <Button
                                    variant="outline"
                                    className="h-9 px-2 text-xs font-semibold border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                                    onClick={() => handleDiscard(msg.id)}
                                  >
                                    Discard
                                  </Button>
                                  <Button
                                    className="flex-1 h-9 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-200"
                                    onClick={() => handleConfirmSettlement(msg.id, msg.settlement_payload!)}
                                    disabled={isCreatingSettlement}
                                  >
                                    {isCreatingSettlement
                                      ? <Loader2 className="size-3.5 mr-1.5 animate-spin" />
                                      : <CheckCircle2 className="size-3.5 mr-1.5" />
                                    }
                                    {isCreatingSettlement ? "Recording…" : "Confirm Payment"}
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}

                {/* ── Optimistic User Message ── */}
                {pendingMessage && (
                  <div className="flex gap-2.5 flex-row-reverse">
                    <Avatar role="user" name={me?.full_name} />
                    <div className="flex flex-col gap-2 items-end max-w-[82%]">
                      <div className="rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-sm bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-tr-sm shadow-indigo-200">
                        {pendingMessage}
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Typing indicator ── */}
                {isSending && (
                  <div className="flex gap-2.5 flex-row">
                    <Avatar role="assistant" />
                    <div className="bg-white border border-slate-200/80 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <TypingDots />
                    </div>
                  </div>
                )}
              </div>

              {/* ── Input ── */}
              <div className="shrink-0 px-4 pb-4 pt-3 bg-white/80 backdrop-blur border-t border-slate-200/60">
                <div className="relative flex items-end gap-2 bg-white border border-slate-200 rounded-2xl px-3 py-2 shadow-sm focus-within:ring-2 focus-within:ring-indigo-400/30 focus-within:border-indigo-300 transition-all">
                  <Textarea
                    ref={textareaRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Ask me to split an expense, settle up, or ask about your group…"
                    className="flex-1 resize-none border-0 shadow-none focus-visible:ring-0 text-sm bg-transparent p-0 min-h-[24px] max-h-[120px] leading-relaxed placeholder:text-slate-400"
                    disabled={isSending}
                    rows={1}
                  />
                  <Button
                    size="icon"
                    className={`shrink-0 w-9 h-9 rounded-xl transition-all ${input.trim() && !isSending
                      ? "bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
                      : "bg-slate-100 text-slate-400 cursor-not-allowed"
                      }`}
                    onClick={handleSend}
                    disabled={!input.trim() || isSending}
                  >
                    {isSending
                      ? <Loader2 className="size-4 animate-spin text-white" />
                      : <Send className="size-4 text-white" />
                    }
                  </Button>
                </div>
                <p className="text-[10px] text-center text-slate-400 mt-2 font-medium">
                  Press <kbd className="bg-slate-100 px-1 rounded text-slate-500">Enter</kbd> to send · <kbd className="bg-slate-100 px-1 rounded text-slate-500">Shift+Enter</kbd> for new line
                </p>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {isEditDialogOpen && editState && (
        <ExpenseFormDialog
          groupId={groupId}
          members={members}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          prefillData={editState.payload}
          onSuccess={() => {
            setConfirmedIds(prev => new Set(prev).add(editState.msgId))
            actionMessage({ messageId: editState.msgId })
            setIsEditDialogOpen(false)
          }}
        />
      )}
    </>
  )
}
