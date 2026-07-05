import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from "recharts"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import type { DashboardWidget } from "../types"

const COLORS = ["#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#f59e0b", "#10b981", "#3b82f6"]

export function WidgetRenderer({ widget }: { widget: DashboardWidget }) {
  const { type, title, data, description } = widget

  const renderContent = () => {
    switch (type) {
      case "bar":
        return (
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data}>
                <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )
      
      case "pie":
      case "donut": {
        const isDonut = type === "donut"
        return (
          <div className="h-64 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={isDonut ? 60 : 0}
                  outerRadius={80}
                  paddingAngle={isDonut ? 2 : 0}
                >
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                  formatter={(value: unknown) => `₹${value}`}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )
      }

      case "table": {
        if (!data || data.length === 0) return <p className="text-sm text-slate-500 mt-4">No data</p>
        const cols = Object.keys(data[0])
        return (
          <div className="overflow-x-auto mt-4 rounded-xl border border-slate-200 shadow-sm">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50/80 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  {cols.map((c) => (
                    <th key={c} className="px-5 py-3 capitalize tracking-wide">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-indigo-50/30 transition-colors">
                    {cols.map((c) => (
                      <td key={c} className="px-5 py-3 text-slate-700">{String(row[c])}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }

      case "summary":
        return (
          <div className="mt-4 text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{description || ""}</ReactMarkdown>
          </div>
        )

      case "list":
        return (
          <ul className="mt-4 space-y-3">
            {data.map((item, i) => (
              <li key={i} className="text-sm text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {typeof item === 'object' && item !== null ? (
                    item.name || item.title ? (
                      <div className="w-full font-semibold text-slate-900 mb-0.5">{(item.name as string) || (item.title as string)}</div>
                    ) : null
                  ) : null}
                  
                  {typeof item === 'object' && item !== null ? (
                     Object.entries(item).filter(([k]) => k !== 'name' && k !== 'title').map(([key, val]) => (
                        <div key={key} className="flex items-center gap-1.5">
                           <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{key}:</span>
                           <span className="text-slate-700 font-medium">{String(val)}</span>
                        </div>
                     ))
                  ) : (
                    <span className="font-medium text-slate-800">{String(item)}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )

      default:
        return <p className="text-sm text-red-500 mt-4">Unsupported widget type: {type}</p>
    }
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-slate-200 p-5 ${
        widget.column_span === 2 ? "md:col-span-2" : widget.column_span === 3 ? "lg:col-span-3 md:col-span-2" : ""
      }`}
    >
      <h3 className="font-semibold text-slate-800 text-lg">{title}</h3>
      {type !== "summary" && description && (
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      )}
      {renderContent()}
    </div>
  )
}
