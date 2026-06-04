import {
  Utensils,
  Car,
  Film,
  ShoppingBag,
  Zap,
  Home,
  Tag,
  Gift,
  HeartPulse,
  BookOpen,
  Briefcase,
  Wrench,
  HelpCircle
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export const ICON_MAP: Record<string, LucideIcon> = {
  Utensils,
  Car,
  Film,
  ShoppingBag,
  Zap,
  Home,
  Tag,
  Gift,
  HeartPulse,
  BookOpen,
  Briefcase,
  Wrench,
  HelpCircle
}

export const getCategoryIcon = (iconName?: string | null) => {
  if (!iconName) return Tag
  const key = Object.keys(ICON_MAP).find(k => k.toLowerCase() === iconName.toLowerCase())
  return key ? ICON_MAP[key] : Tag
}
