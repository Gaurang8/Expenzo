import { useState, useMemo } from "react"
import { useAdminGroups } from "../queries"
import { useEditAdminGroup, useDeleteAdminGroup } from "../mutations"
import { useAdminTableState } from "../hooks/useAdminTableState"
import { useExportCSV } from "../hooks/useExportCSV"
import { DataTable } from "../components/DataTable"
import type { ColumnDef } from "../components/DataTable"
import { SearchAndFilters } from "../components/SearchAndFilters"
import { AdminPageHeader } from "../components/AdminPageHeader"
import { AdminModal } from "../components/AdminModal"
import type { FieldDef } from "../components/AdminModal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { getInitials } from "@/lib/format"
import { format } from "date-fns"
import { Edit, Trash2 } from "lucide-react"
import type { AdminGroup } from "../types"

const editGroupFields: FieldDef[] = [
  { name: "name", label: "Group Name", type: "text", required: true },
  { name: "description", label: "Description", type: "textarea" },
]

export function AdminGroupsPage() {
  const { 
    search, setSearch, page, setPage, sorting, setSorting, 
    queryParams 
  } = useAdminTableState()
  
  const { data: response, isLoading } = useAdminGroups(queryParams)
  const { exportCSV, isExporting } = useExportCSV()
  
  const editMutation = useEditAdminGroup()
  const deleteMutation = useDeleteAdminGroup()
  
  const [editingGroup, setEditingGroup] = useState<AdminGroup | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<AdminGroup | null>(null)

  const handleExport = () => {
    const exportUrl = `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/admin/groups/export/?${queryParams}`
    exportCSV(exportUrl, "expanzo_groups.csv")
  }

  const columns: ColumnDef<AdminGroup>[] = useMemo(() => [
    {
      id: "group",
      header: "Group",
      sortable: true,
      accessorKey: "name",
      cell: (group) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8 rounded-lg">
            <AvatarImage src={group.avatar || undefined} />
            <AvatarFallback className="rounded-lg">{getInitials(group.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold text-slate-900 text-sm">{group.name}</p>
            {group.description && (
              <p className="text-xs text-slate-500 font-medium truncate max-w-[200px]">{group.description}</p>
            )}
          </div>
        </div>
      )
    },
    {
      id: "stats",
      header: "Metrics",
      cell: (group) => (
        <div className="text-sm text-slate-600">
          <p>{group.members_count} Members</p>
          <p>{group.expenses_count} Expenses</p>
        </div>
      )
    },
    {
      id: "total_spent",
      header: "Total Spent",
      sortable: true,
      cell: (group) => <span className="font-medium text-sm">₹{parseFloat(group.total_spent || "0").toFixed(2)}</span>
    },
    {
      id: "created_by",
      header: "Created By",
      cell: (group) => (
        <span className="text-slate-600 text-sm font-medium">
          {group.created_by_info ? group.created_by_info.name : "Unknown"}
        </span>
      )
    },
    {
      id: "created_at",
      header: "Created",
      sortable: true,
      cell: (group) => <span className="text-slate-600 text-sm font-medium">{format(new Date(group.created_at), "MMM d, yyyy")}</span>
    }
  ], [])

  return (
    <div>
      <AdminPageHeader 
        title="Groups Management" 
        description="View and manage all groups across the platform."
      />
      
      <SearchAndFilters 
        searchValue={search}
        onSearch={setSearch}
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
        actions={(group) => (
          <>
            <DropdownMenuItem onClick={() => setEditingGroup(group)}>
              <Edit className="w-4 h-4 mr-2" /> Edit Group
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
              onClick={() => setDeletingGroup(group)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete Group
            </DropdownMenuItem>
          </>
        )}
      />
      
      <AdminModal
        open={!!editingGroup}
        onClose={() => setEditingGroup(null)}
        title="Edit Group"
        fields={editGroupFields}
        initialValues={editingGroup ? { ...editingGroup } : undefined}
        onSubmit={async (values) => {
          if (editingGroup) {
            await editMutation.mutateAsync({ id: editingGroup.id, data: values })
            setEditingGroup(null)
          }
        }}
        isLoading={editMutation.isPending}
      />
      
      <ConfirmDialog
        isOpen={!!deletingGroup}
        onClose={() => setDeletingGroup(null)}
        title="Delete Group"
        description={`Are you sure you want to delete ${deletingGroup?.name}? This will delete ALL expenses and settlements associated with this group. This action cannot be undone.`}
        confirmText="Delete Group"
        isDangerous={true}
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deletingGroup) {
            await deleteMutation.mutateAsync(deletingGroup.id)
            setDeletingGroup(null)
          }
        }}
      />
    </div>
  )
}
