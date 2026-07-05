import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { History, Clock, FileBarChart } from "lucide-react"
import type { DashboardHistoryItem } from "../types"

interface Props {
  isOpen: boolean
  onClose: () => void
  history: DashboardHistoryItem[]
  isLoading: boolean
  onSelect: (item: DashboardHistoryItem) => void
}

export function DashboardHistorySidebar({ isOpen, onClose, history, isLoading, onSelect }: Props) {
  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-[400px] sm:w-[540px] p-0 flex flex-col bg-slate-50/50">
        <SheetHeader className="px-6 py-4 border-b border-slate-100 bg-white">
          <SheetTitle className="flex items-center gap-2 text-slate-800">
            <History className="size-5 text-indigo-500" />
            Dashboard History
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {isLoading ? (
            <p className="text-sm text-slate-400 text-center mt-10">Loading history...</p>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-3 pb-20">
              <FileBarChart className="size-12 opacity-20" />
              <p className="text-sm">No saved dashboards yet.</p>
            </div>
          ) : (
            history.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item)
                  onClose()
                }}
                className="w-full text-left bg-white p-4 rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-slate-800 line-clamp-1 flex-1 pr-4">
                    {item.dashboard_data.title || "Generated Dashboard"}
                  </h4>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400 shrink-0 mt-0.5">
                    <Clock className="size-3" />
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
                <p className="text-xs text-slate-500 line-clamp-2 italic">
                  "{item.prompt}"
                </p>
                <div className="mt-3 flex gap-2">
                  <span className="text-[10px] font-medium px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full">
                    {item.dashboard_data.widgets.length} widgets
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
