import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    MoreVertical, UserPlus, X, ChevronRight, Users, Shield, Image as ImageIcon,
    DollarSign, Calendar, Edit2, ClipboardCheck, Bell,
    PieChart, Coins, Download, LogOut, Trash2
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useGroupMembers, useGroupInvitations } from "./queries"
import { useAcceptInvitation, useRejectInvitation, useRemoveMember, useLeaveGroup, useTransferOwnership, useUpdateMemberRole } from "./mutations"
import type { Group } from "./types"
import { useState } from "react"
import { InviteMemberDialog } from "./InviteMemberDialog"
import { useAuthStore } from "@/store/auth-store"
import { useNavigate } from "react-router-dom"
import { toast } from "@/lib/toast"
import { formatCurrency, getInitials } from "@/lib/format"

interface GroupMembersSheetProps {
    group: Group
    open: boolean
    onOpenChange: (open: boolean) => void
}

export const GroupMembersSheet = ({ group, open, onOpenChange }: GroupMembersSheetProps) => {
    const navigate = useNavigate()
    const currentUser = useAuthStore((state) => state.user)
    const { data: membersRes } = useGroupMembers(group.id.toString())
    const { data: invitationsRes } = useGroupInvitations(group.id.toString())

    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [memberToRemove, setMemberToRemove] = useState<number | null>(null)
    const [memberToTransfer, setMemberToTransfer] = useState<{ id: number, user_id: number } | null>(null)
    const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)

    const members = membersRes?.data || []
    const invitations = invitationsRes?.data || []

    const acceptMutation = useAcceptInvitation()
    const rejectMutation = useRejectInvitation()
    const removeMutation = useRemoveMember(group.id.toString())
    const leaveMutation = useLeaveGroup(group.id.toString())
    const transferMutation = useTransferOwnership(group.id.toString())
    const updateRoleMutation = useUpdateMemberRole(group.id.toString())

    const currentUserRole = group.current_user_role

    const canRemove = (targetMember) => {
        if (!group.permissions?.can_remove_members) return false
        
        // Cannot remove yourself (use Leave instead)
        if (currentUser?.email === targetMember.user_info.email) return false
        
        // Cannot remove an owner (only they can transfer)
        if (targetMember.role === 'owner') return false

        // Admins can only remove regular members, not other admins
        if (currentUserRole === 'admin' && targetMember.role === 'admin') return false

        return true
    }

    const canUpdateRole = (targetMember) => {
        if (!group.permissions?.can_update_roles) return false
        if (currentUser?.email === targetMember.user_info.email) return false
        if (targetMember.role === 'owner') return false
        return true
    }

    const handleRemoveMember = (memberId: number) => {
        setMemberToRemove(memberId)
    }

    const confirmRemoveMember = () => {
        if (memberToRemove) {
            removeMutation.mutate(memberToRemove, {
                onSuccess: (res) => {
                    toast.success(res?.message || "Member removed")
                    setMemberToRemove(null)
                },
                onError: (err) => {
                    toast.apiError(err)
                    setMemberToRemove(null)
                }
            })
        }
    }

    const confirmLeaveGroup = () => {
        leaveMutation.mutate(undefined, {
            onSuccess: (res) => {
                toast.success(res?.message || "Left group successfully")
                setIsLeaveDialogOpen(false)
                onOpenChange(false)
                navigate("/")
            },
            onError: (err) => {
                toast.apiError(err)
                setIsLeaveDialogOpen(false)
            }
        })
    }

    const confirmTransferOwnership = () => {
        if (memberToTransfer) {
            transferMutation.mutate({ user_id: memberToTransfer.user_id }, {
                onSuccess: (res) => {
                    toast.success(res?.message || "Ownership transferred")
                    setMemberToTransfer(null)
                },
                onError: (err) => {
                    toast.apiError(err)
                    setMemberToTransfer(null)
                }
            })
        }
    }

    const handleUpdateRole = (memberId: number, newRole: 'admin' | 'member') => {
        updateRoleMutation.mutate({ memberId, role: newRole }, {
            onSuccess: (res) => {
                toast.success(res?.message || "Role updated successfully")
            },
            onError: (err) => {
                toast.apiError(err)
            }
        })
    }

    return (
        <>
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

                        <SheetHeader className="p-6 pb-4 space-y-0">
                            <SheetTitle className="text-[22px] font-bold text-slate-900 leading-tight">
                                {group.name}
                            </SheetTitle>
                            <p className="text-[15px] font-medium text-slate-400 mt-1">
                                {members.length} members
                            </p>
                        </SheetHeader>

                        <Tabs defaultValue="members" className="flex-1 flex flex-col min-h-0">
                            <div className="px-6 border-b border-slate-200">
                                <TabsList variant="line" className="bg-transparent h-auto p-0 gap-10 justify-start border-none">
                                    <TabsTrigger
                                        value="members"
                                        className="px-0 py-4 rounded-none border-0! border-b-2! border-transparent data-[state=active]:border-indigo-600! data-[state=active]:text-indigo-600! data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-active:bg-transparent! data-active:shadow-none! data-active:border-indigo-600! text-[15px] font-bold text-slate-400 transition-all after:hidden cursor-pointer!"
                                    >
                                        Members
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="pending"
                                        className="px-0 py-4 rounded-none border-0! border-b-2! border-transparent data-[state=active]:border-indigo-600! data-[state=active]:text-indigo-600! data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-active:bg-transparent! data-active:shadow-none! data-active:border-indigo-600! text-[15px] font-bold text-slate-400 transition-all after:hidden cursor-pointer!"
                                    >
                                        Pending {invitations.length > 0 && `(${invitations.length})`}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="settings"
                                        className="px-0 py-4 rounded-none border-0! border-b-2! border-transparent data-[state=active]:border-indigo-600! data-[state=active]:text-indigo-600! data-[state=active]:bg-transparent! data-[state=active]:shadow-none! data-active:bg-transparent! data-active:shadow-none! data-active:border-indigo-600! text-[15px] font-bold text-slate-400 transition-all after:hidden cursor-pointer!"
                                    >
                                        Settings
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                                <TabsContent value="members" className="mt-0 outline-none">
                                    <div className="space-y-6">
                                        {/* Admins Section */}
                                        {members.filter(m => m.role === 'owner').map((member) => (
                                            <div key={member.id} className="flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="size-11 border-none shadow-sm">
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_info.email}`} />
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
                                                    {canRemove(member) ? (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="size-8 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                                                                    <MoreVertical className="size-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end" className="w-48 rounded-lg p-1.5">
                                                                <DropdownMenuItem
                                                                    className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer font-medium py-2 rounded-md"
                                                                    onClick={() => handleRemoveMember(member.id)}
                                                                >
                                                                    <Trash2 className="size-4 mr-2" />
                                                                    Remove member
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" className="size-8 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all disabled:opacity-50" disabled>
                                                            <MoreVertical className="size-4" />
                                                        </Button>
                                                    )}
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
                                                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${member.user_info.email}`} />
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
                                                            {/* Mock logic for the demo visual */}
                                                            {member.id % 3 === 0 ? (
                                                                <span className="text-[13px] font-bold text-emerald-500">Gets back {formatCurrency(14.35)}</span>
                                                            ) : member.id % 3 === 1 ? (
                                                                <span className="text-[13px] font-bold text-rose-500">Owes {formatCurrency(23.00)}</span>
                                                            ) : (
                                                                <span className="text-[13px] font-bold text-slate-400">Settled up</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {canRemove(member) ? (
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
                                                                <DropdownMenuItem
                                                                    className="text-rose-600 focus:text-rose-700 focus:bg-rose-50 cursor-pointer font-medium py-2 rounded-md"
                                                                    onClick={() => handleRemoveMember(member.id)}
                                                                >
                                                                    <Trash2 className="size-4 mr-2" />
                                                                    Remove member
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    ) : (
                                                        <Button variant="ghost" size="icon" className="size-8 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all disabled:opacity-50" disabled>
                                                            <MoreVertical className="size-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </TabsContent>

                                <TabsContent value="pending" className="mt-0 space-y-8 outline-none">
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Invitations</h3>
                                        {invitations.length > 0 && (
                                            <span className="bg-slate-100 text-slate-600 text-[11px] font-bold px-2 py-0.5 rounded-md">{invitations.length}</span>
                                        )}
                                    </div>

                                    {invitations.length === 0 ? (
                                        <div className="text-center py-16">
                                            <div className="size-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <UserPlus className="size-8 text-slate-200" />
                                            </div>
                                            <p className="text-[15px] text-slate-400 font-bold">No pending requests</p>
                                            <p className="text-[13px] text-slate-300 mt-1">New requests will appear here</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            {invitations.map((invitation) => {
                                                const isForCurrentUser = invitation.email === currentUser?.email

                                                return (
                                                    <div key={invitation.id} className="flex items-center justify-between gap-4 group">
                                                        <div className="flex items-center gap-4 min-w-0">
                                                            <Avatar className="size-10 shadow-sm shrink-0">
                                                                <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${invitation.email}`} />
                                                                <AvatarFallback>{invitation.email.charAt(0).toUpperCase()}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="flex flex-col min-w-0">
                                                                <span className="text-[15px] font-bold text-slate-900 truncate leading-none mb-1.5">{invitation.email}</span>
                                                                <span className="text-[12px] font-bold text-slate-400">Requested to join</span>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-3 shrink-0">
                                                            {isForCurrentUser ? (
                                                                <>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        className="h-9 px-4 text-[13px] font-bold text-rose-400 hover:text-rose-500 hover:bg-rose-50/50 rounded-xl"
                                                                        onClick={() => rejectMutation.mutate(invitation.id)}
                                                                    >
                                                                        Reject
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        className="h-9 px-5 text-[13px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 border-none transition-all active:scale-95"
                                                                        onClick={() => acceptMutation.mutate(invitation.id)}
                                                                    >
                                                                        Accept
                                                                    </Button>
                                                                </>
                                                            ) : (
                                                                <div className="bg-slate-50 text-slate-400 text-[12px] font-bold px-3 py-1.5 rounded-xl border border-slate-100">
                                                                    {invitation.status === 'pending' ? 'Waiting' : invitation.status}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </TabsContent>

                                <TabsContent value="settings" className="mt-0 outline-none pb-10">
                                    <div className="space-y-8">
                                        {/* GROUP SETTINGS */}
                                        <div className="space-y-4">
                                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Group Settings</h3>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <Users className="size-5 text-slate-400" />
                                                        <span className="text-[15px] font-bold text-slate-900">Group name</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[14px] text-slate-500 font-medium">{group.name}</span>
                                                        <ChevronRight className="size-4 text-slate-300" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <ImageIcon className="size-5 text-slate-400" />
                                                        <span className="text-[15px] font-bold text-slate-900">Group avatar</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="size-6 border-none shadow-sm">
                                                            <AvatarImage src={`https://api.dicebear.com/7.x/shapes/svg?seed=${group.name}`} />
                                                            <AvatarFallback className="bg-indigo-50 text-indigo-700 text-xs font-bold">{group.name.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <ChevronRight className="size-4 text-slate-300" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <DollarSign className="size-5 text-slate-400" />
                                                        <span className="text-[15px] font-bold text-slate-900">Currency</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[14px] text-slate-500 font-medium">USD ($)</span>
                                                        <ChevronRight className="size-4 text-slate-300" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <Calendar className="size-5 text-slate-400" />
                                                        <span className="text-[15px] font-bold text-slate-900">Date format</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[14px] text-slate-500 font-medium">MM/DD/YYYY</span>
                                                        <ChevronRight className="size-4 text-slate-300" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <DollarSign className="size-5 text-slate-400" />
                                                        <span className="text-[15px] font-bold text-slate-900">Decimal format</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[14px] text-slate-500 font-medium">2 (1,234.56)</span>
                                                        <ChevronRight className="size-4 text-slate-300" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* GROUP PREFERENCES */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Group Preferences</h3>
                                            <div className="space-y-1">
                                                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <Users className="size-5 text-slate-400" />
                                                        <span className="text-[15px] font-bold text-slate-900">Who can add expenses</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[14px] text-slate-500 font-medium">All members</span>
                                                        <ChevronRight className="size-4 text-slate-300" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <Edit2 className="size-5 text-slate-400" />
                                                        <span className="text-[15px] font-bold text-slate-900">Who can edit expenses</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[14px] text-slate-500 font-medium">All members</span>
                                                        <ChevronRight className="size-4 text-slate-300" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <ClipboardCheck className="size-5 text-slate-400" />
                                                        <span className="text-[15px] font-bold text-slate-900">Expense approval</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[14px] text-slate-500 font-medium">Off</span>
                                                        <ChevronRight className="size-4 text-slate-300" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <Bell className="size-5 text-slate-400" />
                                                        <span className="text-[15px] font-bold text-slate-900">Settle up reminders</span>
                                                    </div>
                                                    <div className="w-[36px] h-[20px] bg-indigo-600 rounded-full flex items-center px-0.5 shadow-inner">
                                                        <div className="w-[16px] h-[16px] bg-white rounded-full translate-x-[16px] shadow-sm transition-transform" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <PieChart className="size-5 text-slate-400" />
                                                        <span className="text-[15px] font-bold text-slate-900">Default split method</span>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[14px] text-slate-500 font-medium">Equally</span>
                                                        <ChevronRight className="size-4 text-slate-300" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <div className="flex items-center gap-4">
                                                        <Coins className="size-5 text-slate-400" />
                                                        <span className="text-[15px] font-bold text-slate-900">Round off amounts</span>
                                                    </div>
                                                    <div className="w-[36px] h-[20px] bg-slate-200 rounded-full flex items-center px-0.5 shadow-inner">
                                                        <div className="w-[16px] h-[16px] bg-white rounded-full shadow-sm transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* MORE ACTIONS */}
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">More Actions</h3>
                                            <div className="space-y-1">
                                                <div className="flex items-start gap-4 py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                                                    <Download className="size-5 text-slate-400 mt-0.5" />
                                                    <div className="flex flex-col">
                                                        <span className="text-[15px] font-bold text-slate-900">Export group data</span>
                                                        <span className="text-[13px] text-slate-500">Download all expenses and payments</span>
                                                    </div>
                                                </div>

                                                {group.permissions?.can_leave_group && (
                                                    <div
                                                        className="flex items-start gap-4 py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors"
                                                        onClick={() => setIsLeaveDialogOpen(true)}
                                                    >
                                                        <LogOut className="size-5 text-slate-400 mt-0.5" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[15px] font-bold text-slate-900">Leave group</span>
                                                            <span className="text-[13px] text-slate-500">You will no longer be a member</span>
                                                        </div>
                                                    </div>
                                                )}

                                                {group.permissions?.can_delete_group && (
                                                    <div className="flex items-start gap-4 py-3 cursor-pointer hover:bg-rose-50 rounded-xl px-2 -mx-2 transition-colors mt-2">
                                                        <Trash2 className="size-5 text-rose-500 mt-0.5" />
                                                        <div className="flex flex-col">
                                                            <span className="text-[15px] font-bold text-rose-600">Delete group</span>
                                                            <span className="text-[13px] text-rose-500/70">This action cannot be undone</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </TabsContent>
                            </div>

                            {group.permissions?.can_invite_members && (
                                <div className="p-6 mt-auto">
                                    <Button
                                        onClick={() => setIsInviteOpen(true)}
                                        className="w-full h-[52px] bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 font-black text-[15px] rounded-2xl flex items-center justify-center gap-3 group transition-all duration-300 shadow-sm"
                                    >
                                        <UserPlus className="size-5 group-hover:scale-110 transition-transform" />
                                        Invite member
                                    </Button>
                                </div>
                            )}
                        </Tabs>
                    </div>
                </SheetContent>
            </Sheet>

            <InviteMemberDialog
                groupId={group.id.toString()}
                open={isInviteOpen}
                onOpenChange={setIsInviteOpen}
            />

            <Dialog open={memberToRemove !== null} onOpenChange={(open) => !open && setMemberToRemove(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Remove Member</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to remove this member? This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setMemberToRemove(null)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmRemoveMember} disabled={removeMutation.isPending}>
                            {removeMutation.isPending ? "Removing..." : "Remove"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={isLeaveDialogOpen} onOpenChange={setIsLeaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Leave Group</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to leave this group? You will no longer have access to its expenses and payments.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsLeaveDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmLeaveGroup} disabled={leaveMutation.isPending}>
                            {leaveMutation.isPending ? "Leaving..." : "Leave Group"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={memberToTransfer !== null} onOpenChange={(open) => !open && setMemberToTransfer(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transfer Ownership</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to transfer ownership of this group? You will become an admin and lose owner privileges.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setMemberToTransfer(null)}>
                            Cancel
                        </Button>
                        <Button variant="default" onClick={confirmTransferOwnership} disabled={transferMutation.isPending} className="bg-indigo-600 hover:bg-indigo-700">
                            {transferMutation.isPending ? "Transferring..." : "Confirm"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

export default GroupMembersSheet
