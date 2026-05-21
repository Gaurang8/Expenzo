import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Plus, Wallet, ChevronRight, Users, Calendar } from "lucide-react"
import { useParams } from "react-router-dom"
import { useGroupDetail } from "./queries"


import { useGroupActivities, useGroupBalances } from "@/features/expenses/queries"
import { useMe } from "@/features/auth/queries"
import { useDeleteExpense, useDeleteSettlement } from "@/features/expenses/mutations"
import { ExpenseFormDialog } from "@/features/expenses/CreateExpenseDialog"
import { SettlementFormDialog } from "@/features/expenses/CreateSettlementDialog"
import { useState } from "react"
import { GroupMembersSheet } from "./GroupMembersSheet"
import { ExpenseDetailSheet } from "@/features/expenses/ExpenseDetailSheet"
import { BalanceBreakdownDialog } from "./BalanceBreakdownDialog"
import type { Expense, Settlement, EditActivity } from "@/features/expenses/types"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { ActivityItem, ExpenseActivity, SettlementActivity } from "@/features/expenses/types"
import { formatCurrency, formatMonthYear, getInitials } from "@/lib/format"
import { toast } from "@/lib/toast"


function ExpenseCard({ item }: { item: ExpenseActivity }) {
    const net = parseFloat(item.my_net)

    let bgColor: string
    let statusLabel: string
    let netDisplay: string

    if (!item.is_involved) {
        bgColor = "bg-slate-100"
        statusLabel = "Not involved"
        netDisplay = "—"
    } else if (net > 0) {
        bgColor = "bg-emerald-400"
        statusLabel = "You are owed"
        netDisplay = `+${formatCurrency(net)}`
    } else if (net < 0) {
        bgColor = "bg-rose-400"
        statusLabel = "You owe"
        netDisplay = `-${formatCurrency(Math.abs(net))}`
    } else {
        bgColor = "bg-slate-100"
        statusLabel = "Settled"
        netDisplay = formatCurrency(0)
    }

    const isLight = bgColor === "bg-slate-100"
    const textColor = isLight ? "text-slate-700" : "text-white"
    const subColor = isLight ? "opacity-60" : "opacity-80"

    const payerName = item.primary_payer_info?.name ?? "Someone"
    const payerTypography = item.payers_count > 1
        ? `${payerName} + ${item.payers_count - 1}`
        : payerName

    return (
        <div className={`${bgColor} ${textColor} p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Wallet className="size-12 -rotate-12 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-center gap-3 mb-2">
                <div className={`${isLight ? 'bg-slate-500/15' : 'bg-white/20'} p-2 rounded-lg`}>
                    <Plus className="size-4" />
                </div>
                <span className="font-semibold text-sm truncate">{item.title}</span>
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <div className="text-xl font-bold">{netDisplay}</div>
                    <div className={`text-[11px] ${subColor} font-medium`}>
                        {payerTypography} paid {formatCurrency(item.total_amount)}
                    </div>
                </div>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${subColor} text-right`}>
                    {statusLabel}
                </div>
            </div>
        </div>
    )
}

function SettlementCard({ item }: { item: SettlementActivity }) {
    const amount = parseFloat(item.amount)

    let bgColor: string
    let statusLabel: string
    let description: string

    if (item.my_role === "payer") {
        bgColor = "bg-slate-700"
        statusLabel = "You paid"
        description = `To ${item.paid_to_info.name}`
    } else if (item.my_role === "receiver") {
        bgColor = "bg-slate-700"
        statusLabel = "You received"
        description = `From ${item.paid_by_info.name}`
    } else {
        bgColor = "bg-slate-100"
        statusLabel = "Settlement"
        description = `${item.paid_by_info.name} → ${item.paid_to_info.name}`
    }

    const isLight = bgColor === "bg-slate-100"
    const textColor = isLight ? "text-slate-700" : "text-white"
    const subColor = isLight ? "opacity-60" : "opacity-80"

    return (
        <div className={`${bgColor} ${textColor} p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer relative overflow-hidden group`}>
            <div className="absolute top-0 right-0 p-3 opacity-10">
                <Wallet className="size-12 -rotate-12 group-hover:scale-110 transition-transform" />
            </div>
            <div className="flex items-center gap-3 mb-2">
                <div className={`${isLight ? 'bg-slate-500/15' : 'bg-white/20'} p-2 rounded-lg`}>
                    <Wallet className="size-4" />
                </div>
                <span className="font-semibold text-sm">Settlement</span>
            </div>
            <div className="flex justify-between items-end">
                <div>
                    <div className="text-xl font-bold">{formatCurrency(amount)}</div>
                    <div className={`text-[11px] ${subColor} font-medium`}>{description}</div>
                </div>
                <div className={`text-[11px] font-bold uppercase tracking-wider ${subColor} text-right`}>
                    {statusLabel}
                </div>
            </div>
        </div>
    )
}

function ActivityCard({ item, onClick }: { item: ActivityItem, onClick: () => void }) {
    return (
        <div onClick={onClick} className="cursor-pointer">
            {item.type === "expense" ? (
                <ExpenseCard item={item} />
            ) : (
                <SettlementCard item={item} />
            )}
        </div>
    )
}


const GroupDetail = () => {
    const { groupId } = useParams()
    const { group, members, isLoading: groupLoading } = useGroupDetail(groupId)
    const { data: meRes } = useMe()
    const me = meRes?.data
    const { data: activitiesRes, isLoading: activitiesLoading } = useGroupActivities(groupId)
    const { data: balancesRes } = useGroupBalances(groupId)
    const balancesData = balancesRes?.data?.simplified_transactions || []

    const deleteExpense = useDeleteExpense(groupId)
    const deleteSettlement = useDeleteSettlement(groupId)

    const [isSheetOpen, setIsSheetOpen] = useState(false)
    const [isBalancesOpen, setIsBalancesOpen] = useState(false)
    const [isDetailOpen, setIsDetailOpen] = useState(false)
    const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null)
    const [isEditOpen, setIsEditOpen] = useState(false)
    const [editingItem, setEditingItem] = useState<EditActivity | null>(null)

    const handleActivityClick = (item: ActivityItem) => {
        setSelectedActivity(item)
        setIsDetailOpen(true)
    }

    const handleDeleteActivity = (id: number, type: 'expense' | 'settlement') => {
        const mutation = type === 'expense' ? deleteExpense : deleteSettlement
        mutation.mutate(id, {
            onSuccess: () => {
                toast.success(`${type === 'expense' ? 'Expense' : 'Settlement'} deleted`)
                setIsDetailOpen(false)
            },
            onError: (err) => {
                toast.apiError(err)
            }
        })
    }

    const handleEditActivity = (item: EditActivity) => {
        setEditingItem(item)
        setIsEditOpen(true)
        setIsDetailOpen(false)
    }

    const activities = activitiesRes?.data || []


    if (groupLoading || !group) {
        return (
            <div className="flex-1 flex items-center justify-center bg-slate-50">
                <p className="text-slate-500 text-lg font-medium animate-pulse">Loading group details...</p>
            </div>
        )
    }


    // Group activities by month
    const groupedActivities = activities.reduce((acc, activity) => {
        const dateStr = activity.type === 'expense' ? activity.expense_date : activity.settled_at
        const monthYear = formatMonthYear(dateStr)
        if (!acc[monthYear]) acc[monthYear] = []
        acc[monthYear].push(activity)
        return acc
    }, {} as Record<string, ActivityItem[]>)

    const monthKeys = Object.keys(groupedActivities).sort((a, b) => {
        // Sort months descending (latest first)
        const dateA = new Date(a)
        const dateB = new Date(b)
        return dateB.getTime() - dateA.getTime()
    })

    return (
        <div className="flex-1 flex flex-col h-screen bg-white overflow-hidden">
            {/* Topbar */}
            <div className="h-20 border-b flex items-center justify-between px-8 bg-white/80 backdrop-blur-md sticky top-0 z-10">
                <h1 className="text-2xl font-bold text-slate-800">{group.name}</h1>

                <div className="flex items-center gap-8">
                    <div className="hidden md:flex items-center gap-4">
                        {/* Avatar Group */}
                        <div className="flex -space-x-2.5">
                            {members.slice(0, 4).map((member) => (
                                <Avatar key={member.id} className="size-8 border-2 border-white ring-1 ring-slate-100 shadow-sm">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_info.email}`} />
                                    <AvatarFallback className="text-[10px] bg-slate-100">{getInitials(member.user_info.name)}</AvatarFallback>
                                </Avatar>
                            ))}
                            {members.length > 4 && (
                                <div className="size-8 rounded-full bg-slate-100 border-2 border-white ring-1 ring-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 shadow-sm">
                                    +{members.length - 4}
                                </div>
                            )}
                        </div>

                        {/* Members Button */}
                        <Button
                            variant="ghost"
                            className="h-9 px-3 rounded-lg flex items-center gap-2 hover:bg-slate-50 text-slate-600 font-bold text-sm border border-slate-100 cursor-pointer"
                            onClick={() => setIsSheetOpen(true)}
                        >
                            <Users className="size-4" />
                            Members ({members.length})
                        </Button>
                    </div>

                    <div className="flex items-center gap-3">
                        {groupId && (
                            <SettlementFormDialog groupId={groupId} members={members} />
                        )}
                        {group.permissions?.can_add_expense && groupId && (
                            <ExpenseFormDialog groupId={groupId} members={members} />
                        )}
                    </div>
                </div>
            </div>

            {/* Edit Dialogs */}
            {groupId && editingItem?.type === 'expense' && (
                <ExpenseFormDialog
                    groupId={groupId}
                    members={members}
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    initialData={editingItem as unknown as Expense}
                />
            )}
            {groupId && editingItem?.type === 'settlement' && (
                <SettlementFormDialog
                    groupId={groupId}
                    members={members}
                    open={isEditOpen}
                    onOpenChange={setIsEditOpen}
                    initialData={editingItem as unknown as Settlement}
                />
            )}

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {/* Balances Section */}
                {balancesData.length > 0 && (
                    <div className="mb-8">
                        <h2 className="text-xs font-bold text-slate-400 tracking-wider mb-4 uppercase">Balances</h2>
                        <div className="space-y-3">
                            {balancesData.slice(0, 3).map((balance, index) => {
                                const isYouPayer = me && balance.from_user === me.id
                                const isYouReceiver = me && balance.to_user === me.id

                                return (
                                    <div key={index} className="flex items-center text-[15px]">
                                        <span className="font-semibold text-slate-700">
                                            {isYouPayer ? 'You' : balance.from_user_info.name}
                                        </span>
                                        <span className="mx-1.5 text-slate-500">
                                            {isYouPayer ? 'owe' : 'owes'}
                                        </span>
                                        <span className="font-semibold text-slate-700">
                                            {isYouReceiver ? 'you' : balance.to_user_info.name}
                                        </span>
                                        <span className={`ml-2 font-bold ${isYouReceiver ? 'text-emerald-500' : 'text-rose-500'}`}>
                                            {formatCurrency(balance.amount)}
                                        </span>
                                    </div>
                                )
                            })}
                            {balancesData.length > 3 && (
                                <button
                                    onClick={() => setIsBalancesOpen(true)}
                                    className="flex cursor-pointer items-center text-slate-400 hover:text-indigo-600 transition-colors text-sm font-medium mt-4 group"
                                >
                                    +{balancesData.length - 3} more
                                    <ChevronRight className="size-4 ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                                </button>
                            )}
                        </div>
                    </div>
                )}

                <Separator className="bg-slate-100 mb-8" />

                {/* Activity Feed */}
                <div className="space-y-10">
                    <h2 className="text-xs font-bold text-slate-400 tracking-wider uppercase">Activity</h2>

                    {activitiesLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="bg-slate-100 rounded-xl h-24 animate-pulse" />
                            ))}
                        </div>
                    ) : activities.length === 0 ? (
                        <div className="py-16 text-center text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                            <Wallet className="size-10 mx-auto mb-3 opacity-40" />
                            <p className="font-semibold text-slate-500">No activity yet</p>
                            <p className="text-sm mt-1">Add an expense to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            {monthKeys.map(month => (
                                <div key={month} className="space-y-6">
                                    <div className="flex items-center gap-4">
                                        <div className="bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100 flex items-center gap-2">
                                            <Calendar className="size-3.5 text-slate-400" />
                                            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{month}</span>
                                        </div>
                                        <div className="h-px bg-slate-100 flex-1" />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {groupedActivities[month].map(item => (
                                            <ActivityCard
                                                key={`${item.type}-${item.id}`}
                                                item={item}
                                                onClick={() => handleActivityClick(item)}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Members Sheet */}
            <GroupMembersSheet
                group={group}
                open={isSheetOpen}
                onOpenChange={setIsSheetOpen}
            />

            {/* Expense/Settlement Detail Sheet */}
            <ExpenseDetailSheet
                item={selectedActivity}
                groupName={group.name}
                open={isDetailOpen}
                onOpenChange={setIsDetailOpen}
                onDelete={handleDeleteActivity}
                onEdit={handleEditActivity}
                canManageAll={group.permissions.can_manage_expenses}
            />

            {/* Balance Breakdown Dialog */}
            <BalanceBreakdownDialog
                data={balancesRes?.data}
                open={isBalancesOpen}
                onOpenChange={setIsBalancesOpen}
            />
        </div>
    )
}

export default GroupDetail
