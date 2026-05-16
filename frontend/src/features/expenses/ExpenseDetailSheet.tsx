import {
    Sheet,
    SheetContent,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    X, Wallet, Calendar, FileText,
    ArrowUpCircle,
    Trash2, ChevronRight, PieChart
} from "lucide-react"
import { formatCurrency, getInitials } from "@/lib/format"
import { format } from "date-fns"
import type { ActivityItem, Expense, Settlement, SettlementActivity } from "./types"
import { useExpenseDetail, useSettlementDetail } from "./queries"
import { Skeleton } from "@/components/ui/skeleton"
import { useMe } from "@/features/auth/queries"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { useState } from "react"
import { Edit2 } from "lucide-react"
import type { EditActivity } from "./types"

interface ExpenseDetailSheetProps {
    item: ActivityItem | null
    groupName: string
    open: boolean
    onOpenChange: (open: boolean) => void
    onDelete?: (id: number, type: 'expense' | 'settlement') => void
    onEdit?: (item: EditActivity) => void
    canManageAll?: boolean
}

export const ExpenseDetailSheet = ({ item, groupName, open, onOpenChange, onDelete, onEdit, canManageAll }: ExpenseDetailSheetProps) => {
    const { data: meRes } = useMe()
    const me = meRes?.data

    const isExpense = item?.type === 'expense'
    const isSettlement = item?.type === 'settlement'

    const { data: expenseDetail, isLoading: expenseLoading } = useExpenseDetail(
        isExpense ? item?.id.toString() : undefined
    )
    const { data: settlementDetail, isLoading: settlementLoading } = useSettlementDetail(
        isSettlement ? item?.id.toString() : undefined
    )

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

    if (!item) return null

    const isLoading = expenseLoading || settlementLoading
    const detail = isExpense ? expenseDetail?.data : settlementDetail?.data

    const title = isExpense ? "Expense details" : "Payment details"
    const amount = isExpense ? parseFloat(item.total_amount) : parseFloat(item.amount)
    const date = isExpense ? new Date(item.expense_date) : new Date(item.settled_at)

    const canEditOrDelete = canManageAll || (me && item.created_by === me.id)


    const participants = (detail as Expense)?.participants || []
    const payers = (detail as Expense)?.payers || []

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="right-4! top-4! bottom-4! h-[calc(100vh-32px)]! w-full sm:max-w-[480px]! rounded-[32px] p-0 flex flex-col gap-0 border-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] overflow-hidden bg-white"
            >
                <div className="flex flex-col h-full relative">
                    {/* Custom Close Button */}
                    <button
                        onClick={() => onOpenChange(false)}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-slate-50 text-slate-400 transition-colors z-10"
                    >
                        <X className="size-5" />
                    </button>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {/* Header Section */}
                        <div className="p-8 pb-6">
                            <h2 className="text-[20px] font-bold text-slate-900 mb-6">{title}</h2>

                            <div className="flex items-center justify-between bg-emerald-50/50 p-6 rounded-[24px] relative overflow-hidden group">
                                <div className="absolute right-[-10px] top-[-10px] opacity-[0.03] group-hover:scale-110 transition-transform duration-500">
                                    <Wallet className="size-32 -rotate-12" />
                                </div>
                                <div className="flex items-center gap-4 relative z-10">
                                    <div className="size-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-100">
                                        <ArrowUpCircle className="size-6" />
                                    </div>
                                    <div>
                                        <p className="text-[13px] font-bold text-emerald-600 mb-0.5">
                                            {isExpense ? "Total Expense" : "Total Settlement"}
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <span className="text-3xl font-black text-slate-900">{formatCurrency(amount)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* User Involved */}
                        <div className="px-8 mb-8">
                            {isLoading ? (
                                <Skeleton className="h-20 w-full rounded-2xl" />
                            ) : (
                                <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="size-10 border-2 border-white shadow-sm">
                                            <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${isExpense ? (detail as Expense)?.created_by_info?.email : (detail as Settlement)?.paid_by_info?.email}`} />
                                            <AvatarFallback>{getInitials(isExpense ? (detail as Expense)?.created_by_info?.name : (detail as Settlement)?.paid_by_info?.name)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-slate-900 leading-tight">
                                                    {(isExpense ? (detail as Expense)?.created_by_info?.name : (detail as Settlement)?.paid_by_info?.name)}
                                                </p>
                                                {(isExpense ? (detail as Expense)?.created_by_info?.email : (detail as Settlement)?.paid_by_info?.email) === me?.email && (
                                                    <div className="bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">You</div>
                                                )}
                                            </div>
                                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                                                {isExpense ? "Created by" : "Paid by"}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{isExpense ? "Group" : "Paid to"}</p>
                                        <div className="flex items-center justify-end gap-2">
                                            <p className="text-sm font-bold text-slate-700">
                                                {isExpense ? groupName : (detail as Settlement)?.paid_to_info?.name}
                                            </p>
                                            {(!isExpense && (detail as Settlement)?.paid_to_info?.email === me?.email) && (
                                                <div className="bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">You</div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Metadata List */}
                        <div className="px-8 space-y-5 mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                        <Calendar className="size-4" />
                                    </div>
                                    <span className="text-[14px] font-bold text-slate-400">{isExpense ? "Expense date" : "Settled on"}</span>
                                </div>
                                <span className="text-[14px] font-bold text-slate-700">{format(date, "MMM d, yyyy")}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400">
                                        <FileText className="size-4" />
                                    </div>
                                    <span className="text-[14px] font-bold text-slate-400">{isExpense ? "Description" : "Note"}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-[14px] font-bold text-slate-700">
                                        {isExpense ? item.title : (item as SettlementActivity).description || "Settlement"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Amount Summary Section */}
                        {isExpense && (
                            <div className="px-8 mb-8">
                                <div className="bg-slate-50/50 rounded-[24px] p-6 border border-slate-100">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Amount Summary</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-500">Total amount</span>
                                            <span className="text-sm font-black text-slate-900">{formatCurrency(amount)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-bold text-slate-500">Your share</span>
                                            <span className="text-sm font-black text-slate-900">
                                                {formatCurrency(Math.abs(parseFloat(item.my_net)))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-bold text-slate-500">Split type</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                                <PieChart className="size-3 text-indigo-600" />
                                                <span className="text-[11px] font-black text-slate-700 uppercase tracking-tight">
                                                    Split {(detail as Expense)?.split_type}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Who Paid Section */}
                        {isExpense && (
                            <div className="px-8 mb-8">
                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Who Paid</h3>
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-[13px] font-bold text-slate-500">Total paid by you</span>
                                    <span className="text-[15px] font-black text-emerald-500">{formatCurrency(parseFloat(item.my_paid))}</span>
                                </div>
                                <div className="space-y-2">
                                    {payers.map((payer) => (
                                        <div key={payer.id} className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors rounded-xl group cursor-pointer">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-8">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${payer.user_info.email}`} />
                                                    <AvatarFallback>{getInitials(payer.user_info.name)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[14px] font-bold text-slate-900">
                                                        {payer.user_info.name}
                                                    </span>
                                                    {payer.user_info.email === me?.email && (
                                                        <div className="bg-indigo-600 text-white text-[8px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter">You</div>
                                                    )}
                                                </div>
                                            </div>
                                            <span className="text-[14px] font-black text-slate-900">{formatCurrency(parseFloat(payer.paid_amount))}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Members List Section */}
                        {isExpense && (
                            <div className="px-8 mb-10">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Members ({participants.length})</h3>
                                    <div className="flex items-center gap-12 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Share (₹)</span>
                                        <span>Percentage</span>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    {participants.map((p, i) => (
                                        <div key={i} className="flex items-center justify-between group">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="size-7">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user_info.email}`} />
                                                    <AvatarFallback className="text-[10px] font-bold">{getInitials(p.user_info.name)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[13px] font-bold text-slate-900 truncate max-w-[120px]">
                                                        {p.user_info.name}
                                                    </span>
                                                    {p.user_info.email === me?.email && (
                                                        <div className="bg-indigo-600 text-white text-[7px] px-1 py-0.5 rounded-sm font-black uppercase tracking-tighter">You</div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8 text-[13px] font-black text-slate-700">
                                                <span className="w-16 text-right">{formatCurrency(parseFloat(p.owed_amount))}</span>
                                                <span className="w-12 text-right text-slate-400">{p.percentage ? `${p.percentage}%` : '-'}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Related Expense */}
                        <div className="px-8 mb-10">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Related Expense</h3>
                            <div className="p-4 bg-slate-50/50 hover:bg-slate-50 transition-colors rounded-[24px] border border-slate-100 flex items-center justify-between cursor-pointer group">
                                <div className="flex items-center gap-4">
                                    <div className="size-10 rounded-2xl bg-white shadow-sm flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                                        <Wallet className="size-5" />
                                    </div>
                                    <div>
                                        <p className="text-[14px] font-bold text-slate-900 leading-tight">Lunch at Cafe</p>
                                        <p className="text-[11px] font-bold text-slate-400 mt-0.5">
                                            You paid ₹250.00 • May 10, 2024
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight className="size-4 text-slate-300 group-hover:translate-x-1 transition-transform" />
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    {canEditOrDelete && (
                        <div className="p-6 pt-2 border-t border-slate-100 bg-slate-50/30 flex items-center gap-3">
                            <Button
                                variant="ghost"
                                className="flex-1 h-[52px] text-indigo-600 font-bold text-[15px] hover:bg-indigo-50 hover:text-indigo-700 rounded-2xl gap-2"
                                onClick={() => detail && onEdit?.({ ...detail, type: isExpense ? 'expense' : 'settlement' } as EditActivity)}
                            >
                                <Edit2 className="size-4" />
                                Update
                            </Button>
                            <Button
                                variant="ghost"
                                className="flex-1 h-[52px] text-rose-500 font-bold text-[15px] hover:bg-rose-50 hover:text-rose-700 rounded-2xl gap-2"
                                onClick={() => setShowDeleteConfirm(true)}
                            >
                                <Trash2 className="size-4" />
                                {isExpense ? "Delete expense" : "Delete payment"}
                            </Button>
                        </div>
                    )}
                </div>

                <ConfirmDialog
                    open={showDeleteConfirm}
                    onOpenChange={setShowDeleteConfirm}
                    onConfirm={() => {
                        onDelete?.(item.id, item.type)
                        setShowDeleteConfirm(false)
                    }}
                    title={`Delete ${isExpense ? 'Expense' : 'Settlement'}?`}
                    description={`Are you sure you want to delete this ${isExpense ? 'expense' : 'settlement'}? This action cannot be undone.`}
                    confirmText="Delete"
                    variant="destructive"
                />
            </SheetContent>
        </Sheet>
    )
}
