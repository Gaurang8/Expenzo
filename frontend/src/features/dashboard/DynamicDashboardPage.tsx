import { useState } from "react"
import { Send, LayoutDashboard, History, Sparkles, Loader2, Save } from "lucide-react"
import { useGenerateDashboard, useSaveDashboard } from "./mutations"
import { useDashboardHistory } from "./queries"
import { WidgetRenderer } from "./components/WidgetRenderer"
import { DashboardHistorySidebar } from "./components/DashboardHistorySidebar"
import { toast } from "@/lib/toast"
import type { DashboardResponse, DashboardHistoryItem } from "./types"
import { useAuthStore } from "@/store/auth-store"
import { ProUpgradePrompt } from "@/features/subscription/ProUpgradePrompt"

const PREDEFINED_PROMPTS = [
  "Create a comprehensive dashboard with a bar chart of my monthly expenses, a donut chart showing my top spending categories, and a summary of my overall financial health this year.",
  "Compare my total payments with Jatin across all groups using a pie chart, and provide a detailed data table of our last 10 shared transactions along with a quick text summary.",
  "Build an 'Office Friends' group dashboard containing a bar chart of who paid the most, a list of the 5 most expensive transactions, and a pie chart breaking down the group's expenses by category.",
]

export function DynamicDashboardPage() {
  const [prompt, setPrompt] = useState("")
  const [currentDashboard, setCurrentDashboard] = useState<DashboardResponse | null>(null)
  const [currentPrompt, setCurrentPrompt] = useState("") // Track prompt for saving
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  const { mutate: generate, isPending: isGenerating } = useGenerateDashboard()
  const { mutate: save, isPending: isSaving } = useSaveDashboard()
  const { data: history = [], isLoading: isLoadingHistory } = useDashboardHistory()
  const { user } = useAuthStore()

  if (user?.subscription_plan !== "PRO") {
    return <ProUpgradePrompt />
  }

  const handleGenerate = (text: string) => {
    const query = text.trim()
    if (!query) return

    setPrompt(query)
    setCurrentDashboard(null)
    setCurrentPrompt(query)

    generate(query, {
      onSuccess: (res) => {
        setCurrentDashboard(res)
        setIsSaved(false)
      },
      onError: () => {
        toast.error("Failed to generate dashboard. Try again.")
      }
    })
  }

  const handleSave = () => {
    if (!currentDashboard || !currentPrompt || isSaved) return
    save({ prompt: currentPrompt, dashboard_data: currentDashboard }, {
      onSuccess: () => {
        toast.success("Dashboard saved to history!")
        setIsSaved(true)
      },
      onError: () => toast.error("Failed to save dashboard.")
    })
  }

  const handleSelectHistory = (item: DashboardHistoryItem) => {
    setCurrentDashboard(item.dashboard_data)
    setCurrentPrompt(item.prompt)
    setPrompt(item.prompt)
    setIsSaved(true)
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 p-6 md:px-8 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-md shadow-indigo-200">
              <LayoutDashboard className="size-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-800 tracking-tight">AI Insights Dashboard</h1>
              <p className="text-sm text-slate-500 hidden sm:block">Ask the AI to analyze your finances across all groups.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {currentDashboard && (
              <button
                onClick={handleSave}
                disabled={isSaving || isSaved}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isSaved 
                    ? "bg-emerald-50 text-emerald-600 border border-emerald-200 cursor-not-allowed" 
                    : "bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50"
                }`}
              >
                <Save className="size-4" />
                <span className="hidden sm:inline">
                  {isSaving ? "Saving..." : isSaved ? "Saved" : "Save Dashboard"}
                </span>
              </button>
            )}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-indigo-600 transition-colors"
            >
              <History className="size-4" />
              <span className="hidden sm:inline">History</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="max-w-7xl mx-auto h-full">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-4 min-h-[300px]">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
                <Loader2 className="size-8 text-indigo-500 animate-spin" />
              </div>
              <p className="font-medium animate-pulse">Analyzing your financial data...</p>
            </div>
          ) : currentDashboard ? (
            <div className="space-y-6 pb-6">
              <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
                {currentDashboard.title || "Dashboard Results"}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentDashboard.widgets.map((widget, i) => (
                  <WidgetRenderer key={widget.id || i} widget={widget} />
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-400 space-y-4">
              <LayoutDashboard className="size-16 opacity-20" />
              <p className="text-sm font-medium">Ask a question below to generate your dashboard.</p>
              
              {/* Suggestions in empty state */}
              <div className="mt-8 flex flex-col items-center gap-3 max-w-2xl w-full">
                {PREDEFINED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => handleGenerate(p)}
                    className="flex items-center gap-2 px-4 py-3 w-full text-left rounded-xl border border-indigo-100/50 bg-white text-slate-600 text-sm hover:border-indigo-300 hover:shadow-md transition-all group"
                  >
                    <Sparkles className="size-4 text-indigo-400 group-hover:text-indigo-600 shrink-0" />
                    <span className="line-clamp-2">{p}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prompt Area (Bottom) */}
      <div className="bg-white border-t border-slate-200 p-4 md:p-6 shrink-0 shadow-[0_-4px_6px_-1px_rgb(0,0,0,0.05)] z-10">
        <div className="max-w-5xl mx-auto">
          <div className="relative">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate(prompt)}
              placeholder="e.g., Show my spending by category in a pie chart..."
              className="w-full pl-5 pr-14 py-4 rounded-2xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm shadow-sm"
              disabled={isGenerating}
            />
            <button
              onClick={() => handleGenerate(prompt)}
              disabled={isGenerating || !prompt.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 flex items-center justify-center transition-colors shadow-sm"
            >
              {isGenerating ? <Loader2 className="size-4 text-white animate-spin" /> : <Send className="size-4 text-white" />}
            </button>
          </div>
        </div>
      </div>

      <DashboardHistorySidebar
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        isLoading={isLoadingHistory}
        onSelect={handleSelectHistory}
      />
    </div>
  )
}
