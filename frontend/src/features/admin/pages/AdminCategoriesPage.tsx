import { useState, useMemo, type ComponentType } from "react"
import { useAdminCategories } from "../queries"
import { useCreateAdminCategory, useEditAdminCategory, useDeleteAdminCategory } from "../mutations"
import { useAdminTableState } from "../hooks/useAdminTableState"
import { DataTable } from "../components/DataTable"
import type { ColumnDef } from "../components/DataTable"
import { SearchAndFilters } from "../components/SearchAndFilters"
import { AdminPageHeader } from "../components/AdminPageHeader"
import { StatusBadge } from "../components/StatusBadge"
import { AdminModal } from "../components/AdminModal"
import type { FieldDef } from "../components/AdminModal"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { Button } from "@/components/ui/button"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Plus, Edit, Trash2, Tag as TagIcon } from "lucide-react"
import * as LucideIcons from "lucide-react"
import type { AdminCategory } from "../types"

const categoryFields: FieldDef[] = [
  { name: "name", label: "Category Name", type: "text", required: true },
  { name: "icon", label: "Lucide Icon Name (e.g. ShoppingBag, Film)", type: "text", required: true },
]

export function AdminCategoriesPage() {
  const { search, setSearch, page, setPage, sorting, setSorting, queryParams } = useAdminTableState({
    defaultSort: "name"
  })
  
  const { data: response, isLoading } = useAdminCategories(queryParams)
  
  const createMutation = useCreateAdminCategory()
  const editMutation = useEditAdminCategory()
  const deleteMutation = useDeleteAdminCategory()
  
  const [isCreating, setIsCreating] = useState(false)
  const [editingCategory, setEditingCategory] = useState<AdminCategory | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<AdminCategory | null>(null)

  const columns: ColumnDef<AdminCategory>[] = useMemo(() => [
    {
      id: "name",
      header: "Category",
      sortable: true,
      cell: (cat) => {
        const IconComponent = (LucideIcons as unknown as Record<string, ComponentType<{ className?: string }>>)[cat.icon] ?? TagIcon
        return (
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-md">
              <IconComponent className="w-4 h-4" />
            </div>
            <span className="font-semibold text-slate-900 text-sm">{cat.name}</span>
          </div>
        )
      }
    },
    {
      id: "is_default",
      header: "Type",
      cell: (cat) => <StatusBadge status={cat.is_default ? "default" : "custom"} />
    },
    {
      id: "expenses_count",
      header: "Usage",
      cell: (cat) => <span className="text-slate-600 text-sm font-medium">{cat.expenses_count} expenses</span>
    },
    {
      id: "created_by",
      header: "Created By",
      cell: (cat) => <span className="text-slate-600 text-sm font-medium">{cat.created_by_info ? cat.created_by_info.name : "System"}</span>
    }
  ], [])

  return (
    <div>
      <AdminPageHeader 
        title="Categories Management" 
        description="Manage expense categories available across the platform."
        action={
          <Button onClick={() => setIsCreating(true)} className="bg-indigo-600 hover:bg-indigo-700 h-10">
            <Plus className="w-4 h-4 mr-2" /> Create Default Category
          </Button>
        }
      />
      
      <SearchAndFilters 
        searchValue={search}
        onSearch={setSearch}
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
        actions={(cat) => (
          <>
            <DropdownMenuItem onClick={() => setEditingCategory(cat)}>
              <Edit className="w-4 h-4 mr-2" /> Edit
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem 
              className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
              onClick={() => setDeletingCategory(cat)}
            >
              <Trash2 className="w-4 h-4 mr-2" /> Delete
            </DropdownMenuItem>
          </>
        )}
      />
      
      <AdminModal
        open={isCreating}
        onClose={() => setIsCreating(false)}
        title="Create Category"
        fields={categoryFields}
        onSubmit={async (values) => {
          await createMutation.mutateAsync(values)
          setIsCreating(false)
        }}
        isLoading={createMutation.isPending}
      />
      
      <AdminModal
        open={!!editingCategory}
        onClose={() => setEditingCategory(null)}
        title="Edit Category"
        fields={categoryFields}
        initialValues={editingCategory ? { ...editingCategory } : undefined}
        onSubmit={async (values) => {
          if (editingCategory) {
            await editMutation.mutateAsync({ id: editingCategory.id, data: values })
            setEditingCategory(null)
          }
        }}
        isLoading={editMutation.isPending}
      />
      
      <ConfirmDialog
        isOpen={!!deletingCategory}
        onClose={() => setDeletingCategory(null)}
        title="Delete Category"
        description={`Are you sure you want to delete the "${deletingCategory?.name}" category? This action cannot be undone.`}
        confirmText="Delete Category"
        isDangerous={true}
        isLoading={deleteMutation.isPending}
        onConfirm={async () => {
          if (deletingCategory) {
            await deleteMutation.mutateAsync(deletingCategory.id)
            setDeletingCategory(null)
          }
        }}
      />
    </div>
  )
}
