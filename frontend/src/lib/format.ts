import { format, parseISO } from "date-fns"

/**
 * Formats a number or string as a currency amount.
 * Default is INR (₹).
 */
export function formatCurrency(amount: number | string, currency = 'INR') {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  if (isNaN(numericAmount)) return '₹0.00'

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericAmount)
}

/**
 * Formats a date string or Date object.
 * Default pattern is 'MMM d, yyyy' (e.g. May 10, 2026).
 */
export function formatDate(date: string | Date, pattern = 'MMM d, yyyy') {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, pattern)
}

/**
 * Formats a date as 'Month Year' (e.g. May 2026).
 * Useful for grouping activities.
 */
export function formatMonthYear(date: string | Date) {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, 'MMMM yyyy')
}

/**
 * Gets initials from a full name.
 * e.g. "Gaurang Mevada" -> "GM"
 */
export function getInitials(name?: string) {
  if (!name) return "U"
  
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  
  if (parts.length === 1 && parts[0].length > 0) {
    return parts[0][0].toUpperCase()
  }
  
  return "U"
}

/**
 * Formats a number as a percentage string.
 */
export function formatPercentage(value: number | string) {
  const numericValue = typeof value === 'string' ? parseFloat(value) : value
  if (isNaN(numericValue)) return '0%'
  return `${numericValue}%`
}
