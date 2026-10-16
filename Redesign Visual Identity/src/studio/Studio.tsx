import { useEffect, useRef, useState } from "react"
import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react"
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  Check,
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
  Search,
  SlidersHorizontal,
  Sparkles,
  Sticker,
  Trash2,
  Type,
  UnlockKeyhole,
  WandSparkles,
  X,
} from "lucide-react"
import type {
  Adjustments,
  Composition,
  LayerProperties,
  Photo,
  PhotoTemplate,
} from "../types"
import { defaultAdjustments } from "../types"
import { getTemplate, templatesForCount } from "../templates"
import { loadImage, renderComposition } from "../rendering"
import { adjustmentControls } from "./pixels"
import { filterPresets } from "./filters"
import {
  backgroundPatterns,
  frames,
  frameCategories,
  stickers,
  stickerPacks,
  stickerUrl,
} from "./assets"
import type { FramePreset } from "./assets"
import useFontRevision from "./useFontRevision"
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
}
const tools = [
  { name: "Frames", icon: Frame },
  { name: "Layout", icon: Grid2X2 },
  { name: "Adjust", icon: SlidersHorizontal },
  { name: "Filters", icon: Sparkles },
  { name: "Stickers", icon: Sticker },
  { name: "Text", icon: Type },
  { name: "Background", icon: Paintbrush },
  { name: "Layers", icon: Layers },
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
    asset = stickers.find((a) => a.id === sticker?.assetId)
  return photo ? (
    <img src={photo.src} alt="" />
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
}: Props) {
  const [tool, setTool] = useState("Frames"),
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
    [confirmDelete, setConfirmDelete] = useState(false),
    [replacing, setReplacing] = useState(false)
  const stage = useRef<HTMLDivElement>(null),
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
    pointers = useRef(new Map<number, GesturePoint>())
  const template = getTemplate(c.templateId),
    layers = orderedLayers(c),
    layer = layers.find((l) => l.id === selected),
    photoIndex = c.photos.findIndex((p) => p.id === selected),
    photo = c.photos[photoIndex],
    sticker = c.stickers.find((s) => s.id === selected),
    text = c.texts.find((t) => t.id === selected),
    size = dimensions(c, template)
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
  const setPanel = (name: string) => {
    contextStart.current = c
    setTool(name)
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
  const switchLayout = (t: PhotoTemplate) => {
    if (t.count !== c.photos.length) {
      notify("This layout cannot hold all your photos. Nothing was changed.")
      return
    }
    commit({
      ...c,
      mode: "guided",
      templateId: t.id,
      photos: c.photos.map((p) => ({ ...p, transform: undefined })),
    })
    notify("Layout changed. Photos and adjustments preserved.")
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
    const i = composition.photos.findIndex((p) => p.id === id)
    if (i >= 0)
      return photoBounds(composition, getTemplate(composition.templateId), i)
    const s = composition.stickers.find((s) => s.id === id)
    if (s)
      return {
        x: s.x - s.size / 2,
        y: s.y - (s.size * size.width) / size.height / 2,
        width: s.size,
        height: (s.size * size.width) / size.height,
        rotation: s.rotation,
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
    if (index >= 0) {
      const p = base.photos[index]
      if (base.mode !== "freeform")
        return {
          ...base,
          photos: base.photos.map((x) =>
            x.id === id
              ? {
                  ...x,
                  adjustments: {
                    ...x.adjustments,
                    offsetX: Math.max(
                      -100,
                      Math.min(100, x.adjustments.offsetX + dx * 2),
                    ),
                    offsetY: Math.max(
                      -100,
                      Math.min(100, x.adjustments.offsetY + dy * 2),
                    ),
                    zoom: Math.max(1, Math.min(4, x.adjustments.zoom * scale)),
                  },
                }
              : x,
          ),
        }
      const rotated = operation === "rotate"
      return {
        ...base,
        photos: base.photos.map((x) =>
          x.id === id
            ? {
                ...x,
                transform: {
                  ...b,
                  x: rotated ? b.x : b.x + dx,
                  y: rotated ? b.y : b.y + dy,
                  width: Math.max(3, Math.min(180, b.width * scale)),
                  height: Math.max(3, Math.min(180, b.height * scale)),
                  rotation: b.rotation + (rotated ? dx * 3 : rotationDelta),
                },
              }
            : x,
        ),
      }
    }
    if (s)
      return {
        ...base,
        stickers: base.stickers.map((x) =>
          x.id === id
            ? {
                ...x,
                x: x.x + (operation === "rotate" ? 0 : dx),
                y: x.y + (operation === "rotate" ? 0 : dy),
                size: Math.max(2, Math.min(100, x.size * scale)),
                rotation:
                  x.rotation +
                  (operation === "rotate" ? dx * 3 : rotationDelta),
              }
            : x,
        ),
      }
    if (t)
      return {
        ...base,
        texts: base.texts.map((x) =>
          x.id === id
            ? {
                ...x,
                x: x.x + (operation === "rotate" ? 0 : dx),
                y: x.y + (operation === "rotate" ? 0 : dy),
                size: Math.max(6, Math.min(120, x.size * scale)),
                rotation:
                  x.rotation +
                  (operation === "rotate" ? dx * 3 : rotationDelta),
              }
            : x,
        ),
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
    e.currentTarget.setPointerCapture(e.pointerId)
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
    if (pointers.current.size === 1) {
      if (id) setSelected(id)
      gesture.current = {
        before: c,
        id,
        operation,
        startX: e.clientX,
        startY: e.clientY,
        distance: 0,
        pan,
        zoom,
      }
    }
    if (pointers.current.size === 2 && gesture.current) {
      const [a, b] = [...pointers.current.values()]
      gesture.current = {
        ...gesture.current,
        before: c,
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
      scale = Math.hypot(a.x - b.x, a.y - b.y) / Math.max(1, g.distance)
      dx = (((a.x + b.x) / 2 - g.startX) / rect.width) * 100
      dy = (((a.y + b.y) / 2 - g.startY) / rect.height) * 100
    }
    if (!g.id) {
      if (pointers.current.size === 2)
        setZoom(Math.max(0.5, Math.min(3, g.zoom * scale)))
      setPan({
        x: g.pan.x + (dx * rect.width) / 100,
        y: g.pan.y + (dy * rect.height) / 100,
      })
      return
    }
    const props = orderedLayers(g.before).find((l) => l.id === g.id)?.properties
    if (props?.locked) return
    if (g.operation === "resize") scale = Math.max(0.2, 1 + dx / 40)
    const bounds = layerBounds(g.id, g.before),
      centerX = bounds.x + bounds.width / 2 + dx,
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
        g.operation === "resize" ? 0 : dx,
        g.operation === "resize" ? 0 : dy,
        scale,
      )
    onTransient(next)
  }
  const pointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!gesture.current) return
    pointers.current.delete(e.pointerId)
    {
      const g = gesture.current
      pointers.current.clear()
      if (e.type === "pointercancel") onTransient(g.before)
      else if (g.id && c !== g.before) commit(c, g.before)
      gesture.current = null
      setSnapped({ x: false, y: false })
    }
  }
  const addSticker = (id: string) => {
    const asset = stickers.find((s) => s.id === id)!
    const newId = crypto.randomUUID()
    commit({
      ...c,
      stickers: [
        ...c.stickers,
        {
          id: newId,
          assetId: id,
          kind: "star",
          name: asset.name,
          x: 50,
          y: 50,
          size: 20,
          rotation: 0,
          color: "#a45f59",
        },
      ],
    })
    setSelected(newId)
    setRecentStickers((r) => [id, ...r.filter((x) => x !== id)].slice(0, 20))
  }
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
  const matchingStickers = stickers.filter(
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
      <div className="studio-body">
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
                    setPanel("Layout")
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
          <div className="canvas-viewport">
            <div
              className="canvas-paper-shadow"
              style={
                {
                  width: `${Math.min(100, ((340 / size.height) * size.width) / 5)}%`,
                  minWidth: "25%",
                  "--canvas-aspect": size.width / size.height,
                  transform: `translate(${pan.x}px,${pan.y}px) scale(${zoom})`,
                } as CSSProperties
              }
            >
              <div
                ref={stage}
                className="touch-canvas"
                style={{ aspectRatio: `${size.width}/${size.height}` }}
                onPointerDown={pointerDown}
                onPointerMove={pointerMove}
                onPointerUp={pointerEnd}
                onPointerCancel={pointerEnd}
              >
                <StudioPreview composition={visible} />
                {layers
                  .filter((l) => l.kind !== "frame" && !l.properties.hidden)
                  .map((l) => {
                    const b = layerBounds(l.id)
                    return (
                      <div
                        key={l.id}
                        data-layer={l.id}
                        className={`canvas-hit ${
                          selected === l.id && !compare ? "selected" : ""
                        } ${l.properties.locked ? "locked" : ""}`}
                        style={{
                          left: `${b.x}%`,
                          top: `${b.y}%`,
                          width: `${b.width}%`,
                          height: `${b.height}%`,
                          transform: `rotate(${b.rotation}deg)`,
                          zIndex: layers.indexOf(l) + 1,
                        }}
                      >
                        {selected === l.id && !compare && (
                          <>
                            <span className="selection-tag">
                              {l.properties.locked
                                ? "Locked"
                                : l.kind === "photo"
                                  ? `Photo ${c.photos.findIndex((p) => p.id === l.id) + 1}`
                                  : l.label.slice(0, 22)}
                            </span>
                            {!l.properties.locked && (
                              <>
                                <button
                                  data-operation="resize"
                                  aria-label="Drag to resize selected layer"
                                  className="selection-resize"
                                />
                                <button
                                  data-operation="rotate"
                                  aria-label="Drag to rotate selected layer"
                                  className="selection-rotate"
                                >
                                  <RotateCcw size={10} />
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    )
                  })}
                {safe && (
                  <div className="safe-guides">
                    <span>SOCIAL SAFE AREA</span>
                  </div>
                )}
                {snapped.x && <div className="snap-guide vertical" />}
                {snapped.y && <div className="snap-guide horizontal" />}
              </div>
            </div>
          </div>
          <div className="canvas-bottomline">
            <span>
              <MousePointer2 size={12} />
              {c.mode === "freeform"
                ? "Drag to arrange · pinch to resize"
                : "Drag a photo to recrop · pinch to zoom"}
            </span>
            <div>
              <button
                className="studio-icon"
                aria-label="Zoom out"
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              >
                <Minus size={14} />
              </button>
              <button className="zoom-value" onClick={resetView}>
                {Math.round(zoom * 100)}%
              </button>
              <button
                className="studio-icon"
                aria-label="Zoom in"
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              >
                <Plus size={14} />
              </button>
            </div>
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
              {c.photos.map((p, i) => (
                <button
                  className={selected === p.id ? "selected" : ""}
                  onClick={() => setSelected(p.id)}
                  key={p.id}
                >
                  <img src={p.src} alt={`Select photo ${i + 1}`} />
                  <span>{String(i + 1).padStart(2, "0")}</span>
                </button>
              ))}
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
                disabled={layer.properties.locked}
                onClick={() => setConfirmDelete(true)}
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
          <p className="hand studio-annotation">
            a little mess. a little magic. entirely you.
          </p>
        </div>
        <aside className="studio-inspector">
          <nav className="studio-tools" aria-label="Editing tools">
            {tools.map(({ name, icon: Icon }) => (
              <button
                className={tool === name ? "active" : ""}
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
          </nav>
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
                          : tool === "Layout"
                            ? "Give your moments room."
                            : tool === "Text"
                              ? "Put it into words."
                              : "Set the scene."}
              </h2>
            </div>
            <span className="hand">make it yours</span>
          </div>
          <div className="inspector-body">
            {["Frames", "Stickers"].includes(tool) && (
              <label className="studio-search">
                <Search size={15} />
                <input
                  aria-label={`Search ${tool.toLowerCase()}`}
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setLibraryPage(0)
                  }}
                  placeholder={
                    tool === "Frames"
                      ? "Search lace, film, notebook…"
                      : "Search bows, stars, memories…"
                  }
                />
                {search && (
                  <button
                    aria-label="Clear search"
                    onClick={() => setSearch("")}
                  >
                    <X size={13} />
                  </button>
                )}
              </label>
            )}
            {tool === "Frames" && (
              <>
                <div className="library-summary">
                  <span>{frames.length} original vector frame recipes</span>
                  <span>{c.photos.length} photos · compatible</span>
                </div>
                <div className="library-chips">
                  {["All collections", ...frameCategories].map((cat) => (
                    <button
                      className={category === cat ? "active" : ""}
                      key={cat}
                      onClick={() => {
                        setCategory(cat)
                        setLibraryPage(0)
                      }}
                    >
                      {cat === "All collections"
                        ? "All styles"
                        : cat.split(" and ")[0]}
                    </button>
                  ))}
                </div>
                <div className="library-filterbar">
                  <button
                    className={showFavorites ? "on" : ""}
                    onClick={() => {
                      setShowFavorites(!showFavorites)
                      setLibraryPage(0)
                    }}
                  >
                    <Heart size={13} />
                    Saved
                  </button>
                  <button
                    className={showRecent ? "on" : ""}
                    onClick={() => {
                      setShowRecent(!showRecent)
                      setLibraryPage(0)
                    }}
                  >
                    Recent
                  </button>
                  <select
                    aria-label="Frame color filter"
                    value={colorFilter}
                    onChange={(e) => {
                      setColorFilter(e.target.value)
                      setLibraryPage(0)
                    }}
                  >
                    <option>Any color</option>
                    <option>Light</option>
                    <option>Dark</option>
                  </select>
                  <select
                    aria-label="Sort frames"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                  >
                    <option>Collection</option>
                    <option>A–Z</option>
                    <option>Recently used</option>
                  </select>
                </div>
                <div className="studio-frame-grid">
                  {matchingFrames
                    .slice(libraryPage * 12, libraryPage * 12 + 12)
                    .map((f) => (
                      <article
                        className={
                          (frameCandidate?.id ?? c.frameId) === f.id
                            ? "active"
                            : ""
                        }
                        key={f.id}
                      >
                        <button
                          className="frame-pick"
                          onClick={() => setFrameCandidate(f)}
                        >
                          <div
                            className="frame-mini"
                            style={{ background: f.background }}
                          >
                            <div className="frame-mini-photos">
                              {c.photos.slice(0, 4).map((p) => (
                                <img src={p.src} key={p.id} alt="" />
                              ))}
                            </div>
                            <img
                              className="frame-vector"
                              src={f.preview}
                              alt=""
                            />
                          </div>
                          <strong>{f.name.split(" · ")[0]}</strong>
                          <span>{f.name.split(" · ")[1]}</span>
                        </button>
                        <button
                          className={`frame-fav ${
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
                </div>
                <Pagination
                  page={libraryPage}
                  count={matchingFrames.length}
                  setPage={setLibraryPage}
                />
                {!matchingFrames.length && (
                  <p className="library-empty">
                    No frames match. Try another collection or search.
                  </p>
                )}
                <div className="frame-customize">
                  <span className="mini-label">INK COLOR</span>
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
                  />
                  <Range
                    label="Border width"
                    value={c.borderWidth}
                    max={30}
                    onChange={(v) => commit({ ...c, borderWidth: v })}
                  />
                  <Range
                    label="Photo spacing"
                    value={c.spacing}
                    max={20}
                    onChange={(v) => commit({ ...c, spacing: v })}
                  />
                  <Range
                    label="Corner radius"
                    value={c.radius}
                    max={35}
                    onChange={(v) => commit({ ...c, radius: v })}
                  />
                  <button
                    className="text-button"
                    disabled={!c.frameId}
                    onClick={() => commit({ ...c, frameId: undefined })}
                  >
                    Remove decorative frame
                  </button>
                </div>
              </>
            )}
            {tool === "Layout" && (
              <>
                <p className="inspector-intro">
                  Layouts arrange your photos. Frames add the finishing touch.
                  Switch either without losing your edits.
                </p>
                <div className="ratio-select">
                  <span className="mini-label">CANVAS SIZE</span>
                  <select
                    aria-label="Canvas aspect ratio"
                    value={c.aspectRatio ?? "original"}
                    onChange={(e) =>
                      commit({
                        ...c,
                        aspectRatio: e.target
                          .value as Composition["aspectRatio"],
                      })
                    }
                  >
                    <option value="original">
                      Original · {template.width} × {template.height}
                    </option>
                    <option value="square">Square · 1800 × 1800</option>
                    <option value="story">Story · 1440 × 2560</option>
                    <option value="landscape">Landscape · 2400 × 1600</option>
                  </select>
                </div>
                <div className="layout-card-grid">
                  {templatesForCount(
                    c.photos.length as PhotoTemplate["count"],
                  ).map((t) => (
                    <button
                      className={
                        c.mode !== "freeform" && c.templateId === t.id
                          ? "active"
                          : ""
                      }
                      key={t.id}
                      onClick={() => switchLayout(t)}
                    >
                      <div
                        className="layout-mini"
                        style={{
                          aspectRatio: `${t.width}/${t.height}`,
                          background: c.background,
                        }}
                      >
                        {t.slots.map((s, i) => (
                          <span
                            key={i}
                            style={{
                              left: `${s.x}%`,
                              top: `${s.y}%`,
                              width: `${s.width}%`,
                              height: `${s.height}%`,
                            }}
                          >
                            {i + 1}
                          </span>
                        ))}
                      </div>
                      <strong>{t.name}</strong>
                    </button>
                  ))}
                  <button
                    className={c.mode === "freeform" ? "active" : ""}
                    onClick={() => commit(enterFreeform(c, template))}
                  >
                    <div className="freeform-illustration">
                      <ImagesIllustration />
                    </div>
                    <strong>My own arrangement</strong>
                    <span>Drag, overlap, make it yours</span>
                  </button>
                </div>
                <button
                  className="button secondary wide"
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
                    <div className="library-chips">
                      {[
                        "All looks",
                        ...new Set(filterPresets.map((p) => p.category)),
                      ].map((cat) => (
                        <button
                          className={filterCategory === cat ? "active" : ""}
                          key={cat}
                          onClick={() => setFilterCategory(cat)}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                    <div className="studio-filter-grid">
                      {filterPresets
                        .filter(
                          (p) =>
                            !filterPresets.some(
                              (x) => x.category === filterCategory,
                            ) || p.category === filterCategory,
                        )
                        .map((p) => (
                          <button
                            className={
                              currentAdjustments.filter === p.name
                                ? "active"
                                : ""
                            }
                            key={p.name}
                            title={p.description}
                            onClick={() => updatePhoto({ filter: p.name })}
                          >
                            <div>
                              <StudioPreview
                                maxEdge={140}
                                composition={{
                                  ...c,
                                  mode: "guided",
                                  aspectRatio: "square",
                                  templateId: "solo-polaroid",
                                  frameId: undefined,
                                  photos: [
                                    {
                                      ...photo,
                                      transform: undefined,
                                      adjustments: {
                                        ...defaultAdjustments(),
                                        filter: p.name,
                                      },
                                    },
                                  ],
                                  stickers: [],
                                  texts: [],
                                  layerOrder: undefined,
                                }}
                              />
                            </div>
                            <strong>{p.name}</strong>
                            <span>{p.category}</span>
                          </button>
                        ))}
                    </div>
                    <Range
                      label="Filter intensity"
                      value={currentAdjustments.intensity}
                      onChange={(v) => updatePhoto({ intensity: v })}
                      onReset={() => updatePhoto({ intensity: 100 })}
                    />
                    <button
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
                      className="text-button"
                      onClick={() =>
                        updatePhoto({ filter: "Original", intensity: 100 })
                      }
                    >
                      Reset filter
                    </button>
                  </>
                ) : (
                  <p className="library-empty">
                    Select a photo to explore {filterPresets.length} original
                    looks.
                  </p>
                )}
              </>
            )}
            {tool === "Stickers" && (
              <>
                <div className="library-summary">
                  <span>{stickers.length} original transparent vectors</span>
                  <button onClick={() => stickerInput.current?.click()}>
                    <ImagePlus size={13} />
                    Import your own
                  </button>
                </div>
                <div className="library-chips">
                  {["All packs", "Favorites", "Recent", ...stickerPacks].map(
                    (p) => (
                      <button
                        className={pack === p ? "active" : ""}
                        key={p}
                        onClick={() => {
                          setPack(p)
                          setLibraryPage(0)
                        }}
                      >
                        {p}
                      </button>
                    ),
                  )}
                </div>
                <div className="sticker-library">
                  {matchingStickers
                    .slice(libraryPage * 24, libraryPage * 24 + 24)
                    .map((s) => (
                      <article key={s.id}>
                        <button onClick={() => addSticker(s.id)} title={s.name}>
                          <img src={stickerUrl(s)} alt="" />
                          <span>{s.name}</span>
                        </button>
                        <button
                          className="sticker-fav"
                          aria-label={`Favorite ${s.name}`}
                          onClick={() =>
                            setStickerFavorites((f) =>
                              f.includes(s.id)
                                ? f.filter((x) => x !== s.id)
                                : [...f, s.id],
                            )
                          }
                        >
                          <Heart
                            size={10}
                            fill={
                              stickerFavorites.includes(s.id)
                                ? "currentColor"
                                : "none"
                            }
                          />
                        </button>
                      </article>
                    ))}
                </div>
                <Pagination
                  page={libraryPage}
                  count={matchingStickers.length}
                  pageSize={24}
                  setPage={setLibraryPage}
                />
                {sticker && (
                  <div className="selected-decoration">
                    <h3>{sticker.name ?? "Your sticker"}</h3>
                    <Swatches
                      value={sticker.color}
                      onChange={(color) => updateSticker({ color })}
                    />
                    <Range
                      label="Sticker size"
                      value={sticker.size}
                      min={2}
                      max={100}
                      onChange={(size) => updateSticker({ size })}
                    />
                    <Range
                      label="Sticker rotation"
                      value={sticker.rotation}
                      min={-180}
                      max={180}
                      onChange={(rotation) => updateSticker({ rotation })}
                    />
                    <button
                      className="studio-small-button"
                      onClick={() => updateSticker({ flipX: !sticker.flipX })}
                    >
                      Flip sticker
                    </button>
                  </div>
                )}
                <p className="inspector-footnote">
                  Imported images keep transparency. Automatic background
                  removal is not included.
                </p>
              </>
            )}
            {tool === "Text" && (
              <>
                <label className="studio-field">
                  Your words
                  <textarea
                    value={caption}
                    rows={3}
                    maxLength={400}
                    onChange={(e) => setCaption(e.target.value)}
                    placeholder="Write a little something…"
                  />
                </label>
                <div className="choices">
                  <button
                    className="button secondary"
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
                            color: "#4c4d43",
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
                    className="text-button"
                    onClick={() => setCaption(new Date().toLocaleDateString())}
                  >
                    Today’s date
                  </button>
                </div>
                {text && (
                  <>
                    <label className="studio-field">
                      Selected caption
                      <textarea
                        rows={2}
                        value={text.text}
                        onChange={(e) => updateText({ text: e.target.value })}
                      />
                    </label>
                    <div className="font-options">
                      {(["hand", "serif", "sans"] as const).map((font) => (
                        <button
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
                    <Swatches
                      value={text.color}
                      onChange={(color) => updateText({ color })}
                    />
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
                      onChange={(letterSpacing) =>
                        updateText({ letterSpacing })
                      }
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
                          className={`chip ${
                            text.align === align ? "selected" : ""
                          }`}
                          key={align}
                          onClick={() => updateText({ align })}
                        >
                          {align}
                        </button>
                      ))}
                    </div>
                    <label className="toggle-row">
                      Caption card
                      <input
                        type="checkbox"
                        checked={!!text.labelColor}
                        onChange={(e) =>
                          updateText({
                            labelColor: e.target.checked
                              ? "#f8f2e6"
                              : undefined,
                          })
                        }
                      />
                    </label>
                  </>
                )}
              </>
            )}
            {tool === "Background" && (
              <>
                <span className="mini-label">YOUR PAPER PALETTE</span>
                <Swatches
                  value={c.background}
                  onChange={(background) => commit({ ...c, background })}
                />
                <div className="background-grid">
                  {backgroundPatterns.map((p) => (
                    <button
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
                <Range
                  label="Texture opacity"
                  value={(c.backgroundOpacity ?? 0.35) * 100}
                  onChange={(v) => commit({ ...c, backgroundOpacity: v / 100 })}
                />
                <p className="inspector-footnote">
                  Textures stay separate from your original photos and are
                  reproduced in exports.
                </p>
              </>
            )}
            {tool === "Layers" && (
              <>
                <div className="layer-list">
                  {[...layers].reverse().map((l) => (
                    <div
                      className={`layer-row ${
                        selected === l.id ? "active" : ""
                      }`}
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
                        className="layer-select"
                        onClick={() => setSelected(l.id)}
                      >
                        <span className="layer-thumb">
                          <LayerThumb c={c} id={l.id} />
                        </span>
                        <span>
                          <strong>{l.label.slice(0, 26)}</strong>
                          <small>
                            {l.kind}
                            {l.properties.groupId ? " · grouped" : ""}
                          </small>
                        </span>
                      </button>
                      <button
                        className="studio-icon"
                        aria-label={`${
                          l.properties.hidden ? "Show" : "Hide"
                        } ${l.label}`}
                        onClick={() =>
                          commit(
                            patchLayer(c, l.id, {
                              hidden: !l.properties.hidden,
                            }),
                          )
                        }
                      >
                        {l.properties.hidden ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                      </button>
                      <button
                        className="studio-icon"
                        disabled={l.kind === "frame"}
                        aria-label={`${
                          l.properties.locked ? "Unlock" : "Lock"
                        } ${l.label}`}
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
                  ))}
                </div>
                <div className="group-actions">
                  <button
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
                    Group selected
                  </button>
                  <button
                    disabled={
                      multi.filter((id) =>
                        c.photos.some((p) => p.id === id && !p.locked),
                      ).length < 3
                    }
                    onClick={() =>
                      commit(distributePhotos(c, template, multi, "x"))
                    }
                  >
                    Space horizontally
                  </button>
                  <button
                    disabled={
                      multi.filter((id) =>
                        c.photos.some((p) => p.id === id && !p.locked),
                      ).length < 3
                    }
                    onClick={() =>
                      commit(distributePhotos(c, template, multi, "y"))
                    }
                  >
                    Space vertically
                  </button>
                  <button
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
                    disabled={!layer || layer.kind === "frame"}
                    onClick={copyLayer}
                  >
                    Copy
                  </button>
                  <button disabled={!clipboard.current} onClick={pasteLayer}>
                    Paste
                  </button>
                </div>
                {layer && (
                  <div className="layer-properties">
                    <span className="mini-label">
                      SELECTED {layer.kind.toUpperCase()}
                    </span>
                    <label className="studio-field">
                      Layer name
                      <input
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
                        <label className="studio-field">
                          Blend mode
                          <select
                            value={layer.properties.blend ?? "source-over"}
                            onChange={(e) =>
                              updateLayer({
                                blend: e.target
                                  .value as LayerProperties["blend"],
                              })
                            }
                          >
                            <option value="source-over">Normal</option>
                            <option value="multiply">Multiply</option>
                            <option value="screen">Screen</option>
                          </select>
                        </label>
                      </>
                    )}
                    {photo &&
                      c.mode === "freeform" &&
                      (["x", "y", "width", "height", "rotation"] as const).map(
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
                <div className="background-layer-row">
                  <Paintbrush size={17} />
                  <span>
                    Background · {c.backgroundPattern ?? "solid paper"}
                  </span>
                  <button onClick={() => setPanel("Background")}>Edit</button>
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
        </aside>
      </div>
      {confirmDelete && (
        <div className="modal-backdrop">
          <section
            className="confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-label="Remove layer"
          >
            <h2>Remove this piece?</h2>
            <p>
              This removes only the selected layer from this project. You can
              undo it. Your original file is never changed.
            </p>
            <div className="choices">
              <button
                className="button secondary"
                onClick={() => setConfirmDelete(false)}
              >
                Keep it
              </button>
              <button
                className="button primary"
                onClick={() => {
                  commit(deleteLayer(c, selected))
                  setSelected("")
                  setConfirmDelete(false)
                }}
              >
                Remove layer
              </button>
            </div>
          </section>
        </div>
      )}
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
