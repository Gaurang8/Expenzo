import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"
import { useGroups } from "./queries"
import { CreateGroupDialog } from "./CreateGroupDialog"
import { formatDate } from "@/lib/format"
import { useNavigate, useParams } from "react-router-dom"
import { cn } from "@/lib/utils"
import GroupDetail from "./GroupDetail"
import { UserInvitations } from "./UserInvitations"
import type { Group } from "./types"

const GroupIndex = () => {
    const { data: groupsRes, isLoading } = useGroups()
    const groups = groupsRes?.data || []
    const navigate = useNavigate()
    const { groupId } = useParams()

    return (
        <div className="flex h-screen bg-white">
            {/* Group List Sidebar */}
            <div className="w-[22vw] min-w-[300px] h-screen border-r border-slate-200 bg-white flex flex-col">
                <div className="h-20 border-b border-slate-200 flex items-center px-6 relative shrink-0">
                    <Search className="absolute left-10 text-slate-500 size-4" />
                    <Input
                        placeholder="Search group"
                        className="bg-slate-100 h-10 rounded-full border-none focus-visible:ring-1 focus-visible:ring-indigo-100 pl-11 text-sm placeholder:text-slate-400"
                    />
                </div>

                <div className="px-6 py-6 shrink-0">
                    <CreateGroupDialog />
                </div>

                <UserInvitations />

                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {isLoading ? (
                        <div className="p-8 text-center">
                            <div className="animate-spin size-6 border-2 border-indigo-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                            <p className="text-sm text-slate-400">Loading groups...</p>
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                            <p className="text-sm">No groups found.</p>
                        </div>
                    ) : (
                        <div className="space-y-0.5 px-3">
                            {groups.map((group: Group) => {
                                const isActive = groupId === group.id.toString()
                                const balance = parseFloat(group.user_balance || "0")
                                const isSettled = balance === 0
                                const owes = balance < 0

                                return (
                                    <div
                                        key={group.id}
                                        onClick={() => navigate(`/groups/${group.id}`)}
                                        className={cn(
                                            "flex items-center justify-between px-4 py-4 rounded-2xl cursor-pointer transition-all duration-200 group",
                                            isActive
                                                ? "bg-indigo-50/50 shadow-sm shadow-indigo-100/50"
                                                : "hover:bg-slate-50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-11 w-11 border-2 border-white shadow-sm">
                                                <AvatarImage src={group.avatar || undefined} className="object-cover" />
                                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{group.name.charAt(0).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <div className={cn(
                                                    "text-[15px] font-bold truncate",
                                                    isActive ? "text-indigo-900" : "text-slate-700"
                                                )}>
                                                    {group.name}
                                                </div>
                                                <div className="text-[11px] font-medium text-slate-400 mt-0.5">
                                                    Last active: {formatDate(group.updated_at, "MMM d")}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <div className={cn(
                                                "text-[14px] font-bold",
                                                isSettled ? "text-slate-400" : owes ? "text-rose-500" : "text-emerald-500"
                                            )}>
                                                {isSettled ? "₹0.00" : owes ? `- ₹${Math.abs(balance).toFixed(2)}` : `+ ₹${balance.toFixed(2)}`}
                                            </div>
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                                {isSettled ? "settled" : owes ? "you owe" : "are owed"}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 h-screen overflow-hidden bg-slate-50/30">
                {groupId ? (
                    <GroupDetail />
                ) : (
                    <div className="h-full flex flex-col items-center justify-center">
                        <div className="bg-white p-8 rounded-3xl shadow-xl shadow-slate-100/50 border border-slate-100 text-center max-w-sm">
                            <div className="bg-indigo-50 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <Search className="size-8 text-indigo-500 opacity-40" />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 mb-2">Select a group</h2>
                            <p className="text-slate-500 text-sm leading-relaxed">
                                Choose a group from the list on the left to see expenses and balances.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default GroupIndex