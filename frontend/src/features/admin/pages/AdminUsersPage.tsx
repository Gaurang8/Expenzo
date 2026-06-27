import { useState } from "react"
import { useAdminUsers } from "../queries"
import { useEditAdminUser, useDeleteAdminUser, useToggleUserActive, useToggleUserStaff } from "../mutations"
import { useAdminTableState } from "../hooks/useAdminTableState"
import { useExportCSV } from "../hooks/useExportCSV"
import { DataTable } from "../components/DataTable"
import type { ColumnDef } from "../components/DataTable"
import { SearchAndFilters } from "../components/SearchAndFilters"
import { AdminPageHeader } from "../components/AdminPageHeader"
import { StatusBadge } from "../components/StatusBadge"
import { AdminModal } from "../components/AdminModal"
import type { FieldDef } from "../components/AdminModal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/format"
import { format } from "date-fns"
import { Shield, ShieldAlert, Ban, CheckCircle, Edit, Trash2 } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuthStore } from "@/store/auth-store"
import type { AdminUser } from "../types"

const editUserFields: FieldDef[] = [
  { name: "full_name", label: "Full Name", type: "text", required: true },
  { name: "email", label: "Email Address", type: "email", required: true },
  { name: "is_active", label: "Is Active", type: "checkbox" },
  { name: "is_staff", label: "Is Staff (Admin)", type: "checkbox" },
]

export function AdminUsersPage() {
  const currentUser = useAuthStore(state => state.user)
  const { 
    search, setSearch, page, setPage, sorting, setSorting, 
    filters, setFilter, clearFilters, queryParams 
  } = useAdminTableState()
  
  const { data: response, isLoading } = useAdminUsers(queryParams)
  const { exportCSV, isExporting } = useExportCSV()
  
  const editMutation = useEditAdminUser()
  const deleteMutation = useDeleteAdminUser()
  const toggleActiveMutation = useToggleUserActive()
  const toggleStaffMutation = useToggleUserStaff()
  
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null)

  const handleExport = () => {
    const exportUrl = `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/admin/users/export/?${queryParams}`
    exportCSV(exportUrl, "expanzo_users.csv")
  }

  const columns: ColumnDef<AdminUser>[] = [
    {
      id: "user",
      header: "User",
      sortable: true,
      cell: (user) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user?.avatar || undefined} />
            <AvatarFallback>{getInitials(user?.full_name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-slate-900 text-base">{user?.full_name || "Unknown"}</p>
            <p className="text-sm text-slate-500 font-medium">{user?.email || "No email"}</p>
          </div>
        </div>
      )
    },
    {
      id: "status",
      header: "Status",
      cell: (user) => (
        <div className="flex flex-col gap-1 items-start">
          <StatusBadge status={user.is_active ? "active" : "inactive"} />
          {user.is_superuser ? (
            <StatusBadge status="staff" /> // Or a custom 'Superuser' badge
          ) : user.is_staff ? (
            <StatusBadge status="staff" />
          ) : null}
        </div>
      )
    },
    {
      id: "stats",
      header: "Stats",
      cell: (user) => (
        <div className="text-sm text-slate-600">
          <p>{user?.groups_count || 0} Groups</p>
          <p>{user?.expenses_count || 0} Expenses</p>
        </div>
      )
    },
    {
      id: "unsettled_amount",
      header: "Balance",
      cell: (user) => {
        const amount = Number(user.unsettled_amount) || 0;
        return (
          <span className={
            amount > 0 ? "text-emerald-600 font-medium text-sm" : 
            amount < 0 ? "text-rose-600 font-medium text-sm" : 
            "text-slate-500 text-sm"
          }>
            {amount === 0 ? "Settled" : amount > 0 ? `+₹${amount.toFixed(2)}` : `-₹${Math.abs(amount).toFixed(2)}`}
          </span>
        )
      }
    },
    {
      id: "created_at",
      header: "Joined",
      sortable: true,
      cell: (user) => <span className="text-slate-600 text-sm font-medium">{user.created_at ? format(new Date(user.created_at), "MMM d, yyyy") : "N/A"}</span>
    }
  ]

  const activeFilterChips = Object.entries(filters).map(([key, value]) => ({
    id: key,
    label: `${key.replace('_', ' ')}: ${value}`
  }))

  const FilterDropdowns = (
    <>
      <Select 
        value={filters.is_active || "all"} 
        onValueChange={(val) => setFilter("is_active", val === "all" ? null : val)}
      >
        <SelectTrigger className="w-[130px] bg-white data-[size=default]:h-10">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="true">Active</SelectItem>
          <SelectItem value="false">Inactive</SelectItem>
        </SelectContent>
      </Select>
      
      <Select 
        value={filters.is_staff || "all"} 
        onValueChange={(val) => setFilter("is_staff", val === "all" ? null : val)}
      >
        <SelectTrigger className="w-[130px] bg-white data-[size=default]:h-10">
          <SelectValue placeholder="Role" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          <SelectItem value="all">All Roles</SelectItem>
          <SelectItem value="true">Staff</SelectItem>
          <SelectItem value="false">User</SelectItem>
        </SelectContent>
      </Select>
    </>
  )

  return (
    <div>
      <AdminPageHeader 
        title="Users Management" 
        description="Manage all platform users, their roles, and status."
      />
      
      <SearchAndFilters 
        searchValue={search}
        onSearch={setSearch}
        filters={FilterDropdowns}
        activeFilters={activeFilterChips}
        onRemoveFilter={(id) => setFilter(id, null)}
        onClearFilters={clearFilters}
        onExport={handleExport}
        isExporting={isExporting}
      />
      
      <DataTable 
        columns={columns}
        data={response?.data.results || []}
        isLoading={isLoading}
        page={page}
        totalPages={response?.data.total_pages || 1}
        onPageChange={setPage}
        sortField={sorting.field}
        sortDesc={sorting.desc}
        onSortChange={setSorting}
        actions={(user) => (
          <>
            <DropdownMenuItem onClick={() => setEditingUser(user)}>
              <Edit className="w-4 h-4 mr-2" /> Edit User
            </DropdownMenuItem>
            
            {!user.is_superuser && user.id !== currentUser?.id && (
              <>
                <DropdownMenuItem onClick={() => toggleActiveMutation.mutate(user.id)}>
                  {user.is_active ? <Ban className="w-4 h-4 mr-2 text-rose-500" /> : <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />}
                  {user.is_active ? "Deactivate" : "Activate"}
                </DropdownMenuItem>
                
                {currentUser?.is_superuser && (
                  <DropdownMenuItem onClick={() => toggleStaffMutation.mutate(user.id)}>
                    {user.is_staff ? <ShieldAlert className="w-4 h-4 mr-2 text-amber-500" /> : <Shield className="w-4 h-4 mr-2 text-indigo-500" />}
                    {user.is_staff ? "Remove Staff" : "Make Staff"}
                  </DropdownMenuItem>
                )}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuItem 
                  className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                  onClick={() => setDeletingUser(user)}
                >
                  <Trash2 className="w-4 h-4 mr-2" /> Delete
                </DropdownMenuItem>
              </>
            )}
          </>
        )}
      />
      
      <AdminModal
        open={!!editingUser}
        onClose={() => setEditingUser(null)}
        title="Edit User"
        fields={editUserFields}
        initialValues={editingUser ? { ...editingUser } : undefined}
        onSubmit={async (values) => {
          if (editingUser) {
            await editMutation.mutateAsync({ id: editingUser.id, data: values })
            setEditingUser(null)
          }
        }}
        isLoading={editMutation.isPending}
      />
      
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        title="Delete User"
        description={`Are you sure you want to delete ${deletingUser?.full_name}? This action cannot be undone.`}
        confirmText="Delete"
        isDangerous={true}
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deletingUser) {
            await deleteMutation.mutateAsync(deletingUser.id)
            setDeletingUser(null)
          }
        }}
      />
    </div>
  )
}
