import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { MoreVertical, Shield, Users, Trash2 } from "lucide-react"
import type { User } from "@/store/auth-store"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatCurrency, getInitials } from "@/lib/format"
import { toast } from "@/lib/toast"
import type { GroupMember, Group } from "../../types"

interface MembersTabProps {
    members: GroupMember[]
    currentUser: User | null
    group: Group
    getMemberBalance: (userId: number) => number
    canRemove: (member: GroupMember) => boolean
    canUpdateRole: (member: GroupMember) => boolean
    handleRemoveMember: (id: number) => void
    handleUpdateRole: (id: number, role: 'admin' | 'member') => void
    setMemberToTransfer: (member: { id: number; user_id: number }) => void
}

export function MembersTab({
    members,
    currentUser,
    group,
    getMemberBalance,
    canRemove,
    canUpdateRole,
    handleRemoveMember,
    handleUpdateRole,
    setMemberToTransfer
}: MembersTabProps) {
    return (
        <div className="space-y-6">
            {/* Admins Section */}
            {members.filter(m => m.role === 'owner').map((member) => (
                <div key={member.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <Avatar className="size-11 border-none shadow-sm">
                            <AvatarImage src={member.user_info.avatar || undefined} />
                            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold">
                                {getInitials(member.user_info.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-[15px] font-bold text-slate-900">{member.user_info.name}</span>
                                {member.user_info.email === currentUser?.email && (
                                    <div className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter shadow-sm">
                                        You
                                    </div>
                                )}
                            </div>
                            <span className="text-[12px] font-bold text-amber-500 mt-0.5 uppercase tracking-wide">
                                Owner
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="flex flex-col items-end">
                                {(() => {
                                    const balance = getMemberBalance(member.user)
                                    if (balance > 0) {
                                        return (
                                            <span className="text-[11px] font-bold text-emerald-500 whitespace-nowrap uppercase tracking-tight">
                                                Gets back {formatCurrency(balance)}
                                            </span>
                                        )
                                    } else if (balance < 0) {
                                        return (
                                            <span className="text-[11px] font-bold text-rose-500 whitespace-nowrap uppercase tracking-tight">
                                                Owes {formatCurrency(Math.abs(balance))}
                                            </span>
                                        )
                                    } else {
                                        return (
                                            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-tight">
                                                Settled up
                                            </span>
                                        )
                                    }
                                })()}
                            </div>
                        </div>
                        {canRemove(member) || canUpdateRole(member) || (group.permissions?.can_transfer_ownership && member.role !== 'owner') ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                                        <MoreVertical className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-lg p-1.5 flex flex-col gap-1">
                                    {canUpdateRole(member) && (
                                        <DropdownMenuItem
                                            className="text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50 cursor-pointer font-medium py-2 rounded-md"
                                            onClick={() => handleUpdateRole(member.id, member.role === 'admin' ? 'member' : 'admin')}
                                        >
                                            <Shield className="size-4 mr-2" />
                                            {member.role === 'admin' ? 'Remove admin' : 'Make admin'}
                                        </DropdownMenuItem>
                                    )}
                                    {group.permissions?.can_transfer_ownership && member.role !== 'owner' && (
                                        <DropdownMenuItem
                                            className="text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50 cursor-pointer font-medium py-2 rounded-md"
                                            onClick={() => setMemberToTransfer({ id: member.id, user_id: member.user })}
                                        >
                                            <Users className="size-4 mr-2" />
                                            Make owner
                                        </DropdownMenuItem>
                                    )}
                                    {canRemove(member) && (
                                        <DropdownMenuItem
                                            disabled={getMemberBalance(member.user) !== 0}
                                            className={`text-rose-600 focus:text-rose-700 focus:bg-rose-50 font-medium py-2 rounded-md ${getMemberBalance(member.user) !== 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                                }`}
                                            onClick={() => {
                                                if (getMemberBalance(member.user) !== 0) {
                                                    toast.error("Member must settle their balance before removal.")
                                                    return
                                                }
                                                handleRemoveMember(member.id)
                                            }}
                                        >
                                            <Trash2 className="size-4 mr-2" />
                                            Remove member
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                    </div>
                </div>
            ))}

            {members.some(m => m.role === 'owner') && members.some(m => m.role !== 'owner') && (
                <div className="flex items-center gap-4 py-2">
                    <div className="h-px bg-slate-100 flex-1" />
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Members</span>
                    <div className="h-px bg-slate-100 flex-1" />
                </div>
            )}

            {/* Regular Members Section */}
            {members.filter(m => m.role !== 'owner').map((member) => (
                <div key={member.id} className="flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                        <Avatar className="size-11 border-none shadow-sm">
                            <AvatarImage src={member.user_info.avatar || undefined} />
                            <AvatarFallback className="bg-indigo-50 text-indigo-700 font-bold">
                                {getInitials(member.user_info.name)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <span className="text-[15px] font-bold text-slate-900">{member.user_info.name}</span>
                                {member.user_info.email === currentUser?.email && (
                                    <div className="bg-indigo-600 text-white text-[9px] px-1.5 py-0.5 rounded-md font-black uppercase tracking-tighter shadow-sm">
                                        You
                                    </div>
                                )}
                            </div>
                            {member.role === 'admin' ? (
                                <span className="text-[12px] font-bold text-indigo-500 mt-0.5 uppercase tracking-wide">
                                    Admin
                                </span>
                            ) : (
                                <span className="text-[12px] font-bold text-slate-400 mt-0.5">
                                    Member
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="flex flex-col items-end">
                                {(() => {
                                    const balance = getMemberBalance(member.user)
                                    if (balance > 0) {
                                        return (
                                            <span className="text-[11px] font-bold text-emerald-500 whitespace-nowrap uppercase tracking-tight">
                                                Gets back {formatCurrency(balance)}
                                            </span>
                                        )
                                    } else if (balance < 0) {
                                        return (
                                            <span className="text-[11px] font-bold text-rose-500 whitespace-nowrap uppercase tracking-tight">
                                                Owes {formatCurrency(Math.abs(balance))}
                                            </span>
                                        )
                                    } else {
                                        return (
                                            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap uppercase tracking-tight">
                                                Settled up
                                            </span>
                                        )
                                    }
                                })()}
                            </div>
                        </div>
                        {canRemove(member) || canUpdateRole(member) || (group.permissions?.can_transfer_ownership && member.role !== 'owner') ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-8 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                                        <MoreVertical className="size-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48 rounded-lg p-1.5 flex flex-col gap-1">
                                    {canUpdateRole(member) && (
                                        <DropdownMenuItem
                                            className="text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50 cursor-pointer font-medium py-2 rounded-md"
                                            onClick={() => handleUpdateRole(member.id, member.role === 'admin' ? 'member' : 'admin')}
                                        >
                                            <Shield className="size-4 mr-2" />
                                            {member.role === 'admin' ? 'Remove admin' : 'Make admin'}
                                        </DropdownMenuItem>
                                    )}
                                    {group.permissions?.can_transfer_ownership && member.role !== 'owner' && (
                                        <DropdownMenuItem
                                            className="text-indigo-600 focus:text-indigo-700 focus:bg-indigo-50 cursor-pointer font-medium py-2 rounded-md"
                                            onClick={() => setMemberToTransfer({ id: member.id, user_id: member.user })}
                                        >
                                            <Users className="size-4 mr-2" />
                                            Make owner
                                        </DropdownMenuItem>
                                    )}
                                    {canRemove(member) && (
                                        <DropdownMenuItem
                                            disabled={getMemberBalance(member.user) !== 0}
                                            className={`text-rose-600 focus:text-rose-700 focus:bg-rose-50 font-medium py-2 rounded-md ${getMemberBalance(member.user) !== 0 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                                                }`}
                                            onClick={() => {
                                                if (getMemberBalance(member.user) !== 0) {
                                                    toast.error("Member must settle their balance before removal.")
                                                    return
                                                }
                                                handleRemoveMember(member.id)
                                            }}
                                        >
                                            <Trash2 className="size-4 mr-2" />
                                            Remove member
                                        </DropdownMenuItem>
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : null}
                    </div>
                </div>
            ))}
        </div>
    )
}
