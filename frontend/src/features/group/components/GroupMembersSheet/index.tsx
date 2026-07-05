import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { UserPlus, X } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { useGroupDetail } from "../../queries"
import { useGroupBalances } from "@/features/expenses/queries"
import { useAcceptInvitation, useRejectInvitation, useGroupMutations } from "../../mutations"

import type { Group, GroupMember } from "../../types"
import { useState, useRef } from "react"
import { InviteMemberDialog } from "../../InviteMemberDialog"
import { useAuthStore } from "@/store/auth-store"
import { useNavigate } from "react-router-dom"
import { toast } from "@/lib/toast"
import { MembersTab } from "./MembersTab"
import { PendingTab } from "./PendingTab"
import { SettingsTab } from "./SettingsTab"

interface GroupMembersSheetProps {
    group: Group
    open: boolean
    onOpenChange: (open: boolean) => void
}



export const GroupMembersSheet = ({ group, open, onOpenChange }: GroupMembersSheetProps) => {
    const navigate = useNavigate()
    const currentUser = useAuthStore((state) => state.user)
    const { members, invitations } = useGroupDetail(group.id.toString())
    const { data: balancesRes } = useGroupBalances(group.id.toString())

    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [memberToRemove, setMemberToRemove] = useState<number | null>(null)
    const [memberToTransfer, setMemberToTransfer] = useState<{ id: number, user_id: number } | null>(null)
    const [isLeaveDialogOpen, setIsLeaveDialogOpen] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [editingField, setEditingField] = useState<'name' | 'description' | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const acceptMutation = useAcceptInvitation()
    const rejectMutation = useRejectInvitation()
    const {
        removeMember: removeMutation,
        leaveGroup: leaveMutation,
        transferOwnership: transferMutation,
        updateMemberRole: updateRoleMutation,
        updateGroup: updateGroupMutation,
        deleteGroup: deleteMutation
    } = useGroupMutations(group.id.toString())

    const handleExportData = async () => {
        try {
            const token = localStorage.getItem("access_token");
            const baseUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? "http://localhost:8000/api";

            const res = await fetch(`${baseUrl}/groups/${group.id}/export/`, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });

            if (!res.ok) throw new Error("Failed to export data");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            const contentDisposition = res.headers.get("Content-Disposition");
            let filename = `group_${group.id}_data.csv`;
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
                if (filenameMatch && filenameMatch.length === 2) {
                    filename = filenameMatch[1];
                }
            }
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            toast.success("Export successful!");
        } catch {
            toast.error("Failed to export group data");
        }
    }


    const getMemberBalance = (userId: number) => {
        const userBalance = balancesRes?.data?.individual_balances.find(
            (b) => b.user_id === userId
        )
        return parseFloat(userBalance?.balance || "0")
    }

    const currentUserBalance = currentUser ? getMemberBalance(currentUser.id) : 0

    const currentUserRole = group.current_user_role

    const canRemove = (targetMember: GroupMember) => {
        if (!group.permissions?.can_remove_members) return false

        // Cannot remove yourself (use Leave instead)
        if (currentUser?.email === targetMember.user_info.email) return false

        // Cannot remove an owner (only they can transfer)
        if (targetMember.role === 'owner') return false

        // Admins can only remove regular members, not other admins
        if (currentUserRole === 'admin' && targetMember.role === 'admin') return false

        return true
    }



    const canUpdateRole = (targetMember: GroupMember) => {
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

    const hasAnyActiveBalances = balancesRes?.data?.individual_balances.some(b => parseFloat(b.balance) !== 0) || false

    const confirmDeleteGroup = () => {
        deleteMutation.mutate(undefined, {
            onSuccess: () => {
                toast.success("Group deleted successfully")
                setIsDeleteDialogOpen(false)
                onOpenChange(false)
                navigate('/')
            },
            onError: (err) => {
                toast.apiError(err)
                setIsDeleteDialogOpen(false)
            }
        })
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

    const handleUpdateName = (newName: string) => {
        if (!newName.trim() || newName === group.name) {
            setEditingField(null)
            return
        }

        updateGroupMutation.mutate({ name: newName }, {
            onSuccess: (res) => {
                toast.success(res?.message || "Group name updated")
                setEditingField(null)
            },
            onError: (err) => {
                toast.apiError(err)
            }
        })
    }

    const handleUpdateDescription = (newDescription: string) => {
        if (newDescription === group.description) {
            setEditingField(null)
            return
        }

        updateGroupMutation.mutate({ description: newDescription }, {
            onSuccess: (res) => {
                toast.success(res?.message || "Description updated")
                setEditingField(null)
            },
            onError: (err) => {
                toast.apiError(err)
            }
        })
    }

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (file) {
            const formData = new FormData()
            formData.append("avatar", file)
            updateGroupMutation.mutate(formData, {
                onSuccess: (res) => {
                    toast.success(res?.message || "Avatar updated")
                },
                onError: (err) => {
                    toast.apiError(err)
                }
            })
            // Reset input so the same file can be selected again if needed
            if (fileInputRef.current) {
                fileInputRef.current.value = ""
            }
        }
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
                                    <MembersTab 
                                        members={members}
                                        currentUser={currentUser}
                                        group={group}
                                        getMemberBalance={getMemberBalance}
                                        canRemove={canRemove}
                                        canUpdateRole={canUpdateRole}
                                        handleRemoveMember={handleRemoveMember}
                                        handleUpdateRole={handleUpdateRole}
                                        setMemberToTransfer={setMemberToTransfer}
                                    />
                                </TabsContent>

                                <TabsContent value="pending" className="mt-0 space-y-8 outline-none">
                                    <PendingTab 
                                        invitations={invitations}
                                        currentUser={currentUser}
                                        acceptMutation={acceptMutation}
                                        rejectMutation={rejectMutation}
                                    />
                                </TabsContent>

                                <TabsContent value="settings" className="mt-0 outline-none pb-10">
                                    <SettingsTab 
                                        group={group}
                                        editingField={editingField}
                                        setEditingField={setEditingField}
                                        handleUpdateName={handleUpdateName}
                                        handleUpdateDescription={handleUpdateDescription}
                                        updateGroupMutation={updateGroupMutation}
                                        fileInputRef={fileInputRef}
                                        handleAvatarChange={handleAvatarChange}
                                        handleExportData={handleExportData}
                                        currentUserBalance={currentUserBalance}
                                        setIsLeaveDialogOpen={setIsLeaveDialogOpen}
                                        hasAnyActiveBalances={hasAnyActiveBalances}
                                        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
                                    />
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

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Group</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this group? This action is permanent and will remove all expenses and members.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={confirmDeleteGroup} disabled={deleteMutation.isPending}>
                            {deleteMutation.isPending ? "Deleting..." : "Delete Group"}
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
