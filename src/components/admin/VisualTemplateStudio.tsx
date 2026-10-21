import React, { useState, useRef, useEffect, useMemo, Suspense, lazy } from "react"
import {
  Sparkles,
  SlidersHorizontal,
  Layers,
  Save,
  Send,
  Eye,
  Plus,
  Trash2,
  Copy,
  RotateCcw,
  Smartphone,
  Tablet,
  Printer,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  ArrowLeft,
  Paintbrush,
  Type,
  Sticker as StickerIcon,
  Frame as FrameIcon,
  LayoutGrid,
  Maximize2,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCw,
  Image as ImageIcon,
} from "lucide-react"
import type {
  Composition,
  Photo,
  PhotoCount,
  PhotoTemplate,
  Slot,
  StickerLayer,
  TextLayer,
} from "../../types"
import { defaultAdjustments } from "../../types"
import { getTemplate, templates, templateCategories } from "../../templates"
import { renderComposition, cssFilter } from "../../rendering"
import {
  type CustomTemplateRecord,
  saveCustomTemplate,
  publishCustomTemplate,
  unpublishCustomTemplate,
} from "../../services/adminService"
import type { UserAccount } from "../../services/supabase"
import { stickers, frames, backgroundPatterns, findSticker, stickerUrl } from "../../studio/assets"

const Studio = lazy(() => import("../../studio/Studio"))

interface VisualTemplateStudioProps {
  initialTemplate?: CustomTemplateRecord | null
  currentUser: UserAccount | null
  onBack: () => void
  onSaved?: (saved: CustomTemplateRecord) => void
  onPublished?: (published: CustomTemplateRecord) => void
}

const SAMPLE_PHOTO_URLS = [
  "/images/romantic_love_kisspose_aesthetic/031.jpg",
  "/images/romantic_love_kisspose_aesthetic/032.jpg",
  "/images/romantic_love_kisspose_aesthetic/033.jpg",
  "/images/romantic_love_kisspose_aesthetic/034.jpg",
  "/images/romantic_love_kisspose_aesthetic/035.jpg",
  "/images/cool_animated_romantic/001.jpg",
]

const ASPECT_RATIO_PRESETS = [
  { id: "original", label: "Strip (1000×2400)", w: 1000, h: 2400, desc: "Classic 4-Cut Photostrip" },
  { id: "2:3", label: "2:3 Poster (1600×2400)", w: 1600, h: 2400, desc: "Standard Keepsake Print" },
  { id: "9:16", label: "9:16 Story (1440×2560)", w: 1440, h: 2560, desc: "Mobile Fullscreen Story" },
  { id: "1:1", label: "1:1 Square (1800×1800)", w: 1800, h: 1800, desc: "Instagram & Polaroid Quad" },
  { id: "3:4", label: "3:4 Classic (1800×2400)", w: 1800, h: 2400, desc: "Scrapbook Magazine" },
  { id: "4:5", label: "4:5 Portrait (1600×2000)", w: 1600, h: 2000, desc: "Feed Portrait" },
]

export const VisualTemplateStudio: React.FC<VisualTemplateStudioProps> = ({
  initialTemplate,
  currentUser,
  onBack,
  onSaved,
  onPublished,
}) => {
  // Studio Mode: "builder" (No-Code Template Builder) vs "normal" (Normal Creative Studio)
  const [studioMode, setStudioMode] = useState<"builder" | "normal">("builder")

  // Active Tool Tab in Builder
  const [activeTab, setActiveTab] = useState<"layout" | "slots" | "text" | "stickers" | "background" | "frames">("layout")

  // Template Metadata
  const [templateId, setTemplateId] = useState<string>(
    initialTemplate?.id || `tmpl-custom-${Date.now()}`
  )
  const [name, setName] = useState<string>(initialTemplate?.name || "K-Booth Sunset Sparkle 4-Cut")
  const [description, setDescription] = useState<string>(
    initialTemplate?.description || "Curated aesthetic photostrip created in Visual Studio"
  )
  const [category, setCategory] = useState<string>(
    initialTemplate?.category || "K-Booth (인생네컷)"
  )
  const [customCategory, setCustomCategory] = useState<string>("")
  const [tagsInput, setTagsInput] = useState<string>(
    (initialTemplate?.tags || ["kbooth", "korean", "photostrip", "custom"]).join(", ")
  )
  const [status, setStatus] = useState<"draft" | "published" | "archived">(
    initialTemplate?.status || "draft"
  )
  const [version, setVersion] = useState<number>(initialTemplate?.version || 1)

  // Layout & Dimensions
  const [selectedRatio, setSelectedRatio] = useState<string>(initialTemplate?.aspectRatio || "original")
  const [canvasWidth, setCanvasWidth] = useState<number>(initialTemplate?.width || 1000)
  const [canvasHeight, setCanvasHeight] = useState<number>(initialTemplate?.height || 2400)
  const [background, setBackground] = useState<string>(initialTemplate?.background || "#fdfbf7")
  const [backgroundPattern, setBackgroundPattern] = useState<string | undefined>(
    initialTemplate?.backgroundPattern || "none"
  )
  const [backgroundOpacity, setBackgroundOpacity] = useState<number>(
    initialTemplate?.backgroundOpacity ?? 0.8
  )
  const [accent, setAccent] = useState<string>(initialTemplate?.accent || "#d97762")

  // Slots
  const [slots, setSlots] = useState<Slot[]>(() => {
    if (initialTemplate?.slots && initialTemplate.slots.length > 0) {
      return initialTemplate.slots
    }
    // Default 4-cut vertical strip
    return [
      { x: 10, y: 7, width: 80, height: 19, radius: 2 },
      { x: 10, y: 28, width: 80, height: 19, radius: 2 },
      { x: 10, y: 49, width: 80, height: 19, radius: 2 },
      { x: 10, y: 70, width: 80, height: 19, radius: 2 },
    ]
  })
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(0)

  // Frame Layer
  const [frameId, setFrameId] = useState<string | undefined>(initialTemplate?.frameId)
  const [frameColor, setFrameColor] = useState<string | undefined>(initialTemplate?.frameColor)

  // Decorative Elements
  const [stickersList, setStickersList] = useState<StickerLayer[]>(initialTemplate?.stickers || [])
  const [textsList, setTextsList] = useState<TextLayer[]>(initialTemplate?.texts || [])
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null)

  // Testing & Preview Controls
  const [showSamplePhotos, setShowSamplePhotos] = useState<boolean>(false)
  const [devicePreviewMode, setDevicePreviewMode] = useState<"mobile" | "tablet" | "strip" | null>(null)
  const [previewCoverUrl, setPreviewCoverUrl] = useState<string | null>(initialTemplate?.thumbnailUrl || null)

  // UI State
  const [isSaving, setIsSaving] = useState<boolean>(false)
  const [showPublishModal, setShowPublishModal] = useState<boolean>(false)
  const [notification, setNotification] = useState<string | null>(null)
  const [stickerCategory, setStickerCategory] = useState<string>("all")
  const [stickerSearch, setStickerSearch] = useState<string>("")

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)

  const notify = (msg: string) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  // Sync state whenever initialTemplate changes (e.g. from Scrapbook or Catalog)
  useEffect(() => {
    if (initialTemplate) {
      setTemplateId(initialTemplate.id)
      setName(initialTemplate.name)
      setDescription(initialTemplate.description || "")
      setCategory(initialTemplate.category)
      setTagsInput((initialTemplate.tags || []).join(", "))
      setStatus(initialTemplate.status)
      setVersion(initialTemplate.version || 1)
      setSelectedRatio(initialTemplate.aspectRatio || "original")
      setCanvasWidth(initialTemplate.width || 1000)
      setCanvasHeight(initialTemplate.height || 2400)
      setBackground(initialTemplate.background || "#fdfbf7")
      setBackgroundPattern(initialTemplate.backgroundPattern || "none")
      setBackgroundOpacity(initialTemplate.backgroundOpacity ?? 0.8)
      setAccent(initialTemplate.accent || "#d97762")
      setSlots(initialTemplate.slots || [])
      setFrameId(initialTemplate.frameId)
      setFrameColor(initialTemplate.frameColor)
      setStickersList(initialTemplate.stickers ? [...initialTemplate.stickers] : [])
      setTextsList(initialTemplate.texts ? [...initialTemplate.texts] : [])
      setPreviewCoverUrl(initialTemplate.thumbnailUrl || null)
    }
  }, [initialTemplate])

  // Handle aspect ratio preset change
  const handleSelectRatio = (presetId: string) => {
    const preset = ASPECT_RATIO_PRESETS.find((p) => p.id === presetId)
    if (!preset) return
    setSelectedRatio(presetId)
    setCanvasWidth(preset.w)
    setCanvasHeight(preset.h)
  }

  // Construct standard runtime PhotoTemplate representation
  const runtimeTemplate: PhotoTemplate = useMemo(() => {
    const effectiveCategory = category === "+ New Category" ? customCategory || "Custom Studio" : category
    return {
      id: templateId,
      name,
      category: effectiveCategory,
      count: slots.length as PhotoCount,
      width: canvasWidth,
      height: canvasHeight,
      slots,
      background,
      accent,
      orientation: canvasWidth >= canvasHeight ? "landscape" : "portrait",
      note: description,
      thumbnail: previewCoverUrl || undefined,
      tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
      backgroundPattern: backgroundPattern === "none" ? undefined : backgroundPattern,
      frameId,
      frameColor,
      subtitle: description,
    }
  }, [
    templateId,
    name,
    category,
    customCategory,
    slots,
    canvasWidth,
    canvasHeight,
    background,
    accent,
    description,
    previewCoverUrl,
    tagsInput,
    backgroundPattern,
    frameId,
    frameColor,
  ])

  // Construct active Composition for live canvas preview
  const liveComposition: Composition = useMemo(() => {
    // If showSamplePhotos is ON, map sample photos to slots
    const photos: Photo[] = showSamplePhotos
      ? slots.map((_, i) => ({
          id: `sample-${i}`,
          src: SAMPLE_PHOTO_URLS[i % SAMPLE_PHOTO_URLS.length],
          name: `Sample ${i + 1}`,
          adjustments: defaultAdjustments(),
        }))
      : []

    return {
      templateId: runtimeTemplate.id,
      background,
      borderColor: "#171717",
      borderWidth: 0,
      radius: slots[0]?.radius || 2,
      spacing: 0,
      padding: 0,
      photos,
      stickers: stickersList,
      texts: textsList,
      backgroundPattern: backgroundPattern === "none" ? undefined : backgroundPattern,
      backgroundOpacity,
      frameId,
      frameColor,
    }
  }, [
    runtimeTemplate,
    background,
    slots,
    stickersList,
    textsList,
    backgroundPattern,
    backgroundOpacity,
    frameId,
    frameColor,
    showSamplePhotos,
  ])

  // Render canvas whenever composition updates
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let active = true

    renderComposition(canvas, liveComposition, runtimeTemplate, 0.4)
      .then(() => {
        if (!active) return
        // Auto-generate preview thumbnail dataUrl
        try {
          const thumb = canvas.toDataURL("image/jpeg", 0.75)
          setPreviewCoverUrl(thumb)
        } catch {}
      })
      .catch((err) => console.warn("[Builder Canvas] Render warning:", err))

    return () => {
      active = false
    }
  }, [liveComposition, runtimeTemplate])

  // Slot Management
  const handleAddSlot = () => {
    if (slots.length >= 11) {
      notify("Maximum 11 slots allowed per template.")
      return
    }
    const newSlot: Slot = {
      x: 10,
      y: Math.min(80, slots.length * 12 + 10),
      width: 80,
      height: 18,
      radius: 2,
    }
    const nextSlots = [...slots, newSlot]
    setSlots(nextSlots)
    setSelectedSlotIndex(nextSlots.length - 1)
    notify(`Slot ${nextSlots.length} added!`)
  }

  const handleDeleteSlot = (index: number) => {
    if (slots.length <= 1) {
      notify("A template must contain at least 1 photo slot.")
      return
    }
    const nextSlots = slots.filter((_, i) => i !== index)
    setSlots(nextSlots)
    setSelectedSlotIndex(nextSlots.length > 0 ? 0 : null)
  }

  const handleUpdateSlot = (index: number, patch: Partial<Slot>) => {
    setSlots((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    )
  }

  // Slot Auto-Layout Presets
  const applyLayoutPreset = (type: "4cut" | "2x2" | "duo" | "6cut" | "polaroid") => {
    if (type === "4cut") {
      setSlots([
        { x: 10, y: 6, width: 80, height: 20, radius: 2 },
        { x: 10, y: 28, width: 80, height: 20, radius: 2 },
        { x: 10, y: 50, width: 80, height: 20, radius: 2 },
        { x: 10, y: 72, width: 80, height: 20, radius: 2 },
      ])
      notify("Applied 4-Cut Classic Photostrip layout!")
    } else if (type === "2x2") {
      setSlots([
        { x: 7, y: 7, width: 41, height: 41, radius: 2 },
        { x: 52, y: 7, width: 41, height: 41, radius: 2 },
        { x: 7, y: 52, width: 41, height: 41, radius: 2 },
        { x: 52, y: 52, width: 41, height: 41, radius: 2 },
      ])
      notify("Applied 2×2 Quad Grid layout!")
    } else if (type === "duo") {
      setSlots([
        { x: 10, y: 8, width: 80, height: 41, radius: 2.5 },
        { x: 10, y: 52, width: 80, height: 41, radius: 2.5 },
      ])
      notify("Applied 2-Cut Duo Bookmark layout!")
    } else if (type === "polaroid") {
      setSlots([{ x: 9, y: 8, width: 82, height: 74, radius: 1.5 }])
      notify("Applied Polaroid Single layout!")
    } else if (type === "6cut") {
      setSlots([
        { x: 6, y: 6, width: 41, height: 26, radius: 2 },
        { x: 53, y: 6, width: 41, height: 26, radius: 2 },
        { x: 6, y: 36, width: 41, height: 26, radius: 2 },
        { x: 53, y: 36, width: 41, height: 26, radius: 2 },
        { x: 6, y: 66, width: 41, height: 26, radius: 2 },
        { x: 53, y: 66, width: 41, height: 26, radius: 2 },
      ])
      notify("Applied 6-Cut Scrapbook layout!")
    }
  }

  // Decorative Elements: Add Text
  const handleAddText = () => {
    const newText: TextLayer = {
      id: `text-${Date.now()}`,
      text: "LITTLE MOMENTS",
      x: 50,
      y: 95,
      size: 28,
      rotation: 0,
      color: "#1c1917",
      font: "sans",
      align: "center",
      letterSpacing: 2,
    }
    setTextsList([...textsList, newText])
    setSelectedElementId(newText.id)
    notify("Added typography header layer!")
  }

  // Decorative Elements: Add Sticker
  const handleAddSticker = (assetId: string) => {
    const newSticker: StickerLayer = {
      id: `sticker-${Date.now()}`,
      kind: "sparkle",
      assetId,
      x: 50,
      y: 50,
      size: 16,
      rotation: 0,
      color: "#d97762",
    }
    setStickersList([...stickersList, newSticker])
    setSelectedElementId(newSticker.id)
    notify("Added decorative sticker layer!")
  }

  // Save Draft Handler
  const handleSaveDraft = async () => {
    setIsSaving(true)
    const effectiveCategory = category === "+ New Category" ? customCategory || "Custom Studio" : category

    const record: CustomTemplateRecord = {
      id: templateId,
      name,
      description,
      category: effectiveCategory,
      tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
      version,
      thumbnailUrl: previewCoverUrl || undefined,
      width: canvasWidth,
      height: canvasHeight,
      aspectRatio: selectedRatio,
      orientation: canvasWidth >= canvasHeight ? "landscape" : "portrait",
      photoCount: slots.length as PhotoCount,
      slots,
      background,
      backgroundPattern: backgroundPattern === "none" ? undefined : backgroundPattern,
      backgroundOpacity,
      accent,
      frameId,
      frameColor,
      stickers: stickersList,
      texts: textsList,
      status: "draft",
      createdBy: currentUser?.email || "admin@littlemoments.com",
      createdAt: initialTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const res = await saveCustomTemplate(record, previewCoverUrl || undefined, currentUser)
    setIsSaving(false)

    if (res.success && res.template) {
      setStatus("draft")
      notify("Draft saved successfully! ✧")
      onSaved?.(res.template)
    } else {
      notify(`Error saving: ${res.error || "Unknown error"}`)
    }
  }

  // Publish Handler
  const handleConfirmPublish = async () => {
    setIsSaving(true)
    const effectiveCategory = category === "+ New Category" ? customCategory || "Custom Studio" : category

    const record: CustomTemplateRecord = {
      id: templateId,
      name,
      description,
      category: effectiveCategory,
      tags: tagsInput.split(",").map((s) => s.trim()).filter(Boolean),
      version: version + 1,
      thumbnailUrl: previewCoverUrl || undefined,
      width: canvasWidth,
      height: canvasHeight,
      aspectRatio: selectedRatio,
      orientation: canvasWidth >= canvasHeight ? "landscape" : "portrait",
      photoCount: slots.length as PhotoCount,
      slots,
      background,
      backgroundPattern: backgroundPattern === "none" ? undefined : backgroundPattern,
      backgroundOpacity,
      accent,
      frameId,
      frameColor,
      stickers: stickersList,
      texts: textsList,
      status: "published",
      createdBy: currentUser?.email || "admin@littlemoments.com",
      createdAt: initialTemplate?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString(),
    }

    const res = await saveCustomTemplate(record, previewCoverUrl || undefined, currentUser)
    setIsSaving(false)
    setShowPublishModal(false)

    if (res.success && res.template) {
      setStatus("published")
      setVersion((v) => v + 1)
      notify("🎉 Template published! It is now live in the user catalog.")
      onPublished?.(res.template)
    } else {
      notify(`Publish failed: ${res.error || "Unknown error"}`)
    }
  }

  const selectedSlot = selectedSlotIndex !== null ? slots[selectedSlotIndex] : null

  return (
    <div className="flex flex-col h-[100dvh] bg-[#f8f6f0] text-stone-900 font-mono overflow-hidden">
      {/* Top Navbar */}
      <header className="px-4 py-2 bg-[#faf8f0] border-b-2 border-stone-900 flex items-center justify-between gap-3 shrink-0 shadow-xs z-30">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-lg border border-stone-300 hover:border-stone-900 hover:bg-stone-100 text-stone-800 transition-all flex items-center gap-1 text-xs font-bold"
            title="Back to Master Control"
          >
            <ArrowLeft size={14} />
            <span className="hidden sm:inline">Master Control</span>
          </button>

          <div className="h-4 w-[1px] bg-stone-300 hidden sm:block" />

          {/* Mode Switcher: Builder vs Normal Studio */}
          <div className="flex items-center bg-stone-200 p-0.5 rounded-lg border border-stone-300 text-xs">
            <button
              type="button"
              onClick={() => setStudioMode("builder")}
              className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
                studioMode === "builder"
                  ? "bg-stone-900 text-amber-300 shadow-xs"
                  : "text-stone-700 hover:text-stone-950"
              }`}
            >
              <Sparkles size={13} />
              <span>No-Code Builder</span>
            </button>
            <button
              type="button"
              onClick={() => setStudioMode("normal")}
              className={`px-2.5 py-1 rounded font-bold transition-all flex items-center gap-1.5 ${
                studioMode === "normal"
                  ? "bg-stone-900 text-amber-300 shadow-xs"
                  : "text-stone-700 hover:text-stone-950"
              }`}
            >
              <Paintbrush size={13} />
              <span>Normal Studio</span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 ml-2">
            <span
              className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${
                status === "published"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-amber-100 text-amber-800 border border-amber-300"
              }`}
            >
              {status} v{version}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs font-bold bg-white px-2 py-1 rounded border border-stone-300 focus:border-stone-900 outline-none max-w-[220px]"
              placeholder="Template Name"
            />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {studioMode === "builder" && (
            <>
              {/* Sample Photo Toggle */}
              <button
                type="button"
                onClick={() => setShowSamplePhotos(!showSamplePhotos)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all flex items-center gap-1.5 ${
                  showSamplePhotos
                    ? "bg-amber-200 border-stone-900 text-stone-950 shadow-[1px_1px_0_#171717]"
                    : "bg-white border-stone-300 text-stone-700 hover:border-stone-900"
                }`}
                title="Toggle Sample Photos vs Empty Slots Wireframe"
              >
                <ImageIcon size={13} />
                <span className="hidden sm:inline">
                  {showSamplePhotos ? "Photos Visible" : "Empty Slots"}
                </span>
              </button>

              {/* Device Preview Button */}
              <button
                type="button"
                onClick={() => setDevicePreviewMode("mobile")}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-stone-300 hover:border-stone-900 text-stone-800 text-xs font-bold transition-all flex items-center gap-1.5"
                title="Preview on Mobile & Tablet"
              >
                <Eye size={13} />
                <span className="hidden sm:inline">Device Preview</span>
              </button>

              {/* Save Draft */}
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={isSaving}
                className="px-3 py-1.5 rounded-lg bg-white border border-stone-900 hover:bg-stone-50 text-stone-900 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 active:scale-95"
              >
                <Save size={13} />
                <span>Save Draft</span>
              </button>

              {/* Publish to Users */}
              <button
                type="button"
                onClick={() => setShowPublishModal(true)}
                className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-black text-white text-xs font-bold transition-all shadow-[2px_2px_0_#d97762] flex items-center gap-1.5 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none"
              >
                <Send size={13} className="text-amber-300" />
                <span>Publish →</span>
              </button>
            </>
          )}

          {studioMode === "normal" && (
            <span className="text-xs text-stone-500 font-mono hidden sm:inline">
              Super Admin Creative Studio
            </span>
          )}
        </div>
      </header>

      {/* Notification Toast */}
      {notification && (
        <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-mono shadow-lg border border-amber-300 flex items-center gap-2 animate-bounce">
          <Sparkles size={14} className="text-amber-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Main Studio Viewport */}
      {studioMode === "normal" ? (
        /* MODE A: NORMAL STUDIO */
        <div className="flex-1 min-h-0 h-full overflow-hidden flex flex-col">
          <Suspense
            fallback={
              <div className="flex-1 flex flex-col items-center justify-center bg-[#f8f6f0]">
                <p className="font-caveat text-2xl text-stone-600">Preparing Creative Studio...</p>
              </div>
            }
          >
            <Studio
              composition={liveComposition}
              onChange={(next) => {
                // Keep local state in sync
                setBackground(next.background)
                setStickersList(next.stickers)
                setTextsList(next.texts)
              }}
              onTransient={() => {}}
              onDone={() => notify("Normal studio preview completed.")}
              onSave={() => notify("Studio state captured.")}
              saveStatus="Ready"
              notify={notify}
            />
          </Suspense>
        </div>
      ) : (
        /* MODE B: NO-CODE TEMPLATE BUILDER */
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
          {/* Left Panel: Tools & Customization Tabs */}
          <aside className="w-full lg:w-[380px] bg-[#faf8f0] border-b-2 lg:border-b-0 lg:border-r-2 border-stone-900 flex flex-col shrink-0 overflow-hidden z-20">
            {/* Tool Tabs Switcher */}
            <div className="flex items-center overflow-x-auto p-1.5 bg-[#f2ede2] border-b border-stone-300 gap-1 text-[11px] scrollbar-none shrink-0">
              {[
                { id: "layout", label: "Layout & Size", icon: LayoutGrid },
                { id: "slots", label: `Slots (${slots.length})`, icon: SlidersHorizontal },
                { id: "text", label: "Typography", icon: Type },
                { id: "stickers", label: "Stickers", icon: StickerIcon },
                { id: "background", label: "Background", icon: Paintbrush },
                { id: "frames", label: "Frames", icon: FrameIcon },
              ].map((t) => {
                const Icon = t.icon
                const isActive = activeTab === t.id
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-2.5 py-1.5 rounded-md font-bold whitespace-nowrap flex items-center gap-1 transition-all ${
                      isActive
                        ? "bg-stone-900 text-amber-300 shadow-xs"
                        : "text-stone-700 hover:text-stone-950 hover:bg-stone-200/60"
                    }`}
                  >
                    <Icon size={12} />
                    <span>{t.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Tab Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs font-mono">
              {/* TAB 1: LAYOUT & SIZE */}
              {activeTab === "layout" && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-stone-900 block mb-1.5 uppercase text-[10.5px]">
                      Aspect Ratio & Dimensions
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ASPECT_RATIO_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => handleSelectRatio(p.id)}
                          className={`p-2 rounded-lg border-2 text-left transition-all ${
                            selectedRatio === p.id
                              ? "border-stone-900 bg-amber-100 shadow-[2px_2px_0_#171717]"
                              : "border-stone-300 bg-white hover:border-stone-700"
                          }`}
                        >
                          <strong className="block font-bold text-stone-900">{p.label}</strong>
                          <span className="text-[10px] text-stone-500 block leading-tight mt-0.5">
                            {p.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Auto-Layout Presets */}
                  <div>
                    <label className="font-bold text-stone-900 block mb-1.5 uppercase text-[10.5px]">
                      Quick Auto-Layout Presets
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => applyLayoutPreset("4cut")}
                        className="p-2 rounded-lg bg-white border border-stone-300 hover:border-stone-900 font-bold text-stone-800 text-left"
                      >
                        ⚡ 4-Cut Strip
                      </button>
                      <button
                        type="button"
                        onClick={() => applyLayoutPreset("2x2")}
                        className="p-2 rounded-lg bg-white border border-stone-300 hover:border-stone-900 font-bold text-stone-800 text-left"
                      >
                        ⚡ 2×2 Grid
                      </button>
                      <button
                        type="button"
                        onClick={() => applyLayoutPreset("duo")}
                        className="p-2 rounded-lg bg-white border border-stone-300 hover:border-stone-900 font-bold text-stone-800 text-left"
                      >
                        ⚡ 2-Cut Duo
                      </button>
                      <button
                        type="button"
                        onClick={() => applyLayoutPreset("6cut")}
                        className="p-2 rounded-lg bg-white border border-stone-300 hover:border-stone-900 font-bold text-stone-800 text-left"
                      >
                        ⚡ 6-Cut Scrapbook
                      </button>
                    </div>
                  </div>

                  {/* Category & Tags */}
                  <div className="space-y-3 pt-3 border-t border-dashed border-stone-300">
                    <div>
                      <label className="font-bold text-stone-900 block mb-1 uppercase text-[10.5px]">
                        Template Category
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full p-2 rounded-lg border-2 border-stone-900 bg-white font-bold outline-none text-xs"
                      >
                        {templateCategories
                          .filter((c) => c !== "All styles")
                          .map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        <option value="+ New Category">+ New Custom Category</option>
                      </select>
                    </div>

                    {category === "+ New Category" && (
                      <div>
                        <label className="font-bold text-stone-900 block mb-1 uppercase text-[10px]">
                          Enter Custom Category Name
                        </label>
                        <input
                          type="text"
                          value={customCategory}
                          onChange={(e) => setCustomCategory(e.target.value)}
                          placeholder="e.g. Y2K Aesthetic 2026"
                          className="w-full p-2 bg-white rounded-lg border border-stone-900 text-xs outline-none"
                        />
                      </div>
                    )}

                    <div>
                      <label className="font-bold text-stone-900 block mb-1 uppercase text-[10.5px]">
                        Tags (Comma-separated)
                      </label>
                      <input
                        type="text"
                        value={tagsInput}
                        onChange={(e) => setTagsInput(e.target.value)}
                        className="w-full p-2 bg-white rounded-lg border border-stone-300 text-xs outline-none focus:border-stone-900"
                        placeholder="kbooth, aesthetic, romantic, purikura"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-stone-900 block mb-1 uppercase text-[10.5px]">
                        Description / Keepsake Note
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={2}
                        className="w-full p-2 bg-white rounded-lg border border-stone-300 text-xs outline-none focus:border-stone-900 resize-none"
                        placeholder="Note or caption for this template"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: PHOTO SLOTS */}
              {activeTab === "slots" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 uppercase text-[10.5px]">
                      Configured Slots ({slots.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      className="px-2.5 py-1 rounded bg-stone-900 text-amber-300 font-bold text-[11px] flex items-center gap-1 active:scale-95"
                    >
                      <Plus size={12} />
                      <span>Add Slot</span>
                    </button>
                  </div>

                  {/* Slot Selector List */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {slots.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedSlotIndex(i)}
                        className={`py-1.5 px-2 rounded-md font-bold text-center border transition-all ${
                          selectedSlotIndex === i
                            ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs"
                            : "bg-white text-stone-700 border-stone-300 hover:border-stone-800"
                        }`}
                      >
                        Slot {i + 1}
                      </button>
                    ))}
                  </div>

                  {/* Selected Slot Inspector */}
                  {selectedSlot !== null && selectedSlotIndex !== null && (
                    <div className="p-3 bg-white rounded-xl border-2 border-stone-900 shadow-xs space-y-3">
                      <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                        <strong className="font-bold text-stone-900 text-sm">
                          Slot {selectedSlotIndex + 1} Geometry
                        </strong>
                        <button
                          type="button"
                          onClick={() => handleDeleteSlot(selectedSlotIndex)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                          title="Delete slot"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <label className="text-[10px] text-stone-500 font-bold block mb-0.5">X Position (%)</label>
                          <input
                            type="number"
                            value={selectedSlot.x}
                            min={0}
                            max={100}
                            step={0.5}
                            onChange={(e) => handleUpdateSlot(selectedSlotIndex, { x: Number(e.target.value) })}
                            className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Y Position (%)</label>
                          <input
                            type="number"
                            value={selectedSlot.y}
                            min={0}
                            max={100}
                            step={0.5}
                            onChange={(e) => handleUpdateSlot(selectedSlotIndex, { y: Number(e.target.value) })}
                            className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Width (%)</label>
                          <input
                            type="number"
                            value={selectedSlot.width}
                            min={5}
                            max={100}
                            step={0.5}
                            onChange={(e) => handleUpdateSlot(selectedSlotIndex, { width: Number(e.target.value) })}
                            className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Height (%)</label>
                          <input
                            type="number"
                            value={selectedSlot.height}
                            min={5}
                            max={100}
                            step={0.5}
                            onChange={(e) => handleUpdateSlot(selectedSlotIndex, { height: Number(e.target.value) })}
                            className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Radius (px)</label>
                          <input
                            type="number"
                            value={selectedSlot.radius ?? 2}
                            min={0}
                            max={30}
                            onChange={(e) => handleUpdateSlot(selectedSlotIndex, { radius: Number(e.target.value) })}
                            className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Rotation (°)</label>
                          <input
                            type="number"
                            value={selectedSlot.rotation ?? 0}
                            min={-180}
                            max={180}
                            onChange={(e) => handleUpdateSlot(selectedSlotIndex, { rotation: Number(e.target.value) })}
                            className="w-full p-1.5 bg-stone-50 border border-stone-300 rounded"
                          />
                        </div>
                      </div>

                      {/* Alignment Quick Actions */}
                      <div className="pt-2 border-t border-stone-200 flex gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const w = selectedSlot.width
                            handleUpdateSlot(selectedSlotIndex, { x: Number(((100 - w) / 2).toFixed(1)) })
                          }}
                          className="flex-1 py-1 px-2 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold"
                        >
                          Center X
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            // Match 1:1 Aspect based on canvas dimensions
                            const pixelW = (selectedSlot.width / 100) * canvasWidth
                            const targetHeightPercent = Number(((pixelW / canvasHeight) * 100).toFixed(1))
                            handleUpdateSlot(selectedSlotIndex, { height: targetHeightPercent })
                          }}
                          className="flex-1 py-1 px-2 rounded bg-stone-100 hover:bg-stone-200 text-stone-800 text-[10px] font-bold"
                        >
                          Square (1:1)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: TYPOGRAPHY / TEXT */}
              {activeTab === "text" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 uppercase text-[10.5px]">
                      Pre-Placed Typography ({textsList.length})
                    </span>
                    <button
                      type="button"
                      onClick={handleAddText}
                      className="px-2.5 py-1 rounded bg-stone-900 text-amber-300 font-bold text-[11px] flex items-center gap-1 active:scale-95"
                    >
                      <Plus size={12} />
                      <span>Add Text</span>
                    </button>
                  </div>

                  {textsList.length === 0 ? (
                    <div className="p-4 text-center bg-white rounded-xl border border-dashed border-stone-300 text-stone-500">
                      No text layers added yet. Click &apos;Add Text&apos; to put headers like &apos;LIFE FOUR CUTS&apos; or dates.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {textsList.map((txt) => (
                        <div
                          key={txt.id}
                          className="p-3 bg-white rounded-xl border border-stone-200 shadow-xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <input
                              type="text"
                              value={txt.text}
                              onChange={(e) => {
                                const val = e.target.value
                                setTextsList(textsList.map((t) => (t.id === txt.id ? { ...t, text: val } : t)))
                              }}
                              className="font-bold text-xs bg-stone-50 p-1.5 rounded border border-stone-300 flex-1 mr-2"
                            />
                            <button
                              type="button"
                              onClick={() => setTextsList(textsList.filter((t) => t.id !== txt.id))}
                              className="text-rose-600 p-1"
                              title="Delete text"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>

                          <div className="grid grid-cols-3 gap-2 text-[10.5px]">
                            <div>
                              <label className="text-stone-500 block mb-0.5">Font</label>
                              <select
                                value={txt.font}
                                onChange={(e) => {
                                  const f = e.target.value as any
                                  setTextsList(textsList.map((t) => (t.id === txt.id ? { ...t, font: f } : t)))
                                }}
                                className="w-full p-1 bg-stone-50 rounded border"
                              >
                                <option value="sans">DM Sans</option>
                                <option value="hand">Caveat (Hand)</option>
                                <option value="serif">Georgia (Serif)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-stone-500 block mb-0.5">Size</label>
                              <input
                                type="number"
                                value={txt.size}
                                min={8}
                                max={80}
                                onChange={(e) => {
                                  const s = Number(e.target.value)
                                  setTextsList(textsList.map((t) => (t.id === txt.id ? { ...t, size: s } : t)))
                                }}
                                className="w-full p-1 bg-stone-50 rounded border"
                              />
                            </div>
                            <div>
                              <label className="text-stone-500 block mb-0.5">Y Position</label>
                              <input
                                type="number"
                                value={txt.y}
                                min={0}
                                max={100}
                                onChange={(e) => {
                                  const y = Number(e.target.value)
                                  setTextsList(textsList.map((t) => (t.id === txt.id ? { ...t, y } : t)))
                                }}
                                className="w-full p-1 bg-stone-50 rounded border"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: STICKERS */}
              {activeTab === "stickers" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 uppercase text-[10.5px]">
                      Sticker Library ({stickersList.length} placed)
                    </span>
                  </div>

                  {/* Sticker Catalog Grid */}
                  <div className="grid grid-cols-4 gap-2 max-h-[40vh] overflow-y-auto p-1 bg-white rounded-xl border border-stone-200">
                    {stickers.slice(0, 36).map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => handleAddSticker(st.id)}
                        className="p-2 rounded-lg border border-stone-200 hover:border-stone-900 hover:bg-stone-50 flex items-center justify-center aspect-square transition-all group"
                        title={`Add ${st.name}`}
                      >
                        <img
                          src={stickerUrl(st, "#1c1917")}
                          alt={st.name}
                          className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                        />
                      </button>
                    ))}
                  </div>

                  {/* Placed Stickers List */}
                  {stickersList.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-dashed border-stone-300">
                      <span className="font-bold text-[10px] text-stone-600 block">Placed Stickers:</span>
                      {stickersList.map((stk, i) => (
                        <div
                          key={stk.id}
                          className="p-2 bg-white rounded-lg border border-stone-200 flex items-center justify-between text-xs"
                        >
                          <span>Sticker #{i + 1} ({stk.assetId})</span>
                          <button
                            type="button"
                            onClick={() => setStickersList(stickersList.filter((s) => s.id !== stk.id))}
                            className="text-rose-600 p-0.5"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: BACKGROUND & PATTERNS */}
              {activeTab === "background" && (
                <div className="space-y-4">
                  <div>
                    <label className="font-bold text-stone-900 block mb-1.5 uppercase text-[10.5px]">
                      Background Base Color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className="w-10 h-10 rounded border border-stone-300 cursor-pointer"
                      />
                      <input
                        type="text"
                        value={background}
                        onChange={(e) => setBackground(e.target.value)}
                        className="p-2 bg-white border border-stone-300 rounded font-mono text-xs uppercase flex-1"
                      />
                    </div>
                  </div>

                  {/* Quick Color Swatches */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      "#fdfbf7",
                      "#f8f6f0",
                      "#18181b",
                      "#23150d",
                      "#42131b",
                      "#3e5c7d",
                      "#5c6b48",
                      "#fef08a",
                      "#fbcfe8",
                      "#e2e8f0",
                    ].map((col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setBackground(col)}
                        style={{ backgroundColor: col }}
                        className="w-7 h-7 rounded-full border border-stone-400 hover:scale-110 transition-transform shadow-xs"
                        title={col}
                      />
                    ))}
                  </div>

                  {/* Background Patterns */}
                  <div>
                    <label className="font-bold text-stone-900 block mb-1.5 uppercase text-[10.5px]">
                      Aesthetic Patterns
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 max-h-[30vh] overflow-y-auto pr-1">
                      {["none", ...backgroundPatterns].map((pat) => (
                        <button
                          key={pat}
                          type="button"
                          onClick={() => setBackgroundPattern(pat)}
                          className={`p-2 rounded-lg border text-left text-[11px] font-bold capitalize transition-all ${
                            backgroundPattern === pat
                              ? "bg-stone-900 text-amber-300 border-stone-900 shadow-xs"
                              : "bg-white text-stone-800 border-stone-200 hover:border-stone-800"
                          }`}
                        >
                          {pat}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 6: FRAMES */}
              {activeTab === "frames" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 uppercase text-[10.5px]">
                      Decorative Frames & Borders
                    </span>
                    {frameId && (
                      <button
                        type="button"
                        onClick={() => setFrameId(undefined)}
                        className="text-rose-600 text-[10.5px] font-bold"
                      >
                        Remove Frame
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 max-h-[40vh] overflow-y-auto p-1 bg-white rounded-xl border border-stone-200">
                    {frames.slice(0, 18).map((fr) => (
                      <button
                        key={fr.id}
                        type="button"
                        onClick={() => {
                          setFrameId(fr.id)
                          notify(`Selected ${fr.name} frame!`)
                        }}
                        className={`p-2 rounded-lg border flex flex-col items-center justify-center text-center transition-all ${
                          frameId === fr.id
                            ? "bg-amber-100 border-stone-900 shadow-xs"
                            : "bg-white border-stone-200 hover:border-stone-800"
                        }`}
                      >
                        <span className="text-[10px] font-bold truncate max-w-full">{fr.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* Center Stage: Interactive Live Canvas */}
          <main className="flex-1 bg-[#ebe5d8] p-4 sm:p-8 flex items-center justify-center relative overflow-hidden">
            {/* Visual Canvas Container */}
            <div className="relative shadow-[12px_12px_0_#171717] border-2 border-stone-900 bg-white max-h-[82vh] max-w-[90%] flex items-center justify-center">
              <canvas
                ref={canvasRef}
                className="max-h-[80vh] max-w-full object-contain block"
              />

              {/* Interactive Bounding Box Overlays for Slots */}
              {slots.map((s, idx) => {
                const isSelected = selectedSlotIndex === idx
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      setSelectedSlotIndex(idx)
                      setActiveTab("slots")
                    }}
                    style={{
                      left: `${s.x}%`,
                      top: `${s.y}%`,
                      width: `${s.width}%`,
                      height: `${s.height}%`,
                      transform: s.rotation ? `rotate(${s.rotation}deg)` : undefined,
                    }}
                    className={`absolute cursor-pointer border-2 transition-all flex items-center justify-center ${
                      isSelected
                        ? "border-amber-500 bg-amber-400/20 shadow-[0_0_12px_rgba(245,158,11,0.5)] z-20"
                        : "border-dashed border-stone-800/40 hover:border-stone-900 hover:bg-stone-500/10 z-10"
                    }`}
                  >
                    <span
                      className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        isSelected
                          ? "bg-amber-500 text-stone-950 shadow-xs"
                          : "bg-stone-900/60 text-white backdrop-blur-xs"
                      }`}
                    >
                      SLOT {idx + 1}
                    </span>
                  </div>
                )
              })}
            </div>
          </main>
        </div>
      )}

      {/* Multi-Device Responsive Preview Modal */}
      {devicePreviewMode && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#faf8f0] w-full max-w-2xl rounded-2xl border-2 border-stone-900 shadow-[8px_8px_0_#171717] p-5 flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between pb-3 border-b-2 border-stone-200">
              <div className="flex items-center gap-2">
                <Eye size={18} className="text-amber-600" />
                <h3 className="font-bold text-sm text-stone-900">Responsive Device Preview</h3>
              </div>

              {/* Device Selector */}
              <div className="flex items-center gap-1 bg-stone-200 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setDevicePreviewMode("mobile")}
                  className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 ${
                    devicePreviewMode === "mobile" ? "bg-stone-900 text-white" : "text-stone-700"
                  }`}
                >
                  <Smartphone size={12} />
                  <span>Phone (390px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDevicePreviewMode("tablet")}
                  className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 ${
                    devicePreviewMode === "tablet" ? "bg-stone-900 text-white" : "text-stone-700"
                  }`}
                >
                  <Tablet size={12} />
                  <span>Tablet (768px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDevicePreviewMode("strip")}
                  className={`px-2.5 py-1 rounded font-bold flex items-center gap-1 ${
                    devicePreviewMode === "strip" ? "bg-stone-900 text-white" : "text-stone-700"
                  }`}
                >
                  <Printer size={12} />
                  <span>Print Strip</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setDevicePreviewMode(null)}
                className="p-1 rounded-lg hover:bg-stone-200 text-stone-600"
              >
                <X size={16} />
              </button>
            </div>

            {/* Device Frame Viewport */}
            <div className="flex-1 overflow-auto py-6 flex items-center justify-center bg-stone-100/70 rounded-xl my-4">
              <div
                className={`transition-all p-3 bg-white shadow-xl border-4 border-stone-900 flex items-center justify-center ${
                  devicePreviewMode === "mobile"
                    ? "w-[260px] h-[520px] rounded-[36px]"
                    : devicePreviewMode === "tablet"
                      ? "w-[420px] h-[560px] rounded-[24px]"
                      : "w-[220px] h-[580px] rounded-lg"
                }`}
              >
                {previewCoverUrl ? (
                  <img
                    src={previewCoverUrl}
                    alt="Device Preview"
                    className="max-h-full max-w-full object-contain rounded"
                  />
                ) : (
                  <span className="text-xs text-stone-400">Rendering preview...</span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs font-mono text-stone-500 pt-2 border-t border-stone-200">
              <span>{name} · {slots.length}-Cut Layout</span>
              <button
                type="button"
                onClick={() => setDevicePreviewMode(null)}
                className="px-4 py-1.5 rounded-lg bg-stone-900 text-white font-bold"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Publish Template to All Users */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-[#faf8f0] w-full max-w-md rounded-2xl border-2 border-stone-900 shadow-[8px_8px_0_#171717] p-5 flex flex-col space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b-2 border-stone-200">
              <Send size={18} className="text-amber-600" />
              <h3 className="font-bold text-sm text-stone-900">Confirm Template Publication</h3>
            </div>

            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-stone-300">
              {previewCoverUrl && (
                <img
                  src={previewCoverUrl}
                  alt={name}
                  className="w-14 h-20 object-contain rounded border border-stone-200 shrink-0 bg-stone-50"
                />
              )}
              <div className="text-xs font-mono space-y-1">
                <strong className="block font-bold text-stone-900">{name}</strong>
                <span className="text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 text-[10px] font-bold block">
                  Category: {category}
                </span>
                <span className="text-stone-500 block text-[10px]">
                  {slots.length} photo cuts · {canvasWidth}×{canvasHeight}px
                </span>
              </div>
            </div>

            <p className="text-xs text-stone-600 font-mono leading-relaxed">
              Publishing will make this template immediately accessible to all registered and guest users in the Little Moments template catalog.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-stone-200">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-lg bg-white border border-stone-300 font-bold text-xs text-stone-700 hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmPublish}
                disabled={isSaving}
                className="px-4 py-2 rounded-lg bg-stone-900 text-white font-bold text-xs hover:bg-black shadow-[2px_2px_0_#d97762] active:scale-95 flex items-center gap-1.5"
              >
                {isSaving ? "Publishing..." : "Confirm & Publish 🚀"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisualTemplateStudio
