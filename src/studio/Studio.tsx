import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Crop,
  Download,
  Eye,
  EyeOff,
  Frame,
  Grid2X2,
  Heart,
  ImagePlus,
  Layers,
  LockKeyhole,
  Maximize,
  Minus,
  MousePointer2,
  Paintbrush,
  Plus,
  RotateCcw,
  RotateCw,
  Search,
  SlidersHorizontal,
  Smile,
  Sparkles,
  Sticker,
  Trash2,
  Type,
  UnlockKeyhole,
  WandSparkles,
  X,
  GripVertical,
} from "lucide-react"
import type {
  Adjustments,
  Composition,
  LayerProperties,
  Photo,
  PhotoTemplate,
} from "../types"
import { defaultAdjustments } from "../types"
import { getTemplate, templates, templatesForCount } from "../templates"
import { cssFilter, loadImage, renderComposition } from "../rendering"
import { adjustmentControls } from "./pixels"
import { filterPresets } from "./filters"
import {
  backgroundPatterns,
  frames,
  frameCategories,
  stickers,
  allStickers,
  allStickerPacks,
  pngStickers,
  findSticker,
  stickerPacks,
  stickerUrl,
} from "./assets"
import type { FramePreset } from "./assets"
import useFontRevision from "./useFontRevision"
import { TemplateThumbnail } from "../components/TemplateThumbnail"
import {
  ASPECT_RATIOS,
  GRID_LAYOUTS,
  findGridLayout,
  getLayoutsForCount,
  getActiveAspectRatio,
} from "./gridEngine"
import type { AspectRatioId, GridLayout } from "./gridEngine"
import {
  deleteLayer,
  dimensions,
  distributePhotos,
  duplicateLayer,
  enterFreeform,
  moveLayer,
  orderedLayers,
  patchLayer,
  photoBounds,
} from "./model"

type Props = {
  composition: Composition
  onChange: (next: Composition, before?: Composition) => void
  onTransient: (next: Composition) => void
  onDone: () => void
  onSave: () => void
  saveStatus: string
  notify: (s: string) => void
  onUndo?: () => void
  onRedo?: () => void
  canUndo?: boolean
  canRedo?: boolean
  onClose?: () => void
}
const tools = [
  { name: "Grid", icon: Grid2X2 },
  { name: "Templates", icon: Sparkles },
  { name: "Frames", icon: Frame },
  { name: "Adjust", icon: SlidersHorizontal },
  { name: "Filters", icon: WandSparkles },
  { name: "Stickers", icon: Sticker },
  { name: "Text", icon: Type },
  { name: "Background", icon: Paintbrush },
  { name: "Layers", icon: Layers },
]

const samplePhotos = [
  "/images/romantic_love_kisspose_aesthetic/031.jpg",
  "/images/romantic_love_kisspose_aesthetic/032.jpg",
  "/images/romantic_love_kisspose_aesthetic/033.jpg",
  "/images/romantic_love_kisspose_aesthetic/034.jpg",
  "/images/romantic_love_kisspose_aesthetic/035.jpg",
  "/images/cool_animated_romantic/001.jpg",
]
const colors = [
  "#f8f2e6",
  "#edd1cc",
  "#d3ddc7",
  "#ccdbe2",
  "#ead69b",
  "#222a26",
  "#fffaf5",
  "#9e5b65",
]
function initialPreferences(key: string): string[] {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]")
  } catch {
    return []
  }
}
export function StudioPreview({
  composition,
  className = "",
  maxEdge = 700,
}: {
  composition: Composition
  className?: string
  maxEdge?: number
}) {
  const fontRevision = useFontRevision()
  const canvas = useRef<HTMLCanvasElement>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false)
  useEffect(() => {
    let current = true
    setLoading(true)
    const timer = setTimeout(() => {
      const buffer = document.createElement("canvas")
      renderComposition(
        buffer,
        composition,
        getTemplate(composition.templateId),
        Math.min(
          1,
          maxEdge /
            Math.max(
              ...Object.values(
                dimensions(composition, getTemplate(composition.templateId)),
              ),
            ),
        ),
      )
        .then(() => {
          if (!current || !canvas.current) return
          canvas.current.width = buffer.width
          canvas.current.height = buffer.height
          canvas.current.getContext("2d")?.drawImage(buffer, 0, 0)
          setError("")
          setLoading(false)
        })
        .catch(() => {
          if (current) {
            setError(
              "This photo could not be rendered. Replace it or undo the last edit.",
            )
            setLoading(false)
          }
        })
    }, 35)
    return () => {
      current = false
      clearTimeout(timer)
    }
  }, [composition, maxEdge, fontRevision])
  return (
    <div className={`studio-render ${className}`} aria-busy={loading}>
      <canvas ref={canvas} aria-label="Editable composition preview" />
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
function Range({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  onReset,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (v: number) => void
  onReset?: () => void
}) {
  return (
    <label className="studio-range">
      <span>{label}</span>
      <output>{Number(value.toFixed(2))}</output>
      {onReset && (
        <button
          type="button"
          title={`Reset ${label}`}
          aria-label={`Reset ${label}`}
          onClick={(e) => {
            e.preventDefault()
            onReset()
          }}
        >
          <RotateCcw size={12} />
        </button>
      )}
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
function Swatches({
  value,
  onChange,
}: {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="studio-swatches">
      {colors.map((c) => (
        <button
          key={c}
          style={{ background: c }}
          className={c === value ? "selected" : ""}
          aria-label={`Choose ${c}`}
          onClick={() => onChange(c)}
        >
          {c === value && <Check size={13} />}
        </button>
      ))}
      <label title="Custom color">
        <Plus size={14} />
        <input
          aria-label="Custom color"
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  )
}
type LayerThumbProps = {
  c: Composition
  id: string
}
type LayerClipboard = {
  composition: Composition
  id: string
}
type GesturePoint = {
  x: number
  y: number
}
function LayerThumb({ c, id }: LayerThumbProps) {
  const photo = c.photos.find((p) => p.id === id),
    sticker = c.stickers.find((s) => s.id === id),
    asset = findSticker(sticker?.assetId || "") ?? stickers.find((a) => a.id === sticker?.assetId)
  return photo ? (
    <img src={photo.src} alt="" />
  ) : sticker?.src ? (
    <img src={sticker.src} alt="" />
  ) : asset ? (
    <img src={stickerUrl(asset, sticker!.color)} alt="" />
  ) : id === "frame" ? (
    <Frame size={18} />
  ) : (
    <Type size={18} />
  )
}
export default function Studio({
  composition: c,
  onChange: commit,
  onTransient,
  onDone,
  onSave,
  saveStatus,
  notify,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onClose,
}: Props) {
  const [tool, setTool] = useState("Grid"),
    [showLayersModal, setShowLayersModal] = useState(false),
    [activeMobileDrawer, setActiveMobileDrawer] = useState<string | null>(null),
    [studioTab, setStudioTab] = useState<"grid" | "template">("grid"),
    [gridCountFilter, setGridCountFilter] = useState<number | "all">("all"),
    [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>("All styles"),
    [swapTarget, setSwapTarget] = useState<string | null>(null),
    [selected, setSelected] = useState(c.photos[0]?.id ?? ""),
    [multi, setMulti] = useState<string[]>([]),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("All collections"),
    [libraryPage, setLibraryPage] = useState(0),
    [filterCategory, setFilterCategory] = useState("All looks"),
    [pack, setPack] = useState("All packs"),
    [frameCandidate, setFrameCandidate] = useState<FramePreset | null>(null),
    [favorites, setFavorites] = useState(() =>
      initialPreferences("studio-frame-favorites"),
    ),
    [recent, setRecent] = useState(() =>
      initialPreferences("studio-recent-frames"),
    ),
    [stickerFavorites, setStickerFavorites] = useState(() =>
      initialPreferences("studio-sticker-favorites"),
    ),
    [recentStickers, setRecentStickers] = useState(() =>
      initialPreferences("studio-recent-stickers"),
    ),
    [stickerPreviewBg, setStickerPreviewBg] = useState<"checkered" | "light" | "dark">("checkered"),
    [sort, setSort] = useState("Collection"),
    [colorFilter, setColorFilter] = useState("Any color"),
    [showFavorites, setShowFavorites] = useState(false),
    [showRecent, setShowRecent] = useState(false),
    [copied, setCopied] = useState<Adjustments | null>(null),
    [compare, setCompare] = useState(false),
    [safe, setSafe] = useState(false),
    [zoom, setZoom] = useState(1),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [snapped, setSnapped] = useState({ x: false, y: false }),
    [caption, setCaption] = useState("a little moment worth keeping"),
    [inspectorWidth, setInspectorWidth] = useState<number>(() => {
      try {
        const saved = localStorage.getItem("studio-inspector-width")
        if (saved) {
          const val = parseInt(saved, 10)
          if (val >= 320 && val <= 860) return val
        }
      } catch {}
      return 460
    }),
    [isResizing, setIsResizing] = useState(false),
    [replacing, setReplacing] = useState(false),
    [touchMode, setTouchMode] = useState<"photo" | "canvas">("photo"),
    [gestureHud, setGestureHud] = useState<{ text: string; sub?: string } | null>(null),
    [stickerPlacementAngle, setStickerPlacementAngle] = useState<number | "random">(0),
    [templateSearch, setTemplateSearch] = useState(""),
    [templateCutFilter, setTemplateCutFilter] = useState<number | "all">("all"),
    [filterSearch, setFilterSearch] = useState("")
  const stage = useRef<HTMLDivElement>(null),
    studioBodyRef = useRef<HTMLDivElement>(null),
    viewportRef = useRef<HTMLDivElement>(null),
    importInput = useRef<HTMLInputElement>(null),
    stickerInput = useRef<HTMLInputElement>(null),
    clipboard = useRef<LayerClipboard | null>(null),
    contextStart = useRef(c),
    gesture = useRef<{
      before: Composition
      id: string
      operation: string
      startX: number
      startY: number
      distance: number
      pan: typeof pan
      zoom: number
    } | null>(null),
    pointers = useRef(new Map<number, GesturePoint>()),
    lastTap = useRef<{ time: number; id: string; x: number; y: number } | null>(null),
    hudTimeout = useRef<number | null>(null)

  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = viewportRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setViewportSize({ width: Math.round(rect.width), height: Math.round(rect.height) })
      }
    }
    update()
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        if (width > 0 && height > 0) {
          setViewportSize({ width: Math.round(width), height: Math.round(height) })
        }
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const showHud = (text: string, sub?: string) => {
    setGestureHud({ text, sub })
    if (hudTimeout.current) window.clearTimeout(hudTimeout.current)
    hudTimeout.current = window.setTimeout(() => {
      setGestureHud(null)
    }, 1200)
  }
  const template = getTemplate(c.templateId),
    layers = orderedLayers(c),
    layer = layers.find((l) => l.id === selected),
    photoIndex = c.photos.findIndex((p) => p.id === selected),
    photo = c.photos[photoIndex],
    sticker = c.stickers.find((s) => s.id === selected),
    text = c.texts.find((t) => t.id === selected),
    size = dimensions(c, template)

  const canvasFit = useMemo(() => {
    const targetW = size.width || 1800
    const targetH = size.height || 1800
    const aspect = targetW / targetH

    const vpW = viewportSize.width > 0
      ? viewportSize.width
      : (typeof window !== "undefined" ? Math.max(200, window.innerWidth - inspectorWidth - 20) : 600)
    const vpH = viewportSize.height > 0
      ? viewportSize.height
      : (typeof window !== "undefined" ? Math.max(200, window.innerHeight - 260) : 500)

    // Provide clean, comfortable breathing room around the photobooth canvas
    const padX = vpW < 500 ? 12 : 24
    const padY = vpH < 500 ? 12 : 24

    const maxW = Math.max(50, vpW - padX)
    const maxH = Math.max(50, vpH - padY)

    let w: number
    let h: number

    if (maxW / maxH > aspect) {
      // Height-constrained: canvas height fills available height
      h = Math.round(maxH)
      w = Math.round(maxH * aspect)
    } else {
      // Width-constrained: canvas width fills available width
      w = Math.round(maxW)
      h = Math.round(maxW / aspect)
    }

    return { width: w, height: h, aspect }
  }, [size.width, size.height, viewportSize.width, viewportSize.height, inspectorWidth])
  const currentAdjustments = { ...defaultAdjustments(), ...photo?.adjustments }
  const preview = frameCandidate
    ? {
        ...c,
        frameId: frameCandidate.id,
        frameColor: frameCandidate.color,
        background: frameCandidate.background,
      }
    : c
  const visible = compare
    ? {
        ...preview,
        photos: preview.photos.map((p) =>
          p.id === selected ? { ...p, adjustments: defaultAdjustments() } : p,
        ),
      }
    : preview
  useEffect(() => {
    const values: { [key: string]: string[] } = {
      "studio-frame-favorites": favorites,
      "studio-recent-frames": recent,
      "studio-sticker-favorites": stickerFavorites,
      "studio-recent-stickers": recentStickers,
    }
    try {
      Object.entries(values).forEach(([k, v]) =>
        localStorage.setItem(k, JSON.stringify(v)),
      )
    } catch {
      notify("Preferences could not be stored. Your project is unchanged.")
    }
  }, [favorites, recent, stickerFavorites, recentStickers])

  const isDraggingResizer = useRef(false)
  const dragResizerStart = useRef<{ clientX: number; width: number } | null>(null)

  const onResizerPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {}
    isDraggingResizer.current = true
    dragResizerStart.current = { clientX: e.clientX, width: inspectorWidth }
    setIsResizing(true)
  }

  const onResizerPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingResizer.current || !dragResizerStart.current) return
    e.preventDefault()
    // Moving cursor LEFT (e.clientX < start) increases sidebar width
    const delta = dragResizerStart.current.clientX - e.clientX
    const minW = 320
    const maxW = Math.min(880, Math.floor(window.innerWidth * 0.72))
    const nextW = Math.max(minW, Math.min(maxW, Math.round(dragResizerStart.current.width + delta)))
    if (studioBodyRef.current) {
      studioBodyRef.current.style.setProperty("--studio-inspector-width", `${nextW}px`)
      studioBodyRef.current.style.setProperty("grid-template-columns", `1fr ${nextW}px`, "important")
    }
    setInspectorWidth(nextW)
  }

  const onResizerPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingResizer.current) return
    isDraggingResizer.current = false
    dragResizerStart.current = null
    setIsResizing(false)
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {}
  }

  useEffect(() => {
    if (studioBodyRef.current) {
      studioBodyRef.current.style.setProperty("--studio-inspector-width", `${inspectorWidth}px`)
      studioBodyRef.current.style.setProperty("grid-template-columns", `1fr ${inspectorWidth}px`, "important")
    }
    try {
      localStorage.setItem("studio-inspector-width", String(inspectorWidth))
    } catch {}
  }, [inspectorWidth])

  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = "col-resize"
      document.body.style.userSelect = "none"
    } else {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
    return () => {
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isResizing])
  const setPanel = (name: string) => {
    contextStart.current = c
    setTool(name)
    if (name === "Grid") setStudioTab("grid")
    if (name === "Templates") setStudioTab("template")
    setSearch("")
    setLibraryPage(0)
    setFrameCandidate(null)
  }
  const updatePhoto = (patch: Partial<Adjustments>) => {
    if (!photo) {
      notify("Select a photo first.")
      return
    }
    if (photo.locked) {
      notify("Unlock this photo to edit it.")
      return
    }
    commit({
      ...c,
      photos: c.photos.map((p) =>
        p.id === selected
          ? {
              ...p,
              adjustments: {
                ...defaultAdjustments(),
                ...p.adjustments,
                ...patch,
              },
            }
          : p,
      ),
    })
  }
  const selectPhoto = () => {
    if (!photo && c.photos[0]) setSelected(c.photos[0].id)
  }
  const updateLayer = (patch: LayerProperties) =>
    commit(patchLayer(c, selected, patch))
  const updateSticker = (patch: Partial<NonNullable<typeof sticker>>) => {
    if (sticker?.locked) {
      notify("Unlock the sticker first.")
      return
    }
    commit({
      ...c,
      stickers: c.stickers.map((s) =>
        s.id === selected ? { ...s, ...patch } : s,
      ),
    })
  }
  const updateText = (patch: Partial<NonNullable<typeof text>>) => {
    if (text?.locked) {
      notify("Unlock the caption first.")
      return
    }
    commit({
      ...c,
      texts: c.texts.map((t) => (t.id === selected ? { ...t, ...patch } : t)),
    })
  }
  const copyLayer = () => {
    if (layer && layer.kind !== "frame") {
      clipboard.current = { composition: c, id: selected }
      notify("Layer copied. Paste a new editable copy.")
    }
  }
  const pasteLayer = () => {
    const clip = clipboard.current
    if (!clip) return
    const id = crypto.randomUUID(),
      source = duplicateLayer(clip.composition, clip.id, id),
      p = source.photos.find((x) => x.id === id),
      s = source.stickers.find((x) => x.id === id),
      t = source.texts.find((x) => x.id === id)
    const next = {
      ...c,
      mode: "freeform" as const,
      photos: p ? [...c.photos, p] : c.photos,
      stickers: s ? [...c.stickers, s] : c.stickers,
      texts: t ? [...c.texts, t] : c.texts,
      layerOrder: [...layers.map((l) => l.id), id],
    }
    commit(next)
    setSelected(id)
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest("input,textarea,select")) return
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "c") {
          e.preventDefault()
          copyLayer()
        }
        if (e.key === "v") {
          e.preventDefault()
          pasteLayer()
        }
      }
    }
    window.addEventListener("keydown", key)
    return () => window.removeEventListener("keydown", key)
  }, [c, selected])
  const applyGridLayout = (gl: GridLayout) => {
    let nextPhotos = [...c.photos]
    if (nextPhotos.length > gl.count) {
      nextPhotos = nextPhotos.slice(0, gl.count)
    }

    commit({
      ...c,
      mode: "guided",
      gridLayoutId: gl.id,
      photos: nextPhotos.map((p) => ({ ...p, transform: undefined })),
    })
    notify(`Applied ${gl.name} (${gl.count} photos)`)
  }

  const applyTemplate = (t: PhotoTemplate) => {
    let nextPhotos = [...c.photos]
    if (nextPhotos.length > t.count) {
      nextPhotos = nextPhotos.slice(0, t.count)
    }

    const next: Composition = {
      ...c,
      mode: "guided",
      templateId: t.id,
      gridLayoutId: undefined,
      aspectRatio: undefined,
      photos: nextPhotos.map((p) => ({ ...p, transform: undefined })),
    }

    if (t.background) {
      next.background = t.background
    }
    if (t.backgroundPattern) {
      next.backgroundPattern = t.backgroundPattern
    }
    if (t.frameId) {
      next.frameId = t.frameId
    }
    if (t.frameColor) {
      next.frameColor = t.frameColor
    }

    commit(next)
    notify(`Applied template: ${t.name}`)
  }

  const swapPhotos = (idA: string, idB: string) => {
    const idxA = c.photos.findIndex((p) => p.id === idA)
    const idxB = c.photos.findIndex((p) => p.id === idB)
    if (idxA < 0 || idxB < 0 || idxA === idxB) return
    const nextPhotos = [...c.photos]
    const temp = nextPhotos[idxA]
    nextPhotos[idxA] = nextPhotos[idxB]
    nextPhotos[idxB] = temp
    commit({
      ...c,
      photos: nextPhotos,
    })
    setSwapTarget(null)
    notify("Photo positions swapped!")
  }

  const switchLayout = (t: PhotoTemplate) => {
    applyTemplate(t)
  }
  const reshapePhoto = async (ratio: string) => {
    if (!photo || photo.locked) return
    const image = ratio === "source" ? await loadImage(photo.src) : null
    const aspect = image ? image.width / image.height : Number(ratio)
    if (!Number.isFinite(aspect) || aspect <= 0) return
    const base = c.mode === "freeform" ? c : enterFreeform(c, template),
      bounds = photoBounds(base, template, photoIndex)
    const height = Math.min(
      100,
      ((bounds.width / aspect) * size.width) / size.height,
    )
    const width = (height * aspect * size.height) / size.width
    commit({
      ...base,
      photos: base.photos.map((p) =>
        p.id === selected
          ? {
              ...p,
              transform: {
                ...bounds,
                x: bounds.x + (bounds.width - width) / 2,
                y: bounds.y + (bounds.height - height) / 2,
                width,
                height,
              },
            }
          : p,
      ),
    })
  }
  const importPhotos = async (files: FileList | null, asSticker = false) => {
    if (!files) return
    try {
      const additions: Photo[] = []
      for (const f of Array.from(files)) {
        if (!f.type.startsWith("image/")) continue
        if (f.size > 30 * 1024 * 1024)
          throw new Error("Use images smaller than 30 MB.")
        const src = await new Promise<string>((resolve, reject) => {
          const r = new FileReader()
          r.onload = () => resolve(String(r.result))
          r.onerror = reject
          r.readAsDataURL(f)
        })
        const image = new Image()
        image.src = src
        await image.decode()
        additions.push({
          id: crypto.randomUUID(),
          src,
          name: f.name,
          adjustments: defaultAdjustments(),
        })
      }
      if (asSticker) {
        commit({
          ...c,
          stickers: [
            ...c.stickers,
            ...additions.map((p) => ({
              id: p.id,
              kind: "star" as const,
              src: p.src,
              name: p.name,
              x: 50,
              y: 50,
              size: 25,
              rotation: 0,
              color: "#a45f59",
            })),
          ],
        })
        setSelected(additions[0]?.id ?? selected)
      } else if (replacing && photo && additions[0]) {
        commit({
          ...c,
          photos: c.photos.map((p) =>
            p.id === selected
              ? {
                  ...p,
                  src: additions[0].src,
                  name: additions[0].name,
                  adjustments: defaultAdjustments(),
                }
              : p,
          ),
        })
      } else {
        const base = c.mode === "freeform" ? c : enterFreeform(c, template)
        commit({
          ...base,
          photos: [
            ...base.photos,
            ...additions.map((p, i) => ({
              ...p,
              transform: {
                x: 15 + i * 3,
                y: 15 + i * 3,
                width: 45,
                height: 35,
                rotation: 0,
              },
            })),
          ],
        })
        setSelected(additions[0]?.id ?? selected)
      }
    } catch (e) {
      notify(e instanceof Error ? e.message : "This file could not be opened.")
    } finally {
      setReplacing(false)
      if (importInput.current) importInput.current.value = ""
      if (stickerInput.current) stickerInput.current.value = ""
    }
  }
  const layerBounds = (id: string, composition = c) => {
    if (id === "frame") {
      return (
        composition.frameTransform ?? {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
        }
      )
    }
    const i = composition.photos.findIndex((p) => p.id === id)
    if (i >= 0)
      return photoBounds(composition, getTemplate(composition.templateId), i)
    const s = composition.stickers.find((s) => s.id === id)
    if (s) {
      const h = (s.size * size.width) / size.height
      return {
        x: s.x - s.size / 2,
        y: s.y - h / 2,
        width: s.size,
        height: h,
        rotation: s.rotation,
      }
    }
    const t = composition.texts.find((t) => t.id === id)
    if (t)
      return {
        x: t.x - 20,
        y: t.y - 3,
        width: 40,
        height: 6,
        rotation: t.rotation,
      }
    return { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
  }
  const transformGesture = (
    base: Composition,
    id: string,
    dx: number,
    dy: number,
    scale: number,
    rotationDelta = 0,
  ): Composition => {
    const b = layerBounds(id, base),
      index = base.photos.findIndex((p) => p.id === id),
      s = base.stickers.find((s) => s.id === id),
      t = base.texts.find((t) => t.id === id),
      operation = gesture.current?.operation

    if (id === "frame" && base.frameId) {
      const ft = base.frameTransform ?? {
        x: 0,
        y: 0,
        width: 100,
        height: 100,
        rotation: 0,
      }
      const rotated = operation === "rotate"
      const resized = operation === "resize"
      if (rotated) {
        return {
          ...base,
          frameTransform: {
            ...ft,
            rotation: Math.round(ft.rotation + rotationDelta),
          },
        }
      }
      if (resized) {
        const newWidth = Math.max(10, Math.min(250, Number((ft.width * scale).toFixed(2))))
        const newHeight = Math.max(10, Math.min(250, Number((ft.height * scale).toFixed(2))))
        const newX = Number(((ft.x + ft.width / 2) - newWidth / 2).toFixed(2))
        const newY = Number(((ft.y + ft.height / 2) - newHeight / 2).toFixed(2))
        return {
          ...base,
          frameTransform: {
            ...ft,
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          },
        }
      }
      return {
        ...base,
        frameTransform: {
          ...ft,
          x: Number((ft.x + dx).toFixed(2)),
          y: Number((ft.y + dy).toFixed(2)),
        },
      }
    }

    if (index >= 0) {
      const p = base.photos[index]
      if (base.mode !== "freeform") {
        if (operation === "rotate") {
          const curRot = p.adjustments?.rotation || 0
          return {
            ...base,
            photos: base.photos.map((x) =>
              x.id === id
                ? {
                    ...x,
                    adjustments: {
                      ...x.adjustments,
                      rotation: Math.round(curRot + rotationDelta),
                    },
                  }
                : x,
            ),
          }
        }
        const curZoom = p.adjustments?.zoom || 1
        const curX = p.adjustments?.offsetX || 0
        const curY = p.adjustments?.offsetY || 0

        const newZoom = scale !== 1
          ? Math.max(1, Math.min(4, Number((curZoom * scale).toFixed(2))))
          : curZoom
        const newX = Math.max(-100, Math.min(100, Math.round(curX + dx * 1.5)))
        const newY = Math.max(-100, Math.min(100, Math.round(curY + dy * 1.5)))

        return {
          ...base,
          photos: base.photos.map((x) =>
            x.id === id
              ? {
                  ...x,
                  adjustments: {
                    ...x.adjustments,
                    offsetX: newX,
                    offsetY: newY,
                    zoom: newZoom,
                  },
                }
              : x,
          ),
        }
      }
      const rotated = operation === "rotate"
      const resized = operation === "resize"
      if (rotated) {
        return {
          ...base,
          photos: base.photos.map((x) =>
            x.id === id
              ? {
                  ...x,
                  transform: {
                    ...b,
                    rotation: Math.round(b.rotation + rotationDelta),
                  },
                }
              : x,
          ),
        }
      }
      if (resized) {
        const newWidth = Math.max(5, Math.min(250, Number((b.width * scale).toFixed(2))))
        const newHeight = Math.max(5, Math.min(250, Number((b.height * scale).toFixed(2))))
        const newX = Number(((b.x + b.width / 2) - newWidth / 2).toFixed(2))
        const newY = Number(((b.y + b.height / 2) - newHeight / 2).toFixed(2))
        return {
          ...base,
          photos: base.photos.map((x) =>
            x.id === id
              ? {
                  ...x,
                  transform: {
                    ...b,
                    x: newX,
                    y: newY,
                    width: newWidth,
                    height: newHeight,
                  },
                }
              : x,
          ),
        }
      }
      return {
        ...base,
        photos: base.photos.map((x) =>
          x.id === id
            ? {
                ...x,
                transform: {
                  ...b,
                  x: Number((b.x + dx).toFixed(2)),
                  y: Number((b.y + dy).toFixed(2)),
                },
              }
            : x,
        ),
      }
    }
    if (s) {
      const rotated = operation === "rotate"
      const resized = operation === "resize"
      if (rotated) {
        return {
          ...base,
          stickers: base.stickers.map((x) =>
            x.id === id
              ? {
                  ...x,
                  rotation: Math.round(x.rotation + rotationDelta),
                }
              : x,
          ),
        }
      }
      if (resized) {
        return {
          ...base,
          stickers: base.stickers.map((x) =>
            x.id === id
              ? {
                  ...x,
                  size: Math.max(2, Math.min(120, Math.round(x.size * scale))),
                }
              : x,
          ),
        }
      }
      return {
        ...base,
        stickers: base.stickers.map((x) =>
          x.id === id
            ? {
                ...x,
                x: Number((x.x + dx).toFixed(2)),
                y: Number((x.y + dy).toFixed(2)),
              }
            : x,
        ),
      }
    }
    if (t) {
      const rotated = operation === "rotate"
      const resized = operation === "resize"
      if (rotated) {
        return {
          ...base,
          texts: base.texts.map((x) =>
            x.id === id
              ? {
                  ...x,
                  rotation: Math.round(x.rotation + rotationDelta),
                }
              : x,
          ),
        }
      }
      if (resized) {
        return {
          ...base,
          texts: base.texts.map((x) =>
            x.id === id
              ? {
                  ...x,
                  size: Math.max(6, Math.min(120, Math.round(x.size * scale))),
                }
              : x,
          ),
        }
      }
      return {
        ...base,
        texts: base.texts.map((x) =>
          x.id === id
            ? {
                ...x,
                x: Number((x.x + dx).toFixed(2)),
                y: Number((x.y + dy).toFixed(2)),
              }
            : x,
        ),
      }
    }
    return base
  }
  const pointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return
    const target = (e.target as HTMLElement).closest<HTMLElement>(
        "[data-layer]",
      ),
      id = target?.dataset.layer ?? "",
      operation =
        (e.target as HTMLElement).closest<HTMLElement>("[data-operation]")
          ?.dataset.operation ?? "move"

    // Double-tap recognition for native touch feel
    const now = Date.now()
    const last = lastTap.current
    if (last && now - last.time < 350 && Math.hypot(e.clientX - last.x, e.clientY - last.y) < 25) {
      if (id && c.photos.some((p) => p.id === id)) {
        // Double-tap on photo: toggle zoom 1.0x -> 1.6x -> 2.4x -> 1.0x
        const currentP = c.photos.find((p) => p.id === id)
        const currentZ = currentP?.adjustments?.zoom || 1
        const nextZ = currentZ < 1.3 ? 1.6 : currentZ < 2.0 ? 2.4 : 1.0
        setSelected(id)
        updatePhoto({ zoom: nextZ })
        showHud(`Photo Zoom: ${nextZ.toFixed(1)}x`, "Double-tap to cycle zoom")
        lastTap.current = null
        return
      } else if (!id) {
        // Double-tap on canvas background: reset view
        setZoom(1)
        setPan({ x: 0, y: 0 })
        showHud("Canvas Centered", "100% view restored")
        lastTap.current = null
        return
      }
    }
    lastTap.current = { time: now, id, x: e.clientX, y: e.clientY }

    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // safe ignore on touch devices
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    let currentComposition = c
    if (id) {
      setSelected(id)
      if (id === "frame") {
        if (!currentComposition.frameTransform) {
          currentComposition = {
            ...currentComposition,
            frameTransform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 },
          }
          commit(currentComposition)
        }
      } else if (c.photos.some((p) => p.id === id)) {
        if ((operation === "resize" || operation === "rotate") && currentComposition.mode !== "freeform") {
          currentComposition = enterFreeform(currentComposition, template)
          commit(currentComposition)
          showHud("Switched to Freeform", "Rotate & resize photos freely")
        }
      }
    }

    if (pointers.current.size === 1) {
      gesture.current = {
        before: currentComposition,
        id,
        operation,
        startX: e.clientX,
        startY: e.clientY,
        distance: 0,
        pan,
        zoom,
      }
    } else if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = {
        ...gesture.current,
        before: currentComposition,
        distance: Math.hypot(a.x - b.x, a.y - b.y),
        startX: (a.x + b.x) / 2,
        startY: (a.y + b.y) / 2,
        pan,
        zoom,
      }
    }
  }
  const pointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current
    if (!g || !pointers.current.has(e.pointerId) || !stage.current) return
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const rect = stage.current.getBoundingClientRect()
    let dx = ((e.clientX - g.startX) / rect.width) * 100,
      dy = ((e.clientY - g.startY) / rect.height) * 100,
      scale = 1
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      scale = dist / Math.max(1, g.distance)
      const midX = (a.x + b.x) / 2
      const midY = (a.y + b.y) / 2
      dx = ((midX - g.startX) / rect.width) * 100
      dy = ((midY - g.startY) / rect.height) * 100
    }

    // 1. Canvas View navigation if no layer touched or touchMode is "canvas":
    if (!g.id || touchMode === "canvas") {
      if (pointers.current.size === 2) {
        const nextZoom = Math.max(0.5, Math.min(3.5, Number((g.zoom * scale).toFixed(2))))
        setZoom(nextZoom)
        showHud(`Canvas Zoom: ${Math.round(nextZoom * 100)}%`, "Pinch to zoom strip")
      }
      if (pointers.current.size === 2 || zoom > 1.05 || touchMode === "canvas") {
        const nextPanX = Math.round(g.pan.x + (dx * rect.width) / 100)
        const nextPanY = Math.round(g.pan.y + (dy * rect.height) / 100)
        setPan({ x: nextPanX, y: nextPanY })
        if (pointers.current.size === 1) {
          showHud("Canvas Pan", "Moving photobooth strip")
        }
      }
      return
    }

    // 2. Editing photo, sticker, frame, or text layer:
    const props = orderedLayers(g.before).find((l) => l.id === g.id)?.properties
    if (props?.locked) return

    let rotationDelta = 0
    const bounds = layerBounds(g.id, g.before)
    const centerScreenX = rect.left + ((bounds.x + bounds.width / 2) / 100) * rect.width
    const centerScreenY = rect.top + ((bounds.y + bounds.height / 2) / 100) * rect.height

    if (g.operation === "rotate") {
      const startAngle = Math.atan2(g.startY - centerScreenY, g.startX - centerScreenX) * (180 / Math.PI)
      const currentAngle = Math.atan2(e.clientY - centerScreenY, e.clientX - centerScreenX) * (180 / Math.PI)
      rotationDelta = currentAngle - startAngle
      if (e.shiftKey) {
        const targetRot = bounds.rotation + rotationDelta
        const snappedRot = Math.round(targetRot / 15) * 15
        rotationDelta = snappedRot - bounds.rotation
      }
      const newRot = Math.round(bounds.rotation + rotationDelta)
      showHud(`Rotation: ${newRot}°`, "Drag around center · Shift for 15° steps")
    } else if (g.operation === "resize") {
      const startDist = Math.hypot(g.startX - centerScreenX, g.startY - centerScreenY)
      const currentDist = Math.hypot(e.clientX - centerScreenX, e.clientY - centerScreenY)
      scale = Math.max(0.08, currentDist / Math.max(8, startDist))
      showHud(`Scale: ${Math.round(scale * 100)}%`, "Drag corner away to expand")
    }

    const isTargetPhoto = g.before.photos.some((p) => p.id === g.id)
    if (isTargetPhoto && g.operation === "move") {
      if (pointers.current.size === 2) {
        const origP = g.before.photos.find((p) => p.id === g.id)
        const targetZoom = Math.max(1, Math.min(4, Number(((origP?.adjustments?.zoom || 1) * scale).toFixed(2))))
        showHud(`Photo Zoom: ${targetZoom.toFixed(1)}x`, "Pinch gesture")
      } else {
        showHud("Photo Pan", "Drag to reposition inside frame")
      }
    }

    const centerX = bounds.x + bounds.width / 2 + dx,
      centerY = bounds.y + bounds.height / 2 + dy,
      snapX = Math.abs(centerX - 50) < 1.2,
      snapY = Math.abs(centerY - 50) < 1.2
    if (g.operation === "move" && pointers.current.size === 1) {
      if (snapX) dx += 50 - centerX
      if (snapY) dy += 50 - centerY
      setSnapped({ x: snapX, y: snapY })
    }
    const ids = props?.groupId
      ? orderedLayers(g.before)
          .filter(
            (l) =>
              l.properties.groupId === props.groupId && !l.properties.locked,
          )
          .map((l) => l.id)
      : [g.id]
    let next = g.before
    for (const id of ids)
      next = transformGesture(
        next,
        id,
        g.operation === "resize" || g.operation === "rotate" ? 0 : dx,
        g.operation === "resize" || g.operation === "rotate" ? 0 : dy,
        scale,
        rotationDelta,
      )
    onTransient(next)
  }
  const pointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    pointers.current.delete(e.pointerId)
    if (pointers.current.size === 0 && gesture.current) {
      const g = gesture.current
      if (e.type === "pointercancel") onTransient(g.before)
      else if (g.id && c !== g.before) commit(c, g.before)
      gesture.current = null
      setSnapped({ x: false, y: false })
      if (hudTimeout.current) window.clearTimeout(hudTimeout.current)
      hudTimeout.current = window.setTimeout(() => setGestureHud(null), 800)
    }
  }

  const addSticker = (id: string) => {
    const asset = findSticker(id) ?? allStickers.find((s) => s.id === id) ?? stickers.find((s) => s.id === id)!
    const newId = crypto.randomUUID()
    const rot = stickerPlacementAngle === "random" ? Math.floor(Math.random() * 25) - 12 : stickerPlacementAngle
    commit({
      ...c,
      stickers: [
        ...c.stickers,
        {
          id: newId,
          assetId: id,
          src: asset?.src,
          kind: "star",
          name: asset?.name || "Sticker",
          x: 50,
          y: 50,
          size: 20,
          rotation: rot,
          color: "#a45f59",
        },
      ],
    })
    setSelected(newId)
    setRecentStickers((r) => [id, ...r.filter((x) => x !== id)].slice(0, 20))
  }

  const frameCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "All collections": frames.length }
    for (const f of frames) {
      counts[f.category] = (counts[f.category] || 0) + 1
    }
    return counts
  }, [])

  const stickerPackCounts = useMemo(() => {
    const counts: Record<string, number> = {
      "All packs": allStickers.length,
      Favorites: stickerFavorites.length,
      Recent: recentStickers.length,
    }
    for (const s of allStickers) {
      counts[s.pack] = (counts[s.pack] || 0) + 1
    }
    return counts
  }, [stickerFavorites, recentStickers])

  const filterCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = { "All looks": filterPresets.length }
    for (const p of filterPresets) {
      counts[p.category] = (counts[p.category] || 0) + 1
    }
    return counts
  }, [])

  const templateCategoryCounts = useMemo(() => {
    const list = [
      "All styles",
      "Korean Photo Booth 4-Cut",
      "Scrapbook & Summer Grass 🌿",
      "Romantic Kiss Pose Aesthetic ♡",
      "Propose & Birthday Keepsakes 🎂",
      "Cool & Spider Animated 🕸️",
    ]
    const counts: Record<string, number> = {}
    for (const cat of list) {
      if (cat === "All styles") {
        counts[cat] = templates.length
      } else if (cat === "Scrapbook & Summer Grass 🌿") {
        counts[cat] = templates.filter(
          (t) =>
            t.id.includes("piccollage") ||
            t.tags?.includes("scrapbook") ||
            t.tags?.includes("piccollage") ||
            t.name.toLowerCase().includes("scrapbook"),
        ).length
      } else if (cat === "Korean Photo Booth 4-Cut") {
        counts[cat] = templates.filter(
          (t) =>
            t.category.toLowerCase().includes("korean") ||
            t.category.toLowerCase().includes("booth") ||
            t.tags?.some((tg) => tg.toLowerCase().includes("korean") || tg.toLowerCase().includes("four-cut")),
        ).length
      } else {
        const word = cat.toLowerCase().split(" ")[0]
        counts[cat] = templates.filter(
          (t) =>
            t.category.toLowerCase().includes(word) ||
            t.tags?.some((tg) => tg.toLowerCase().includes(word)),
        ).length
      }
    }
    return counts
  }, [])

  const matchingTemplates = useMemo(() => {
    return templates.filter((t) => {
      if (templateCutFilter !== "all" && t.count !== templateCutFilter) return false
      if (templateSearch.trim()) {
        const q = templateSearch.toLowerCase()
        const match = `${t.name} ${t.category} ${t.tags?.join(" ") ?? ""}`.toLowerCase().includes(q)
        if (!match) return false
      }
      if (templateCategoryFilter === "Scrapbook & Summer Grass 🌿") {
        return (
          t.id.includes("piccollage") ||
          t.tags?.includes("scrapbook") ||
          t.tags?.includes("piccollage") ||
          t.name.toLowerCase().includes("scrapbook")
        )
      }
      if (templateCategoryFilter === "Korean Photo Booth 4-Cut") {
        return (
          t.category.toLowerCase().includes("korean") ||
          t.category.toLowerCase().includes("booth") ||
          t.tags?.some((tg) => tg.toLowerCase().includes("korean") || tg.toLowerCase().includes("four-cut"))
        )
      }
      if (templateCategoryFilter !== "All styles") {
        const filterWord = templateCategoryFilter.toLowerCase().split(" ")[0]
        return (
          t.category.toLowerCase().includes(filterWord) ||
          t.tags?.some((tg) => tg.toLowerCase().includes(filterWord))
        )
      }
      return true
    })
  }, [templateCutFilter, templateSearch, templateCategoryFilter])

  const matchingFilters = useMemo(() => {
    return filterPresets.filter((p) => {
      if (filterCategory !== "All looks" && p.category !== filterCategory) return false
      if (filterSearch.trim()) {
        const q = filterSearch.toLowerCase()
        return `${p.name} ${p.category} ${p.description}`.toLowerCase().includes(q)
      }
      return true
    })
  }, [filterCategory, filterSearch])

  const matchingFrames = frames
    .filter(
      (f) =>
        f.supportedCounts.includes(template.count) &&
        (!showFavorites || favorites.includes(f.id)) &&
        (!showRecent || recent.includes(f.id)) &&
        (category === "All collections" || f.category === category) &&
        (colorFilter === "Any color" ||
          (colorFilter === "Dark"
            ? f.background === "#25262a"
            : f.background !== "#25262a")) &&
        `${f.name} ${f.tags.join(" ")}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    )
    .sort((a, b) =>
      sort === "A–Z"
        ? a.name.localeCompare(b.name)
        : sort === "Recently used"
          ? (recent.includes(a.id) ? recent.indexOf(a.id) : 999) -
            (recent.includes(b.id) ? recent.indexOf(b.id) : 999)
          : 0,
    )
  const matchingStickers = allStickers.filter(
    (s) =>
      (pack === "All packs" ||
        (pack === "Favorites" && stickerFavorites.includes(s.id)) ||
        (pack === "Recent" && recentStickers.includes(s.id)) ||
        s.pack === pack) &&
      `${s.name} ${s.tags.join(" ")}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  )
  const resetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }
  return (
    <section className="creative-studio">
      <input
        ref={importInput}
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={(e) => void importPhotos(e.target.files)}
      />
      <input
        ref={stickerInput}
        type="file"
        multiple
        accept="image/*"
        hidden
        onChange={(e) => void importPhotos(e.target.files, true)}
      />
      <div className="studio-projectbar">
        <div>
          <span className="project-icon">
            <Layers size={19} />
          </span>
          <div>
            <strong>My little masterpiece</strong>
            <span
              className={`save-state ${
                saveStatus === "Save failed" ? "error" : ""
              }`}
            >
              <i />
              {saveStatus}
            </span>
          </div>
        </div>
        <div>
          <button className="studio-small-button" onClick={onSave}>
            Save project
          </button>
          <button className="button primary" onClick={onDone}>
            <Download size={16} />
            Export
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
      <div
        ref={studioBodyRef}
        className="studio-body"
        style={{
          "--studio-inspector-width": `${inspectorWidth}px`,
        } as CSSProperties}
      >
        <div className="studio-workbench">
          <div className="canvas-topline">
            <div className="mode-switch">
              <button
                className={c.mode !== "freeform" ? "active" : ""}
                onClick={() => {
                  if (c.photos.length !== template.count) {
                    notify(
                      "Choose a compatible layout first. All photos will be kept.",
                    )
                    setPanel("Grid")
                    return
                  }
                  commit({ ...c, mode: "guided" })
                }}
              >
                Guided
              </button>
              <button
                className={c.mode === "freeform" ? "active" : ""}
                onClick={() => commit(enterFreeform(c, template))}
              >
                Freeform <Sparkles size={11} />
              </button>
            </div>
            <button
              className={`studio-small-button ${safe ? "on" : ""}`}
              onClick={() => setSafe(!safe)}
            >
              <Grid2X2 size={13} />
              Safe area
            </button>
            <button
              className="studio-icon"
              aria-label="Fit canvas"
              onClick={resetView}
            >
              <Maximize size={17} />
            </button>
          </div>
          <div
            ref={viewportRef}
            className="canvas-viewport relative"
            onPointerDown={pointerDown}
            onPointerMove={pointerMove}
            onPointerUp={pointerEnd}
            onPointerCancel={pointerEnd}
          >
            {/* Native APK Live Gesture HUD */}
            {gestureHud && (
              <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-stone-900/95 text-white px-4 py-1.5 rounded-full shadow-2xl text-xs font-mono font-bold tracking-wide z-30 pointer-events-none flex items-center gap-2 border border-white/20 backdrop-blur-md transition-all">
                <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
                <span>{gestureHud.text}</span>
                {gestureHud.sub && (
                  <span className="text-stone-300 font-normal text-[10.5px]">· {gestureHud.sub}</span>
                )}
              </div>
            )}

            <div
              className="canvas-paper-shadow"
              style={
                {
                  width: `${canvasFit.width}px`,
                  height: `${canvasFit.height}px`,
                  aspectRatio: `${canvasFit.aspect}`,
                  transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
                  transformOrigin: "center center",
                } as CSSProperties
              }
            >
              <div
                ref={stage}
                className="touch-canvas"
                style={{
                  width: "100%",
                  height: "100%",
                  aspectRatio: `${canvasFit.aspect}`,
                }}
              >
                <StudioPreview composition={visible} />
                {layers
                  .filter((l) => (l.kind !== "frame" || (c.frameId && (selected === "frame" || tool === "Frames"))) && !l.properties.hidden)
                  .map((l) => {
                    const b = layerBounds(l.id)
                    const isSelected = selected === l.id && !compare
                    return (
                      <div
                        key={l.id}
                        data-layer={l.id}
                        className={`canvas-hit ${
                          isSelected ? "selected" : ""
                        } ${l.properties.locked ? "locked" : ""}`}
                        style={{
                          left: `${b.x}%`,
                          top: `${b.y}%`,
                          width: `${b.width}%`,
                          height: `${b.height}%`,
                          transform: `rotate(${b.rotation}deg)`,
                          zIndex: isSelected ? 50 : layers.indexOf(l) + 1,
                          pointerEvents: l.kind === "frame" && !isSelected ? "none" : "auto",
                        }}
                      >
                        {isSelected && (
                          <>
                            <span className="selection-tag">
                              {l.properties.locked
                                ? "Locked"
                                : l.kind === "photo"
                                  ? `Photo ${c.photos.findIndex((p) => p.id === l.id) + 1}`
                                  : l.kind === "frame"
                                    ? "Decorative Frame"
                                    : l.label.slice(0, 22)}
                            </span>
                            {!l.properties.locked && (
                              <>
                                <button
                                  data-operation="resize"
                                  data-handle="se"
                                  aria-label="Drag to resize selected layer"
                                  className="selection-resize handle-se"
                                />
                                <button
                                  data-operation="resize"
                                  data-handle="ne"
                                  aria-label="Drag to resize selected layer"
                                  className="selection-resize handle-ne"
                                />
                                <button
                                  data-operation="resize"
                                  data-handle="sw"
                                  aria-label="Drag to resize selected layer"
                                  className="selection-resize handle-sw"
                                />
                                <button
                                  data-operation="resize"
                                  data-handle="nw"
                                  aria-label="Drag to resize selected layer"
                                  className="selection-resize handle-nw"
                                />
                                <div className="selection-rotate-stem" />
                                <button
                                  data-operation="rotate"
                                  aria-label="Drag to rotate selected layer"
                                  className="selection-rotate"
                                  title="Drag to rotate layer"
                                >
                                  <RotateCcw size={11} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                {/* Empty slot placeholders for guided mode or templates */}
                {c.mode !== "freeform" && (() => {
                  const activeLayout = c.gridLayoutId ? findGridLayout(c.gridLayoutId) : null
                  const activeSlots = activeLayout
                    ? activeLayout.getSlots(c.spacing ?? 2, c.padding ?? 4)
                    : template.slots
                  const emptySlots = activeSlots.slice(c.photos.length)
                  return emptySlots.map((slot, idx) => {
                    const slotIndex = c.photos.length + idx
                    return (
                      <div
                        key={`empty-slot-${slotIndex}`}
                        className="empty-slot-placeholder"
                        style={{
                          left: `${slot.x}%`,
                          top: `${slot.y}%`,
                          width: `${slot.width}%`,
                          height: `${slot.height}%`,
                          transform: slot.rotation ? `rotate(${slot.rotation}deg)` : undefined,
                          position: "absolute",
                        }}
                        onClick={() => {
                          setReplacing(false)
                          importInput.current?.click()
                        }}
                        title={`Click to add photo to Slot ${slotIndex + 1}`}
                      >
                        <Plus size={22} className="text-stone-400 group-hover:text-stone-700" />
                        <span className="text-[11px] font-mono text-stone-600 font-bold">
                          Slot {slotIndex + 1}
                        </span>
                        <span className="text-[10px] text-stone-400 font-sans">
                          + Tap to add
                        </span>
                      </div>
                    )
                  })
                })()}
                {safe && (
                  <div className="safe-guides">
                    <span>SOCIAL SAFE AREA</span>
                  </div>
                )}
                {snapped.x && <div className="snap-guide vertical" />}
                {snapped.y && <div className="snap-guide horizontal" />}
              </div>
            </div>

            {/* Floating Quick-Tools Rail on Canvas Right Edge (Blueprint Screen 8) */}
            <div className="studio-floating-rail" role="toolbar" aria-label="Quick Canvas Tools">
              <button
                type="button"
                className={`studio-floating-btn ${showLayersModal ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setShowLayersModal(!showLayersModal)
                }}
                title="Layers Panel (Floating)"
                aria-label="Toggle Layers"
              >
                <Layers size={17} />
                <span className="floating-btn-label">Layers</span>
                <span className="floating-btn-badge">{layers.length}</span>
              </button>

              <button
                type="button"
                className="studio-floating-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  if (photo) {
                    const nextFit = photo.adjustments.fit === "fit" ? "fill" : "fit"
                    updatePhoto({ fit: nextFit })
                    notify(`Photo fit: ${nextFit}`)
                  } else {
                    notify("Tap any photo to adjust fit/crop")
                  }
                }}
                title="Toggle Photo Fit/Fill Crop"
                aria-label="Crop / Fit"
              >
                <Crop size={17} />
                <span className="floating-btn-label">Crop</span>
              </button>

              <button
                type="button"
                className={`studio-floating-btn ${safe ? "active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation()
                  setSafe(!safe)
                }}
                title="Toggle Safe Guides"
                aria-label="Safe Area"
              >
                <Grid2X2 size={17} />
                <span className="floating-btn-label">Safe</span>
              </button>

              <button
                type="button"
                className="studio-floating-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  resetView()
                }}
                title="Fit to Center"
                aria-label="Fit Canvas"
              >
                <Maximize size={17} />
                <span className="floating-btn-label">Fit</span>
              </button>
            </div>

            {/* Floating Layers Panel Card (Reference Image 5 & Blueprint Screen 8) */}
            {showLayersModal && (
              <div
                className="floating-layers-card"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-label="Floating Layers Panel"
              >
                {/* Header */}
                <div className="layers-card-header">
                  <div className="flex items-center gap-2">
                    <Layers size={16} className="text-cyan-400" />
                    <span className="font-mono text-xs font-bold text-white tracking-wide">
                      Layers
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">
                      ({layers.length})
                    </span>
                  </div>
                  <button
                    type="button"
                    className="w-6 h-6 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition-colors cursor-pointer"
                    onClick={() => setShowLayersModal(false)}
                    aria-label="Close Layers"
                  >
                    <X size={13} />
                  </button>
                </div>

                {/* Layer Items List (Reversed so top-most visual layer is at top) */}
                <div className="layers-card-list">
                  {[...layers].reverse().map((l, revIdx) => {
                    const originalIdx = layers.length - 1 - revIdx
                    const isSelected = selected === l.id && !compare
                    const photoItem = l.kind === "photo" ? c.photos.find((p) => p.id === l.id) : null
                    const stickerItem = l.kind === "sticker" ? c.stickers.find((s) => s.id === l.id) : null

                    return (
                      <div
                        key={l.id}
                        className={`layer-item-card ${isSelected ? "selected-cyan" : ""}`}
                        onClick={() => setSelected(l.id)}
                      >
                        {/* Thumbnail with checkered transparency pattern */}
                        <div className="layer-thumb-container">
                          {photoItem?.src ? (
                            <img src={photoItem.src} alt={l.label} className="w-full h-full object-cover rounded" />
                          ) : stickerItem?.src ? (
                            <img src={stickerItem.src} alt="sticker" className="w-full h-full object-contain p-1" />
                          ) : l.kind === "text" ? (
                            <div className="w-full h-full flex items-center justify-center text-cyan-400 font-bold font-mono text-sm bg-stone-900/80">
                              T
                            </div>
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-amber-400 bg-stone-900/80">
                              <Frame size={16} />
                            </div>
                          )}
                        </div>

                        {/* Title & Badge */}
                        <div className="layer-meta">
                          <span className="layer-label truncate">{l.label}</span>
                          <span className="layer-type">{l.kind}</span>
                        </div>

                        {/* Toggles & Reorder */}
                        <div className="layer-actions flex items-center gap-1">
                          <button
                            type="button"
                            className={`layer-toggle-btn ${l.properties.hidden ? "is-off" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              commit(patchLayer(c, l.id, { hidden: !l.properties.hidden }))
                            }}
                            title={l.properties.hidden ? "Show layer" : "Hide layer"}
                          >
                            {l.properties.hidden ? <EyeOff size={13} /> : <Eye size={13} />}
                          </button>

                          <button
                            type="button"
                            className={`layer-toggle-btn ${l.properties.locked ? "is-locked" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation()
                              commit(patchLayer(c, l.id, { locked: !l.properties.locked }))
                            }}
                            title={l.properties.locked ? "Unlock layer" : "Lock layer"}
                          >
                            {l.properties.locked ? <LockKeyhole size={13} /> : <UnlockKeyhole size={13} />}
                          </button>

                          <div className="flex flex-col ml-0.5">
                            <button
                              type="button"
                              disabled={originalIdx >= layers.length - 1}
                              className="reorder-arrow disabled:opacity-20"
                              onClick={(e) => {
                                e.stopPropagation()
                                commit(moveLayer(c, l.id, originalIdx + 1))
                              }}
                              title="Move Forward"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              disabled={originalIdx <= 0}
                              className="reorder-arrow disabled:opacity-20"
                              onClick={(e) => {
                                e.stopPropagation()
                                commit(moveLayer(c, l.id, originalIdx - 1))
                              }}
                              title="Move Backward"
                            >
                              ▼
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Opacity Control Slider (Matching Reference Image 5) */}
                <div className="layers-card-opacity">
                  <div className="flex justify-between items-center text-[11px] font-mono mb-1.5 text-stone-300">
                    <span className="font-bold">Opacity</span>
                    <span className="text-cyan-400 font-bold font-mono">
                      {Math.round((layer?.properties.opacity ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={Math.round((layer?.properties.opacity ?? 1) * 100)}
                    onChange={(e) => {
                      const val = Number(e.target.value) / 100
                      if (selected) {
                        commit(patchLayer(c, selected, { opacity: val }))
                      }
                    }}
                    className="w-full accent-cyan-400 h-1.5 bg-stone-700 rounded cursor-pointer"
                  />
                </div>

                {/* Bottom Quick Tools Row (Duplicate, Delete, Replace, Rotate) */}
                <div className="layers-card-footer">
                  <button
                    type="button"
                    disabled={!selected}
                    className="layer-footer-btn"
                    onClick={() => {
                      if (!selected) return
                      const newId = crypto.randomUUID()
                      commit(duplicateLayer(c, selected, newId))
                      setSelected(newId)
                      notify("Layer duplicated")
                    }}
                    title="Duplicate Layer"
                  >
                    <Copy size={13} />
                    <span>Copy</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selected}
                    className="layer-footer-btn"
                    onClick={() => {
                      if (!selected) return
                      if (photo) {
                        setReplacing(true)
                        importInput.current?.click()
                      } else {
                        stickerInput.current?.click()
                      }
                    }}
                    title="Replace with new file"
                  >
                    <ImagePlus size={13} />
                    <span>Replace</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selected}
                    className="layer-footer-btn"
                    onClick={() => {
                      if (!selected) return
                      if (photo) {
                        const cur = photo.adjustments.rotation || 0
                        updatePhoto({ rotation: (cur + 90) % 360 })
                      } else {
                        const b = layerBounds(selected)
                        commit(patchLayer(c, selected, { transform: { ...b, rotation: (b.rotation + 90) % 360 } }))
                      }
                    }}
                    title="Rotate 90°"
                  >
                    <RotateCw size={13} />
                    <span>Rotate</span>
                  </button>

                  <button
                    type="button"
                    disabled={!selected}
                    className="layer-footer-btn text-rose-400 hover:text-rose-300"
                    onClick={() => {
                      if (!selected) return
                      commit(deleteLayer(c, selected))
                      setSelected("")
                      notify("Layer deleted")
                    }}
                    title="Delete Layer"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}
          </div>
          <div className="canvas-bottomline flex flex-wrap items-center justify-between gap-1.5 px-3 py-2 bg-stone-100 border-t border-stone-300">
            {/* Mode switch & gesture info */}
            <div className="flex items-center gap-1.5">
              <div className="flex items-center bg-stone-200 p-0.5 rounded border border-stone-300">
                <button
                  type="button"
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                    touchMode === "photo"
                      ? "bg-rose-900 text-white shadow-xs"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                  onClick={() => {
                    setTouchMode("photo")
                    showHud("Photo Pan/Zoom Active", "Drag photo to recrop · Pinch to zoom")
                  }}
                  title="Drag photo to recrop · Pinch to zoom"
                >
                  <Crop size={10} />
                  <span>Photo Gesture</span>
                </button>
                <button
                  type="button"
                  className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all flex items-center gap-1 ${
                    touchMode === "canvas"
                      ? "bg-stone-900 text-white shadow-xs"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                  onClick={() => {
                    setTouchMode("canvas")
                    showHud("Canvas Pan/Zoom Active", "Drag to pan strip · Pinch to zoom canvas")
                  }}
                  title="Drag to pan strip · Pinch to zoom canvas"
                >
                  <Maximize size={10} />
                  <span>Canvas View</span>
                </button>
              </div>

              <span className="text-[10px] text-stone-500 font-mono hidden sm:inline">
                {touchMode === "photo" ? "Pinch photo · drag to center" : "Pinch canvas · drag to pan"}
              </span>
            </div>

            {/* Quick zoom controls */}
            <div className="flex items-center gap-1">
              {photo && touchMode === "photo" ? (
                <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-stone-300 shadow-xs">
                  <span className="text-[9.5px] font-mono text-stone-500 font-bold mr-0.5">PHOTO</span>
                  <button
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-100 text-stone-700 active:scale-95"
                    aria-label="Zoom photo out"
                    onClick={() => {
                      const z = Math.max(1, Number(((photo.adjustments?.zoom || 1) - 0.2).toFixed(1)))
                      updatePhoto({ zoom: z })
                      showHud(`Photo Zoom: ${z.toFixed(1)}x`)
                    }}
                  >
                    <Minus size={11} />
                  </button>
                  <span className="text-[10.5px] font-mono font-black min-w-[28px] text-center text-rose-900">
                    {(photo.adjustments?.zoom || 1).toFixed(1)}x
                  </span>
                  <button
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-100 text-stone-700 active:scale-95"
                    aria-label="Zoom photo in"
                    onClick={() => {
                      const z = Math.min(4, Number(((photo.adjustments?.zoom || 1) + 0.2).toFixed(1)))
                      updatePhoto({ zoom: z })
                      showHud(`Photo Zoom: ${z.toFixed(1)}x`)
                    }}
                  >
                    <Plus size={11} />
                  </button>
                  <button
                    className="px-1.5 py-0.5 text-[9px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded ml-1"
                    onClick={() => {
                      updatePhoto({ offsetX: 0, offsetY: 0, zoom: 1 })
                      showHud("Photo Reset", "Centered in frame")
                    }}
                  >
                    Reset
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-stone-300 shadow-xs">
                  <span className="text-[9.5px] font-mono text-stone-500 font-bold mr-0.5">STRIP</span>
                  <button
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-100 text-stone-700 active:scale-95"
                    aria-label="Zoom out"
                    onClick={() => {
                      const z = Math.max(0.5, Number((zoom - 0.25).toFixed(2)))
                      setZoom(z)
                      showHud(`Canvas Zoom: ${Math.round(z * 100)}%`)
                    }}
                  >
                    <Minus size={11} />
                  </button>
                  <button
                    className="text-[10.5px] font-mono font-bold px-1 min-w-[34px] text-center hover:underline"
                    onClick={resetView}
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    className="w-5 h-5 flex items-center justify-center rounded hover:bg-stone-100 text-stone-700 active:scale-95"
                    aria-label="Zoom in"
                    onClick={() => {
                      const z = Math.min(3, Number((zoom + 0.25).toFixed(2)))
                      setZoom(z)
                      showHud(`Canvas Zoom: ${Math.round(z * 100)}%`)
                    }}
                  >
                    <Plus size={11} />
                  </button>
                  <button
                    className="px-1.5 py-0.5 text-[9px] font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded ml-1"
                    onClick={resetView}
                  >
                    Fit
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* PicCollage canvas action buttons */}
          <div className="piccollage-canvas-actions">
            <button
              type="button"
              className="piccollage-canvas-btn btn-secondary"
              onClick={() => {
                setReplacing(false)
                importInput.current?.click()
              }}
            >
              <ImagePlus size={16} />
              <span>Add More Photos</span>
            </button>
            <button
              type="button"
              className="piccollage-canvas-btn btn-primary"
              onClick={onSave}
              title="Save high-resolution collage"
            >
              <Download size={16} />
              <span>Save Image</span>
            </button>
          </div>

          <div className="studio-photo-dock">
            <div className="photo-dock-title">
              <span>
                YOUR MOMENTS <b>{c.photos.length}</b>
              </span>
              <button
                onClick={() => {
                  setReplacing(false)
                  importInput.current?.click()
                }}
              >
                <ImagePlus size={14} />
                Add photos
              </button>
            </div>
            <div className="dock-photos">
              {c.photos.map((p, i) => {
                const isSelected = selected === p.id
                const isSwapTarget = swapTarget === p.id
                return (
                  <div key={p.id} className="relative group flex-shrink-0">
                    <button
                      type="button"
                      className={`${isSelected ? "selected" : ""} ${isSwapTarget ? "ring-2 ring-amber-500 scale-105" : ""}`}
                      onClick={() => {
                        if (swapTarget && swapTarget !== p.id) {
                          swapPhotos(swapTarget, p.id)
                        } else {
                          setSelected(p.id)
                        }
                      }}
                    >
                      <img src={p.src} alt={`Select photo ${i + 1}`} />
                      <span>{String(i + 1).padStart(2, "0")}</span>
                    </button>
                    {isSelected && (
                      <button
                        type="button"
                        className="dock-swap-btn"
                        title={swapTarget === p.id ? "Cancel swap" : "Swap photo position"}
                        aria-label="Swap position with another photo"
                        onClick={(e) => {
                          e.stopPropagation()
                          const nextTarget = swapTarget === p.id ? null : p.id
                          setSwapTarget(nextTarget)
                          if (nextTarget) {
                            notify("Tap another photo in the dock to swap positions")
                          }
                        }}
                      >
                        ⇄
                      </button>
                    )}
                  </div>
                )
              })}
              <button
                className="dock-add"
                aria-label="Add photographs"
                onClick={() => {
                  setReplacing(false)
                  importInput.current?.click()
                }}
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
          {layer && (
            <div className="context-actions">
              <span>{layer.label.slice(0, 25)}</span>
              <button
                aria-label="Duplicate selected layer"
                disabled={layer.kind === "frame" || layer.properties.locked}
                onClick={() => {
                  const id = crypto.randomUUID()
                  const base =
                    c.mode === "freeform" ? c : enterFreeform(c, template)
                  commit(duplicateLayer(base, selected, id))
                  setSelected(id)
                }}
              >
                <Copy size={15} />
              </button>
              <button
                aria-label={
                  layer.properties.locked ? "Unlock layer" : "Lock layer"
                }
                onClick={() =>
                  updateLayer({ locked: !layer.properties.locked })
                }
              >
                {layer.properties.locked ? (
                  <UnlockKeyhole size={15} />
                ) : (
                  <LockKeyhole size={15} />
                )}
              </button>
              <button
                aria-label="Bring layer forward"
                onClick={() => commit(moveLayer(c, selected, 1))}
              >
                <ArrowUp size={15} />
              </button>
              <button
                aria-label="Send layer backward"
                onClick={() => commit(moveLayer(c, selected, -1))}
              >
                <ArrowDown size={15} />
              </button>
              <button
                aria-label="Delete selected layer"
                title="Delete layer"
                disabled={layer.properties.locked}
                onClick={() => {
                  commit(deleteLayer(c, selected))
                  setSelected("")
                }}
              >
                <Trash2 size={15} />
              </button>
              <button
                aria-label="Open layer settings"
                onClick={() => setPanel("Layers")}
              >
                <SlidersHorizontal size={15} />
              </button>
            </div>
          )}

          {/* Mobile Bottom Tool Dock (Blueprint Screen 8 & Reference Image 3/4) */}
          <div className="studio-mobile-dock lg:hidden" role="toolbar" aria-label="Mobile Tool Dock">
            {[
              { name: "Grid", icon: Grid2X2, label: "Grid" },
              { name: "Templates", icon: Sparkles, label: "Templates" },
              { name: "Adjust", icon: SlidersHorizontal, label: "Adjust" },
              { name: "Filters", icon: WandSparkles, label: "Filter" },
              { name: "Text", icon: Type, label: "Text" },
              { name: "Background", icon: Paintbrush, label: "Background" },
              { name: "Stickers", icon: Sticker, label: "Stickers" },
            ].map(({ name, icon: Icon, label }) => {
              const isActive = activeMobileDrawer === name
              return (
                <button
                  key={name}
                  type="button"
                  className={`mobile-dock-btn ${isActive ? "active" : ""}`}
                  onClick={() => {
                    if (activeMobileDrawer === name) {
                      setActiveMobileDrawer(null)
                    } else {
                      setPanel(name)
                      setActiveMobileDrawer(name)
                      if (["Adjust", "Filters"].includes(name)) selectPhoto()
                    }
                  }}
                  title={label}
                >
                  <div className="mobile-dock-icon-wrapper">
                    <Icon size={18} />
                  </div>
                  <span className="mobile-dock-label">{label}</span>
                </button>
              )
            })}
          </div>
        </div>

        <aside
          className={`studio-inspector ${activeMobileDrawer ? "drawer-open" : ""}`}
          style={{
            "--studio-inspector-width": `${inspectorWidth}px`,
          } as CSSProperties}
        >
          {/* Mobile Bottom Sheet Drawer Header (Blueprint Screen 9) */}
          <div className="mobile-drawer-header lg:hidden">
            <div
              className="mobile-drawer-pill"
              onClick={() => setActiveMobileDrawer(null)}
              title="Tap or drag to close drawer"
            />
            <div className="mobile-drawer-title-bar">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                <span className="font-mono text-xs font-bold text-stone-900 uppercase tracking-wide">
                  {tool}
                </span>
                <span className="text-[10px] text-stone-500 font-mono">
                  · Choose Option
                </span>
              </div>
              <button
                type="button"
                className="w-7 h-7 rounded-full bg-stone-200 hover:bg-stone-300 flex items-center justify-center text-stone-800 transition-colors cursor-pointer"
                onClick={() => setActiveMobileDrawer(null)}
                aria-label="Dismiss Drawer"
                title="Dismiss Drawer"
              >
                <ChevronDown size={16} />
              </button>
            </div>
          </div>
          {/* Draggable sidebar resizer handle */}
          <div
            className={`studio-resizer ${isResizing ? "resizing" : ""}`}
            onPointerDown={onResizerPointerDown}
            onPointerMove={onResizerPointerMove}
            onPointerUp={onResizerPointerUp}
            onPointerCancel={onResizerPointerUp}
            title="Drag left/right to resize sidebar. Double-click to reset (460px)."
            onDoubleClick={() => setInspectorWidth(460)}
          >
            <div className="studio-resizer-line" />
            <div className="studio-resizer-handle">
              <GripVertical size={13} />
            </div>
            {isResizing && (
              <div className="studio-resizer-badge">
                {inspectorWidth}px
              </div>
            )}
          </div>
          <nav className="studio-rail studio-tools" aria-label="Editing tools">
            {tools.map(({ name, icon: Icon }) => (
              <button
                className={`rail-item ${tool === name ? "active" : ""}`}
                key={name}
                onClick={() => {
                  setPanel(name)
                  if (["Adjust", "Filters"].includes(name)) selectPhoto()
                }}
              >
                <Icon size={18} />
                <span>{name}</span>
              </button>
            ))}
            <button
              type="button"
              className={`rail-item rail-resize-btn ${inspectorWidth >= 560 ? "active" : ""}`}
              onClick={() => setInspectorWidth((w) => (w >= 560 ? 360 : w <= 400 ? 460 : 620))}
              title={inspectorWidth >= 560 ? "Collapse to compact (360px)" : "Expand sidebar (620px)"}
            >
              <Maximize size={16} />
              <span>{inspectorWidth >= 560 ? "Narrow" : "Widen"}</span>
            </button>
          </nav>
          <div className="studio-panel">
            <div className="inspector-heading">
            <div>
              <span className="eyebrow">YOUR CREATIVE TOOLKIT</span>
              <h2>
                {tool === "Frames"
                  ? "Find your finishing touch."
                  : tool === "Filters"
                    ? "A feeling for every frame."
                    : tool === "Adjust"
                      ? "Bring out the good light."
                      : tool === "Layers"
                        ? "Every little piece."
                        : tool === "Stickers"
                          ? "Little things. Big personality."
                          : tool === "Grid"
                            ? "Dynamic grids & aspect ratios."
                            : tool === "Templates"
                              ? "Scrapbook & photo designs."
                            : tool === "Text"
                              ? "Put it into words."
                              : "Set the scene."}
              </h2>
            </div>
            <div className="inspector-header-right">
              <span className="hand hidden sm:inline">make it yours</span>
              <div className="inspector-width-presets" title="Quick panel width">
                <button
                  type="button"
                  className={`width-preset-btn ${inspectorWidth <= 390 ? "active" : ""}`}
                  onClick={() => setInspectorWidth(360)}
                  title="Compact width (360px)"
                >
                  360px
                </button>
                <button
                  type="button"
                  className={`width-preset-btn ${inspectorWidth > 390 && inspectorWidth <= 520 ? "active" : ""}`}
                  onClick={() => setInspectorWidth(460)}
                  title="Medium width (460px)"
                >
                  460px
                </button>
                <button
                  type="button"
                  className={`width-preset-btn ${inspectorWidth > 520 ? "active" : ""}`}
                  onClick={() => setInspectorWidth(620)}
                  title="Wide width (620px)"
                >
                  620px
                </button>
              </div>
            </div>
          </div>
          <div className="inspector-body">
            {tool === "Frames" && (
              <>
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-800 gap-2 flex-wrap text-xs font-mono">
                  <span className="text-amber-400 text-[10px] uppercase font-bold tracking-wider">
                    {frames.length} Frame Recipes · {matchingFrames.length} Matching
                  </span>
                  <div className="preview-mode-group">
                    <button
                      type="button"
                      className={`preview-mode-btn ${colorFilter === "Any color" ? "active-grid" : ""}`}
                      onClick={() => setColorFilter("Any color")}
                    >
                      All
                    </button>
                    <button
                      type="button"
                      className={`preview-mode-btn ${colorFilter === "Light" ? "active-light" : ""}`}
                      onClick={() => setColorFilter("Light")}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      className={`preview-mode-btn ${colorFilter === "Dark" ? "active-dark" : ""}`}
                      onClick={() => setColorFilter("Dark")}
                    >
                      Dark
                    </button>
                  </div>
                </div>

                {/* Search Bar */}
                <div className="studio-search-bar">
                  <Search size={14} className="search-icon" />
                  <input
                    aria-label="Search frames"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search lace, film, notebook, arcade, frames..."
                  />
                  {search && (
                    <button
                      type="button"
                      className="clear-btn"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category Pill Chips Scroller */}
                <div className="studio-chip-scroller">
                  {["All collections", ...frameCategories].map((cat) => {
                    const count = frameCategoryCounts[cat] ?? 50
                    const label = cat === "All collections" ? "All styles" : cat.split(" and ")[0]
                    return (
                      <button
                        key={cat}
                        type="button"
                        className={`studio-pill-chip ${category === cat ? "active" : ""}`}
                        onClick={() => setCategory(cat)}
                      >
                        <span>{label}</span>
                        <span className="studio-pill-badge">({count})</span>
                      </button>
                    )
                  })}
                </div>

                {/* Filter / Sort bar */}
                <div className="flex items-center justify-between gap-1.5 text-xs font-mono">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className={`studio-pill-chip ${showFavorites ? "active" : ""}`}
                      onClick={() => setShowFavorites(!showFavorites)}
                    >
                      <Heart size={11} fill={showFavorites ? "currentColor" : "none"} />
                      Saved ({favorites.length})
                    </button>
                    <button
                      type="button"
                      className={`studio-pill-chip ${showRecent ? "active" : ""}`}
                      onClick={() => setShowRecent(!showRecent)}
                    >
                      Recent ({recent.length})
                    </button>
                  </div>
                  <select
                    aria-label="Sort frames"
                    className="bg-stone-900 border border-stone-800 text-stone-300 text-[11px] rounded px-2 py-1 outline-none font-mono focus:border-amber-400"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option>Collection</option>
                    <option>A–Z</option>
                    <option>Recently used</option>
                  </select>
                </div>

                {/* Continuous Scrollable 2-Column Grid (NO PAGINATION ARROWS!) */}
                <div className="studio-continuous-grid cols-2">
                  {matchingFrames.map((f) => (
                    <article
                      className={`studio-dark-frame-card ${
                        (frameCandidate?.id ?? c.frameId) === f.id ? "active" : ""
                      }`}
                      key={f.id}
                    >
                      <button
                        type="button"
                        className="frame-card-trigger"
                        onClick={() => setFrameCandidate(f)}
                      >
                        <div
                          className="frame-card-preview"
                          style={{ background: f.background }}
                        >
                          <div className="frame-photos">
                            {c.photos.slice(0, 4).map((p) => (
                              <img src={p.src} key={p.id} alt="" loading="lazy" />
                            ))}
                          </div>
                          <img
                            className="frame-svg"
                            src={f.preview}
                            alt=""
                            loading="lazy"
                          />
                        </div>
                        <div className="frame-card-info">
                          <strong>{f.name.split(" · ")[0]}</strong>
                          <span>{f.name.split(" · ")[1]}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        className={`frame-card-fav ${
                          favorites.includes(f.id) ? "active" : ""
                        }`}
                        aria-label={`Favorite ${f.name}`}
                        onClick={() =>
                          setFavorites((x) =>
                            x.includes(f.id)
                              ? x.filter((id) => id !== f.id)
                              : [...x, f.id],
                          )
                        }
                      >
                        <Heart
                          size={12}
                          fill={
                            favorites.includes(f.id) ? "currentColor" : "none"
                          }
                        />
                      </button>
                    </article>
                  ))}
                  {!matchingFrames.length && (
                    <div className="col-span-2 py-8 text-center text-stone-400 text-xs font-mono">
                      No frames match "{search}". Try another collection or clear search.
                    </div>
                  )}
                </div>

                {/* Frame Customization Controls */}
                <div className="studio-dark-section mt-1">
                  <span className="text-[10px] uppercase font-bold text-amber-400 font-mono tracking-wider">
                    INK COLOR & PALETTE
                  </span>
                  <Swatches
                    value={frameCandidate?.color ?? c.frameColor ?? "#a45f59"}
                    onChange={(v) =>
                      frameCandidate
                        ? setFrameCandidate({ ...frameCandidate, color: v })
                        : commit({ ...c, frameColor: v })
                    }
                  />
                  <Range
                    label="Frame opacity"
                    value={(c.frameOpacity ?? 1) * 100}
                    onChange={(v) => commit({ ...c, frameOpacity: v / 100 })}
                    onReset={() => commit({ ...c, frameOpacity: 1 })}
                  />
                  <Range
                    label="Border width"
                    value={c.borderWidth}
                    max={30}
                    onChange={(v) => commit({ ...c, borderWidth: v })}
                    onReset={() => commit({ ...c, borderWidth: 10 })}
                  />
                  <Range
                    label="Photo spacing"
                    value={c.spacing}
                    max={20}
                    onChange={(v) => commit({ ...c, spacing: v })}
                    onReset={() => commit({ ...c, spacing: 3 })}
                  />
                  <Range
                    label="Corner radius"
                    value={c.radius}
                    max={35}
                    onChange={(v) => commit({ ...c, radius: v })}
                    onReset={() => commit({ ...c, radius: 0 })}
                  />
                  {c.frameId && (
                    <div className="pt-2 border-t border-stone-800 mt-2 space-y-2">
                      <span className="text-[10px] uppercase font-bold text-amber-400 font-mono tracking-wider">
                        FRAME ROTATION & SCALE
                      </span>
                      <Range
                        label="Frame scale"
                        value={Math.round(c.frameTransform?.width ?? 100)}
                        min={20}
                        max={200}
                        onChange={(v) => {
                          const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                          const scale = v / 100
                          const newW = Number((100 * scale).toFixed(2))
                          const newH = Number((100 * scale).toFixed(2))
                          commit({
                            ...c,
                            frameTransform: {
                              ...ft,
                              x: Number((50 - newW / 2).toFixed(2)),
                              y: Number((50 - newH / 2).toFixed(2)),
                              width: newW,
                              height: newH,
                            },
                          })
                        }}
                        onReset={() => {
                          const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                          commit({ ...c, frameTransform: { ...ft, x: 0, y: 0, width: 100, height: 100 } })
                        }}
                      />
                      <Range
                        label="Frame rotation"
                        value={c.frameTransform?.rotation ?? 0}
                        min={-180}
                        max={180}
                        onChange={(v) => {
                          const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                          commit({ ...c, frameTransform: { ...ft, rotation: v } })
                        }}
                        onReset={() => {
                          const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                          commit({ ...c, frameTransform: { ...ft, rotation: 0 } })
                        }}
                      />
                      <div className="choices">
                        <button
                          type="button"
                          className="chip"
                          onClick={() => {
                            const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                            commit({ ...c, frameTransform: { ...ft, rotation: ((ft.rotation - 15) % 360) } })
                          }}
                        >
                          -15°
                        </button>
                        <button
                          type="button"
                          className="chip"
                          onClick={() => {
                            const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                            commit({ ...c, frameTransform: { ...ft, rotation: ((ft.rotation + 15) % 360) } })
                          }}
                        >
                          +15°
                        </button>
                        <button
                          type="button"
                          className={`chip ${selected === "frame" ? "selected" : ""}`}
                          onClick={() => setSelected("frame")}
                        >
                          Select on Canvas
                        </button>
                        <button
                          type="button"
                          className="chip"
                          onClick={() => commit({ ...c, frameTransform: { x: 0, y: 0, width: 100, height: 100, rotation: 0 } })}
                        >
                          Reset Frame
                        </button>
                      </div>
                    </div>
                  )}
                  <button
                    type="button"
                    className="text-button text-rose-400 hover:text-rose-300"
                    disabled={!c.frameId}
                    onClick={() => commit({ ...c, frameId: undefined, frameTransform: undefined })}
                  >
                    Remove decorative frame
                  </button>
                </div>
              </>
            )}
            {(tool === "Grid" || tool === "Templates") && (
              <>
                <div className="piccollage-tab-header">
                  <button
                    type="button"
                    className={`piccollage-top-tab ${studioTab === "grid" ? "active" : ""}`}
                    onClick={() => {
                      setStudioTab("grid")
                      setTool("Grid")
                    }}
                  >
                    Grid ({GRID_LAYOUTS.length})
                  </button>
                  <button
                    type="button"
                    className={`piccollage-top-tab ${studioTab === "template" ? "active" : ""}`}
                    onClick={() => {
                      setStudioTab("template")
                      setTool("Templates")
                    }}
                  >
                    Templates ({templates.length})
                  </button>
                </div>

                {studioTab === "grid" ? (
                  <>
                    <p className="inspector-intro text-xs text-stone-400 font-mono">
                      Pick an aspect ratio and dynamic grid wireframe. Adjust borders, spacing, and surface finishes.
                    </p>

                    {/* Aspect Ratio Row */}
                    <div className="piccollage-ratio-row">
                      {ASPECT_RATIOS.map((r) => {
                        const activeRatio = getActiveAspectRatio(c, template)
                        const isCurrentRatio = (c.aspectRatio ? c.aspectRatio === r.id : activeRatio === r.id)
                        return (
                          <button
                            type="button"
                            key={r.id}
                            className={`piccollage-ratio-chip ${isCurrentRatio ? "active" : ""}`}
                            onClick={() => {
                              setPan({ x: 0, y: 0 })
                              setZoom(1)
                              let nextGridId = c.gridLayoutId
                              const count = c.photos.length || template.count || 4
                              if (!nextGridId || nextGridId === "grid-4-strip" || nextGridId === "grid-4-equal") {
                                if (r.id === "1:1" && count === 4) nextGridId = "grid-4-equal"
                                else if ((r.id === "16:9" || r.id === "3:2") && count === 4) nextGridId = "grid-4-equal"
                                else if ((r.id === "9:16" || r.id === "2:3" || r.id === "3:4" || r.id === "4:5") && count === 4) nextGridId = "grid-4-strip"
                                else if (count === 3) nextGridId = (r.id === "16:9" || r.id === "3:2") ? "grid-3-hero-top" : "grid-3-hero-left"
                                else if (count === 2) nextGridId = (r.id === "16:9" || r.id === "3:2") ? "grid-2-cols" : "grid-2-rows"
                                else if (count === 1) nextGridId = "grid-1-full"
                              }
                              commit({
                                ...c,
                                aspectRatio: r.id,
                                ...(nextGridId ? { gridLayoutId: nextGridId } : {}),
                              })
                              notify(`Studio format: ${r.label} (${r.sublabel})`)
                            }}
                            title={`${r.sublabel} · ${r.label}`}
                          >
                            <span className={`ratio-box-icon ${r.iconType}`} />
                            <span>{r.label}</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Cut filter chips with counts */}
                    <div className="studio-chip-scroller mt-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono mr-1">Cuts:</span>
                      {(["all", 2, 3, 4, 5, 6, 8, 9] as const).map((cnt) => {
                        const count = cnt === "all" ? GRID_LAYOUTS.length : GRID_LAYOUTS.filter(g => g.count === cnt).length
                        return (
                          <button
                            type="button"
                            key={cnt}
                            className={`studio-pill-chip ${gridCountFilter === cnt ? "active" : ""}`}
                            onClick={() => setGridCountFilter(cnt)}
                          >
                            <span>{cnt === "all" ? "All" : `${cnt} Cuts`}</span>
                            <span className="studio-pill-badge">({count})</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Wireframe Grid Cards in Continuous Scroll (NO PAGINATION) */}
                    <div className="studio-continuous-grid cols-2 mt-2">
                      {GRID_LAYOUTS.filter((gl) =>
                        gridCountFilter === "all" ? true : gl.count === gridCountFilter,
                      ).map((gl) => {
                        const isActive = c.gridLayoutId === gl.id
                        return (
                          <button
                            type="button"
                            key={gl.id}
                            className={`studio-dark-wireframe-card ${isActive ? "active" : ""}`}
                            onClick={() => applyGridLayout(gl)}
                            title={`${gl.name} (${gl.count} photos)`}
                          >
                            <div className="wireframe-box">
                              <svg viewBox="0 0 100 100" className="w-full h-full">
                                {gl.wireframe.map((cell, idx) => (
                                  <rect
                                    key={idx}
                                    x={cell.x}
                                    y={cell.y}
                                    width={cell.w}
                                    height={cell.h}
                                    rx="2.5"
                                    fill={isActive ? "#facc15" : "#3f3f46"}
                                    stroke="#18181b"
                                    strokeWidth="2.5"
                                  />
                                ))}
                              </svg>
                            </div>
                            <strong className="text-xs text-stone-200 truncate max-w-full font-mono">
                              {gl.name}
                            </strong>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {gl.count} photos
                            </span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Grid Spacing, Padding, and Radius Controls */}
                    <div className="studio-dark-section mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-stone-300 font-mono">
                        <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Border & Spacing</span>
                        <span className="text-stone-400 font-mono text-[10px]">{c.spacing}% gap</span>
                      </div>
                      <Range
                        label="Photo spacing (gap)"
                        value={c.spacing}
                        min={0}
                        max={10}
                        step={0.5}
                        onChange={(v) => commit({ ...c, spacing: v })}
                        onReset={() => commit({ ...c, spacing: 2 })}
                      />
                      <Range
                        label="Border padding (outer margin)"
                        value={c.padding ?? 3}
                        min={0}
                        max={10}
                        step={0.5}
                        onChange={(v) => commit({ ...c, padding: v })}
                        onReset={() => commit({ ...c, padding: 3 })}
                      />
                      <Range
                        label="Corner roundness"
                        value={c.radius}
                        min={0}
                        max={30}
                        step={1}
                        onChange={(v) => commit({ ...c, radius: v })}
                        onReset={() => commit({ ...c, radius: 0 })}
                      />

                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-amber-400 font-mono tracking-wider block mb-1">
                          BORDER & CANVAS COLOR
                        </span>
                        <Swatches
                          value={c.background ?? "#ffffff"}
                          onChange={(v) => commit({ ...c, background: v })}
                        />
                      </div>

                      <div className="pt-2">
                        <span className="text-[10px] uppercase font-bold text-amber-400 font-mono tracking-wider block mb-1">
                          SURFACE TEXTURE
                        </span>
                        <select
                          className="w-full text-xs py-1.5 px-2 rounded-lg border border-stone-800 bg-stone-900 text-stone-200 font-mono outline-none focus:border-amber-400"
                          value={c.backgroundPattern ?? "none"}
                          onChange={(e) =>
                            commit({
                              ...c,
                              backgroundPattern: e.target.value === "none" ? undefined : e.target.value,
                            })
                          }
                        >
                          <option value="none">Solid Color</option>
                          <option value="Summer grass">Summer grass lawn 🌿</option>
                          <option value="Checkerboard">Checkerboard</option>
                          <option value="Grid notebook">Grid notebook paper</option>
                          <option value="Linen paper">Linen paper</option>
                          <option value="Watercolor wash">Watercolor wash</option>
                          <option value="Halftone dots">Halftone dots</option>
                          <option value="Terrazzo stone">Terrazzo stone</option>
                          <option value="Woodgrain">Woodgrain</option>
                        </select>
                      </div>
                    </div>

                    <button
                      type="button"
                      className="button secondary wide mt-3"
                      onClick={() => commit(enterFreeform(c, template))}
                    >
                      Freeform drag & scatter layout
                    </button>
                  </>
                ) : (
                  <>
                    <p className="inspector-intro text-xs text-stone-400 font-mono">
                      Choose from signature scrapbooks, Korean photo booth 4-cut strips, and keepsake templates.
                    </p>

                    {/* Template Search Bar */}
                    <div className="studio-search-bar">
                      <Search size={14} className="search-icon" />
                      <input
                        aria-label="Search templates"
                        value={templateSearch}
                        onChange={(e) => setTemplateSearch(e.target.value)}
                        placeholder="Search templates by style or keyword..."
                      />
                      {templateSearch && (
                        <button
                          type="button"
                          className="clear-btn"
                          aria-label="Clear template search"
                          onClick={() => setTemplateSearch("")}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Template Cut Filter Chips */}
                    <div className="studio-chip-scroller">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider font-mono mr-1">Cuts:</span>
                      {(["all", 1, 2, 3, 4, 6, 8, 9] as const).map((cnt) => {
                        const count = cnt === "all" ? templates.length : templates.filter(t => t.count === cnt).length
                        return (
                          <button
                            type="button"
                            key={cnt}
                            className={`studio-pill-chip ${templateCutFilter === cnt ? "active" : ""}`}
                            onClick={() => setTemplateCutFilter(cnt)}
                          >
                            <span>{cnt === "all" ? "All" : `${cnt} Photo${cnt > 1 ? "s" : ""}`}</span>
                            <span className="studio-pill-badge">({count})</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Template Category Chips with exact counts */}
                    <div className="studio-chip-scroller">
                      {[
                        "All styles",
                        "Korean Photo Booth 4-Cut",
                        "Scrapbook & Summer Grass 🌿",
                        "Romantic Kiss Pose Aesthetic ♡",
                        "Propose & Birthday Keepsakes 🎂",
                        "Cool & Spider Animated 🕸️",
                      ].map((cat) => {
                        const count = templateCategoryCounts[cat] ?? 12
                        return (
                          <button
                            type="button"
                            className={`studio-pill-chip ${templateCategoryFilter === cat ? "active" : ""}`}
                            key={cat}
                            onClick={() => setTemplateCategoryFilter(cat)}
                          >
                            <span>{cat}</span>
                            <span className="studio-pill-badge">({count})</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Continuous 2-Column Template Cards (NO PAGINATION) */}
                    <div className="studio-continuous-grid cols-2">
                      {matchingTemplates.map((t) => {
                        const isActive = c.templateId === t.id && !c.gridLayoutId
                        return (
                          <button
                            type="button"
                            className={`studio-dark-template-card ${isActive ? "active" : ""}`}
                            key={t.id}
                            onClick={() => applyTemplate(t)}
                          >
                            <div
                              className="template-thumb-box"
                              style={{
                                aspectRatio: `${t.width}/${t.height}`,
                                minHeight: "110px",
                              }}
                            >
                              <TemplateThumbnail template={t} className="w-full h-full object-contain" />
                            </div>
                            <strong className="text-xs truncate block text-stone-200 font-mono">
                              {t.name}
                            </strong>
                            <span className="template-meta">
                              {t.count} photos · {t.orientation}
                            </span>
                          </button>
                        )
                      })}

                      <button
                        type="button"
                        className={`studio-dark-template-card ${c.mode === "freeform" ? "active" : ""}`}
                        onClick={() => commit(enterFreeform(c, template))}
                      >
                        <div className="template-thumb-box" style={{ minHeight: "110px" }}>
                          <ImagesIllustration />
                        </div>
                        <strong className="text-xs text-stone-200 font-mono">My own arrangement</strong>
                        <span className="template-meta">Drag, overlap, make it yours</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      className="button secondary wide mt-3"
                      onClick={() => {
                        const base = enterFreeform(c, template)
                        commit({
                          ...base,
                          photos: base.photos.map((p, i) => ({
                            ...p,
                            transform: {
                              x: 8 + (i % 3) * 28,
                              y: 8 + Math.floor(i / 3) * 28,
                              width: 35,
                              height: 35,
                              rotation: i % 2 ? 6 : -6,
                            },
                          })),
                        })
                      }}
                    >
                      Try a scattered scrapbook layout
                    </button>
                  </>
                )}
              </>
            )}
            {tool === "Adjust" && (
              <>
                {photo ? (
                  <>
                    <div className="photo-scope">
                      <LayerThumb c={c} id={selected} />
                      <div>
                        <strong>Photo {photoIndex + 1}</strong>
                        <span>
                          Editing this photo only · original preserved
                        </span>
                      </div>
                      <button
                        title="Toggle before and after"
                        className={compare ? "on" : ""}
                        aria-label="Toggle before and after"
                        onClick={() => setCompare(!compare)}
                      >
                        <Eye size={17} />
                      </button>
                    </div>
                    <div className="adjust-mode-tabs">
                      <button
                        className={
                          filterCategory !== "Geometry" ? "active" : ""
                        }
                        onClick={() => setFilterCategory("Light & color")}
                      >
                        Light & color
                      </button>
                      <button
                        className={
                          filterCategory === "Geometry" ? "active" : ""
                        }
                        onClick={() => setFilterCategory("Geometry")}
                      >
                        <Crop size={13} />
                        Crop & geometry
                      </button>
                    </div>
                    {filterCategory === "Geometry" ? (
                      <>
                        <label className="studio-field">
                          Photo window aspect ratio
                          <select
                            aria-label="Photo window aspect ratio"
                            defaultValue="custom"
                            onChange={(e) => void reshapePhoto(e.target.value)}
                          >
                            <option value="custom" disabled>
                              Custom / layout window
                            </option>
                            <option value="source">Original proportions</option>
                            <option value="1">Square · 1:1</option>
                            <option value="0.8">Portrait · 4:5</option>
                            <option value="1.5">Landscape · 3:2</option>
                            <option value="0.5625">Story · 9:16</option>
                          </select>
                        </label>
                        <div className="geometry-actions">
                          <button
                            onClick={() =>
                              updatePhoto({
                                rotation: currentAdjustments.rotation - 90,
                              })
                            }
                          >
                            Rotate left
                          </button>
                          <button
                            onClick={() =>
                              updatePhoto({
                                rotation: currentAdjustments.rotation + 90,
                              })
                            }
                          >
                            Rotate right
                          </button>
                          <button
                            onClick={() =>
                              updatePhoto({ flipX: !currentAdjustments.flipX })
                            }
                          >
                            Flip horizontal
                          </button>
                          <button
                            onClick={() =>
                              updatePhoto({ flipY: !currentAdjustments.flipY })
                            }
                          >
                            Flip vertical
                          </button>
                        </div>
                        <div className="choices">
                          <button
                            className={
                              currentAdjustments.fit === "fill"
                                ? "chip selected"
                                : "chip"
                            }
                            onClick={() => updatePhoto({ fit: "fill" })}
                          >
                            Fill frame
                          </button>
                          <button
                            className={
                              currentAdjustments.fit === "fit"
                                ? "chip selected"
                                : "chip"
                            }
                            onClick={() =>
                              updatePhoto({
                                fit: "fit",
                                zoom: 1,
                                offsetX: 0,
                                offsetY: 0,
                              })
                            }
                          >
                            Fit · show whole photo
                          </button>
                        </div>
                        {[
                          {
                            key: "zoom",
                            name: "Zoom",
                            min: 1,
                            max: 4,
                            step: 0.01,
                            neutral: 1,
                          },
                          {
                            key: "offsetX",
                            name: "Horizontal position",
                            min: -100,
                            max: 100,
                            step: 1,
                            neutral: 0,
                          },
                          {
                            key: "offsetY",
                            name: "Vertical position",
                            min: -100,
                            max: 100,
                            step: 1,
                            neutral: 0,
                          },
                          {
                            key: "rotation",
                            name: "Straighten / rotate",
                            min: -180,
                            max: 180,
                            step: 0.5,
                            neutral: 0,
                          },
                          {
                            key: "perspectiveX",
                            name: "Horizontal perspective",
                            min: -100,
                            max: 100,
                            step: 1,
                            neutral: 0,
                          },
                          {
                            key: "perspectiveY",
                            name: "Vertical perspective",
                            min: -100,
                            max: 100,
                            step: 1,
                            neutral: 0,
                          },
                        ].map((a) => (
                          <Range
                            key={a.key}
                            label={a.name}
                            value={Number(
                              currentAdjustments[
                                (a.key as keyof Adjustments)
                              ] ?? 0,
                            )}
                            min={a.min}
                            max={a.max}
                            step={a.step}
                            onChange={(v) => updatePhoto({ [a.key]: v })}
                            onReset={() => updatePhoto({ [a.key]: a.neutral })}
                          />
                        ))}
                        <button
                          className="studio-small-button"
                          onClick={() => {
                            setReplacing(true)
                            importInput.current?.click()
                          }}
                        >
                          <ImagePlus size={14} />
                          Replace this photo
                        </button>
                        <button
                          className="studio-small-button"
                          disabled={c.photos.length < 2 || photo.locked}
                          onClick={() => {
                            const next = [...c.photos],
                              target = (photoIndex + 1) % next.length
                            ;[next[photoIndex], next[target]] = [
                              next[target],
                              next[photoIndex],
                            ]
                            commit({ ...c, photos: next })
                          }}
                        >
                          Swap with next photo slot
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="auto-enhance"
                          onClick={() =>
                            updatePhoto({
                              exposure: 0.12,
                              shadows: 16,
                              highlights: -12,
                              contrast: 106,
                              vibrance: 12,
                            })
                          }
                        >
                          <WandSparkles size={17} />
                          <div>
                            <strong>Quick lighting lift</strong>
                            <span>
                              A reversible preset. No AI or detection.
                            </span>
                          </div>
                          <Plus size={16} />
                        </button>
                        {adjustmentControls.map((a) => (
                          <Range
                            key={a.key}
                            label={a.name}
                            value={Number(currentAdjustments[a.key])}
                            min={a.min}
                            max={a.max}
                            step={a.step}
                            onChange={(v) => updatePhoto({ [a.key]: v })}
                            onReset={() => updatePhoto({ [a.key]: a.neutral })}
                          />
                        ))}
                      </>
                    )}
                    <div className="adjust-copy">
                      <button
                        onClick={() => {
                          setCopied({ ...photo.adjustments })
                          notify("Photo adjustments copied.")
                        }}
                      >
                        <Copy size={14} />
                        Copy look
                      </button>
                      <button
                        disabled={!copied}
                        onClick={() => updatePhoto(copied!)}
                      >
                        Paste look
                      </button>
                      <button
                        onClick={() =>
                          commit({
                            ...c,
                            photos: c.photos.map((p) =>
                              p.locked
                                ? p
                                : {
                                    ...p,
                                    adjustments: {
                                      ...photo.adjustments,
                                      zoom: p.adjustments.zoom,
                                      offsetX: p.adjustments.offsetX,
                                      offsetY: p.adjustments.offsetY,
                                      rotation: p.adjustments.rotation,
                                      flipX: p.adjustments.flipX,
                                      flipY: p.adjustments.flipY,
                                      fit: p.adjustments.fit,
                                    },
                                  },
                            ),
                          })
                        }
                      >
                        Apply look to all
                      </button>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => updatePhoto(defaultAdjustments())}
                    >
                      <RotateCcw size={13} />
                      Restore selected original
                    </button>
                  </>
                ) : (
                  <p className="library-empty">
                    Select a photo from the canvas or photo strip.
                  </p>
                )}
              </>
            )}
            {tool === "Filters" && (
              <>
                {photo ? (
                  <>
                    <div className="photo-scope">
                      <LayerThumb c={c} id={selected} />
                      <div>
                        <strong>
                          Photo {photoIndex + 1} · {currentAdjustments.filter}
                        </strong>
                        <span>Each photo can have its own feeling.</span>
                      </div>
                      <button
                        aria-label="Toggle before and after"
                        className={compare ? "on" : ""}
                        onClick={() => setCompare(!compare)}
                      >
                        <Eye size={17} />
                      </button>
                    </div>

                    {/* Filter Search Bar */}
                    <div className="studio-search-bar">
                      <Search size={14} className="search-icon" />
                      <input
                        aria-label="Search filters"
                        value={filterSearch}
                        onChange={(e) => setFilterSearch(e.target.value)}
                        placeholder="Search filters by mood, film, tone..."
                      />
                      {filterSearch && (
                        <button
                          type="button"
                          className="clear-btn"
                          aria-label="Clear filter search"
                          onClick={() => setFilterSearch("")}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Filter Category Chips with exact counts */}
                    <div className="studio-chip-scroller">
                      {[
                        "All looks",
                        ...new Set(filterPresets.map((p) => p.category)),
                      ].map((cat) => {
                        const count = filterCategoryCounts[cat] ?? 6
                        return (
                          <button
                            type="button"
                            className={`studio-pill-chip ${filterCategory === cat ? "active" : ""}`}
                            key={cat}
                            onClick={() => setFilterCategory(cat)}
                          >
                            <span>{cat}</span>
                            <span className="studio-pill-badge">({count})</span>
                          </button>
                        )
                      })}
                    </div>

                    {/* Continuous 2-Column Filter Preview Cards (NO PAGINATION) */}
                    <div className="studio-continuous-grid cols-2">
                      {matchingFilters.map((p) => (
                        <button
                          type="button"
                          className={`studio-dark-filter-card ${
                            currentAdjustments.filter === p.name ? "active" : ""
                          }`}
                          key={p.name}
                          title={p.description}
                          onClick={() => updatePhoto({ filter: p.name })}
                        >
                          <div className="filter-thumb-box overflow-hidden relative w-full aspect-square rounded bg-stone-900 flex items-center justify-center">
                            {photo?.src ? (
                              <img
                                src={photo.src}
                                alt={p.name}
                                loading="lazy"
                                className="w-full h-full object-cover pointer-events-none"
                                style={{
                                  filter: cssFilter({
                                    ...defaultAdjustments(),
                                    filter: p.name,
                                    intensity: 100,
                                  }),
                                }}
                              />
                            ) : (
                              <div className="w-full h-full bg-stone-800 flex items-center justify-center text-[10px] text-stone-400 font-mono">
                                {p.name}
                              </div>
                            )}
                          </div>
                          <strong>{p.name}</strong>
                          <span>{p.category}</span>
                        </button>
                      ))}
                      {!matchingFilters.length && (
                        <div className="col-span-2 py-8 text-center text-stone-400 text-xs font-mono">
                          No filters match "{filterSearch}". Try another category or clear search.
                        </div>
                      )}
                    </div>

                    <div className="studio-dark-section mt-1">
                      <Range
                        label="Filter intensity"
                        value={currentAdjustments.intensity}
                        onChange={(v) => updatePhoto({ intensity: v })}
                        onReset={() => updatePhoto({ intensity: 100 })}
                      />
                      <button
                        type="button"
                        className="button secondary wide"
                        onClick={() =>
                          commit({
                            ...c,
                            photos: c.photos.map((p) =>
                              p.locked
                                ? p
                                : {
                                    ...p,
                                    adjustments: {
                                      ...p.adjustments,
                                      filter: photo.adjustments.filter,
                                      intensity: photo.adjustments.intensity,
                                    },
                                  },
                            ),
                          })
                        }
                      >
                        Apply filter to every photo
                      </button>
                      <button
                        type="button"
                        className="text-button text-amber-400 hover:text-amber-300"
                        onClick={() =>
                          updatePhoto({ filter: "Original", intensity: 100 })
                        }
                      >
                        Reset filter
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="library-empty">
                    Select a photo to explore {filterPresets.length} original looks.
                  </p>
                )}
              </>
            )}
            {tool === "Stickers" && (
              <>
                {/* Top Bar: Target & Preview Mode Switcher */}
                <div className="flex items-center justify-between pb-1.5 border-b border-stone-800 gap-2 flex-wrap text-xs font-mono">
                  <span className="text-amber-400 text-[10px] uppercase font-bold tracking-wider">
                    {allStickers.length} STICKERS ({pngStickers.length} PNG + {stickers.length} VECTOR)
                  </span>
                  <div className="flex items-center gap-1.5">
                    {/* Preview Mode Switcher (Grid / Light / Dark) */}
                    <div className="preview-mode-group" title="Toggle background to verify sticker transparency on light & dark surfaces">
                      <button
                        type="button"
                        className={`preview-mode-btn ${stickerPreviewBg === "checkered" ? "active-grid" : ""}`}
                        onClick={() => setStickerPreviewBg("checkered")}
                      >
                        Grid
                      </button>
                      <button
                        type="button"
                        className={`preview-mode-btn ${stickerPreviewBg === "light" ? "active-light" : ""}`}
                        onClick={() => setStickerPreviewBg("light")}
                      >
                        Light
                      </button>
                      <button
                        type="button"
                        className={`preview-mode-btn ${stickerPreviewBg === "dark" ? "active-dark" : ""}`}
                        onClick={() => setStickerPreviewBg("dark")}
                      >
                        Dark
                      </button>
                    </div>
                    <button
                      type="button"
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-900 border border-stone-800 text-stone-300 hover:border-amber-400 flex items-center gap-1"
                      onClick={() => stickerInput.current?.click()}
                    >
                      <ImagePlus size={12} />
                      Import
                    </button>
                  </div>
                </div>

                {/* Pre-placement Tilt / Rotation Selector (As seen in Scrapbook screenshot!) */}
                <div className="tilt-selector-group">
                  <span className="label">
                    <RotateCw size={11} className="text-amber-400" />
                    Tilt / Rotation:
                  </span>
                  <div className="tilt-btn-row">
                    {[
                      { label: "-12°", val: -12 },
                      { label: "-6°", val: -6 },
                      { label: "0°", val: 0 },
                      { label: "+6°", val: 6 },
                      { label: "+12°", val: 12 },
                      { label: "🎲", val: "random" },
                    ].map((p) => (
                      <button
                        key={String(p.val)}
                        type="button"
                        className={`tilt-btn ${stickerPlacementAngle === p.val ? "active" : ""}`}
                        onClick={() => setStickerPlacementAngle(p.val as any)}
                        title={`Place sticker with ${p.label} rotation`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search Bar */}
                <div className="studio-search-bar">
                  <Search size={14} className="search-icon" />
                  <input
                    aria-label="Search stickers"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search stickers by name or keyword..."
                  />
                  {search && (
                    <button
                      type="button"
                      className="clear-btn"
                      aria-label="Clear search"
                      onClick={() => setSearch("")}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Pack Selector Chips Scroller with exact counts */}
                <div className="studio-chip-scroller">
                  {["All packs", "Favorites", "Recent", ...allStickerPacks].map((p) => {
                    const count = stickerPackCounts[p] ?? 25
                    return (
                      <button
                        key={p}
                        type="button"
                        className={`studio-pill-chip ${pack === p ? "active" : ""}`}
                        onClick={() => setPack(p)}
                      >
                        <span>{p}</span>
                        <span className="studio-pill-badge">({count})</span>
                      </button>
                    )
                  })}
                </div>

                {/* Continuous Scrollable 4-Column Grid (NO PAGINATION ARROWS!) */}
                <div className="studio-continuous-grid cols-4">
                  {matchingStickers.map((s) => (
                    <article
                      key={s.id}
                      className={`studio-dark-sticker-card ${
                        stickerPreviewBg === "light"
                          ? "bg-light"
                          : stickerPreviewBg === "dark"
                          ? "bg-dark"
                          : "bg-grid"
                      }`}
                      onClick={() => addSticker(s.id)}
                      title={`Click to place ${s.name}`}
                    >
                      <div className="sticker-img-box">
                        <img src={stickerUrl(s)} alt="" loading="lazy" />
                      </div>
                      <span className="sticker-name">{s.name}</span>
                      <button
                        type="button"
                        className={`sticker-card-fav ${
                          stickerFavorites.includes(s.id) ? "active" : ""
                        }`}
                        aria-label={`Favorite ${s.name}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          setStickerFavorites((f) =>
                            f.includes(s.id)
                              ? f.filter((x) => x !== s.id)
                              : [...f, s.id],
                          )
                        }}
                      >
                        <Heart
                          size={10}
                          fill={
                            stickerFavorites.includes(s.id) ? "currentColor" : "none"
                          }
                        />
                      </button>
                    </article>
                  ))}
                  {!matchingStickers.length && (
                    <div className="col-span-4 py-8 text-center text-stone-400 text-xs font-mono">
                      No stickers match "{search}". Try another pack or clear search.
                    </div>
                  )}
                </div>

                {/* Selected Sticker Inspector Panel */}
                {sticker && (
                  <div className="studio-dark-section mt-1">
                    <div className="flex items-center justify-between">
                      <strong className="text-xs text-stone-200 font-mono truncate">
                        {sticker.name ?? "Selected Sticker"}
                      </strong>
                      <button
                        type="button"
                        className="text-stone-400 hover:text-rose-400"
                        title="Delete sticker"
                        onClick={() => commit(deleteLayer(c, sticker.id))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    {/* Color swatches for recolorable vector stickers */}
                    {sticker.color && (
                      <Swatches
                        value={sticker.color}
                        onChange={(color) => updateSticker({ color })}
                      />
                    )}
                    <Range
                      label="Sticker size"
                      value={sticker.size}
                      min={2}
                      max={100}
                      onChange={(size) => updateSticker({ size })}
                      onReset={() => updateSticker({ size: 20 })}
                    />
                    <Range
                      label="Sticker rotation"
                      value={sticker.rotation}
                      min={-180}
                      max={180}
                      onChange={(rotation) => updateSticker({ rotation })}
                      onReset={() => updateSticker({ rotation: 0 })}
                    />
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        className="studio-small-button flex-1"
                        onClick={() => updateSticker({ flipX: !sticker.flipX })}
                      >
                        Flip sticker
                      </button>
                      <button
                        type="button"
                        className="studio-small-button flex-1"
                        onClick={() => {
                          const newId = crypto.randomUUID()
                          commit(duplicateLayer(c, sticker.id, newId))
                          setSelected(newId)
                        }}
                      >
                        <Copy size={13} />
                        Duplicate
                      </button>
                    </div>
                  </div>
                )}
                <p className="inspector-footnote text-[11px] text-stone-500 font-mono">
                  All 165 PNG & 225 vector stickers maintain transparency and render in high resolution during photo export.
                </p>
              </>
            )}
            {tool === "Text" && (
              <>
                <div className="flex items-center justify-between pb-1 border-b border-stone-800 text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                  <span>PHOTOBOOTH PRESETS</span>
                  <span className="text-stone-400">Click to set</span>
                </div>
                <div className="studio-chip-scroller">
                  {[
                    { label: "Today's Date", text: new Date().toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }) },
                    { label: "Hongdae 11:45 PM", text: "Hongdae Photo Booth · 11:45 PM" },
                    { label: "best moments ♡", text: "best moments ♡" },
                    { label: "seoul nights ★", text: "seoul nights ★" },
                    { label: "sweet memories ✿", text: "sweet memories ✿" },
                    { label: "little things ✨", text: "little things ✨" },
                    { label: "photo dump 🎞️", text: "photo dump 🎞️" },
                    { label: "forever & always", text: "forever & always" },
                    { label: "good friends ☻", text: "good friends · good times" },
                  ].map((preset) => (
                    <button
                      key={preset.label}
                      type="button"
                      className="studio-pill-chip"
                      onClick={() => setCaption(preset.text)}
                    >
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div className="studio-dark-section">
                  <label className="studio-dark-field">
                    <span>Your words & caption</span>
                    <textarea
                      value={caption}
                      rows={2}
                      maxLength={400}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write a little something…"
                    />
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="button primary flex-1"
                      disabled={!caption.trim()}
                      onClick={() => {
                        const id = crypto.randomUUID()
                        commit({
                          ...c,
                          texts: [
                            ...c.texts,
                            {
                              id,
                              text: caption,
                              x: 50,
                              y: 85,
                              size: 22,
                              rotation: 0,
                              color: "#faf8f2",
                              font: "hand",
                            },
                          ],
                        })
                        setSelected(id)
                      }}
                    >
                      <Plus size={14} />
                      Add to canvas
                    </button>
                    <button
                      type="button"
                      className="studio-small-button"
                      onClick={() => setCaption(new Date().toLocaleDateString())}
                    >
                      Today’s date
                    </button>
                  </div>
                </div>

                {text && (
                  <div className="studio-dark-section mt-1">
                    <div className="flex items-center justify-between pb-1 border-b border-stone-800">
                      <strong className="text-xs text-stone-200 font-mono">SELECTED CAPTION</strong>
                      <button
                        type="button"
                        className="text-stone-400 hover:text-rose-400"
                        title="Delete text"
                        onClick={() => commit(deleteLayer(c, text.id))}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <label className="studio-dark-field">
                      <span>Caption Text</span>
                      <textarea
                        rows={2}
                        value={text.text}
                        onChange={(e) => updateText({ text: e.target.value })}
                      />
                    </label>
                    <div className="font-options">
                      {(["hand", "serif", "sans"] as const).map((font) => (
                        <button
                          type="button"
                          className={text.font === font ? "active" : ""}
                          key={font}
                          style={{
                            fontFamily:
                              font === "hand"
                                ? "Caveat"
                                : font === "serif"
                                  ? "Georgia"
                                  : "DM Sans",
                          }}
                          onClick={() => updateText({ font })}
                        >
                          Aa{" "}
                          <span>
                            {font === "hand"
                              ? "Handwritten"
                              : font === "serif"
                                ? "Editorial"
                                : "Clean sans"}
                          </span>
                        </button>
                      ))}
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-stone-400 uppercase font-bold block mb-1">
                        INK COLOR
                      </span>
                      <Swatches
                        value={text.color}
                        onChange={(color) => updateText({ color })}
                      />
                    </div>
                    <Range
                      label="Text size"
                      value={text.size}
                      min={6}
                      max={100}
                      onChange={(size) => updateText({ size })}
                    />
                    <Range
                      label="Letter spacing"
                      value={text.letterSpacing ?? 0}
                      min={-3}
                      max={20}
                      step={0.5}
                      onChange={(letterSpacing) => updateText({ letterSpacing })}
                    />
                    <Range
                      label="Line spacing"
                      value={text.lineHeight ?? 1.3}
                      min={0.8}
                      max={3}
                      step={0.1}
                      onChange={(lineHeight) => updateText({ lineHeight })}
                    />
                    <Range
                      label="Text rotation"
                      value={text.rotation}
                      min={-180}
                      max={180}
                      onChange={(rotation) => updateText({ rotation })}
                    />
                    <Range
                      label="Text outline"
                      value={text.outline ?? 0}
                      max={15}
                      onChange={(outline) => updateText({ outline })}
                    />
                    <div className="choices">
                      {(["left", "center", "right"] as const).map((align) => (
                        <button
                          type="button"
                          className={`chip ${text.align === align ? "selected" : ""}`}
                          key={align}
                          onClick={() => updateText({ align })}
                        >
                          {align.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <label className="toggle-row">
                      <span>Caption card background</span>
                      <input
                        type="checkbox"
                        checked={!!text.labelColor}
                        onChange={(e) =>
                          updateText({
                            labelColor: e.target.checked ? "#18181b" : undefined,
                          })
                        }
                      />
                    </label>
                  </div>
                )}
              </>
            )}
            {tool === "Background" && (
              <>
                <div className="flex items-center justify-between pb-1 border-b border-stone-800 text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                  <span>PHOTOBOOTH PALETTE</span>
                  <span className="text-stone-400">Paper Tone</span>
                </div>
                <Swatches
                  value={c.background}
                  onChange={(background) => commit({ ...c, background })}
                />

                <div className="flex items-center justify-between pt-2 pb-1 border-b border-stone-800 text-[10px] font-mono text-amber-400 uppercase font-bold tracking-wider">
                  <span>SURFACE TEXTURES ({backgroundPatterns.length})</span>
                  <span className="text-stone-400">Continuous grid</span>
                </div>
                {/* Continuous 3-column scrollable grid (NO PAGINATION) */}
                <div className="background-grid">
                  {backgroundPatterns.map((p) => (
                    <button
                      type="button"
                      className={c.backgroundPattern === p ? "active" : ""}
                      key={p}
                      onClick={() => commit({ ...c, backgroundPattern: p })}
                    >
                      <div
                        className={`pattern-sample pattern-${p.toLowerCase().replace(/ /g, "-")}`}
                        style={{ backgroundColor: c.background }}
                      />
                      <span>{p === "none" ? "Solid color" : p}</span>
                    </button>
                  ))}
                </div>

                <div className="studio-dark-section mt-1">
                  <Range
                    label="Texture opacity"
                    value={(c.backgroundOpacity ?? 0.35) * 100}
                    onChange={(v) => commit({ ...c, backgroundOpacity: v / 100 })}
                    onReset={() => commit({ ...c, backgroundOpacity: 0.35 })}
                  />
                </div>
                <p className="inspector-footnote text-[11px] text-stone-500 font-mono">
                  Textures stay non-destructive from your original photos and are reproduced in full quality during photo export.
                </p>
              </>
            )}
            {tool === "Layers" && (
              <>
                <div className="flex items-center justify-between pb-1 border-b border-stone-800 text-xs font-mono">
                  <span className="text-amber-400 text-[10px] uppercase font-bold tracking-wider">
                    {layers.length} Layers · {multi.length} Selected
                  </span>
                  <div className="flex items-center gap-2">
                    {multi.length > 0 && (
                      <button
                        type="button"
                        className="text-[10px] text-stone-400 hover:text-amber-400 font-mono"
                        onClick={() => setMulti([])}
                      >
                        Clear
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-[10px] text-amber-400 hover:text-amber-300 font-mono"
                      onClick={() => setMulti(layers.filter(l => l.kind !== "frame").map(l => l.id))}
                    >
                      Select All
                    </button>
                  </div>
                </div>

                {/* Continuous scrollable Layer List (NO ARROW PAGINATION) */}
                <div className="layer-list">
                  {[...layers].reverse().map((l) => {
                    const isSelected = selected === l.id
                    const isGrouped = !!l.properties.groupId
                    return (
                      <div
                        className={`layer-row ${isSelected ? "active" : ""}`}
                        key={l.id}
                      >
                        <input
                          type="checkbox"
                          aria-label={`Select ${l.label} for grouping`}
                          checked={multi.includes(l.id)}
                          disabled={l.kind === "frame"}
                          onChange={(e) =>
                            setMulti((m) =>
                              e.target.checked
                                ? [...m, l.id]
                                : m.filter((x) => x !== l.id),
                            )
                          }
                        />
                        <button
                          type="button"
                          className="layer-select"
                          onClick={() => setSelected(l.id)}
                        >
                          <span className="layer-thumb">
                            <LayerThumb c={c} id={l.id} />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center gap-1">
                              <span className={`layer-kind-badge ${l.kind}`}>
                                {l.kind}
                              </span>
                              <strong className="truncate">
                                {l.label.slice(0, 24)}
                              </strong>
                            </span>
                            <small className="text-stone-400 block text-[10px]">
                              {isGrouped ? "Grouped element" : `${l.kind} layer`}
                            </small>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="studio-icon"
                          aria-label={`${l.properties.hidden ? "Show" : "Hide"} ${l.label}`}
                          title={l.properties.hidden ? "Show" : "Hide"}
                          onClick={() =>
                            commit(
                              patchLayer(c, l.id, {
                                hidden: !l.properties.hidden,
                              }),
                            )
                          }
                        >
                          {l.properties.hidden ? (
                            <EyeOff size={13} />
                          ) : (
                            <Eye size={13} />
                          )}
                        </button>
                        <button
                          type="button"
                          className="studio-icon"
                          disabled={l.kind === "frame"}
                          aria-label={`${l.properties.locked ? "Unlock" : "Lock"} ${l.label}`}
                          title={l.properties.locked ? "Unlock" : "Lock"}
                          onClick={() =>
                            commit(
                              patchLayer(c, l.id, {
                                locked: !l.properties.locked,
                              }),
                            )
                          }
                        >
                          {l.properties.locked ? (
                            <LockKeyhole size={13} />
                          ) : (
                            <UnlockKeyhole size={13} />
                          )}
                        </button>
                      </div>
                    )
                  })}
                  {!layers.length && (
                    <div className="py-8 text-center text-stone-400 text-xs font-mono">
                      No active layers on canvas. Add photos or stickers!
                    </div>
                  )}
                </div>

                {/* Group & Multi-Action Toolbar */}
                <div className="group-actions">
                  <button
                    type="button"
                    disabled={multi.length < 2}
                    onClick={() => {
                      const id = crypto.randomUUID()
                      let next = c
                      for (const l of multi)
                        next = patchLayer(next, l, { groupId: id })
                      commit(next)
                      setMulti([])
                      notify("Grouped. Drag any member to move the group.")
                    }}
                  >
                    Group ({multi.length})
                  </button>
                  <button
                    type="button"
                    disabled={
                      multi.filter((id) =>
                        c.photos.some((p) => p.id === id && !p.locked),
                      ).length < 3
                    }
                    onClick={() =>
                      commit(distributePhotos(c, template, multi, "x"))
                    }
                  >
                    Space X
                  </button>
                  <button
                    type="button"
                    disabled={
                      multi.filter((id) =>
                        c.photos.some((p) => p.id === id && !p.locked),
                      ).length < 3
                    }
                    onClick={() =>
                      commit(distributePhotos(c, template, multi, "y"))
                    }
                  >
                    Space Y
                  </button>
                  <button
                    type="button"
                    disabled={!layer?.properties.groupId}
                    onClick={() => {
                      let next = c
                      for (const l of layers.filter(
                        (l) =>
                          l.properties.groupId === layer?.properties.groupId,
                      ))
                        next = patchLayer(next, l.id, { groupId: undefined })
                      commit(next)
                    }}
                  >
                    Ungroup
                  </button>
                  <button
                    type="button"
                    disabled={!layer || layer.kind === "frame"}
                    onClick={copyLayer}
                  >
                    <Copy size={12} className="inline mr-1" />
                    Copy
                  </button>
                  <button
                    type="button"
                    disabled={!clipboard.current}
                    onClick={pasteLayer}
                  >
                    Paste
                  </button>
                </div>

                {layer && (
                  <div className="studio-dark-section mt-1">
                    <span className="text-[10px] uppercase font-bold text-amber-400 font-mono tracking-wider">
                      SELECTED {layer.kind.toUpperCase()} PROPERTIES
                    </span>
                    <label className="studio-dark-field">
                      <span>Layer name</span>
                      <input
                        type="text"
                        disabled={layer.kind === "frame"}
                        value={layer.properties.name ?? layer.label}
                        onChange={(e) => updateLayer({ name: e.target.value })}
                      />
                    </label>
                    <Range
                      label="Layer opacity"
                      value={(layer.properties.opacity ?? 1) * 100}
                      onChange={(v) => updateLayer({ opacity: v / 100 })}
                    />
                    {layer.kind !== "frame" && (
                      <>
                        <Range
                          label="Layer shadow"
                          value={layer.properties.shadow ?? 0}
                          max={100}
                          onChange={(v) => updateLayer({ shadow: v })}
                        />
                        <label className="studio-dark-field">
                          <span>Blend mode</span>
                          <select
                            value={layer.properties.blend ?? "source-over"}
                            onChange={(e) =>
                              updateLayer({
                                blend: e.target.value as LayerProperties["blend"],
                              })
                            }
                          >
                            <option value="source-over">Normal</option>
                            <option value="multiply">Multiply (Ink/Blend)</option>
                            <option value="screen">Screen (Lighten)</option>
                          </select>
                        </label>
                      </>
                    )}
                    {layer.kind === "frame" && c.frameId && (
                      <div className="space-y-2 mt-2 pt-2 border-t border-stone-800">
                        <Range
                          label="Frame width"
                          value={Math.round(c.frameTransform?.width ?? 100)}
                          min={10}
                          max={250}
                          onChange={(v) => {
                            const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                            commit({ ...c, frameTransform: { ...ft, width: v } })
                          }}
                        />
                        <Range
                          label="Frame height"
                          value={Math.round(c.frameTransform?.height ?? 100)}
                          min={10}
                          max={250}
                          onChange={(v) => {
                            const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                            commit({ ...c, frameTransform: { ...ft, height: v } })
                          }}
                        />
                        <Range
                          label="Frame rotation"
                          value={c.frameTransform?.rotation ?? 0}
                          min={-180}
                          max={180}
                          onChange={(v) => {
                            const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                            commit({ ...c, frameTransform: { ...ft, rotation: v } })
                          }}
                        />
                        <div className="choices">
                          <button
                            type="button"
                            className="chip"
                            onClick={() => {
                              const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                              commit({ ...c, frameTransform: { ...ft, rotation: (ft.rotation - 15) } })
                            }}
                          >
                            -15°
                          </button>
                          <button
                            type="button"
                            className="chip"
                            onClick={() => {
                              const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                              commit({ ...c, frameTransform: { ...ft, rotation: (ft.rotation + 15) } })
                            }}
                          >
                            +15°
                          </button>
                          <button
                            type="button"
                            className="chip"
                            onClick={() => {
                              const ft = c.frameTransform ?? { x: 0, y: 0, width: 100, height: 100, rotation: 0 }
                              commit({ ...c, frameTransform: { ...ft, rotation: 0 } })
                            }}
                          >
                            Reset 0°
                          </button>
                        </div>
                      </div>
                    )}
                    {photo && c.mode !== "freeform" && (
                      <div className="pt-2">
                        <button
                          type="button"
                          className="button secondary wide"
                          onClick={() => commit(enterFreeform(c, template))}
                        >
                          <Sparkles size={12} />
                          Unlock to Freeform (Rotate & Resize)
                        </button>
                      </div>
                    )}
                    {photo &&
                      c.mode === "freeform" && (
                        <>
                          {(["x", "y", "width", "height", "rotation"] as const).map(
                            (key) => (
                              <Range
                                key={key}
                                label={`Photo ${key}`}
                                value={photoBounds(c, template, photoIndex)[key]}
                                min={
                                  key === "rotation"
                                    ? -180
                                    : key === "width" || key === "height"
                                      ? 3
                                      : -50
                                }
                                max={key === "rotation" ? 180 : 150}
                                onChange={(v) =>
                                  commit({
                                    ...c,
                                    photos: c.photos.map((p, i) =>
                                      i === photoIndex
                                        ? {
                                            ...p,
                                            transform: {
                                              ...photoBounds(c, template, i),
                                              [key]: v,
                                            },
                                          }
                                        : p,
                                    ),
                                  })
                                }
                              />
                            ),
                          )}
                          <div className="choices mt-1">
                            <button
                              type="button"
                              className="chip"
                              onClick={() => {
                                const b = photoBounds(c, template, photoIndex)
                                commit({
                                  ...c,
                                  photos: c.photos.map((p, i) =>
                                    i === photoIndex
                                      ? { ...p, transform: { ...b, rotation: (b.rotation - 90) } }
                                      : p,
                                  ),
                                })
                              }}
                            >
                              -90°
                            </button>
                            <button
                              type="button"
                              className="chip"
                              onClick={() => {
                                const b = photoBounds(c, template, photoIndex)
                                commit({
                                  ...c,
                                  photos: c.photos.map((p, i) =>
                                    i === photoIndex
                                      ? { ...p, transform: { ...b, rotation: (b.rotation + 90) } }
                                      : p,
                                  ),
                                })
                              }}
                            >
                              +90°
                            </button>
                            <button
                              type="button"
                              className="chip"
                              onClick={() => {
                                const b = photoBounds(c, template, photoIndex)
                                commit({
                                  ...c,
                                  photos: c.photos.map((p, i) =>
                                    i === photoIndex
                                      ? { ...p, transform: { ...b, rotation: 0 } }
                                      : p,
                                  ),
                                })
                              }}
                            >
                              Reset 0°
                            </button>
                          </div>
                        </>
                      )}
                    {sticker && (
                      <>
                        <Range
                          label="Sticker size"
                          value={sticker.size}
                          min={2}
                          max={120}
                          onChange={(size) => updateSticker({ size })}
                        />
                        <Range
                          label="Sticker rotation"
                          value={sticker.rotation}
                          min={-180}
                          max={180}
                          onChange={(rotation) => updateSticker({ rotation })}
                        />
                        <div className="choices mb-2">
                          <button
                            type="button"
                            className="chip"
                            onClick={() => updateSticker({ rotation: sticker.rotation - 15 })}
                          >
                            -15°
                          </button>
                          <button
                            type="button"
                            className="chip"
                            onClick={() => updateSticker({ rotation: sticker.rotation + 15 })}
                          >
                            +15°
                          </button>
                          <button
                            type="button"
                            className="chip"
                            onClick={() => updateSticker({ rotation: 0 })}
                          >
                            Reset 0°
                          </button>
                        </div>
                      </>
                    )}
                    {(sticker || text) &&
                      (["x", "y"] as const).map((key) => (
                        <Range
                          key={key}
                          label={`Position ${key}`}
                          value={(sticker ?? text)![key]}
                          min={-20}
                          max={120}
                          onChange={(v) =>
                            sticker
                              ? updateSticker({ [key]: v })
                              : updateText({ [key]: v })
                          }
                        />
                      ))}
                    <div className="geometry-actions">
                      <button
                        type="button"
                        disabled={!photo || c.mode !== "freeform"}
                        onClick={() => {
                          const b = photoBounds(c, template, photoIndex)
                          commit({
                            ...c,
                            photos: c.photos.map((p) =>
                              p.id === selected
                                ? {
                                    ...p,
                                    transform: { ...b, x: 50 - b.width / 2 },
                                  }
                                : p,
                            ),
                          })
                        }}
                      >
                        Center horizontally
                      </button>
                      <button
                        type="button"
                        disabled={!photo || c.mode !== "freeform"}
                        onClick={() => {
                          const b = photoBounds(c, template, photoIndex)
                          commit({
                            ...c,
                            photos: c.photos.map((p) =>
                              p.id === selected
                                ? {
                                    ...p,
                                    transform: { ...b, y: 50 - b.height / 2 },
                                  }
                                : p,
                            ),
                          })
                        }}
                      >
                        Center vertically
                      </button>
                    </div>
                  </div>
                )}
                <div className="background-layer-row mt-2">
                  <Paintbrush size={16} />
                  <span>
                    Background · {c.backgroundPattern ?? "Solid color"}
                  </span>
                  <button type="button" onClick={() => setPanel("Background")}>Edit</button>
                </div>
              </>
            )}
          </div>
          {frameCandidate ? (
            <div className="inspector-footer">
              <div>
                <span>PREVIEWING WITH YOUR PHOTOS</span>
                <strong>{frameCandidate.name}</strong>
              </div>
              <div>
                <button
                  className="studio-small-button"
                  onClick={() => setFrameCandidate(null)}
                >
                  Cancel
                </button>
                <button
                  className="button primary"
                  onClick={() => {
                    commit({
                      ...c,
                      frameId: frameCandidate.id,
                      frameColor: frameCandidate.color,
                      background: frameCandidate.background,
                      frameOpacity: 1,
                    })
                    setRecent((r) =>
                      [
                        frameCandidate.id,
                        ...r.filter((x) => x !== frameCandidate.id),
                      ].slice(0, 30),
                    )
                    setFrameCandidate(null)
                  }}
                >
                  <Check size={14} />
                  Apply frame
                </button>
              </div>
            </div>
          ) : (
            <div className="inspector-footer">
              <span>
                <Check size={12} />
                Original photos stay untouched.
              </span>
              {["Adjust", "Filters"].includes(tool) && (
                <button
                  className="text-button"
                  onClick={() => {
                    commit(contextStart.current)
                    setCompare(false)
                  }}
                >
                  Cancel panel edits
                </button>
              )}
            </div>
          )}
          </div>
        </aside>
      </div>
    </section>
  )
}
function Pagination({
  page,
  count,
  pageSize = 12,
  setPage,
}: {
  page: number
  count: number
  pageSize?: number
  setPage: (n: number) => void
}) {
  return (
    <div className="library-pagination">
      <span>
        {count
          ? `${Math.min(page * pageSize + 1, count)}–${Math.min((page + 1) * pageSize, count)} of ${count}`
          : "0 results"}
      </span>
      <button
        disabled={!page}
        aria-label="Previous library page"
        onClick={() => setPage(page - 1)}
      >
        <ChevronLeft size={16} />
      </button>
      <button
        disabled={(page + 1) * pageSize >= count}
        aria-label="Next library page"
        onClick={() => setPage(page + 1)}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
function ImagesIllustration() {
  return (
    <>
      <span />
      <span />
      <Sparkles size={17} />
    </>
  )
}
