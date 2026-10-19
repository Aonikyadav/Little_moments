import { useState, useEffect, useMemo, useRef } from "react"
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Maximize2,
  Minimize2,
  Play,
  Pause,
  Paintbrush,
  Calendar,
  Heart,
  Plus,
  StickyNote,
  Palette,
  RotateCcw,
  Trash2,
  Check,
  Edit3,
} from "lucide-react"
import type { Composition } from "../types"
import { getTemplate } from "../templates"
import {
  WASHI_PATTERNS,
  DECO_STAMPS,
  BINDER_THEMES,
  PAPER_THEMES,
  BinderTheme,
  PaperTheme,
} from "../data/scrapbookDecos"
import {
  loadScrapbookSettings,
  saveScrapbookSettings,
  loadAllPageCustomizations,
  savePageCustomization,
  resetPageCustomization,
  StickyNoteItem,
  PlacedDecoStamp,
} from "../studio/scrapbookStore"

export interface ScrapbookItem {
  id: string
  title: string
  date: string
  composition?: Composition
  previewUrl?: string
  templateName?: string
  category?: string
  note: string
  memoFont?: "caveat" | "gochi"
  washiStyle: string
  rotation?: number
}

export interface ScrapbookAlbumProps {
  creations: { id: string; name: string; date: string; data: Composition; previewUrl?: string }[]
  onOpenInStudio: (composition: Composition) => void
  onExportCreation: (composition: Composition) => void
  onNewStrip: () => void
}

export const STICKY_PRESETS = [
  { id: "yellow", name: "Buttercup", bg: "#fef08a", border: "#fde047", text: "#713f12", variant: "sticky" },
  { id: "pink", name: "Baby Pink", bg: "#fce7f3", border: "#fbcfe8", text: "#831843", variant: "sticky" },
  { id: "mint", name: "Sage Mint", bg: "#dcfce7", border: "#bbf7d0", text: "#14532d", variant: "sticky" },
  { id: "lavender", name: "Lilac Haze", bg: "#ede9fe", border: "#ddd6fe", text: "#4c1d95", variant: "sticky" },
  { id: "blue", name: "Sky Mist", bg: "#e0f2fe", border: "#bae6fd", text: "#0c4a6e", variant: "sticky" },
  { id: "polaroid", name: "Polaroid Strip", bg: "#ffffff", border: "#e2e8f0", text: "#0f172a", variant: "caption-strip" },
  { id: "dymo-black", name: "Dymo Tape", bg: "#18181b", border: "#27272a", text: "#f8fafc", variant: "dymo" },
  { id: "kraft-tag", name: "Kraft Label", bg: "#d7ba89", border: "#b49265", text: "#451a03", variant: "caption-strip" },
] as const

export const LOCATION_PRESETS = [
  "Hongdae 24hr Booth · 11:45 PM",
  "Seoul Photobooth · 8:30 PM",
  "Late Night Arcade · 01:15 AM",
  "Myeongdong 4-Cut Studio",
  "Date Night In Seoul ♡",
  "Under The Neon Lights ★",
]

export function ScrapbookAlbum({
  creations,
  onOpenInStudio,
  onNewStrip,
}: ScrapbookAlbumProps) {
  // Global settings (Binder & Paper theme)
  const [settings, setSettings] = useState(() => loadScrapbookSettings())
  const [customizations, setCustomizations] = useState(() => loadAllPageCustomizations())

  // Navigation
  const [currentSpread, setCurrentSpread] = useState(0)
  const [isFlipping, setIsFlipping] = useState(false)
  const [flipDirection, setFlipDirection] = useState<"next" | "prev">("next")
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [autoPlay, setAutoPlay] = useState(false)

  // In-place memo editing state
  const [editingMemoSide, setEditingMemoSide] = useState<"left" | "right" | null>(null)
  const [memoDraftText, setMemoDraftText] = useState("")
  const [memoDraftFont, setMemoDraftFont] = useState<"caveat" | "gochi">("caveat")

  // Floating toolbar modal trays & target page side ("left" or "right")
  const [activeToolTray, setActiveToolTray] = useState<"themes" | "sticky" | "stamps" | null>(null)
  const [targetSide, setTargetSide] = useState<"left" | "right">("left")
  const [washiToast, setWashiToast] = useState<string | null>(null)

  // Dragging support for sticky notes & stamps
  const draggingItemRef = useRef<{
    type: "sticky" | "stamp"
    side: "left" | "right"
    itemId: string
    elemId: string
    startX: number
    startY: number
    startElemX: number
    startElemY: number
    pageWidth: number
    pageHeight: number
  } | null>(null)

  const leftPageRef = useRef<HTMLDivElement>(null)
  const rightPageRef = useRef<HTMLDivElement>(null)

  // Construct base scrapbook items
  const baseItems: ScrapbookItem[] = useMemo(() => {
    if (creations.length > 0) {
      return creations.map((c, i) => {
        const tmpl = c.data?.templateId ? getTemplate(c.data.templateId) : null
        return {
          id: c.id,
          title: c.name || `Memory Strip ${i + 1}`,
          date: c.date ? new Date(c.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Today",
          composition: c.data,
          previewUrl: c.previewUrl,
          templateName: tmpl?.name || "Photobooth Strip",
          category: tmpl?.category || "Keepsake",
          note: i % 2 === 0 ? "captured with good company & late night laughs ♡" : "best moments never fade · seoul memories",
          washiStyle: WASHI_PATTERNS[i % WASHI_PATTERNS.length].id,
          rotation: [-1.5, 1.2, -0.8, 1.5, -1.8][i % 5],
        }
      })
    }

    return [
      {
        id: "sample-1",
        title: "Seoul Photobooth Date ♡",
        date: "Oct 19, 2026",
        templateName: "Sweethearts Couple · 4-Cut Classic",
        category: "Romantic Kiss Pose Aesthetic ♡",
        previewUrl: "/covers/cover-046.jpg",
        note: "rainy evening in hongdae · warm tteokbokki and booth giggles",
        washiStyle: "stripe",
        rotation: -1.2,
      },
      {
        id: "sample-2",
        title: "Hongdae Night Walk",
        date: "Oct 15, 2026",
        templateName: "Kiss Pose Couple Soft Blur · 4-Cut",
        category: "Romantic Kiss Pose Aesthetic ♡",
        previewUrl: "/covers/cover-052.jpg",
        note: "under the neon signs · 24hr arcade memories",
        washiStyle: "kraft",
        rotation: 1.5,
      },
      {
        id: "sample-3",
        title: "Birthday Twin Keepsake",
        date: "Sep 28, 2026",
        templateName: "Purple & Beige Birthday Twin Strip",
        category: "K-Booth (인생네컷)",
        previewUrl: "/covers/cover-017.jpg",
        note: "candles, cake, and matching party hats!",
        washiStyle: "pink-dot",
        rotation: -1.8,
      },
      {
        id: "sample-4",
        title: "Cool Besties Spider Cut",
        date: "Sep 14, 2026",
        templateName: "Spider Web Pink Pastel · 4-Cut",
        category: "Cool & Spider Animated 🕸️",
        previewUrl: "/covers/cover-001.jpg",
        note: "matching rings and endless laughter ♡",
        washiStyle: "lavender",
        rotation: 1.1,
      },
    ]
  }, [creations])

  const itemsPerSpread = 2
  const totalSpreads = Math.max(1, Math.ceil(baseItems.length / itemsPerSpread))

  const leftBase = baseItems[currentSpread * 2]
  const rightBase = baseItems[currentSpread * 2 + 1]

  // Merge with user customizations
  const leftItem = leftBase
    ? {
        ...leftBase,
        note: customizations[leftBase.id]?.memo ?? leftBase.note,
        memoFont: customizations[leftBase.id]?.memoFont ?? "caveat",
        washiStyle: customizations[leftBase.id]?.washiStyle ?? leftBase.washiStyle,
      }
    : null

  const rightItem = rightBase
    ? {
        ...rightBase,
        note: customizations[rightBase.id]?.memo ?? rightBase.note,
        memoFont: customizations[rightBase.id]?.memoFont ?? "caveat",
        washiStyle: customizations[rightBase.id]?.washiStyle ?? rightBase.washiStyle,
      }
    : null

  const leftCustom = leftItem ? customizations[leftItem.id] || {} : {}
  const rightCustom = rightItem ? customizations[rightItem.id] || {} : {}

  // Handle Binder / Paper Theme Change
  const updateSettings = (patch: Partial<typeof settings>) => {
    const updated = { ...settings, ...patch }
    setSettings(updated)
    saveScrapbookSettings(updated)
  }

  // Washi tape click cycler
  const cycleWashiTape = (itemId: string, currentStyle: string) => {
    const idx = WASHI_PATTERNS.findIndex((p) => p.id === currentStyle)
    const nextPattern = WASHI_PATTERNS[(idx + 1) % WASHI_PATTERNS.length]
    savePageCustomization(itemId, { washiStyle: nextPattern.id })
    setCustomizations((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], washiStyle: nextPattern.id },
    }))
    setWashiToast(`Washi Tape: ${nextPattern.name}`)
    setTimeout(() => setWashiToast(null), 2200)
  }

  // In-place memo save
  const startEditingMemo = (side: "left" | "right") => {
    const item = side === "left" ? leftItem : rightItem
    if (!item) return
    setEditingMemoSide(side)
    setMemoDraftText(item.note)
    setMemoDraftFont(item.memoFont || "caveat")
  }

  const saveMemo = (side: "left" | "right") => {
    const item = side === "left" ? leftItem : rightItem
    if (!item) return
    const finalMemo = memoDraftText.trim() || item.note
    savePageCustomization(item.id, { memo: finalMemo, memoFont: memoDraftFont })
    setCustomizations((prev) => ({
      ...prev,
      [item.id]: { ...prev[item.id], memo: finalMemo, memoFont: memoDraftFont },
    }))
    setEditingMemoSide(null)
  }

  // Add Sticky Note to active spread side
  const addStickyNote = (
    side: "left" | "right",
    color: any,
    presetText?: string,
    variant: "sticky" | "caption-strip" | "dymo" = "sticky",
  ) => {
    const item = side === "left" ? leftItem : rightItem
    if (!item) return

    const defaultText =
      presetText ||
      (variant === "dymo"
        ? "HONGDAE 24HR · 11:45 PM"
        : variant === "caption-strip"
        ? "Best moments in Seoul ♡"
        : "remember this moment ♡")

    const newNote: StickyNoteItem = {
      id: `sticky_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      text: defaultText,
      color,
      x: side === "left" ? 18 : 65,
      y: variant === "caption-strip" || variant === "dymo" ? 42 : 72,
      rotation: variant === "dymo" ? 0 : Math.round((Math.random() * 8 - 4) * 10) / 10,
      fontFamily: variant === "dymo" ? undefined : "caveat",
      variant,
    }

    const currentNotes = (customizations[item.id]?.stickyNotes || [])
    const nextNotes = [...currentNotes, newNote]
    savePageCustomization(item.id, { stickyNotes: nextNotes })
    setCustomizations((prev) => ({
      ...prev,
      [item.id]: { ...prev[item.id], stickyNotes: nextNotes },
    }))
    setActiveToolTray(null)
  }

  const toggleStickyNoteFont = (itemId: string, noteId: string) => {
    const currentNotes = customizations[itemId]?.stickyNotes || []
    const nextNotes = currentNotes.map((n) => {
      if (n.id !== noteId) return n
      const nextFont = n.fontFamily === "gochi" ? "caveat" : "gochi"
      return { ...n, fontFamily: nextFont as "caveat" | "gochi" }
    })
    savePageCustomization(itemId, { stickyNotes: nextNotes })
    setCustomizations((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], stickyNotes: nextNotes },
    }))
  }

  // Delete Sticky Note
  const deleteStickyNote = (itemId: string, noteId: string) => {
    const currentNotes = (customizations[itemId]?.stickyNotes || [])
    const nextNotes = currentNotes.filter((n) => n.id !== noteId)
    savePageCustomization(itemId, { stickyNotes: nextNotes })
    setCustomizations((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], stickyNotes: nextNotes },
    }))
  }

  // Update Sticky Note text
  const updateStickyNoteText = (itemId: string, noteId: string, newText: string) => {
    const currentNotes = (customizations[itemId]?.stickyNotes || [])
    const nextNotes = currentNotes.map((n) => (n.id === noteId ? { ...n, text: newText } : n))
    savePageCustomization(itemId, { stickyNotes: nextNotes })
    setCustomizations((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], stickyNotes: nextNotes },
    }))
  }

  // Add Deco Stamp
  const addDecoStamp = (side: "left" | "right", stampId: string) => {
    const item = side === "left" ? leftItem : rightItem
    if (!item) return

    const newStamp: PlacedDecoStamp = {
      id: `stamp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      stampId,
      x: side === "left" ? 14 : 72,
      y: 22,
      rotation: Math.round((Math.random() * 20 - 10) * 10) / 10,
      scale: 1,
    }

    const currentStamps = (customizations[item.id]?.decoStamps || [])
    const nextStamps = [...currentStamps, newStamp]
    savePageCustomization(item.id, { decoStamps: nextStamps })
    setCustomizations((prev) => ({
      ...prev,
      [item.id]: { ...prev[item.id], decoStamps: nextStamps },
    }))
    setActiveToolTray(null)
  }

  // Delete Deco Stamp
  const deleteDecoStamp = (itemId: string, stampElemId: string) => {
    const currentStamps = (customizations[itemId]?.decoStamps || [])
    const nextStamps = currentStamps.filter((s) => s.id !== stampElemId)
    savePageCustomization(itemId, { decoStamps: nextStamps })
    setCustomizations((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], decoStamps: nextStamps },
    }))
  }

  // Reset page decorations
  const resetPage = (itemId: string) => {
    resetPageCustomization(itemId)
    setCustomizations((prev) => {
      const copy = { ...prev }
      delete copy[itemId]
      return copy
    })
  }

  // Drag listeners
  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      const drag = draggingItemRef.current
      if (!drag) return
      const deltaX = e.clientX - drag.startX
      const deltaY = e.clientY - drag.startY
      const deltaPercentX = (deltaX / drag.pageWidth) * 100
      const deltaPercentY = (deltaY / drag.pageHeight) * 100

      const newX = Math.min(90, Math.max(5, drag.startElemX + deltaPercentX))
      const newY = Math.min(92, Math.max(8, drag.startElemY + deltaPercentY))

      if (drag.type === "sticky") {
        setCustomizations((prev) => {
          const notes = prev[drag.itemId]?.stickyNotes || []
          return {
            ...prev,
            [drag.itemId]: {
              ...prev[drag.itemId],
              stickyNotes: notes.map((n) => (n.id === drag.elemId ? { ...n, x: newX, y: newY } : n)),
            },
          }
        })
      } else {
        setCustomizations((prev) => {
          const stamps = prev[drag.itemId]?.decoStamps || []
          return {
            ...prev,
            [drag.itemId]: {
              ...prev[drag.itemId],
              decoStamps: stamps.map((s) => (s.id === drag.elemId ? { ...s, x: newX, y: newY } : s)),
            },
          }
        })
      }
    }

    const handlePointerUp = () => {
      const drag = draggingItemRef.current
      if (!drag) return
      // Persist final position
      const finalCustom = customizations[drag.itemId]
      if (finalCustom) {
        savePageCustomization(drag.itemId, finalCustom)
      }
      draggingItemRef.current = null
    }

    window.addEventListener("pointermove", handlePointerMove)
    window.addEventListener("pointerup", handlePointerUp)
    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
      window.removeEventListener("pointerup", handlePointerUp)
    }
  }, [customizations])

  // Page turns
  const goToNextSpread = () => {
    if (currentSpread < totalSpreads - 1) {
      setFlipDirection("next")
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentSpread((s) => s + 1)
        setIsFlipping(false)
      }, 300)
    }
  }

  const goToPrevSpread = () => {
    if (currentSpread > 0) {
      setFlipDirection("prev")
      setIsFlipping(true)
      setTimeout(() => {
        setCurrentSpread((s) => s - 1)
        setIsFlipping(false)
      }, 300)
    }
  }

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (editingMemoSide !== null) return // don't navigate while typing memo
      if (e.key === "ArrowRight") goToNextSpread()
      if (e.key === "ArrowLeft") goToPrevSpread()
      if (e.key === "Escape" && isFullscreen) setIsFullscreen(false)
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [currentSpread, totalSpreads, isFullscreen, editingMemoSide])

  // Autoplay slideshow
  useEffect(() => {
    if (!autoPlay) return
    const timer = setInterval(() => {
      setCurrentSpread((s) => (s >= totalSpreads - 1 ? 0 : s + 1))
    }, 4500)
    return () => clearInterval(timer)
  }, [autoPlay, totalSpreads])

  const activeBinder = BINDER_THEMES[settings.binderTheme] || BINDER_THEMES.silver
  const activePaper = PAPER_THEMES[settings.paperTheme] || PAPER_THEMES.ivory

  return (
    <div
      className={`scrapbook-container select-none ${
        isFullscreen
          ? "fixed inset-0 z-50 bg-[#141312] p-4 sm:p-8 flex flex-col justify-between overflow-auto"
          : "relative w-full my-4"
      }`}
    >
      {/* ======================================================== */}
      {/* TOP FLOATING ALBUM TOOLBAR                               */}
      {/* ======================================================== */}
      <div className="max-w-5xl mx-auto w-full mb-4 px-2">
        <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 bg-stone-900/95 backdrop-blur-md text-white rounded-2xl border-2 border-stone-800 shadow-[4px_4px_0_#000]">
          {/* Left: Album Meta & Jump to Strip */}
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-400 text-stone-950 font-bold shadow-sm">
              <Sparkles size={16} />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-amber-300 font-bold block">
                SCRAPBOOK STUDIO
              </span>
              <p className="font-caveat text-xl sm:text-2xl font-bold text-stone-100 leading-none">
                Spread {currentSpread + 1} of {totalSpreads}
              </p>
            </div>
          </div>

          {/* Center: Customization Trays (Theme, +Sticky, +Stamp) */}
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Theme Picker Trigger */}
            <div className="relative">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                  activeToolTray === "themes"
                    ? "bg-amber-400 text-stone-950 font-bold"
                    : "bg-stone-800 hover:bg-stone-700 text-stone-200"
                }`}
                onClick={() => setActiveToolTray((t) => (t === "themes" ? null : "themes"))}
                title="Change Binder & Paper Theme"
              >
                <Palette size={13} />
                <span>Materials</span>
              </button>

              {/* Theme Dropdown Tray */}
              {activeToolTray === "themes" && (
                <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 p-3 bg-stone-950 border border-stone-700 rounded-xl shadow-2xl w-80 text-xs font-mono space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div>
                    <span className="text-amber-400 text-[10px] uppercase font-bold block mb-1.5">
                      Binder Style (Coils & Materials)
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(BINDER_THEMES) as BinderTheme[]).map((bt) => (
                        <button
                          key={bt}
                          type="button"
                          className={`p-2 rounded-lg border text-left transition-all ${
                            settings.binderTheme === bt
                              ? "border-amber-400 bg-amber-950/40 text-amber-200 font-bold"
                              : "border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800"
                          }`}
                          onClick={() => updateSettings({ binderTheme: bt })}
                        >
                          <div className="w-full h-2 rounded-full mb-1" style={{ background: BINDER_THEMES[bt].ringGradient }} />
                          <span className="text-[11px] block">{BINDER_THEMES[bt].name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-stone-800">
                    <span className="text-amber-400 text-[10px] uppercase font-bold block mb-1.5">
                      Paper Finish
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {(Object.keys(PAPER_THEMES) as PaperTheme[]).map((pt) => (
                        <button
                          key={pt}
                          type="button"
                          className={`p-2 rounded-lg border text-left transition-all ${
                            settings.paperTheme === pt
                              ? "border-amber-400 bg-amber-950/40 text-amber-200 font-bold"
                              : "border-stone-800 bg-stone-900 text-stone-300 hover:bg-stone-800"
                          }`}
                          onClick={() => updateSettings({ paperTheme: pt })}
                        >
                          <div className="w-full h-3 rounded mb-1 border border-black/20" style={{ background: PAPER_THEMES[pt].bg }} />
                          <span className="text-[11px] block">{PAPER_THEMES[pt].name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* + Sticky Note Trigger */}
            <div className="relative">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                  activeToolTray === "sticky"
                    ? "bg-amber-400 text-stone-950 font-bold"
                    : "bg-stone-800 hover:bg-stone-700 text-stone-200"
                }`}
                onClick={() => setActiveToolTray((t) => (t === "sticky" ? null : "sticky"))}
                title="Pin a Sticky Note, Caption Strip, or Location Stamp"
              >
                <StickyNote size={13} />
                <span>+ Sticky & Notes</span>
              </button>

              {activeToolTray === "sticky" && (
                <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 p-3 bg-stone-950 border border-stone-700 rounded-xl shadow-2xl w-80 text-xs font-mono space-y-3 animate-in fade-in slide-in-from-top-2">
                  {/* Page target picker */}
                  <div className="flex items-center justify-between pb-1 border-b border-stone-800">
                    <span className="text-amber-400 text-[10px] uppercase font-bold">
                      Pin To Page:
                    </span>
                    <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded border border-stone-800">
                      <button
                        type="button"
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          targetSide === "left"
                            ? "bg-amber-400 text-stone-950"
                            : "text-stone-400 hover:text-stone-200"
                        }`}
                        onClick={() => setTargetSide("left")}
                      >
                        Left Page
                      </button>
                      <button
                        type="button"
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          targetSide === "right"
                            ? "bg-amber-400 text-stone-950"
                            : "text-stone-400 hover:text-stone-200"
                        }`}
                        onClick={() => setTargetSide("right")}
                      >
                        Right Page
                      </button>
                    </div>
                  </div>

                  {/* Section 1: Pastel Sticky Memos */}
                  <div>
                    <span className="text-[10px] text-stone-300 uppercase font-bold block mb-1">
                      Pastel Sticky Memos
                    </span>
                    <div className="grid grid-cols-5 gap-1.5">
                      {STICKY_PRESETS.filter((p) => p.variant === "sticky").map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="h-8 rounded-md border flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
                          style={{ background: c.bg, borderColor: c.border }}
                          onClick={() => addStickyNote(targetSide, c.id, undefined, "sticky")}
                          title={`Pin ${c.name} memo`}
                        >
                          <Plus size={13} style={{ color: c.text }} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 2: Polaroid & Dymo Caption Strips */}
                  <div>
                    <span className="text-[10px] text-stone-300 uppercase font-bold block mb-1">
                      Caption Strips & Labels
                    </span>
                    <div className="grid grid-cols-3 gap-1.5">
                      {STICKY_PRESETS.filter((p) => p.variant !== "sticky").map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="p-1.5 rounded border text-[10px] text-center font-bold truncate hover:scale-105 transition-transform"
                          style={{ background: c.bg, borderColor: c.border, color: c.text }}
                          onClick={() => addStickyNote(targetSide, c.id, undefined, c.variant)}
                          title={`Pin ${c.name}`}
                        >
                          {c.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Section 3: Location Stamp Presets */}
                  <div>
                    <span className="text-[10px] text-stone-300 uppercase font-bold block mb-1">
                      Location Stamps (Tactile Details)
                    </span>
                    <div className="space-y-1 max-h-32 overflow-y-auto no-scrollbar pr-0.5">
                      {LOCATION_PRESETS.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          className="w-full text-left p-1.5 rounded bg-stone-900 hover:bg-stone-800 border border-stone-800 hover:border-amber-400 text-[11px] text-stone-200 font-caveat flex items-center justify-between"
                          onClick={() => addStickyNote(targetSide, "polaroid", loc, "caption-strip")}
                        >
                          <span className="truncate">{loc}</span>
                          <Plus size={12} className="text-amber-400 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* + Deco Stamp Trigger */}
            <div className="relative">
              <button
                type="button"
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                  activeToolTray === "stamps"
                    ? "bg-amber-400 text-stone-950 font-bold"
                    : "bg-stone-800 hover:bg-stone-700 text-stone-200"
                }`}
                onClick={() => setActiveToolTray((t) => (t === "stamps" ? null : "stamps"))}
                title="Place Deco Stamp or Wax Seal"
              >
                <Sparkles size={13} />
                <span>+ Stamp</span>
              </button>

              {activeToolTray === "stamps" && (
                <div className="absolute top-full mt-2 left-0 sm:left-auto sm:right-0 z-50 p-3 bg-stone-950 border border-stone-700 rounded-xl shadow-2xl w-72 text-xs font-mono space-y-2 animate-in fade-in slide-in-from-top-2">
                  {/* Page target picker */}
                  <div className="flex items-center justify-between pb-1 border-b border-stone-800">
                    <span className="text-amber-400 text-[10px] uppercase font-bold">
                      Stamp On Page:
                    </span>
                    <div className="flex items-center gap-1 bg-stone-900 p-0.5 rounded border border-stone-800">
                      <button
                        type="button"
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          targetSide === "left"
                            ? "bg-amber-400 text-stone-950"
                            : "text-stone-400 hover:text-stone-200"
                        }`}
                        onClick={() => setTargetSide("left")}
                      >
                        Left Page
                      </button>
                      <button
                        type="button"
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          targetSide === "right"
                            ? "bg-amber-400 text-stone-950"
                            : "text-stone-400 hover:text-stone-200"
                        }`}
                        onClick={() => setTargetSide("right")}
                      >
                        Right Page
                      </button>
                    </div>
                  </div>

                  <span className="text-amber-400 text-[10px] uppercase font-bold block">
                    Deco Stamps & Wax Seals
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    {DECO_STAMPS.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="p-1.5 rounded-lg bg-stone-900 border border-stone-800 hover:border-amber-400 flex flex-col items-center justify-center hover:scale-105 transition-all"
                        onClick={() => addDecoStamp(targetSide, s.id)}
                        title={`Place ${s.name}`}
                      >
                        <svg
                          viewBox={s.viewBox || "0 0 54 54"}
                          className="w-12 h-10 object-contain"
                          dangerouslySetInnerHTML={{ __html: s.svg }}
                        />
                        <span className="text-[9px] text-stone-300 mt-1 truncate max-w-full">
                          {s.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reset Spread Decorations */}
            <button
              type="button"
              className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
              onClick={() => {
                if (leftItem) resetPage(leftItem.id)
                if (rightItem) resetPage(rightItem.id)
              }}
              title="Reset current spread decorations"
            >
              <RotateCcw size={14} />
            </button>
          </div>

          {/* Right: Fullscreen Presentation & New Strip */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-all ${
                autoPlay ? "bg-amber-400 text-stone-950 font-bold" : "bg-stone-800 hover:bg-stone-700 text-stone-200"
              }`}
              onClick={() => setAutoPlay((p) => !p)}
              title="Auto-advance slideshow"
            >
              {autoPlay ? <Pause size={13} /> : <Play size={13} />}
              <span className="hidden sm:inline">{autoPlay ? "Pause" : "Slideshow"}</span>
            </button>

            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-mono font-medium flex items-center gap-1.5 transition-all"
              onClick={() => setIsFullscreen((f) => !f)}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Presentation"}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
              <span className="hidden sm:inline">{isFullscreen ? "Exit" : "Full"}</span>
            </button>

            <button
              type="button"
              className="px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold font-mono flex items-center gap-1 transition-all shadow-sm"
              onClick={onNewStrip}
            >
              <Plus size={14} />
              <span>New</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Washi pattern switch notification */}
      {washiToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900/95 text-amber-300 font-mono text-xs px-4 py-2 rounded-full border border-amber-400/50 shadow-xl animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          <Sparkles size={13} className="text-amber-400" />
          <span>{washiToast}</span>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2-PAGE SPIRAL-BOUND ALBUM DESK SPREAD                    */}
      {/* ======================================================== */}
      <div className="relative max-w-5xl mx-auto w-full">
        {/* Desk Surface & Outer Album Cover */}
        <div
          className="relative rounded-2xl border-2 border-stone-900 shadow-[10px_16px_36px_rgba(0,0,0,0.22),4px_4px_0_#1c1917] p-3 sm:p-6 overflow-hidden transition-colors duration-300"
          style={{ background: settings.paperTheme === "midnight" ? "#2a2734" : "#e8dec8" }}
        >
          {/* Subtle desk texture grain */}
          <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#a89f91_1px,transparent_1px)] [background-size:16px_16px]" />

          {/* Spread Canvas Container */}
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-stretch min-h-[480px] sm:min-h-[580px]">
            {/* Center Spiral Rings (Desktop) */}
            <div className="hidden md:flex absolute top-0 bottom-0 left-1/2 -translate-x-1/2 flex-col justify-around py-4 z-30 pointer-events-none">
              {Array.from({ length: 14 }).map((_, i) => (
                <div key={i} className="relative flex items-center justify-center">
                  {/* Left hole */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-inner -mr-1"
                    style={{ background: activeBinder.holeColor }}
                  />
                  {/* Binder ring rendering based on theme */}
                  {activeBinder.doubleWire ? (
                    <div className="flex flex-col gap-0.5 items-center">
                      <div
                        className="w-8 h-1.5 rounded-full shadow-sm border"
                        style={{
                          background: activeBinder.ringGradient,
                          borderColor: activeBinder.ringBorder,
                        }}
                      />
                      <div
                        className="w-8 h-1.5 rounded-full shadow-sm border"
                        style={{
                          background: activeBinder.ringGradient,
                          borderColor: activeBinder.ringBorder,
                        }}
                      />
                    </div>
                  ) : activeBinder.id === "leather" ? (
                    <div
                      className="w-11 h-4 rounded-sm shadow-md border flex items-center justify-around px-1"
                      style={{
                        background: activeBinder.ringGradient,
                        borderColor: activeBinder.ringBorder,
                      }}
                    >
                      <span className="text-[7px] text-amber-200/80 font-mono font-bold">✕</span>
                      <span className="text-[7px] text-amber-200/80 font-mono font-bold">✕</span>
                    </div>
                  ) : (
                    <div
                      className="w-9 h-3 rounded-full shadow-md border"
                      style={{
                        background: activeBinder.ringGradient,
                        borderColor: activeBinder.ringBorder,
                        transform: activeBinder.id === "pink-coil" || activeBinder.id === "lilac" ? "rotate(-10deg)" : "none",
                      }}
                    />
                  )}
                  {/* Right hole */}
                  <div
                    className="w-2.5 h-2.5 rounded-full shadow-inner -ml-1"
                    style={{ background: activeBinder.holeColor }}
                  />
                </div>
              ))}
            </div>

            {/* ======================================================== */}
            {/* LEFT PAGE                                                */}
            {/* ======================================================== */}
            <div
              ref={leftPageRef}
              className={`relative border rounded-l-xl p-4 sm:p-6 shadow-[inset_-8px_0_16px_rgba(0,0,0,0.04)] flex flex-col justify-between transition-all duration-300 overflow-hidden ${
                isFlipping && flipDirection === "prev" ? "scale-[0.98] opacity-80" : ""
              }`}
              style={{
                background: activePaper.bg,
                borderColor: activePaper.cardBorder,
                color: activePaper.textColor,
              }}
            >
              {/* Paper fiber / grid lines */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    settings.paperTheme === "grid"
                      ? `repeating-linear-gradient(0deg, ${activePaper.lineColor}, ${activePaper.lineColor} 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, ${activePaper.lineColor}, ${activePaper.lineColor} 1px, transparent 1px, transparent 20px)`
                      : `repeating-linear-gradient(0deg, ${activePaper.lineColor}, ${activePaper.lineColor} 1px, transparent 1px, transparent 24px)`,
                }}
              />

              {leftItem ? (
                <div className="relative flex-1 flex flex-col justify-between z-10">
                  {/* Interactive Washi Tape Strip at Top (Click to Cycle) */}
                  <button
                    type="button"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6.5 shadow-sm opacity-95 z-20 cursor-pointer hover:scale-105 active:scale-95 transition-transform group"
                    style={{
                      background: WASHI_PATTERNS.find((w) => w.id === leftItem.washiStyle)?.background || "#fbcfe8",
                      border: WASHI_PATTERNS.find((w) => w.id === leftItem.washiStyle)?.border,
                      transform: "rotate(-2deg)",
                      clipPath: "polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)",
                    }}
                    onClick={() => cycleWashiTape(leftItem.id, leftItem.washiStyle)}
                    title="Click to change washi tape pattern"
                  >
                    <span className="opacity-0 group-hover:opacity-100 text-[9px] font-mono font-bold text-stone-900 bg-white/80 px-1 rounded shadow-sm">
                      Tap Washi
                    </span>
                  </button>

                  {/* Photostrip Card Container */}
                  <div
                    className="mt-3 p-3.5 border shadow-[2px_3px_12px_rgba(0,0,0,0.09)] rounded-sm flex flex-col items-center group transition-transform"
                    style={{
                      background: activePaper.cardBg,
                      borderColor: activePaper.cardBorder,
                      transform: `rotate(${leftItem.rotation || 0}deg)`,
                    }}
                  >
                    <div className="w-full max-w-[200px] sm:max-w-[230px] aspect-[1/2] bg-stone-100 border border-stone-200 overflow-hidden relative shadow-inner">
                      {leftItem.previewUrl ? (
                        <img
                          src={leftItem.previewUrl}
                          alt={leftItem.title}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-stone-50">
                          <Heart size={28} className="text-amber-700/60 mb-2" />
                          <p className="font-caveat text-xl text-stone-800 font-bold">{leftItem.title}</p>
                          <p className="text-[10px] font-mono text-stone-500 mt-1">{leftItem.templateName}</p>
                        </div>
                      )}
                    </div>

                    <div className="w-full mt-3 pt-2 border-t border-dashed border-stone-300 text-center">
                      <p className="font-caveat text-xl sm:text-2xl font-bold leading-tight" style={{ color: activePaper.textColor }}>
                        {leftItem.title}
                      </p>
                      <p className="text-[11px] font-mono flex items-center justify-center gap-1 mt-0.5" style={{ color: activePaper.subtextColor }}>
                        <Calendar size={11} />
                        <span>{leftItem.date}</span>
                        <span>·</span>
                        <span className="font-semibold text-amber-700">{leftItem.category}</span>
                      </p>
                    </div>
                  </div>

                  {/* In-Place Editable Handwritten Memo Box */}
                  <div
                    className="mt-4 p-3 border rounded-lg shadow-sm transition-all"
                    style={{
                      background: activePaper.memoBg,
                      borderColor: activePaper.memoBorder,
                    }}
                  >
                    {editingMemoSide === "left" ? (
                      <div className="space-y-2">
                        {/* Font Switcher & Presets */}
                        <div className="flex items-center justify-between pb-1 border-b border-dashed border-stone-300">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono uppercase font-bold text-stone-500">Font:</span>
                            <button
                              type="button"
                              className={`px-2 py-0.5 rounded text-xs transition-all ${
                                memoDraftFont === "caveat"
                                  ? "bg-stone-900 text-amber-300 font-bold shadow-sm"
                                  : "bg-white/70 hover:bg-white text-stone-700"
                              }`}
                              onClick={() => setMemoDraftFont("caveat")}
                            >
                              <span className="font-caveat font-bold">Caveat</span>
                            </button>
                            <button
                              type="button"
                              className={`px-2 py-0.5 rounded text-xs transition-all ${
                                memoDraftFont === "gochi"
                                  ? "bg-stone-900 text-amber-300 font-bold shadow-sm"
                                  : "bg-white/70 hover:bg-white text-stone-700"
                              }`}
                              onClick={() => setMemoDraftFont("gochi")}
                            >
                              <span className="font-gochi font-bold">Gochi Hand</span>
                            </button>
                          </div>
                          <button
                            type="button"
                            className="sketch-button sketch-button--sm text-xs py-1 px-3 bg-amber-400 text-stone-950 font-bold flex items-center gap-1 shrink-0"
                            onClick={() => saveMemo("left")}
                          >
                            <Check size={12} /> Save
                          </button>
                        </div>

                        <textarea
                          value={memoDraftText}
                          onChange={(e) => setMemoDraftText(e.target.value)}
                          placeholder="Type your memory note, date, or inside joke..."
                          rows={2}
                          autoFocus
                          className={`w-full p-1.5 ${
                            memoDraftFont === "gochi" ? "font-gochi" : "font-caveat"
                          } text-xl sm:text-2xl font-bold bg-transparent border-b-2 border-amber-500 focus:outline-none resize-none`}
                          style={{ color: activePaper.memoText }}
                        />

                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                          {[
                            "Hongdae 24hr Booth · 11:45 PM",
                            "seoul nights ♡",
                            "under the neon signs",
                            "forever besties",
                            "laughing until 2am",
                            "anniversary 2026",
                          ].map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              className="px-2 py-0.5 text-[10px] font-mono bg-white/70 hover:bg-white text-stone-800 rounded border border-stone-300 shrink-0"
                              onClick={() => setMemoDraftText(prompt)}
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer group flex items-start justify-between gap-2"
                        onClick={() => startEditingMemo("left")}
                        title="Click to edit handwritten memo"
                      >
                        <p
                          className={`${
                            leftItem.memoFont === "gochi" ? "font-gochi" : "font-caveat"
                          } text-lg sm:text-xl italic leading-snug flex-1`}
                          style={{ color: activePaper.memoText }}
                        >
                          "{leftItem.note}"
                        </p>
                        <Edit3
                          size={14}
                          className="opacity-0 group-hover:opacity-70 text-stone-400 shrink-0 mt-1 transition-opacity"
                        />
                      </div>
                    )}

                    <div className="mt-2.5 pt-1.5 border-t border-dashed border-stone-400/20 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: activePaper.subtextColor }}>
                        PAGE {currentSpread * 2 + 1}
                      </span>
                      {leftItem.composition && (
                        <button
                          type="button"
                          className="text-[11px] font-mono font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 hover:underline"
                          onClick={() => onOpenInStudio(leftItem.composition!)}
                        >
                          <Paintbrush size={11} />
                          <span>Open in Studio</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Render Draggable Sticky Notes on Left Page */}
                  {(leftCustom.stickyNotes || []).map((note) => {
                    const preset = STICKY_PRESETS.find((c) => c.id === note.color) || STICKY_PRESETS[0]
                    const isDymo = note.variant === "dymo" || note.color === "dymo-black"
                    const isCaption = note.variant === "caption-strip" || note.color === "polaroid" || note.color === "kraft-tag"

                    return (
                      <div
                        key={note.id}
                        className={`absolute z-25 cursor-grab active:cursor-grabbing group transition-shadow ${
                          isDymo
                            ? "px-3 py-1 bg-stone-950 text-white rounded-sm border border-stone-800 shadow-md flex items-center justify-between"
                            : isCaption
                            ? "p-2 rounded border shadow-md flex items-center justify-between"
                            : "p-2.5 rounded shadow-md border"
                        }`}
                        style={{
                          left: `${note.x}%`,
                          top: `${note.y}%`,
                          background: preset.bg,
                          borderColor: preset.border,
                          transform: `rotate(${note.rotation}deg)`,
                          width: isDymo ? "auto" : isCaption ? "170px" : "130px",
                          maxWidth: "220px",
                        }}
                        onPointerDown={(e) => {
                          const rect = leftPageRef.current?.getBoundingClientRect()
                          if (!rect) return
                          draggingItemRef.current = {
                            type: "sticky",
                            side: "left",
                            itemId: leftItem.id,
                            elemId: note.id,
                            startX: e.clientX,
                            startY: e.clientY,
                            startElemX: note.x,
                            startElemY: note.y,
                            pageWidth: rect.width,
                            pageHeight: rect.height,
                          }
                        }}
                      >
                        {/* Hover action buttons: delete & font toggle */}
                        <div className="absolute -top-2.5 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                          {!isDymo && (
                            <button
                              type="button"
                              className="p-0.5 rounded-full bg-stone-900 text-amber-300 hover:bg-stone-800 shadow-sm text-[9px] font-bold px-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleStickyNoteFont(leftItem.id, note.id)
                              }}
                              title="Toggle font (Caveat / Gochi Hand)"
                            >
                              {note.fontFamily === "gochi" ? "Gochi" : "Caveat"}
                            </button>
                          )}
                          <button
                            type="button"
                            className="p-0.5 rounded-full bg-stone-900 text-white hover:bg-rose-600 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteStickyNote(leftItem.id, note.id)
                            }}
                            title="Remove note"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>

                        {isDymo ? (
                          <input
                            type="text"
                            value={note.text}
                            onChange={(e) => updateStickyNoteText(leftItem.id, note.id, e.target.value)}
                            className="bg-transparent border-none p-0 font-mono text-[11px] font-bold tracking-widest text-white uppercase focus:outline-none w-full"
                          />
                        ) : (
                          <input
                            type="text"
                            value={note.text}
                            onChange={(e) => updateStickyNoteText(leftItem.id, note.id, e.target.value)}
                            className={`w-full bg-transparent border-none p-0 ${
                              note.fontFamily === "gochi" ? "font-gochi" : "font-caveat"
                            } ${isCaption ? "text-base sm:text-lg font-bold" : "text-base sm:text-lg font-bold"} leading-tight focus:outline-none`}
                            style={{ color: preset.text }}
                          />
                        )}
                      </div>
                    )
                  })}

                  {/* Render Draggable Deco Stamps on Left Page */}
                  {(leftCustom.decoStamps || []).map((stamp) => {
                    const def = DECO_STAMPS.find((d) => d.id === stamp.stampId)
                    if (!def) return null
                    return (
                      <div
                        key={stamp.id}
                        className="absolute z-25 cursor-grab active:cursor-grabbing group hover:scale-105 transition-transform"
                        style={{
                          left: `${stamp.x}%`,
                          top: `${stamp.y}%`,
                          transform: `rotate(${stamp.rotation}deg)`,
                          width: `${def.defaultWidth}px`,
                        }}
                        onPointerDown={(e) => {
                          const rect = leftPageRef.current?.getBoundingClientRect()
                          if (!rect) return
                          draggingItemRef.current = {
                            type: "stamp",
                            side: "left",
                            itemId: leftItem.id,
                            elemId: stamp.id,
                            startX: e.clientX,
                            startY: e.clientY,
                            startElemX: stamp.x,
                            startElemY: stamp.y,
                            pageWidth: rect.width,
                            pageHeight: rect.height,
                          }
                        }}
                      >
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-stone-900 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-sm z-30"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteDecoStamp(leftItem.id, stamp.id)
                          }}
                          title="Remove stamp"
                        >
                          <Trash2 size={10} />
                        </button>
                        <svg
                          viewBox={def.viewBox || "0 0 54 54"}
                          className="w-full h-auto pointer-events-none"
                          dangerouslySetInnerHTML={{ __html: def.svg }}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-stone-300 rounded-lg">
                  <Heart size={36} className="text-stone-400 mb-2" />
                  <p className="font-caveat text-2xl font-bold">Blank Page</p>
                  <p className="text-xs text-stone-400 font-mono mt-1 mb-4">Snap new photos to fill this spot!</p>
                  <button type="button" className="sketch-button sketch-button--sm text-xs" onClick={onNewStrip}>
                    + Snap Photos
                  </button>
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* RIGHT PAGE                                               */}
            {/* ======================================================== */}
            <div
              ref={rightPageRef}
              className={`relative border rounded-r-xl p-4 sm:p-6 shadow-[inset_8px_0_16px_rgba(0,0,0,0.04)] flex flex-col justify-between transition-all duration-300 overflow-hidden ${
                isFlipping && flipDirection === "next" ? "scale-[0.98] opacity-80" : ""
              }`}
              style={{
                background: activePaper.bg,
                borderColor: activePaper.cardBorder,
                color: activePaper.textColor,
              }}
            >
              {/* Paper fiber / grid lines */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    settings.paperTheme === "grid"
                      ? `repeating-linear-gradient(0deg, ${activePaper.lineColor}, ${activePaper.lineColor} 1px, transparent 1px, transparent 20px), repeating-linear-gradient(90deg, ${activePaper.lineColor}, ${activePaper.lineColor} 1px, transparent 1px, transparent 20px)`
                      : `repeating-linear-gradient(0deg, ${activePaper.lineColor}, ${activePaper.lineColor} 1px, transparent 1px, transparent 24px)`,
                }}
              />

              {rightItem ? (
                <div className="relative flex-1 flex flex-col justify-between z-10">
                  {/* Interactive Washi Tape Strip at Top (Click to Cycle) */}
                  <button
                    type="button"
                    className="absolute -top-3 left-1/2 -translate-x-1/2 w-32 h-6.5 shadow-sm opacity-95 z-20 cursor-pointer hover:scale-105 active:scale-95 transition-transform group"
                    style={{
                      background: WASHI_PATTERNS.find((w) => w.id === rightItem.washiStyle)?.background || "#dcfce7",
                      border: WASHI_PATTERNS.find((w) => w.id === rightItem.washiStyle)?.border,
                      transform: "rotate(2deg)",
                      clipPath: "polygon(4% 0%, 96% 0%, 100% 100%, 0% 100%)",
                    }}
                    onClick={() => cycleWashiTape(rightItem.id, rightItem.washiStyle)}
                    title="Click to change washi tape pattern"
                  >
                    <span className="opacity-0 group-hover:opacity-100 text-[9px] font-mono font-bold text-stone-900 bg-white/80 px-1 rounded shadow-sm">
                      Tap Washi
                    </span>
                  </button>

                  {/* Photostrip Card Container */}
                  <div
                    className="mt-3 p-3.5 border shadow-[2px_3px_12px_rgba(0,0,0,0.09)] rounded-sm flex flex-col items-center group transition-transform"
                    style={{
                      background: activePaper.cardBg,
                      borderColor: activePaper.cardBorder,
                      transform: `rotate(${rightItem.rotation || 0}deg)`,
                    }}
                  >
                    <div className="w-full max-w-[200px] sm:max-w-[230px] aspect-[1/2] bg-stone-100 border border-stone-200 overflow-hidden relative shadow-inner">
                      {rightItem.previewUrl ? (
                        <img
                          src={rightItem.previewUrl}
                          alt={rightItem.title}
                          className="w-full h-full object-contain p-1"
                          onError={(e) => {
                            ;(e.target as HTMLElement).style.display = "none"
                          }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center bg-stone-50">
                          <Heart size={28} className="text-amber-700/60 mb-2" />
                          <p className="font-caveat text-xl text-stone-800 font-bold">{rightItem.title}</p>
                          <p className="text-[10px] font-mono text-stone-500 mt-1">{rightItem.templateName}</p>
                        </div>
                      )}
                    </div>

                    <div className="w-full mt-3 pt-2 border-t border-dashed border-stone-300 text-center">
                      <p className="font-caveat text-xl sm:text-2xl font-bold leading-tight" style={{ color: activePaper.textColor }}>
                        {rightItem.title}
                      </p>
                      <p className="text-[11px] font-mono flex items-center justify-center gap-1 mt-0.5" style={{ color: activePaper.subtextColor }}>
                        <Calendar size={11} />
                        <span>{rightItem.date}</span>
                        <span>·</span>
                        <span className="font-semibold text-amber-700">{rightItem.category}</span>
                      </p>
                    </div>
                  </div>

                  {/* In-Place Editable Handwritten Memo Box */}
                  <div
                    className="mt-4 p-3 border rounded-lg shadow-sm transition-all"
                    style={{
                      background: activePaper.memoBg,
                      borderColor: activePaper.memoBorder,
                    }}
                  >
                    {editingMemoSide === "right" ? (
                      <div className="space-y-2">
                        {/* Font Switcher & Presets */}
                        <div className="flex items-center justify-between pb-1 border-b border-dashed border-stone-300">
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] font-mono uppercase font-bold text-stone-500">Font:</span>
                            <button
                              type="button"
                              className={`px-2 py-0.5 rounded text-xs transition-all ${
                                memoDraftFont === "caveat"
                                  ? "bg-stone-900 text-amber-300 font-bold shadow-sm"
                                  : "bg-white/70 hover:bg-white text-stone-700"
                              }`}
                              onClick={() => setMemoDraftFont("caveat")}
                            >
                              <span className="font-caveat font-bold">Caveat</span>
                            </button>
                            <button
                              type="button"
                              className={`px-2 py-0.5 rounded text-xs transition-all ${
                                memoDraftFont === "gochi"
                                  ? "bg-stone-900 text-amber-300 font-bold shadow-sm"
                                  : "bg-white/70 hover:bg-white text-stone-700"
                              }`}
                              onClick={() => setMemoDraftFont("gochi")}
                            >
                              <span className="font-gochi font-bold">Gochi Hand</span>
                            </button>
                          </div>
                          <button
                            type="button"
                            className="sketch-button sketch-button--sm text-xs py-1 px-3 bg-amber-400 text-stone-950 font-bold flex items-center gap-1 shrink-0"
                            onClick={() => saveMemo("right")}
                          >
                            <Check size={12} /> Save
                          </button>
                        </div>

                        <textarea
                          value={memoDraftText}
                          onChange={(e) => setMemoDraftText(e.target.value)}
                          placeholder="Type your memory note, date, or inside joke..."
                          rows={2}
                          autoFocus
                          className={`w-full p-1.5 ${
                            memoDraftFont === "gochi" ? "font-gochi" : "font-caveat"
                          } text-xl sm:text-2xl font-bold bg-transparent border-b-2 border-amber-500 focus:outline-none resize-none`}
                          style={{ color: activePaper.memoText }}
                        />

                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                          {[
                            "Hongdae 24hr Booth · 11:45 PM",
                            "seoul nights ♡",
                            "under the neon signs",
                            "forever besties",
                            "laughing until 2am",
                            "anniversary 2026",
                          ].map((prompt) => (
                            <button
                              key={prompt}
                              type="button"
                              className="px-2 py-0.5 text-[10px] font-mono bg-white/70 hover:bg-white text-stone-800 rounded border border-stone-300 shrink-0"
                              onClick={() => setMemoDraftText(prompt)}
                            >
                              {prompt}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div
                        className="cursor-pointer group flex items-start justify-between gap-2"
                        onClick={() => startEditingMemo("right")}
                        title="Click to edit handwritten memo"
                      >
                        <p
                          className={`${
                            rightItem.memoFont === "gochi" ? "font-gochi" : "font-caveat"
                          } text-lg sm:text-xl italic leading-snug flex-1`}
                          style={{ color: activePaper.memoText }}
                        >
                          "{rightItem.note}"
                        </p>
                        <Edit3
                          size={14}
                          className="opacity-0 group-hover:opacity-70 text-stone-400 shrink-0 mt-1 transition-opacity"
                        />
                      </div>
                    )}

                    <div className="mt-2.5 pt-1.5 border-t border-dashed border-stone-400/20 flex items-center justify-between">
                      <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: activePaper.subtextColor }}>
                        PAGE {currentSpread * 2 + 2}
                      </span>
                      {rightItem.composition && (
                        <button
                          type="button"
                          className="text-[11px] font-mono font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1 hover:underline"
                          onClick={() => onOpenInStudio(rightItem.composition!)}
                        >
                          <Paintbrush size={11} />
                          <span>Open in Studio</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Render Draggable Sticky Notes on Right Page */}
                  {(rightCustom.stickyNotes || []).map((note) => {
                    const preset = STICKY_PRESETS.find((c) => c.id === note.color) || STICKY_PRESETS[0]
                    const isDymo = note.variant === "dymo" || note.color === "dymo-black"
                    const isCaption = note.variant === "caption-strip" || note.color === "polaroid" || note.color === "kraft-tag"

                    return (
                      <div
                        key={note.id}
                        className={`absolute z-25 cursor-grab active:cursor-grabbing group transition-shadow ${
                          isDymo
                            ? "px-3 py-1 bg-stone-950 text-white rounded-sm border border-stone-800 shadow-md flex items-center justify-between"
                            : isCaption
                            ? "p-2 rounded border shadow-md flex items-center justify-between"
                            : "p-2.5 rounded shadow-md border"
                        }`}
                        style={{
                          left: `${note.x}%`,
                          top: `${note.y}%`,
                          background: preset.bg,
                          borderColor: preset.border,
                          transform: `rotate(${note.rotation}deg)`,
                          width: isDymo ? "auto" : isCaption ? "170px" : "130px",
                          maxWidth: "220px",
                        }}
                        onPointerDown={(e) => {
                          const rect = rightPageRef.current?.getBoundingClientRect()
                          if (!rect) return
                          draggingItemRef.current = {
                            type: "sticky",
                            side: "right",
                            itemId: rightItem.id,
                            elemId: note.id,
                            startX: e.clientX,
                            startY: e.clientY,
                            startElemX: note.x,
                            startElemY: note.y,
                            pageWidth: rect.width,
                            pageHeight: rect.height,
                          }
                        }}
                      >
                        {/* Hover action buttons: delete & font toggle */}
                        <div className="absolute -top-2.5 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-30">
                          {!isDymo && (
                            <button
                              type="button"
                              className="p-0.5 rounded-full bg-stone-900 text-amber-300 hover:bg-stone-800 shadow-sm text-[9px] font-bold px-1"
                              onClick={(e) => {
                                e.stopPropagation()
                                toggleStickyNoteFont(rightItem.id, note.id)
                              }}
                              title="Toggle font (Caveat / Gochi Hand)"
                            >
                              {note.fontFamily === "gochi" ? "Gochi" : "Caveat"}
                            </button>
                          )}
                          <button
                            type="button"
                            className="p-0.5 rounded-full bg-stone-900 text-white hover:bg-rose-600 shadow-sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteStickyNote(rightItem.id, note.id)
                            }}
                            title="Remove note"
                          >
                            <Trash2 size={10} />
                          </button>
                        </div>

                        {isDymo ? (
                          <input
                            type="text"
                            value={note.text}
                            onChange={(e) => updateStickyNoteText(rightItem.id, note.id, e.target.value)}
                            className="bg-transparent border-none p-0 font-mono text-[11px] font-bold tracking-widest text-white uppercase focus:outline-none w-full"
                          />
                        ) : (
                          <input
                            type="text"
                            value={note.text}
                            onChange={(e) => updateStickyNoteText(rightItem.id, note.id, e.target.value)}
                            className={`w-full bg-transparent border-none p-0 ${
                              note.fontFamily === "gochi" ? "font-gochi" : "font-caveat"
                            } ${isCaption ? "text-base sm:text-lg font-bold" : "text-base sm:text-lg font-bold"} leading-tight focus:outline-none`}
                            style={{ color: preset.text }}
                          />
                        )}
                      </div>
                    )
                  })}

                  {/* Render Draggable Deco Stamps on Right Page */}
                  {(rightCustom.decoStamps || []).map((stamp) => {
                    const def = DECO_STAMPS.find((d) => d.id === stamp.stampId)
                    if (!def) return null
                    return (
                      <div
                        key={stamp.id}
                        className="absolute z-25 cursor-grab active:cursor-grabbing group hover:scale-105 transition-transform"
                        style={{
                          left: `${stamp.x}%`,
                          top: `${stamp.y}%`,
                          transform: `rotate(${stamp.rotation}deg)`,
                          width: `${def.defaultWidth}px`,
                        }}
                        onPointerDown={(e) => {
                          const rect = rightPageRef.current?.getBoundingClientRect()
                          if (!rect) return
                          draggingItemRef.current = {
                            type: "stamp",
                            side: "right",
                            itemId: rightItem.id,
                            elemId: stamp.id,
                            startX: e.clientX,
                            startY: e.clientY,
                            startElemX: stamp.x,
                            startElemY: stamp.y,
                            pageWidth: rect.width,
                            pageHeight: rect.height,
                          }
                        }}
                      >
                        <button
                          type="button"
                          className="absolute -top-1 -right-1 p-0.5 rounded-full bg-stone-900 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-600 shadow-sm z-30"
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteDecoStamp(rightItem.id, stamp.id)
                          }}
                          title="Remove stamp"
                        >
                          <Trash2 size={10} />
                        </button>
                        <svg
                          viewBox={def.viewBox || "0 0 54 54"}
                          className="w-full h-auto pointer-events-none"
                          dangerouslySetInnerHTML={{ __html: def.svg }}
                        />
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-stone-300 rounded-lg">
                  <Heart size={36} className="text-stone-400 mb-2" />
                  <p className="font-caveat text-2xl font-bold">End of Album</p>
                  <p className="text-xs text-stone-400 font-mono mt-1 mb-4">Add your next photostrip memory!</p>
                  <button type="button" className="sketch-button sketch-button--sm text-xs" onClick={onNewStrip}>
                    + Snap Photos
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tactile Page Turn Controls */}
        <div className="flex items-center justify-between mt-5 px-2">
          <button
            type="button"
            disabled={currentSpread === 0}
            className="sketch-button flex items-center gap-1.5 text-xs py-2 px-4 disabled:opacity-40 disabled:hover:translate-y-0"
            onClick={goToPrevSpread}
          >
            <ChevronLeft size={16} />
            <span>Previous Spread</span>
          </button>

          {/* Quick Spread Dots Indicator */}
          <div className="flex items-center gap-2">
            {Array.from({ length: totalSpreads }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentSpread ? "w-7 bg-stone-900 shadow-sm" : "bg-stone-300 hover:bg-stone-500"
                }`}
                onClick={() => setCurrentSpread(idx)}
                title={`Go to Spread ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            disabled={currentSpread >= totalSpreads - 1}
            className="sketch-button flex items-center gap-1.5 text-xs py-2 px-4 disabled:opacity-40 disabled:hover:translate-y-0"
            onClick={goToNextSpread}
          >
            <span>Next Spread</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
