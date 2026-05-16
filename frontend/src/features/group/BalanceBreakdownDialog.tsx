import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Coins, Wallet, ChevronDown, ChevronUp, Bell, CheckCircle2 } from "lucide-react"
import type { GroupBalancesResponse, MemberBalance, GroupBalance } from "@/features/expenses/types"
import { formatCurrency, getInitials } from "@/lib/format"
import { useMe } from "@/features/auth/queries"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface BalanceBreakdownDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    data?: GroupBalancesResponse
}

function MemberBalanceItem({
    member,
    transactions,
    meId
}: {
    member: MemberBalance,
    transactions: GroupBalance[],
    meId?: number
}) {
    const [isExpanded, setIsExpanded] = useState(false)
    const balance = parseFloat(member.balance)
    const isYou = meId === member.user_id

    let statusText = "is settled up"
    let statusColor = "text-slate-400"
    let amountColor = "text-slate-400"

    if (balance > 0) {
        statusText = "gets back"
        statusColor = "text-slate-900"
        amountColor = "text-emerald-500"
    } else if (balance < 0) {
        statusText = "owes"
        statusColor = "text-slate-900"
        amountColor = "text-rose-500"
    }

    return (
        <div className="border-b border-slate-200 last:border-0 overflow-hidden">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full py-5 flex items-center justify-between hover:bg-slate-50/50 cursor-pointer transition-colors px-4 group"
            >
                <div className="flex items-center gap-4 min-w-0">
                    <Avatar className="size-12 border-2 border-white shadow-sm shrink-0">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.email}`} />
                        <AvatarFallback className="bg-slate-100 text-slate-500 text-xs font-black">
                            {getInitials(member.name)}
                        </AvatarFallback>
                    </Avatar>

                    <div className="flex flex-col items-start min-w-0">
                        <div className="flex items-center gap-2 max-w-full">
                            <span className="font-bold text-[15px] text-slate-900 truncate">
                                {isYou ? 'You' : member.name}
                            </span>
                            {isYou && (
                                <span className="text-[10px] text-indigo-500 font-black uppercase bg-indigo-50 px-1.5 py-0.5 rounded-md shrink-0">
                                    You
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1 text-[13px]">
                            <span className={`font-medium ${statusColor}`}>{statusText}</span>
                            {balance !== 0 && (
                                <>
                                    <span className={`font-black ${amountColor}`}>
                                        {formatCurrency(Math.abs(balance))}
                                    </span>
                                    <span className="text-slate-500 font-medium whitespace-nowrap">in total</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="text-slate-300 group-hover:text-slate-400 transition-colors shrink-0 ml-4">
                    {isExpanded ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
                </div>
            </button>

            {isExpanded && (
                <div className="bg-slate-50/50 pb-6 pt-2 px-4 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {transactions.length === 0 ? (
                        <p className="text-xs text-slate-400 font-medium italic pl-16">
                            No active settlements for this member.
                        </p>
                    ) : (
                        <div className="pl-16 space-y-5">
                            {transactions.map((t, i) => {
                                const isOwedToMember = t.to_user === member.user_id
                                const otherUser = isOwedToMember ? t.from_user_info : t.to_user_info

                                return (
                                    <div key={i} className="flex flex-col gap-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="size-8 border border-white shadow-sm shrink-0">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUser.email}`} />
                                                <AvatarFallback className="text-[10px] font-black uppercase">
                                                    {getInitials(otherUser.name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <p className="text-[13px] text-slate-600 font-medium leading-tight">
                                                <span className="font-bold text-slate-900">{otherUser.name}</span>
                                                {isOwedToMember ? ' owes ' : ' to be paid to '}
                                                <span className="font-black text-indigo-600 mx-0.5">{formatCurrency(t.amount)}</span>
                                                {isOwedToMember ? ` to ${isYou ? 'you' : member.name.split(' ')[0]}` : `by ${isYou ? 'you' : member.name.split(' ')[0]}`}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3 ml-11">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-4 rounded-full text-[11px] font-bold border-slate-200 text-slate-600 hover:bg-white hover:text-indigo-600 transition-all cursor-pointer"
                                            >
                                                <Bell className="size-3 mr-1.5" />
                                                Remind...
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="h-8 px-4 rounded-full text-[11px] font-bold border-slate-200 text-slate-600 hover:bg-white hover:text-indigo-600 transition-all cursor-pointer"
                                            >
                                                <CheckCircle2 className="size-3 mr-1.5" />
                                                Settle up
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export const BalanceBreakdownDialog = ({ open, onOpenChange, data }: BalanceBreakdownDialogProps) => {
    const { data: meRes } = useMe()
    const me = meRes?.data

    const individualBalances = data?.individual_balances || []
    const simplifiedTransactions = data?.simplified_transactions || []

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-xl p-0 overflow-hidden rounded-[40px] border-none shadow-2xl [&>button]:text-white [&>button]:hover:text-dark/80 [&>button]:top-4 [&>button]:right-4">
                <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-8 pb-20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Coins className="size-32 -rotate-12" />
                    </div>

                    <DialogHeader className="relative z-10">
                        <DialogTitle className="text-2xl font-black text-white flex items-center gap-3">
                            <Wallet className="size-6" />
                            Balances
                        </DialogTitle>
                        <p className="text-indigo-100/70 text-[11px] font-bold uppercase tracking-[0.2em] mt-1">
                            Group financial status
                        </p>
                    </DialogHeader>
                </div>

                <div className="bg-white -mt-16 pt-6 pb-8 rounded-t-[40px] relative z-20 min-h-[500px] flex flex-col">
                    <div className="flex-1 max-h-[600px] overflow-y-auto custom-scrollbar px-2">
                        {individualBalances.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                                <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mb-4">
                                    <Coins className="size-10 text-slate-200" />
                                </div>
                                <p className="text-slate-900 font-black text-lg">Everyone is settled up!</p>
                                <p className="text-slate-400 text-sm mt-1 max-w-[240px]">
                                    Add an expense to start tracking balances.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {individualBalances.map((member) => (
                                    <MemberBalanceItem
                                        key={member.user_id}
                                        member={member}
                                        meId={me?.id}
                                        transactions={simplifiedTransactions.filter(t =>
                                            t.from_user === member.user_id || t.to_user === member.user_id
                                        )}
                                    />
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="mt-6 pt-6 px-8 border-t border-slate-50">
                        <p className="text-[11px] text-slate-400 text-center font-medium leading-relaxed uppercase tracking-wider">
                            Showing simplified balances to minimize total payments
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
