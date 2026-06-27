import React, { useState, useEffect } from "react"
import { Search, Filter, X, Download } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

interface SearchAndFiltersProps {
  onSearch: (value: string) => void
  searchValue: string
  placeholder?: string
  
  // Custom filter nodes (like dropdowns)
  filters?: React.ReactNode
  
  // Active filter chips
  activeFilters?: { id: string; label: string }[]
  onRemoveFilter?: (id: string) => void
  onClearFilters?: () => void
  
  onExport?: () => void
  isExporting?: boolean
}

export function SearchAndFilters({
  onSearch,
  searchValue,
  placeholder = "Search...",
  filters,
  activeFilters = [],
  onRemoveFilter,
  onClearFilters,
  onExport,
  isExporting = false
}: SearchAndFiltersProps) {
  const [localSearch, setLocalSearch] = useState(searchValue)

  // Debounce search \u2014 fires when user types; guard prevents re-fire when prop syncs back
  useEffect(() => {
    if (localSearch === searchValue) return
    
    const timer = setTimeout(() => {
      onSearch(localSearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [localSearch, onSearch, searchValue])

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="flex flex-1 gap-3 items-center w-full">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={placeholder}
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="pl-9 bg-white h-10"
            />
            {localSearch && (
              <button 
                onClick={() => setLocalSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          {filters && (
            <div className="flex gap-2 items-center">
              {filters}
            </div>
          )}
        </div>
        
        {onExport && (
          <Button 
            variant="outline" 
            className="w-full sm:w-auto bg-white h-10" 
            onClick={onExport}
            disabled={isExporting}
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Exporting..." : "Export CSV"}
          </Button>
        )}
      </div>
      
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="text-slate-500 font-medium text-xs flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Active Filters:
          </span>
          {activeFilters.map(filter => (
            <span 
              key={filter.id} 
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
            >
              {filter.label}
              <button 
                onClick={() => onRemoveFilter?.(filter.id)}
                className="ml-1.5 inline-flex items-center justify-center text-indigo-400 hover:text-indigo-600 focus:outline-none"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button
            onClick={onClearFilters ?? (() => activeFilters.forEach(f => onRemoveFilter?.(f.id)))}
            className="text-xs text-slate-500 hover:text-slate-700 underline underline-offset-2"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
