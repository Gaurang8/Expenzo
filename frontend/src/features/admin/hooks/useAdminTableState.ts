import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import type { SortingState } from "../types"

interface UseAdminTableStateOptions {
  defaultSort?: string
  defaultLimit?: number
}

export function useAdminTableState(options: UseAdminTableStateOptions = {}) {
  const { defaultSort = "-created_at", defaultLimit = 10 } = options
  const [searchParams, setSearchParams] = useSearchParams()
  
  // Initialize state from URL or defaults
  const search = searchParams.get("search") || ""
  const page = Math.max(1, Number(searchParams.get("page")) || 1)
  
  const urlSort = searchParams.get("ordering")
  const initialSort = urlSort || defaultSort
  
  const sorting: SortingState = useMemo(() => ({
    field: initialSort.startsWith("-") ? initialSort.substring(1) : initialSort,
    desc: initialSort.startsWith("-"),
  }), [initialSort])
  
  const filters = useMemo(() => {
    const activeFilters: Record<string, string> = {}
    searchParams.forEach((value, key) => {
      if (!["search", "page", "ordering", "limit"].includes(key)) {
        activeFilters[key] = value
      }
    })
    return activeFilters
  }, [searchParams])

  // Update URL and State
  const updateUrl = useCallback((newParams: Record<string, string | null>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev)
      Object.entries(newParams).forEach(([key, value]) => {
        if (value === null || value === "") {
          next.delete(key)
        } else {
          next.set(key, value)
        }
      })
      return next
    }, { replace: true })
  }, [setSearchParams])

  const setSearch = useCallback((term: string) => {
    updateUrl({ search: term, page: "1" })
  }, [updateUrl])

  const setPage = useCallback((newPage: number) => {
    updateUrl({ page: newPage.toString() })
  }, [updateUrl])

  const setSorting = useCallback((field: string) => {
    const isCurrentlyDesc = initialSort.startsWith("-")
    const currentField = isCurrentlyDesc ? initialSort.substring(1) : initialSort
    
    const desc = currentField === field ? !isCurrentlyDesc : true // default new sorts to desc
    const newOrdering = desc ? `-${field}` : field
    
    updateUrl({ ordering: newOrdering })
  }, [initialSort, updateUrl])

  const setFilter = useCallback((key: string, value: string | null) => {
    updateUrl({ [key]: value, page: "1" })
  }, [updateUrl])
  
  const clearFilters = useCallback(() => {
    // Create new URL params keeping only search and ordering
    setSearchParams(prev => {
      const next = new URLSearchParams()
      if (prev.has("search")) next.set("search", prev.get("search")!)
      if (prev.has("ordering")) next.set("ordering", prev.get("ordering")!)
      return next
    }, { replace: true })
  }, [setSearchParams])

  // Computed query string for the API
  const queryParams = useMemo(() => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    params.set("page", page.toString())
    params.set("limit", defaultLimit.toString())
    
    const ordering = sorting.desc ? `-${sorting.field}` : sorting.field
    params.set("ordering", ordering)
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })
    
    return params.toString()
  }, [search, page, sorting, filters, defaultLimit])

  return {
    search,
    setSearch,
    page,
    setPage,
    sorting,
    setSorting,
    filters,
    setFilter,
    clearFilters,
    queryParams,
  }
}
