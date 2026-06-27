import { useState } from "react"
import { toast } from "sonner"

export function useExportCSV() {
  const [isExporting, setIsExporting] = useState(false)

  const exportCSV = async (url: string, filename: string) => {
    setIsExporting(true)
    const toastId = toast.loading("Preparing CSV export...")
    
    try {
      const token = localStorage.getItem("access_token")
      const response = await fetch(url, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        }
      })
      
      if (!response.ok) {
        throw new Error("Export failed")
      }
      
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = downloadUrl
      a.download = filename
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(downloadUrl)
      
      toast.success("Export successful", { id: toastId })
    } catch (error) {
      console.error(error)
      toast.error("Failed to export data", { id: toastId })
    } finally {
      setIsExporting(false)
    }
  }

  return { exportCSV, isExporting }
}
