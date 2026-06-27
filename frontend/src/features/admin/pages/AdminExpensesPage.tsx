import { useState } from "react"
import { useAdminExpenses, useAdminSettlements, useAdminGroups, useAdminUsers } from "../queries"
import { useDeleteAdminExpense, useDeleteAdminSettlement } from "../mutations"
import { useAdminTableState } from "../hooks/useAdminTableState"
import { useExportCSV } from "../hooks/useExportCSV"
import { DataTable } from "../components/DataTable"
import type { ColumnDef } from "../components/DataTable"
import { SearchAndFilters } from "../components/SearchAndFilters"
import { AdminPageHeader } from "../components/AdminPageHeader"
import { ConfirmDialog } from "@/components/ui/ConfirmDialog"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { format } from "date-fns"
import { Trash2, ArrowUpRight, Activity } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { AdminExpense, AdminSettlement } from "../types"

export function AdminExpensesPage() {
  const [activeTab, setActiveTab] = useState<"expenses" | "settlements">("expenses")
  
  const { 
    search, setSearch, page, setPage, sorting, setSorting, 
    filters, setFilter, clearFilters, queryParams 
  } = useAdminTableState({
    defaultSort: activeTab === "expenses" ? "-expense_date" : "-settled_at"
  })
  
  const { data: expensesRes, isLoading: expensesLoading } = useAdminExpenses(queryParams)
  const { data: settlementsRes, isLoading: settlementsLoading } = useAdminSettlements(queryParams)
  const { data: groupsRes } = useAdminGroups("limit=500")
  const groups = groupsRes?.data.results || []
  
  const { data: usersRes } = useAdminUsers("limit=500")
  const users = usersRes?.data.results || []
  
  const { exportCSV, isExporting } = useExportCSV()
  
  const deleteExpenseMutation = useDeleteAdminExpense()
  const deleteSettlementMutation = useDeleteAdminSettlement()
  
  const [deletingExpense, setDeletingExpense] = useState<AdminExpense | null>(null)
  const [deletingSettlement, setDeletingSettlement] = useState<AdminSettlement | null>(null)

  const handleExport = () => {
    const endpoint = activeTab === "expenses" ? "expenses" : "settlements"
    const exportUrl = `${import.meta.env.VITE_API_URL || "http://localhost:8000/api"}/admin/${endpoint}/export/?${queryParams}`
    exportCSV(exportUrl, `expanzo_${endpoint}.csv`)
  }

  const expenseColumns: ColumnDef<AdminExpense>[] = [
    {
      id: "title",
      header: "Expense",
      sortable: true,
      cell: (expense) => (
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-rose-50 text-rose-600 rounded-full">
            <ArrowUpRight className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-base">{expense.title}</p>
            <p className="text-sm text-slate-500 font-medium">{expense.group_name}</p>
          </div>
        </div>
      )
    },
    {
      id: "total_amount",
      header: "Amount",
      sortable: true,
      cell: (expense) => <span className="font-medium">₹{parseFloat(expense.total_amount).toFixed(2)}</span>
    },
    {
      id: "category",
      header: "Category",
      cell: (expense) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-sm font-medium bg-slate-100 text-slate-800">
          {expense.category_name || "Uncategorized"}
        </span>
      )
    },
    {
      id: "created_by",
      header: "Added By",
      cell: (expense) => <span className="text-slate-600 text-sm font-medium">{expense.created_by_info?.name}</span>
    },
    {
      id: "expense_date",
      header: "Date",
      sortable: true,
      cell: (expense) => <span className="text-slate-600 text-sm font-medium">{format(new Date(expense.expense_date), "MMM d, yyyy")}</span>
    }
  ]

  const settlementColumns: ColumnDef<AdminSettlement>[] = [
    {
      id: "details",
      header: "Settlement",
      cell: (settlement) => (
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-full">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-base">
              {settlement.paid_by_info?.name} → {settlement.paid_to_info?.name}
            </p>
            <p className="text-sm text-slate-500 font-medium">{settlement.group_name}</p>
          </div>
        </div>
      )
    },
    {
      id: "amount",
      header: "Amount",
      sortable: true,
      cell: (settlement) => <span className="font-medium">₹{parseFloat(settlement.amount).toFixed(2)}</span>
    },
    {
      id: "settled_at",
      header: "Date",
      sortable: true,
      cell: (settlement) => <span className="text-slate-600 text-sm font-medium">{format(new Date(settlement.settled_at), "MMM d, yyyy")}</span>
    }
  ]

  const activeFilterChips = Object.entries(filters).map(([key, value]) => {
    let label = `${key.replace('_', ' ')}: ${value}`
    if (key === 'group' && value) {
      const group = groups.find(g => g.id.toString() === value)
      if (group) {
        label = `Group: ${group.name}`
      }
    }
    if (key === 'user' && value) {
      const user = users.find(u => u.id.toString() === value)
      if (user) {
        label = `User: ${user.full_name}`
      }
    }
    return { id: key, label }
  })

  const FilterDropdowns = (
    <>
      <Select 
        value={filters.group || "all"} 
        onValueChange={(val) => setFilter("group", val === "all" ? null : val)}
      >
        <SelectTrigger className="w-[180px] bg-white data-[size=default]:h-10">
          <SelectValue placeholder="Filter by Group" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          <SelectItem value="all">All Groups</SelectItem>
          {groups.map(group => (
            <SelectItem key={group.id} value={group.id.toString()}>{group.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select 
        value={filters.user || "all"} 
        onValueChange={(val) => setFilter("user", val === "all" ? null : val)}
      >
        <SelectTrigger className="w-[180px] bg-white data-[size=default]:h-10">
          <SelectValue placeholder="Filter by User" />
        </SelectTrigger>
        <SelectContent position="popper" sideOffset={4}>
          <SelectItem value="all">All Users</SelectItem>
          {users.map(user => (
            <SelectItem key={user.id} value={user.id.toString()}>{user.full_name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  )

  return (
    <div>
      <AdminPageHeader 
        title="Transactions Management" 
        description="View and manage all expenses and settlements across the platform."
      />
      
      <Tabs defaultValue="expenses" onValueChange={(val) => setActiveTab(val as "expenses" | "settlements")} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="settlements">Settlements</TabsTrigger>
        </TabsList>
        
        <SearchAndFilters 
          searchValue={search}
          onSearch={setSearch}
          filters={FilterDropdowns}
          activeFilters={activeFilterChips}
          onRemoveFilter={(id) => setFilter(id, null)}
          onClearFilters={clearFilters}
          placeholder={activeTab === "expenses" ? "Search expenses..." : "Search..."}
          onExport={handleExport}
          isExporting={isExporting}
        />
        
        <TabsContent value="expenses" className="mt-0">
          <DataTable 
            columns={expenseColumns}
            data={expensesRes?.data.results || []}
            isLoading={expensesLoading}
            page={page}
            totalPages={expensesRes?.data.total_pages || 1}
            onPageChange={setPage}
            sortField={sorting.field}
            sortDesc={sorting.desc}
            onSortChange={setSorting}
            actions={(expense) => (
              <DropdownMenuItem 
                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                onClick={() => setDeletingExpense(expense)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            )}
          />
        </TabsContent>
        
        <TabsContent value="settlements" className="mt-0">
          <DataTable 
            columns={settlementColumns}
            data={settlementsRes?.data.results || []}
            isLoading={settlementsLoading}
            page={page}
            totalPages={settlementsRes?.data.total_pages || 1}
            onPageChange={setPage}
            sortField={sorting.field}
            sortDesc={sorting.desc}
            onSortChange={setSorting}
            actions={(settlement) => (
              <DropdownMenuItem 
                className="text-rose-600 focus:text-rose-600 focus:bg-rose-50"
                onClick={() => setDeletingSettlement(settlement)}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Delete
              </DropdownMenuItem>
            )}
          />
        </TabsContent>
      </Tabs>
      
      <ConfirmDialog
        isOpen={!!deletingExpense}
        onClose={() => setDeletingExpense(null)}
        title="Delete Expense"
        description={`Are you sure you want to delete "${deletingExpense?.title}"? This will affect member balances in the group. This action cannot be undone.`}
        confirmText="Delete Expense"
        isDangerous={true}
        isLoading={deleteExpenseMutation.isPending}
        onConfirm={async () => {
          if (deletingExpense) {
            await deleteExpenseMutation.mutateAsync(deletingExpense.id)
            setDeletingExpense(null)
          }
        }}
      />
      
      <ConfirmDialog
        isOpen={!!deletingSettlement}
        onClose={() => setDeletingSettlement(null)}
        title="Delete Settlement"
        description={`Are you sure you want to delete this settlement? This will revert the balances. This action cannot be undone.`}
        confirmText="Delete Settlement"
        isDangerous={true}
        isLoading={deleteSettlementMutation.isPending}
        onConfirm={async () => {
          if (deletingSettlement) {
            await deleteSettlementMutation.mutateAsync(deletingSettlement.id)
            setDeletingSettlement(null)
          }
        }}
      />
    </div>
  )
}
