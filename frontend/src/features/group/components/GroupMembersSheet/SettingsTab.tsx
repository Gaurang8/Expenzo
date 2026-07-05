import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Users, Edit2, Image as ImageIcon, PieChart, UserPlus, Shield, Download, LogOut, Trash2 } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronRight } from "lucide-react"
import { formatCurrency } from "@/lib/format"
import { toast } from "@/lib/toast"
import { SettingRow, EditableSettingRow } from "@/components/ui/setting-row"
import type { UseMutationResult } from "@tanstack/react-query"
import type { ApiSuccess } from "@/lib/types"
import type { Group, CreateGroupPayload } from "../../types"
import { ApiError } from "@/lib/api"

interface SettingsTabProps {
    group: Group
    editingField: 'name' | 'description' | null
    setEditingField: (field: 'name' | 'description' | null) => void
    handleUpdateName: (name: string) => void
    handleUpdateDescription: (desc: string) => void
    updateGroupMutation: UseMutationResult<ApiSuccess<Group>, ApiError, FormData | Partial<CreateGroupPayload>, unknown>
    fileInputRef: React.RefObject<HTMLInputElement | null>
    handleAvatarChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleExportData: () => void
    currentUserBalance: number
    setIsLeaveDialogOpen: (open: boolean) => void
    hasAnyActiveBalances: boolean
    setIsDeleteDialogOpen: (open: boolean) => void
}

export function SettingsTab({
    group,
    editingField,
    setEditingField,
    handleUpdateName,
    handleUpdateDescription,
    updateGroupMutation,
    fileInputRef,
    handleAvatarChange,
    handleExportData,
    currentUserBalance,
    setIsLeaveDialogOpen,
    hasAnyActiveBalances,
    setIsDeleteDialogOpen
}: SettingsTabProps) {
    return (
        <div className="space-y-8">
            {/* GROUP SETTINGS */}
            <div className="space-y-4">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Group Settings</h3>
                <div className="space-y-1">
                    <EditableSettingRow
                        key={`editable-Group name-${editingField === 'name' ? 'editing' : 'view'}-${group.name}`}
                        icon={Users}
                        label="Group name"
                        value={group.name}
                        isEditing={editingField === 'name'}
                        onEdit={group.permissions?.can_update_group ? () => setEditingField('name') : undefined}
                        onCancel={() => setEditingField(null)}
                        onSave={handleUpdateName}
                        isPending={updateGroupMutation.isPending && editingField === 'name'}
                        iconBg="bg-indigo-50"
                        iconColor="text-indigo-600"
                    />

                    <EditableSettingRow
                        key={`editable-Description-${editingField === 'description' ? 'editing' : 'view'}-${group.description || ''}`}
                        icon={Edit2}
                        label="Description"
                        value={group.description || ""}
                        isEditing={editingField === 'description'}
                        onEdit={group.permissions?.can_update_group ? () => setEditingField('description') : undefined}
                        onCancel={() => setEditingField(null)}
                        onSave={handleUpdateDescription}
                        isPending={updateGroupMutation.isPending && editingField === 'description'}
                        placeholder="Add a description..."
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                    />

                    <SettingRow
                        icon={ImageIcon}
                        label="Group avatar"
                        onClick={group.permissions?.can_update_group ? () => fileInputRef.current?.click() : undefined}
                        iconBg="bg-orange-50"
                        iconColor="text-orange-600"
                    >
                        <div className="flex items-center gap-3">
                            <Avatar className="size-7 border-2 border-white shadow-sm">
                                <AvatarImage src={group.avatar || undefined} className="object-cover" />
                                <AvatarFallback className="bg-indigo-50 text-indigo-700 text-[10px] font-bold">{group.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            {updateGroupMutation.isPending && !editingField && (
                                <div className="size-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                            )}
                        </div>
                    </SettingRow>
                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleAvatarChange}
                        disabled={updateGroupMutation.isPending}
                    />
                </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">Group Preferences</h3>
                <div className="space-y-1">

                    {/* Add Expenses */}
                    <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                        <div className="flex items-center gap-4">
                            <PieChart className="size-5 text-slate-400" />
                            <span className="text-[15px] font-bold text-slate-900">Who can add expenses</span>
                        </div>
                        {group.current_user_role !== "member" ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center gap-3 cursor-pointer">
                                        <span className="text-[14px] text-slate-500 font-medium capitalize">{group.settings?.add_expense || 'member'}</span>
                                        <ChevronRight className="size-4 text-slate-300" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, add_expense: 'member' } })}>Member</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, add_expense: 'admin' } })}>Admin</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, add_expense: 'owner' } })}>Owner</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-3 opacity-60">
                                <span className="text-[14px] text-slate-500 font-medium capitalize">{group.settings?.add_expense || 'member'}</span>
                            </div>
                        )}
                    </div>

                    {/* Edit Expenses */}
                    <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                        <div className="flex items-center gap-4">
                            <Edit2 className="size-5 text-slate-400" />
                            <span className="text-[15px] font-bold text-slate-900">Who can edit expenses</span>
                        </div>
                        {group.current_user_role !== "member" ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center gap-3 cursor-pointer">
                                        <span className="text-[14px] text-slate-500 font-medium capitalize">{group.settings?.manage_expenses || 'admin'}</span>
                                        <ChevronRight className="size-4 text-slate-300" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, manage_expenses: 'member' } })}>Member</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, manage_expenses: 'admin' } })}>Admin</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, manage_expenses: 'owner' } })}>Owner</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-3 opacity-60">
                                <span className="text-[14px] text-slate-500 font-medium capitalize">{group.settings?.manage_expenses || 'admin'}</span>
                            </div>
                        )}
                    </div>

                    {/* Invite Members */}
                    <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                        <div className="flex items-center gap-4">
                            <UserPlus className="size-5 text-slate-400" />
                            <span className="text-[15px] font-bold text-slate-900">Who can invite members</span>
                        </div>
                        {group.current_user_role !== "member" ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center gap-3 cursor-pointer">
                                        <span className="text-[14px] text-slate-500 font-medium capitalize">{group.settings?.invite_members || 'admin'}</span>
                                        <ChevronRight className="size-4 text-slate-300" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, invite_members: 'member' } })}>Member</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, invite_members: 'admin' } })}>Admin</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, invite_members: 'owner' } })}>Owner</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-3 opacity-60">
                                <span className="text-[14px] text-slate-500 font-medium capitalize">{group.settings?.invite_members || 'admin'}</span>
                            </div>
                        )}
                    </div>

                    {/* Remove Members */}
                    <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                        <div className="flex items-center gap-4">
                            <Users className="size-5 text-slate-400" />
                            <span className="text-[15px] font-bold text-slate-900">Who can remove members</span>
                        </div>
                        {group.current_user_role !== "member" ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center gap-3 cursor-pointer">
                                        <span className="text-[14px] text-slate-500 font-medium capitalize">{group.settings?.remove_members || 'admin'}</span>
                                        <ChevronRight className="size-4 text-slate-300" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, remove_members: 'member' } })}>Member</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, remove_members: 'admin' } })}>Admin</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, remove_members: 'owner' } })}>Owner</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-3 opacity-60">
                                <span className="text-[14px] text-slate-500 font-medium capitalize">{group.settings?.remove_members || 'admin'}</span>
                            </div>
                        )}
                    </div>

                    {/* Update Group */}
                    <div className="flex items-center justify-between py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors">
                        <div className="flex items-center gap-4">
                            <Shield className="size-5 text-slate-400" />
                            <span className="text-[15px] font-bold text-slate-900">Who can edit group info</span>
                        </div>
                        {group.current_user_role !== "member" ? (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <div className="flex items-center gap-3 cursor-pointer">
                                        <span className="text-[14px] text-slate-500 font-medium capitalize">{group.settings?.update_group || 'admin'}</span>
                                        <ChevronRight className="size-4 text-slate-300" />
                                    </div>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, update_group: 'member' } })}>Member</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, update_group: 'admin' } })}>Admin</DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => updateGroupMutation.mutate({ settings: { ...group.settings, update_group: 'owner' } })}>Owner</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        ) : (
                            <div className="flex items-center gap-3 opacity-60">
                                <span className="text-[14px] text-slate-500 font-medium capitalize">{group.settings?.update_group || 'admin'}</span>
                            </div>
                        )}
                    </div>

                </div>
            </div>

            {/* MORE ACTIONS */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
                <h3 className="text-[12px] font-black text-slate-400 uppercase tracking-widest">More Actions</h3>
                <div className="space-y-1">
                    <div
                        className="flex items-start gap-4 py-3 cursor-pointer hover:bg-slate-50 rounded-xl px-2 -mx-2 transition-colors"
                        onClick={handleExportData}
                    >
                        <Download className="size-5 text-slate-400 mt-0.5" />
                        <div className="flex flex-col">
                            <span className="text-[15px] font-bold text-slate-900">Export group data</span>
                            <span className="text-[13px] text-slate-500">Download all expenses and payments</span>
                        </div>
                    </div>

                    {group.permissions?.can_leave_group && (
                        <div
                            className={`flex items-start gap-4 py-3 rounded-xl px-2 -mx-2 transition-colors ${currentUserBalance !== 0
                                ? "opacity-50 cursor-not-allowed bg-slate-50/50"
                                : "cursor-pointer hover:bg-slate-50"
                                }`}
                            onClick={() => {
                                if (currentUserBalance !== 0) {
                                    toast.error("Please settle your balances before leaving the group.")
                                    return
                                }
                                setIsLeaveDialogOpen(true)
                            }}
                        >
                            <LogOut className="size-5 text-slate-400 mt-0.5" />
                            <div className="flex flex-col">
                                <span className="text-[15px] font-bold text-slate-900">Leave group</span>
                                <span className="text-[13px] text-slate-500">
                                    {currentUserBalance !== 0
                                        ? `Current balance: ${formatCurrency(currentUserBalance)}`
                                        : "You will no longer be a member"}
                                </span>
                            </div>
                        </div>
                    )}


                    {group.permissions?.can_delete_group && (
                        <div className={`flex items-start gap-4 py-3 rounded-xl px-2 -mx-2 transition-colors mt-2 ${hasAnyActiveBalances ? 'opacity-50 cursor-not-allowed bg-slate-50/50' : 'cursor-pointer hover:bg-rose-50'}`}
                            onClick={() => {
                                if (hasAnyActiveBalances) {
                                    toast.error("Cannot delete group. Please ensure all balances are settled first.")
                                    return
                                }
                                setIsDeleteDialogOpen(true)
                            }}
                        >
                            <Trash2 className="size-5 text-rose-500 mt-0.5" />
                            <div className="flex flex-col">
                                <span className="text-[15px] font-bold text-rose-600">Delete group</span>
                                <span className="text-[13px] text-rose-500/70">
                                    {hasAnyActiveBalances ? "Settle all balances first" : "This action cannot be undone"}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
