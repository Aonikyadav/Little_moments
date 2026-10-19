import type { BinderTheme, PaperTheme } from "../data/scrapbookDecos"

export interface StickyNoteItem {
  id: string
  text: string
  color: "yellow" | "pink" | "mint" | "lavender" | "blue" | "polaroid" | "dymo-black" | "kraft-tag"
  x: number // percentage (0-100)
  y: number // percentage (0-100)
  rotation: number
  fontFamily?: "caveat" | "gochi"
  variant?: "sticky" | "caption-strip" | "dymo"
}

export interface PlacedDecoStamp {
  id: string
  stampId: string
  x: number // percentage (0-100)
  y: number // percentage (0-100)
  rotation: number
  scale: number
}

export interface PageCustomization {
  memo?: string
  memoFont?: "caveat" | "gochi"
  washiStyle?: string
  stickyNotes?: StickyNoteItem[]
  decoStamps?: PlacedDecoStamp[]
}

export interface ScrapbookGlobalSettings {
  binderTheme: BinderTheme
  paperTheme: PaperTheme
}

const STORAGE_KEY = "lm_scrapbook_customizations_v1"
const SETTINGS_KEY = "lm_scrapbook_settings_v1"

export function loadScrapbookSettings(): ScrapbookGlobalSettings {
  if (typeof window === "undefined") {
    return { binderTheme: "silver", paperTheme: "ivory" }
  }
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.warn("Failed to load scrapbook settings:", e)
  }
  return { binderTheme: "silver", paperTheme: "ivory" }
}

export function saveScrapbookSettings(settings: ScrapbookGlobalSettings) {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
  } catch (e) {
    console.warn("Failed to save scrapbook settings:", e)
  }
}

export function loadAllPageCustomizations(): Record<string, PageCustomization> {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (e) {
    console.warn("Failed to load scrapbook customizations:", e)
  }
  return {}
}

export function savePageCustomization(itemId: string, patch: Partial<PageCustomization>) {
  if (typeof window === "undefined") return
  try {
    const current = loadAllPageCustomizations()
    const existing = current[itemId] || {}
    current[itemId] = { ...existing, ...patch }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch (e) {
    console.warn("Failed to save scrapbook page customization:", e)
  }
}

export function resetPageCustomization(itemId: string) {
  if (typeof window === "undefined") return
  try {
    const current = loadAllPageCustomizations()
    delete current[itemId]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current))
  } catch (e) {
    console.warn("Failed to reset scrapbook page customization:", e)
  }
}
