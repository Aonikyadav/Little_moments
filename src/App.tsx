import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react"
import {
  Camera,
  ArrowRight,
  ArrowLeft,
  Plus,
  Heart,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  Home,
  Settings,
  X,
  Check,
  Copy,
  Download,
  Upload,
  RotateCcw,
  Undo2,
  Redo2,
  SwitchCamera,
  Loader2,
  Trash2,
  Share2,
  Search,
  Star,
  Flower2,
  Smile,
  Pencil,
  ChevronRight,
  Aperture,
  Eye,
  Music,
  Palette,
  Layers,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Clock,
  Menu,
  Bookmark,
  Paintbrush,
  Grid2X2,
} from "lucide-react"
import type {
  Composition,
  BoothSettings,
  Photo,
  PhotoCount,
  PhotoTemplate,
  FilterName,
} from "./types"
import { defaultAdjustments } from "./types"
import { templates, getTemplate, templatesForCount } from "./templates"
import { cssFilter, renderComposition } from "./rendering"
import "./studio/studio.css"
import { dimensions, historyStep } from "./studio/model"
import { saveProject, loadProjects, removeProject } from "./studio/storage"
import useFontRevision from "./studio/useFontRevision"
import { TemplateThumbnail } from "./components/TemplateThumbnail"

const Studio = lazy(() => import("./studio/Studio"))
const samples = [
  "/photos/couple.jpg",
  "/photos/booth.jpg",
  "/photos/kiss.jpg",
  "/photos/friends.jpg",
  "/photos/moments.jpg",
  "/photos/bday.jpg",
]

const counts: PhotoCount[] = [1, 2, 3, 4, 5, 6, 8, 9]

const defaultSettings: BoothSettings = {
  count: 4,
  countdown: 3,
  interval: 3,
  facingMode: "user",
  mirror: true,
  flash: true,
  sound: false,
  visualCountdown: true,
  captureFilter: "Original",
}

const emptyComposition = (id = "tmpl-001"): Composition => {
  const t = getTemplate(id)
  return {
    templateId: id,
    background: t.background,
    borderColor: "#171717",
    borderWidth: 0,
    radius: 2,
    spacing: 0,
    padding: 0,
    photos: [],
    stickers: [],
    texts: [],
  }
}

type Saved = {
  id: string
  date: string
  image: string
  composition: Composition
}

type Page =
  | "home"
  | "templates"
  | "creations"
  | "settings"
  | "setup"
  | "camera"
  | "review"
  | "editor"
  | "export"

export type SortOption = "recommended" | "popular" | "newest" | "simple" | "complex"

function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback
  } catch {
    return fallback
  }
}

function Preview({ composition }: { composition: Composition }) {
  const fontRevision = useFontRevision()
  const ref = useRef<HTMLCanvasElement>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    let active = true
    const buffer = document.createElement("canvas")
    renderComposition(
      buffer,
      composition,
      getTemplate(composition.templateId),
      0.5,
    )
      .then(() => {
        if (active && ref.current) {
          ref.current.width = buffer.width
          ref.current.height = buffer.height
          ref.current.getContext("2d")?.drawImage(buffer, 0, 0)
        }
      })
      .catch(() => setError("Could not load photo preview. Try replacing photos."))
    return () => {
      active = false
    }
  }, [composition, fontRevision])

  return (
    <>
      {error ? (
        <p className="text-xs text-stone-500 font-mono py-8">{error}</p>
      ) : (
        <canvas
          ref={ref}
          className="max-w-full max-h-[500px] object-contain shadow-md border-2 border-stone-900"
          aria-label="Your photo composition"
        />
      )}
    </>
  )
}



export default function App() {
  const [page, setPage] = useState<Page>("home")
  const [settings, setSettings] = useState<BoothSettings>(() =>
    readLocal("little-settings", defaultSettings),
  )
  const [composition, setComposition] = useState<Composition>(() =>
    emptyComposition(),
  )
  const [saved, setSaved] = useState<Saved[]>(() =>
    readLocal("little-creations", []),
  )
  const [favorites, setFavorites] = useState<string[]>(() =>
    readLocal("little-favorites", []),
  )
  const [usageHistory, setUsageHistory] = useState<Record<string, number>>(() =>
    readLocal("little-template-usage", {}),
  )
  const [recentTemplates, setRecentTemplates] = useState<string[]>(() => {
    const stored = readLocal<string[]>("little-recent-templates", [])
    if (stored.length > 0) return stored.slice(0, 5)
    const creations = readLocal<Saved[]>("little-creations", [])
    const seeded = creations.map((c) => c.composition?.templateId).filter(Boolean)
    return Array.from(new Set([...seeded, "tmpl-user-047", "tmpl-user-050", "tmpl-user-052"])).slice(0, 5)
  })
  const [toast, setToast] = useState("")
  const [category, setCategory] = useState("All styles")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [countFilter, setCountFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortOption>("recommended")
  const [query, setQuery] = useState("")
  const [selectedSlot, setSelectedSlot] = useState(0)
  const [history, setHistory] = useState<Composition[]>([])
  const [future, setFuture] = useState<Composition[]>([])
  const [format, setFormat] = useState<"png" | "jpeg">("png")
  const [exportScale, setExportScale] = useState<number>(1)
  const [busy, setBusy] = useState(false)
  const [saveStatus, setSaveStatus] = useState("Saved on this device")
  const [recovery, setRecovery] = useState<Composition | null>(null)
  const [cameraState, setCameraState] = useState<"idle" | "loading" | "ready" | "denied" | "unavailable">("idle")
  const [demoMode, setDemoMode] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [burstCount, setBurstCount] = useState({ current: 0, total: 4 })
  const [flashActive, setFlashActive] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<PhotoTemplate | null>(null)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const draftReady = useRef(false)
  const documentRevision = useRef(0)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const cancel = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const slotReplaceIndex = useRef<number | null>(null)

  const notify = (s: string) => setToast(s)

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3800)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    try {
      localStorage.setItem("little-settings", JSON.stringify(settings))
    } catch {
      notify("Settings could not be stored.")
    }
  }, [settings])

  useEffect(() => {
    try {
      localStorage.setItem("little-favorites", JSON.stringify(favorites))
    } catch {
      notify("Favorites could not be stored.")
    }
  }, [favorites])

  useEffect(() => {
    try {
      localStorage.setItem("little-template-usage", JSON.stringify(usageHistory))
    } catch {
      // ignore
    }
  }, [usageHistory])

  useEffect(() => {
    try {
      localStorage.setItem("little-recent-templates", JSON.stringify(recentTemplates))
    } catch {
      // ignore
    }
  }, [recentTemplates])

  // Stop camera when navigating away from booth
  useEffect(() => {
    if (page !== "camera" && page !== "setup") {
      cancel.current = true
      stream.current?.getTracks().forEach((t) => t.stop())
      stream.current = null
      setCameraState("idle")
      setCapturing(false)
      setCountdown(null)
    }
  }, [page])

  // Automatically ensure video element has the active stream
  useEffect(() => {
    if (video.current && stream.current && video.current.srcObject !== stream.current) {
      video.current.srcObject = stream.current
      video.current.play().catch(() => {})
    }
  }, [cameraState, demoMode, settings.facingMode])

  useEffect(() => {
    return () => {
      cancel.current = true
      stream.current?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  useEffect(() => {
    let active = true
    loadProjects()
      .then((records) => {
        if (!active) return
        const draft = records.find((r) => r.id === "draft")
        if (draft?.composition.photos.length) {
          setRecovery(draft.composition)
        }
        setSaved((old) => [
          ...records.filter((r) => r.id !== "draft"),
          ...old.filter((r) => !records.some((n) => n.id === r.id)),
        ])
        draftReady.current = true
      })
      .catch(() => {
        draftReady.current = true
        setSaveStatus("Ready")
      })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    documentRevision.current++
    if (!composition.photos.length || !draftReady.current) return
    setSaveStatus("Unsaved changes")
    let active = true
    const timer = setTimeout(() => {
      setSaveStatus("Saving...")
      saveProject({
        id: "draft",
        date: new Date().toISOString(),
        image: "",
        composition,
      })
        .then(() => {
          if (active) {
            setSaveStatus("Saved locally")
            setRecovery(composition)
          }
        })
        .catch(() => {
          if (active) setSaveStatus("Save failed")
        })
    }, 650)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [composition])

  const edit = (next: Composition, before?: Composition) => {
    setHistory((h) => [...h.slice(-49), before ?? composition])
    setFuture([])
    setComposition(next)
  }

  const undo = () => {
    if (!history.length) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setFuture((f) => [composition, ...f])
    setComposition(prev)
  }

  const redo = () => {
    if (!future.length) return
    const next = future[0]
    setFuture((f) => f.slice(1))
    setHistory((h) => [...h, composition])
    setComposition(next)
  }

  const toggleFavorite = (id: string) => {
    const isAdding = !favorites.includes(id)
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
    if (isAdding) {
      notify("♥ Favorited! Recommendations updated dynamically.")
    } else {
      notify("Removed from favorites.")
    }
  }

  const recordTemplateUsage = (templateId: string) => {
    if (!templateId) return
    setUsageHistory((prev) => {
      const next = { ...prev, [templateId]: (prev[templateId] || 0) + 1 }
      try {
        localStorage.setItem("little-template-usage", JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
    setRecentTemplates((prev) => {
      const next = [templateId, ...prev.filter((id) => id !== templateId)].slice(0, 5)
      try {
        localStorage.setItem("little-recent-templates", JSON.stringify(next))
      } catch {
        // ignore
      }
      return next
    })
  }

  const applyTemplate = (t: PhotoTemplate) => {
    recordTemplateUsage(t.id)
    const nextComp = {
      ...composition,
      templateId: t.id,
      background: t.background,
    }
    setComposition(nextComp)
    setSettings((s) => ({ ...s, count: t.count }))
    setPreviewTemplate(null)
  }

  const startWithTemplate = (t: PhotoTemplate, mode: "booth" | "upload" | "sample") => {
    applyTemplate(t)
    if (mode === "booth") {
      setPage("camera")
      openCamera()
    } else if (mode === "upload") {
      setPage("review")
      slotReplaceIndex.current = null
      fileInput.current?.click()
    } else {
      // populate sample photos so user can start editing immediately
      const samplePhotos: Photo[] = Array.from({ length: t.count }, (_, i) => ({
        id: crypto.randomUUID(),
        src: samples[i % samples.length],
        name: `Sample Photo ${i + 1}`,
        adjustments: defaultAdjustments(),
      }))
      setComposition((c) => ({ ...c, photos: samplePhotos }))
      setPage("editor")
      notify(`Loaded ${t.name} with sample photos. Edit them in the Studio.`)
    }
  }

  const upload = async (files: FileList | null) => {
    if (!files) return
    try {
      const photos: Photo[] = []
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue
        const src = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(String(reader.result))
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        photos.push({
          id: crypto.randomUUID(),
          src,
          name: file.name,
          adjustments: defaultAdjustments(),
        })
      }
      if (slotReplaceIndex.current !== null && photos[0]) {
        const idx = slotReplaceIndex.current
        setComposition((c) => ({
          ...c,
          photos: c.photos.map((p, i) => (i === idx ? photos[0] : p)),
        }))
        slotReplaceIndex.current = null
        notify(`Replaced photo in Slot ${idx + 1}`)
      } else {
        setComposition((c) => ({
          ...c,
          photos: [...c.photos, ...photos].slice(0, settings.count),
        }))
        notify(`Added ${photos.length} photo(s).`)
      }
      if (page !== "editor" && page !== "review") {
        setPage("review")
      }
    } catch {
      notify("Could not read image file. Please try another.")
    }
    if (fileInput.current) fileInput.current.value = ""
  }

  const openCamera = async () => {
    setCameraState("loading")
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia not supported in this browser context")
      }
      if (stream.current) {
        stream.current.getTracks().forEach((t) => t.stop())
        stream.current = null
      }
      const media = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: settings.facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      })
      stream.current = media
      if (video.current) {
        video.current.srcObject = media
        try {
          await video.current.play()
        } catch (playErr) {
          console.warn("Autoplay was prevented, will resume on interaction:", playErr)
        }
      }
      setDemoMode(false)
      setCameraState("ready")
    } catch (e) {
      console.warn("Camera access failed or unavailable, activating demo studio sensor:", e)
      const isDenied = e instanceof DOMException && e.name === "NotAllowedError"
      setCameraState(isDenied ? "denied" : "unavailable")
      setDemoMode(true)
    }
  }

  const takeSingleSnapshot = async (shotIndex: number): Promise<string> => {
    const v = video.current
    const canvas = document.createElement("canvas")
    const width = 1280
    const height = 960
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext("2d")
    if (!ctx) throw new Error("Cannot get 2d context")

    const sampleUrl = samples[shotIndex % samples.length]
    let captured = false

    // 1. Try real video frame if active and ready with non-zero dimensions
    if (!demoMode && v && v.srcObject && v.readyState >= 2 && v.videoWidth > 0 && v.videoHeight > 0) {
      try {
        ctx.save()
        if (settings.mirror && settings.facingMode === "user") {
          ctx.translate(canvas.width, 0)
          ctx.scale(-1, 1)
        }
        const vAspect = v.videoWidth / v.videoHeight
        const cAspect = canvas.width / canvas.height
        let dw = canvas.width
        let dh = canvas.height
        let dx = 0
        let dy = 0
        if (vAspect > cAspect) {
          dw = canvas.height * vAspect
          dx = (canvas.width - dw) / 2
        } else {
          dh = canvas.width / vAspect
          dy = (canvas.height - dh) / 2
        }
        ctx.drawImage(v, dx, dy, dw, dh)
        ctx.restore()
        captured = true
      } catch (err) {
        console.warn("Could not capture video frame:", err)
      }
    }

    // 2. High-quality photobooth snapshot fallback if live stream isn't producing frames
    if (!captured) {
      await new Promise<void>((resolve) => {
        let finished = false
        const timer = setTimeout(() => {
          if (!finished) {
            finished = true
            resolve()
          }
        }, 1200)

        const img = new Image()
        img.onload = () => {
          if (finished) return
          finished = true
          clearTimeout(timer)
          try {
            ctx.save()
            if (settings.mirror && settings.facingMode === "user") {
              ctx.translate(canvas.width, 0)
              ctx.scale(-1, 1)
            }
            const imgAspect = img.naturalWidth / img.naturalHeight
            const cAspect = canvas.width / canvas.height
            let dw = canvas.width
            let dh = canvas.height
            let dx = 0
            let dy = 0
            if (imgAspect > cAspect) {
              dw = canvas.height * imgAspect
              dx = (canvas.width - dw) / 2
            } else {
              dh = canvas.width / imgAspect
              dy = (canvas.height - dh) / 2
            }
            ctx.drawImage(img, dx, dy, dw, dh)
            ctx.restore()
            captured = true
          } catch (e) {
            console.warn("Could not draw sample to canvas:", e)
          }
          resolve()
        }
        img.onerror = () => {
          if (finished) return
          finished = true
          clearTimeout(timer)
          resolve()
        }
        img.src = sampleUrl
      })

      // 3. Guaranteed photobooth graphic fallback if image was blocked or slow
      if (!captured) {
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
        grad.addColorStop(0, "#2c2824")
        grad.addColorStop(1, "#181615")
        ctx.fillStyle = grad
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.fillStyle = "#faf8f2"
        ctx.font = "bold 44px monospace"
        ctx.textAlign = "center"
        ctx.fillText(`PHOTOBOOTH SHOT #${shotIndex + 1}`, canvas.width / 2, canvas.height / 2 - 20)
        ctx.font = "26px monospace"
        ctx.fillStyle = "#d6d3d1"
        ctx.fillText(
          new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
          canvas.width / 2,
          canvas.height / 2 + 35,
        )
      }
    }

    // Apply live capture filter if selected safely
    try {
      if (settings.captureFilter === "Mono") {
        try {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const d = imgData.data
          for (let p = 0; p < d.length; p += 4) {
            const gray = 0.299 * d[p] + 0.587 * d[p + 1] + 0.114 * d[p + 2]
            d[p] = gray
            d[p + 1] = gray
            d[p + 2] = gray
          }
          ctx.putImageData(imgData, 0, 0)
        } catch {
          ctx.save()
          ctx.globalCompositeOperation = "color"
          ctx.fillStyle = "#777777"
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          ctx.restore()
        }
      } else if (settings.captureFilter === "Warm") {
        ctx.fillStyle = "rgba(220, 130, 40, 0.14)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else if (settings.captureFilter === "Cool") {
        ctx.fillStyle = "rgba(40, 130, 220, 0.14)"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      return canvas.toDataURL("image/jpeg", 0.92)
    } catch (exportErr) {
      console.warn("Canvas export fallback to sampleUrl:", exportErr)
      return sampleUrl
    }
  }

  const startBurstCapture = async () => {
    if (capturing) return
    cancel.current = false
    setCapturing(true)
    const needed = currentTemplate?.count || settings.count || 4
    const newPhotos = [...composition.photos]

    setBurstCount({ current: 0, total: needed })

    for (let i = 0; i < needed; i++) {
      if (cancel.current) break
      setBurstCount({ current: i + 1, total: needed })

      const seconds = i === 0 ? settings.countdown : settings.interval
      for (let s = seconds; s > 0; s--) {
        if (cancel.current) break
        setCountdown(s)
        await new Promise((r) => setTimeout(r, 1000))
      }
      if (cancel.current) break
      setCountdown(null)

      // Flash effect
      if (settings.flash) {
        setFlashActive(true)
        setTimeout(() => setFlashActive(false), 300)
      }

      try {
        const src = await takeSingleSnapshot(i)
        newPhotos[i] = {
          id: crypto.randomUUID(),
          src,
          name: `Booth Shot ${i + 1}`,
          adjustments: defaultAdjustments(),
        }
        setComposition((c) => ({ ...c, photos: [...newPhotos] }))
      } catch (err) {
        console.error("Snapshot error fallback:", err)
        newPhotos[i] = {
          id: crypto.randomUUID(),
          src: samples[i % samples.length],
          name: `Booth Shot ${i + 1}`,
          adjustments: defaultAdjustments(),
        }
        setComposition((c) => ({ ...c, photos: [...newPhotos] }))
      }

      // Small pause between burst shots
      await new Promise((r) => setTimeout(r, 600))
    }

    setCapturing(false)
    setCountdown(null)
    if (!cancel.current) {
      notify(`Captured all ${needed} booth shots!`)
      setPage("review")
    }
  }

  const saveCurrentCreation = async () => {
    try {
      await document.fonts.ready
      const preview = await renderComposition(
        document.createElement("canvas"),
        composition,
        getTemplate(composition.templateId),
        0.3,
      )
      const entry: Saved = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        image: preview.toDataURL("image/jpeg", 0.8),
        composition,
      }
      await saveProject(entry)
      recordTemplateUsage(composition.templateId)
      setSaved((prev) => [entry, ...prev.filter((x) => x.id !== entry.id)])
      notify("Creation saved to your local gallery!")
    } catch {
      notify("Could not save to local storage.")
    }
  }

  const exportFinal = async () => {
    setBusy(true)
    try {
      await document.fonts.ready
      const canvas = document.createElement("canvas")
      const t = getTemplate(composition.templateId)
      await renderComposition(canvas, composition, t, exportScale)
      const mime = format === "png" ? "image/png" : "image/jpeg"
      const dataUrl = canvas.toDataURL(mime, 0.95)
      
      const a = document.createElement("a")
      a.href = dataUrl
      a.download = `little-moments-${t.id}-${Date.now()}.${format}`
      a.click()
      notify("Download started!")
      await saveCurrentCreation()
    } catch {
      notify("Export failed. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  // Dynamic Recommendation Engine based on user's favorited templates and layout usage history
  const preferenceProfiles = useMemo(() => {
    const favoriteTemplates = favorites
      .map((id) => {
        try {
          return getTemplate(id)
        } catch {
          return null
        }
      })
      .filter((t): t is PhotoTemplate => Boolean(t))

    // Aggregate layout usage from state and saved creations
    const combinedUsage: Record<string, number> = { ...usageHistory }
    saved.forEach((s) => {
      const tid = s.composition.templateId
      if (tid) {
        combinedUsage[tid] = (combinedUsage[tid] || 0) + 2
      }
    })

    const categoryWeights: Record<string, number> = {}
    const countWeights: Record<number, number> = {}
    const orientationWeights: Record<string, number> = {}

    // Weight from explicit favorites (highest signal)
    favoriteTemplates.forEach((t) => {
      categoryWeights[t.category] = (categoryWeights[t.category] || 0) + 6
      countWeights[t.count] = (countWeights[t.count] || 0) + 6
      orientationWeights[t.orientation] = (orientationWeights[t.orientation] || 0) + 3
    })

    // Weight from frequently used templates & saved creations
    Object.entries(combinedUsage).forEach(([tid, count]) => {
      try {
        const t = getTemplate(tid)
        if (t) {
          categoryWeights[t.category] = (categoryWeights[t.category] || 0) + count * 3
          countWeights[t.count] = (countWeights[t.count] || 0) + count * 4
          orientationWeights[t.orientation] = (orientationWeights[t.orientation] || 0) + count * 2
        }
      } catch {
        // ignore unknown template ids
      }
    })

    const hasPreferences =
      favorites.length > 0 || Object.keys(combinedUsage).length > 0

    const topCountEntry = Object.entries(countWeights).sort((a, b) => b[1] - a[1])[0]
    const topCategoryEntry = Object.entries(categoryWeights).sort((a, b) => b[1] - a[1])[0]

    return {
      favoriteTemplates,
      combinedUsage,
      categoryWeights,
      countWeights,
      orientationWeights,
      hasPreferences,
      favoriteCount: favorites.length,
      usedLayoutCount: Object.keys(combinedUsage).length,
      topCount: topCountEntry ? Number(topCountEntry[0]) : null,
      topCategory: topCategoryEntry ? topCategoryEntry[0] : null,
    }
  }, [favorites, usageHistory, saved])

  const getRecommendationScore = (t: PhotoTemplate): number => {
    let score = 0

    // 1. Direct Favorite (+200 pts)
    if (favorites.includes(t.id)) {
      score += 200
    }

    // 2. Direct Usage Frequency (+35 pts per usage, capped at 140)
    const usage = preferenceProfiles.combinedUsage[t.id] || 0
    score += Math.min(usage * 35, 140)

    // 3. Category/Style match with user's favorite & frequent styles (up to 75 pts)
    const catWeight = preferenceProfiles.categoryWeights[t.category] || 0
    score += Math.min(catWeight * 10, 75)

    // 4. Layout Cut Count match with user's favorite & frequent counts (up to 65 pts)
    const countWeight = preferenceProfiles.countWeights[t.count] || 0
    score += Math.min(countWeight * 9, 65)

    // 5. Orientation match (up to 20 pts)
    const oriWeight = preferenceProfiles.orientationWeights[t.orientation] || 0
    score += Math.min(oriWeight * 4, 20)

    // 6. Booth Popularity & Versatility Baseline (helps cold-start and subtle ties)
    if (t.count === 4) score += 22 // 4-cut classic photobooth strip
    if (t.category.includes("Romantic") || t.category.includes("Retro") || t.category.includes("Coquette")) {
      score += 15
    }
    if (t.id === "tmpl-user-047" || t.id === "tmpl-user-050" || t.id === "tmpl-user-052" || t.id === "tmpl-user-053" || t.id === "tmpl-user-054") {
      score += 35
    }

    return score
  }

  type BadgeInfo = {
    label: string
    reason: string
    icon: string
    cardBadgeStyle: string
    contentBadgeStyle: string
  }

  const getRecommendationBadge = (t: PhotoTemplate): BadgeInfo | null => {
    // If viewing Recent category, emphasize recent order
    if (category === "Recent" || category.startsWith("Recent")) {
      const recentIndex = recentTemplates.slice(0, 5).indexOf(t.id)
      if (recentIndex === 0) {
        return {
          label: "Latest Used",
          reason: "Most recently used template",
          icon: "⏱",
          cardBadgeStyle: "bg-amber-600 text-white border-stone-900 shadow-[2px_2px_0_#171717]",
          contentBadgeStyle: "bg-amber-100 text-amber-900 border-amber-500 font-bold",
        }
      }
      if (recentIndex > 0) {
        return {
          label: `Recent #${recentIndex + 1}`,
          reason: `Recently used layout (#${recentIndex + 1})`,
          icon: "⏱",
          cardBadgeStyle: "bg-stone-700 text-white border-stone-900 shadow-[2px_2px_0_#171717]",
          contentBadgeStyle: "bg-stone-200 text-stone-900 border-stone-400 font-bold",
        }
      }
    }

    // 1. Explicitly favorited
    if (favorites.includes(t.id)) {
      return {
        label: "♥ Favorited",
        reason: "In your favorites collection",
        icon: "♥",
        cardBadgeStyle: "bg-rose-600 text-white border-stone-900 shadow-[2px_2px_0_#171717]",
        contentBadgeStyle: "bg-rose-100 text-rose-900 border-rose-400 font-bold",
      }
    }

    // 2. Frequently used template in sessions
    const usage = preferenceProfiles.combinedUsage[t.id] || 0
    if (usage > 0) {
      return {
        label: `Used ${usage}x`,
        reason: `Crafted in ${usage} previous session${usage === 1 ? "" : "s"}`,
        icon: "★",
        cardBadgeStyle: "bg-emerald-700 text-white border-stone-900 shadow-[2px_2px_0_#171717]",
        contentBadgeStyle: "bg-emerald-100 text-emerald-900 border-emerald-500 font-bold",
      }
    }

    // 3. Recently used in top recent slots
    const recentIndex = recentTemplates.slice(0, 5).indexOf(t.id)
    if (recentIndex === 0) {
      return {
        label: "Recent Pick",
        reason: "Used in your latest photo session",
        icon: "⏱",
        cardBadgeStyle: "bg-amber-700 text-white border-stone-900 shadow-[2px_2px_0_#171717]",
        contentBadgeStyle: "bg-amber-100 text-amber-900 border-amber-500 font-bold",
      }
    }

    // 4. Matches user's preferred style / category
    const catWeight = preferenceProfiles.categoryWeights[t.category] || 0
    const isTopCategory = preferenceProfiles.topCategory === t.category
    if (isTopCategory || catWeight >= 3) {
      return {
        label: "Matches Style",
        reason: `Matches your style (${t.category})`,
        icon: "✦",
        cardBadgeStyle: "bg-indigo-600 text-white border-stone-900 shadow-[2px_2px_0_#171717]",
        contentBadgeStyle: "bg-indigo-100 text-indigo-900 border-indigo-500 font-bold",
      }
    }

    // 5. Matches user's preferred layout photo cut count
    const countWeight = preferenceProfiles.countWeights[t.count] || 0
    const isTopCount = preferenceProfiles.topCount === t.count
    if (isTopCount || countWeight >= 3) {
      return {
        label: `Matches Layout`,
        reason: `Fits your ${t.count}-cut preference`,
        icon: "⊞",
        cardBadgeStyle: "bg-amber-500 text-stone-950 border-stone-900 shadow-[2px_2px_0_#171717]",
        contentBadgeStyle: "bg-amber-100 text-amber-900 border-amber-500 font-bold",
      }
    }

    // 6. Classic photobooth staple
    if (t.id === "tmpl-user-047" || t.id === "tmpl-user-053" || t.count === 4) {
      return {
        label: "Booth Classic",
        reason: "Iconic photobooth staple",
        icon: "★",
        cardBadgeStyle: "bg-stone-800 text-stone-100 border-stone-900 shadow-[2px_2px_0_#171717]",
        contentBadgeStyle: "bg-stone-200 text-stone-800 border-stone-400 font-bold",
      }
    }

    return null
  }

  // Filter & dynamically sort templates
  const filteredTemplates = useMemo(() => {
    const isRecentCategory = category === "Recent" || category.startsWith("Recent")
    const top5RecentIds = recentTemplates.slice(0, 5)

    return templates.filter((t) => {
      const matchesCategory =
        category === "All styles" ||
        (isRecentCategory && top5RecentIds.includes(t.id)) ||
        (category.startsWith("My Favorites") && favorites.includes(t.id)) ||
        t.category === category ||
        (category.includes("Romantic") && (t.category.includes("Romantic") || t.category.includes("Kiss") || t.category.includes("Couple"))) ||
        (category.includes("Spider") && (t.category.includes("Spider") || t.category.includes("Cool") || t.category.includes("Animated"))) ||
        (category.includes("Birthday") && (t.category.includes("Birthday") || t.category.includes("Propose") || t.category.includes("Greeting"))) ||
        (category.includes("Retro") && t.category.includes("Retro"))

      const matchesCount =
        countFilter === "all" ||
        (countFilter === "1" && t.count === 1) ||
        (countFilter === "2" && t.count === 2) ||
        (countFilter === "3" && t.count === 3) ||
        (countFilter === "4" && t.count === 4) ||
        (countFilter === "5" && t.count === 5) ||
        (countFilter === "6" && t.count === 6) ||
        (countFilter === "8" && t.count === 8) ||
        (countFilter === "11" && ((t.count as number) === 11 || (t.count as number) >= 10)) ||
        (countFilter === "5-6" && (t.count === 5 || t.count === 6)) ||
        (countFilter === "8-9" && (t.count === 8 || t.count === 9 || (t.count as number) >= 8))

      const matchesTag =
        selectedTag === "all" ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase() === selectedTag.toLowerCase())) ||
        t.name.toLowerCase().includes(selectedTag.toLowerCase()) ||
        t.note.toLowerCase().includes(selectedTag.toLowerCase())

      const matchesQuery =
        !query.trim() ||
        t.name.toLowerCase().includes(query.toLowerCase()) ||
        t.category.toLowerCase().includes(query.toLowerCase()) ||
        t.note.toLowerCase().includes(query.toLowerCase()) ||
        (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(query.toLowerCase())))

      return matchesCategory && matchesCount && matchesTag && matchesQuery
    }).sort((a, b) => {
      if (isRecentCategory) {
        const indexA = top5RecentIds.indexOf(a.id)
        const indexB = top5RecentIds.indexOf(b.id)
        return (indexA === -1 ? 999 : indexA) - (indexB === -1 ? 999 : indexB)
      }
      if (sortBy === "recommended") {
        const scoreDiff = getRecommendationScore(b) - getRecommendationScore(a)
        if (scoreDiff !== 0) return scoreDiff
        return a.name.localeCompare(b.name)
      }
      if (sortBy === "popular") {
        const aFav = favorites.includes(a.id) ? 1 : 0
        const bFav = favorites.includes(b.id) ? 1 : 0
        if (aFav !== bFav) return bFav - aFav
        const getPopScore = (t: PhotoTemplate) => {
          let score = 50
          if (t.count === 4) score += 35
          if (t.category.includes("Romantic") || t.category.includes("Coquette")) score += 20
          if (t.id === "tmpl-user-047" || t.id === "tmpl-user-050" || t.id === "tmpl-user-052" || t.id === "tmpl-user-053" || t.id === "tmpl-user-054") score += 50
          return score
        }
        return getPopScore(b) - getPopScore(a)
      }
      if (sortBy === "newest") {
        const getNum = (id: string) => {
          const m = id.match(/\d+/)
          return m ? parseInt(m[0], 10) : 0
        }
        const numDiff = getNum(b.id) - getNum(a.id)
        if (numDiff !== 0) return numDiff
        return b.name.localeCompare(a.name)
      }
      if (sortBy === "simple") {
        if (a.count !== b.count) return a.count - b.count
        return a.name.localeCompare(b.name)
      }
      if (sortBy === "complex") {
        if (a.count !== b.count) return b.count - a.count
        return a.name.localeCompare(b.name)
      }
      return 0
    })
  }, [category, selectedTag, countFilter, query, sortBy, favorites, recentTemplates, preferenceProfiles])

  const currentTemplate = getTemplate(composition.templateId)

  return (
    <div className="min-h-screen bg-[#f5f2e9] text-[#171717] font-mono selection:bg-[#171717] selection:text-[#f5f2e9]">
      {/* CodePen Paper Texture Overlay */}
      <div className="paper-texture" aria-hidden="true" />

      {/* Hidden File Input for Device Uploads */}
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => void upload(e.target.files)}
      />

      {/* Flash Effect Overlay */}
      {flashActive && <div className="flash-overlay" aria-hidden="true" />}

      {/* Site Header - Android APK Top App Bar */}
      {page !== "editor" && (
        <header className="site-header">
        <div className="flex items-center gap-2">
          {page !== "home" && (
            <button
              type="button"
              className="w-8 h-8 rounded-full border border-stone-800 bg-stone-100 flex items-center justify-center text-stone-900 active:scale-90 transition-transform mr-1"
              onClick={() => {
                if (page === "camera" || page === "setup") setPage("templates")
                else setPage("home")
              }}
              title="Navigate back"
              aria-label="Back"
            >
              <ArrowLeft size={16} />
            </button>
          )}

          <a
            href="#"
            className="brand"
            onClick={(e) => {
              e.preventDefault()
              setPage("home")
            }}
          >
            <span className="brand-mark">LM✦</span>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <strong>Little Moments</strong>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-stone-900 text-amber-300 hidden sm:inline-block">
                  APK v2.5
                </span>
              </div>
              <small className="hidden xs:inline">photobooth · analog studio</small>
            </div>
          </a>
        </div>

        {/* Desktop Navigation (>= 1024px) */}
        <nav className="site-navigation hidden lg:flex">
          <button
            type="button"
            className={page === "home" ? "is-active" : ""}
            onClick={() => setPage("home")}
          >
            home
          </button>
          <button
            type="button"
            className={page === "templates" ? "is-active" : ""}
            onClick={() => setPage("templates")}
          >
            templates ({templates.length})
          </button>
          <button
            type="button"
            className={page === "setup" || page === "camera" || page === "review" ? "is-active" : ""}
            onClick={() => {
              setPage("camera")
              openCamera()
            }}
          >
            booth
          </button>
          <button
            type="button"
            onClick={() => {
              if (!composition.photos.length) {
                setComposition((c) => ({
                  ...c,
                  photos: Array.from({ length: currentTemplate.count }, (_, i) => ({
                    id: crypto.randomUUID(),
                    src: samples[i % samples.length],
                    name: `Sample Photo ${i + 1}`,
                    adjustments: defaultAdjustments(),
                  })),
                }))
              }
              setPage("editor")
            }}
          >
            studio
          </button>
          <button
            type="button"
            className={page === "creations" ? "is-active" : ""}
            onClick={() => setPage("creations")}
          >
            creations ({saved.length})
          </button>
          <button
            type="button"
            className={page === "settings" ? "is-active" : ""}
            onClick={() => setPage("settings")}
          >
            settings
          </button>
        </nav>

        {/* Mobile & Tablet quick actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            className="sketch-button sketch-button--sm text-xs py-1.5 px-2.5 flex items-center gap-1.5 bg-rose-600 text-white border-stone-900 shadow-[2px_2px_0_#171717] active:scale-95"
            onClick={() => {
              setPage("camera")
              openCamera()
            }}
            title="Launch Photobooth Camera"
          >
            <Camera size={14} />
            <span className="font-bold">Booth</span>
          </button>

          <button
            type="button"
            className="w-9 h-9 border-2 border-stone-900 bg-[#faf8f0] shadow-[2px_2px_0_#171717] flex items-center justify-center text-stone-900 active:scale-95 transition-transform"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </header>
      )}

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && page !== "editor" && (
        <div className="lg:hidden border-b-2 border-stone-900 bg-[#faf8f0] p-4 flex flex-col gap-2 relative z-30 shadow-[0_8px_20px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between pb-2 mb-1 border-b border-dashed border-stone-300 text-xs text-stone-500 font-mono">
            <span>Navigation Menu</span>
            <span className="text-[10px]">Little Moments Studio</span>
          </div>

          {[
            { id: "home", label: "Home Showcase", icon: Home, count: null },
            { id: "templates", label: "Browse Templates", icon: Grid2X2, count: templates.length },
            { id: "camera", label: "Photobooth Camera", icon: Camera, count: null, action: () => openCamera() },
            { id: "editor", label: "Studio Editor", icon: Paintbrush, count: null },
            { id: "creations", label: "Saved Keepsakes", icon: Bookmark, count: saved.length },
            { id: "settings", label: "Preferences & Camera", icon: Settings, count: null },
          ].map((item) => {
            const Icon = item.icon
            const isActive =
              page === item.id || (item.id === "camera" && (page === "setup" || page === "review"))
            return (
              <button
                key={item.id}
                type="button"
                className={`flex items-center justify-between text-left font-mono uppercase text-xs tracking-wider py-3 px-3 rounded border transition-colors ${
                  isActive
                    ? "bg-stone-900 text-white font-bold border-stone-900 shadow-[2px_2px_0_#d97762]"
                    : "border-stone-200 hover:bg-stone-100 text-stone-800"
                }`}
                onClick={() => {
                  if (item.action) item.action()
                  if (item.id === "editor" && !composition.photos.length) {
                    setComposition((c) => ({
                      ...c,
                      photos: Array.from({ length: currentTemplate.count }, (_, i) => ({
                        id: crypto.randomUUID(),
                        src: samples[i % samples.length],
                        name: `Sample Photo ${i + 1}`,
                        adjustments: defaultAdjustments(),
                      })),
                    }))
                  }
                  setPage(item.id as Page)
                  setMobileMenuOpen(false)
                }}
              >
                <div className="flex items-center gap-2.5">
                  <Icon size={16} className={isActive ? "text-amber-400" : "text-stone-600"} />
                  <span>{item.label}</span>
                </div>
                {item.count !== null && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${
                      isActive ? "bg-stone-800 text-stone-200" : "bg-stone-200 text-stone-700"
                    }`}
                  >
                    {item.count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* Main Container - Full width in editor mode, responsive max-7xl in other modes */}
      <main className={page === "editor" ? "w-full max-w-full p-0 m-0 pb-0 overflow-x-hidden" : "w-full max-w-7xl mx-auto px-3 sm:px-6 md:px-8 pb-28 md:pb-24 overflow-x-hidden"}>
        {/* ======================================================== */}
        {/* SCREEN 1: HOME PAGE (CodePen Hero & Featured)            */}
        {/* ======================================================== */}
        {page === "home" && (
          <>
            {/* Draft Recovery Notification */}
            {recovery && (
              <div className="my-6 p-4 border-2 border-stone-900 bg-[#faf8f0] flex flex-wrap items-center justify-between gap-4 shadow-[4px_4px_0_#171717]">
                <div>
                  <span className="font-gochi text-2xl block text-stone-900">
                    Your previous work is waiting
                  </span>
                  <p className="text-xs text-stone-600 font-mono">
                    You have an unfinished session saved locally on this device.
                  </p>
                </div>
                <button
                  type="button"
                  className="sketch-button sketch-button--dark sketch-button--sm"
                  onClick={() => {
                    setComposition(recovery)
                    setPage("editor")
                  }}
                >
                  Resume creating →
                </button>
              </div>
            )}

            {/* Hero Section */}
            <section className="hero">
              <div className="hero-copy">
                <p className="eyebrow">
                  Authentic Photobooth Strips & Scrapbook Keepsakes
                </p>

                <h1>
                  Moments worth keeping.
                  <span>Captured or crafted.</span>
                </h1>

                <p className="hero-description">
                  A tactile virtual photobooth and keepsake print studio. Choose from {templates.length}
                  authentic photobooth covers, romantic aesthetic scrapbooks, and multi-cut strips, take live camera bursts,
                  drag photos into exact slots, and customize every frame.
                </p>

                <div className="hero-actions">
                  <button
                    type="button"
                    className="sketch-button sketch-button--dark"
                    onClick={() => {
                      setPage("camera")
                      openCamera()
                    }}
                  >
                    Start Photobooth
                  </button>

                  <button
                    type="button"
                    className="sketch-button"
                    onClick={() => setPage("templates")}
                  >
                    Browse {templates.length} Authentic Templates
                  </button>

                  <button
                    type="button"
                    className="sketch-button"
                    onClick={() => {
                      slotReplaceIndex.current = null
                      fileInput.current?.click()
                    }}
                  >
                    Upload Snapshots
                  </button>
                </div>

                <p className="pencil-note pencil-note--hero">
                  ★ Handcrafted real photobooth covers & aesthetic keepsakes
                </p>
              </div>

              {/* Hero Real Keepsake Frame */}
              <div className="hero-sketch" aria-hidden="true">
                <div className="construction-circle construction-circle--one" />
                <div className="construction-circle construction-circle--two" />

                <div className="hero-package">
                  <div className="hero-photo-wrapper">
                    <TemplateThumbnail template={getTemplate("tmpl-user-053") || templates[0]} className="w-full h-full object-contain" />
                  </div>
                  <span className="package-label">
                    AUTHENTIC
                    <br />
                    KEEPSAKE
                  </span>
                  <span className="package-stamp">Original</span>
                </div>

                <p className="hero-sketch-note">authentic studio keepsake #053 · red string romance</p>
              </div>
            </section>

            {/* Featured Templates Row */}
            <section className="shop-section">
              <header className="section-heading">
                <div>
                  <p className="eyebrow">Curated From {templates.length} Authentic Keepsake Strips</p>
                  <h2>Featured 4-Cut Layouts</h2>
                </div>
                <p>
                  Built directly from real photobooth strips with authentic poses, Korean aesthetics, and real character accents.
                </p>
              </header>

              <div className="template-grid mt-10">
                {templates.slice(0, 5).map((t, idx) => (
                  <article
                    key={t.id}
                    className="template-card"
                  >
                    <button
                      type="button"
                      className="product-image-button"
                      onClick={() => setPreviewTemplate(t)}
                    >
                      <div className="product-image-frame relative">
                        <TemplateThumbnail template={t} className="w-full h-full object-contain" />
                        <span className="image-number">STRIP #{String(idx + 1).padStart(2, "0")}</span>
                        <span className="image-note">{t.count} CUTS</span>
                      </div>
                    </button>

                    <div className="product-content">
                      <p className="product-category">{t.category}</p>
                      <h3 className="product-title">{t.name}</h3>
                      <p className="product-description" title={t.note}>{t.note}</p>

                      <div className="product-footer">
                        <span className="product-price">{t.count} photos</span>
                        <button
                          type="button"
                          className="sketch-button sketch-button--dark sketch-button--sm"
                          onClick={() => setPreviewTemplate(t)}
                        >
                          Use Template
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-12 text-center">
                <button
                  type="button"
                  className="sketch-button sketch-button--dark"
                  onClick={() => setPage("templates")}
                >
                  View all {templates.length} templates →
                </button>
              </div>
            </section>

            {/* Process Section */}
            <section className="about-section border-t-2 border-stone-900 pt-16 mt-8 grid md:grid-cols-2 gap-10 items-center">
              <div className="border-2 border-stone-900 p-8 bg-[#faf8f0] shadow-[6px_6px_0_#171717]">
                <p className="eyebrow">How it works</p>
                <h2 className="font-gochi text-4xl mb-4">Crafted for Real Memories.</h2>
                <p className="text-xs text-stone-600 leading-relaxed mb-6">
                  Every keepsake begins with an authentic photobooth cover or vintage scrapbook layout,
                  designed with real paper textures, romantic aesthetics, and crafted with love.
                </p>
                <ul className="space-y-3 font-caveat text-xl">
                  <li>☑ Step 1: Select from {templates.length} authentic photobooth covers & scrapbooks</li>
                  <li>☑ Step 2: Live camera burst with countdown or instant upload</li>
                  <li>☑ Step 3: Match & assign photos into exact slots</li>
                  <li>☑ Step 4: Add stickers, ribbon bows, and print or export!</li>
                </ul>
              </div>

              <div className="p-8 border-t-2 border-b-2 border-stone-900">
                <span className="font-caveat text-lg text-stone-500 block mb-2">user review</span>
                <span className="text-amber-600 tracking-widest text-lg">★★★★★</span>
                <blockquote className="font-gochi text-3xl my-4 leading-tight">
                  “The photos printed so beautifully, my friends demanded strips of their own.”
                </blockquote>
                <cite className="text-xs text-stone-500 font-mono not-italic block">
                  — verified booth maker, delightfully
                </cite>
              </div>
            </section>
          </>
        )}

        {/* ======================================================== */}
        {/* SCREEN 2: TEMPLATE GALLERY                               */}
        {/* ======================================================== */}
        {page === "templates" && (
          <section className="shop-section border-t-0 pt-6">
            <header className="section-heading">
              <div>
                <p className="eyebrow">Authentic Keepsakes · {templates.length} Curated Covers</p>
                <h2>Featured Layouts & Strips</h2>
              </div>
              <p>
                Every card corresponds to an authentic photo booth strip or scrapbook
                composition directly from our curated collections. Click any template to inspect its slots and start your session.
              </p>
            </header>

            {/* Filter Tools */}
            <div className="shop-tools">
              {/* Search Bar */}
              <label className="search-field">
                <span>search template inventory</span>
                <input
                  type="search"
                  value={query}
                  placeholder="Try 'couple', 'strip', 'bow', 'retro', 'polaroid', '4 cuts'..."
                  onChange={(e) => setQuery(e.target.value)}
                />
              </label>

              {/* Category Filter Buttons */}
              <div className="filter-list">
                {[
                  "All styles",
                  "Cool & Spider Animated 🕸️",
                  "Propose & Birthday Keepsakes 🎂",
                  "Romantic Kiss Pose Aesthetic ♡",
                  "Recent",
                  ...(favorites.length > 0 ? [`My Favorites ♥ (${favorites.length})`] : []),
                ].map((cat) => {
                  const isRecent = cat === "Recent"
                  const isFav = cat.startsWith("My Favorites")
                  const isActive =
                    category === cat ||
                    (isRecent && (category === "Recent" || category.startsWith("Recent"))) ||
                    (isFav && category.startsWith("My Favorites"))

                  const label = isRecent
                    ? `Recent (${recentTemplates.slice(0, 5).length})`
                    : cat

                  return (
                    <button
                      key={cat}
                      type="button"
                      className={`filter-button ${isActive ? "is-active" : ""}`}
                      onClick={() => setCategory(isRecent ? "Recent" : cat)}
                    >
                      {label}
                    </button>
                  )
                })}
              </div>

              {/* Photo Count & Sorting Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-dashed border-stone-300">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none w-full sm:w-auto">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 mr-1 flex-shrink-0">
                    Cuts:
                  </span>
                  {[
                    ["all", "All Cuts"],
                    ["1", "1 Cut (Solo)"],
                    ["2", "2 Cuts (Duo)"],
                    ["3", "3 Cuts (Trio)"],
                    ["4", "4 Cuts (Classic)"],
                    ["5", "5 Cuts"],
                    ["6", "6 Cuts"],
                    ["8", "8 Cuts"],
                    ["11", "11 Cuts"],
                  ].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      className={`px-2.5 py-1 text-xs border transition-all flex-shrink-0 whitespace-nowrap ${
                        countFilter === val
                          ? "border-stone-900 bg-stone-900 text-stone-100 font-bold shadow-[1px_1px_0_#171717]"
                          : "border-stone-400 bg-transparent text-stone-700 hover:border-stone-900"
                      }`}
                      onClick={() => setCountFilter(val)}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Sort By Dropdown */}
                <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-1 sm:pt-0">
                  <label htmlFor="gallerySort" className="text-xs font-mono uppercase tracking-wider text-stone-700 font-bold flex-shrink-0">
                    Sort:
                  </label>
                  <select
                    id="gallerySort"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="p-1.5 px-2.5 border-2 border-stone-900 bg-[#faf8f0] text-xs font-mono shadow-[2px_2px_0_#171717] outline-none cursor-pointer hover:bg-stone-50 font-bold flex-1 sm:flex-none max-w-full"
                  >
                    <option value="recommended">✦ Recommended for You</option>
                    <option value="popular">★ Popular (Booth Favorites)</option>
                    <option value="newest">✦ Newest Additions</option>
                    <option value="simple">↓ Simple Difficulty (1–2 Cuts)</option>
                    <option value="complex">↑ Complex Difficulty (Multi-Cuts)</option>
                  </select>

                  <span className="text-xs text-stone-500 font-mono flex-shrink-0 hidden sm:inline">
                    ({filteredTemplates.length})
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic Status / Context Bar for Sorting */}
            {sortBy === "recommended" && (
              <div className="mb-6 p-3 px-4 bg-[#f2ede2] border-2 border-stone-900 shadow-[3px_3px_0_#171717] text-xs text-stone-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-700 flex-shrink-0" />
                  <span>
                    <strong>Personalized Recommendations:</strong>{" "}
                    {preferenceProfiles.hasPreferences
                      ? `Dynamically ranked based on your ${preferenceProfiles.favoriteCount} favorited ${preferenceProfiles.favoriteCount === 1 ? "template" : "templates"} and frequently used layout styles.`
                      : "Curated booth favorites. Click the ♥ heart on any template or use layouts to instantly personalize this feed!"}
                  </span>
                </div>
                {preferenceProfiles.hasPreferences && (
                  <div className="flex items-center gap-2 text-[11px] font-mono text-stone-600">
                    {preferenceProfiles.topCategory && (
                      <span className="bg-stone-200/90 px-2 py-0.5 rounded border border-stone-400">
                        Top Style: {preferenceProfiles.topCategory}
                      </span>
                    )}
                    {preferenceProfiles.topCount && (
                      <span className="bg-stone-200/90 px-2 py-0.5 rounded border border-stone-400">
                        Top Layout: {preferenceProfiles.topCount}-Cut
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
            {sortBy === "popular" && (
              <div className="mb-6 p-2.5 px-4 bg-[#f2ede2] border border-stone-400 text-xs text-stone-700 flex items-center justify-between">
                <span>★ Ordered by all-time photo booth popularity, 4-cut classic strips, and trending styles.</span>
                <span className="text-[11px] font-mono text-stone-500">Popularity Ranked</span>
              </div>
            )}
            {sortBy === "simple" && (
              <div className="mb-6 p-2.5 px-4 bg-[#f2ede2] border border-stone-400 text-xs text-stone-700 flex items-center justify-between">
                <span>↓ Ordered by simplest layouts first (1-cut polaroids & 2-cut cards) for quick, easy sessions.</span>
                <span className="text-[11px] font-mono text-stone-500">Simple to Complex</span>
              </div>
            )}
            {sortBy === "complex" && (
              <div className="mb-6 p-2.5 px-4 bg-[#f2ede2] border border-stone-400 text-xs text-stone-700 flex items-center justify-between">
                <span>↑ Ordered by multi-cut matrix layouts and intricate collages (5 to 9 photos).</span>
                <span className="text-[11px] font-mono text-stone-500">Complex to Simple</span>
              </div>
            )}
            {sortBy === "newest" && (
              <div className="mb-6 p-2.5 px-4 bg-[#f2ede2] border border-stone-400 text-xs text-stone-700 flex items-center justify-between">
                <span>✦ Ordered by newest studio additions and latest frame collections.</span>
                <span className="text-[11px] font-mono text-stone-500">Newest First</span>
              </div>
            )}

            {(category === "Recent" || category.startsWith("Recent")) && (
              <div className="mb-6 p-3 px-4 bg-[#f8f4eb] border-2 border-stone-900 shadow-[3px_3px_0_#171717] text-xs text-stone-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-700 flex-shrink-0" />
                  <span>
                    <strong>Recent Templates ({recentTemplates.slice(0, 5).length} of 5):</strong> Ordered by your latest sessions and projects. Click any layout to quickly resume shooting or styling.
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-mono text-stone-600 bg-stone-200/90 px-2 py-0.5 rounded border border-stone-400">
                    5 Most Recent
                  </span>
                  <button
                    type="button"
                    className="underline text-[11px] text-stone-700 hover:text-stone-900 font-mono"
                    onClick={() => setCategory("All styles")}
                  >
                    View All Styles →
                  </button>
                </div>
              </div>
            )}

            {/* Grid of Templates */}
            {filteredTemplates.length === 0 ? (
              <p className="empty-message py-16 text-center font-caveat text-2xl text-stone-500">
                Nothing found for "{query}". For once, your judgment may be functioning.
              </p>
            ) : (
              <div className="template-grid">
                {filteredTemplates.map((t, idx) => (
                  <article
                    key={t.id}
                    className="template-card"
                    style={{ "--rotation": `${((idx % 4) * 0.4 - 0.6).toFixed(1)}deg` } as React.CSSProperties}
                  >
                    <button
                      type="button"
                      className="product-image-button"
                      onClick={() => setPreviewTemplate(t)}
                    >
                      <div className="product-image-frame relative">
                        {(() => {
                          const badge = getRecommendationBadge(t)
                          if (!badge) return null
                          return (
                            <span
                              className={`absolute top-2 left-2 z-20 px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider font-bold border-2 ${badge.cardBadgeStyle}`}
                            >
                              {badge.label}
                            </span>
                          )
                        })()}
                        <TemplateThumbnail template={t} className="w-full h-full object-contain" />
                        <span className="image-number">LAYOUT #{t.id.replace("tmpl-", "")}</span>
                        <span className="image-note">
                          {t.count <= 2 ? "SIMPLE · " : t.count >= 6 ? "COMPLEX · " : ""}{t.count} CUTS
                        </span>
                      </div>
                    </button>

                    <div className="product-content">
                      {(() => {
                        const badge = getRecommendationBadge(t)
                        if (!badge) return null
                        return (
                          <div
                            className={`inline-flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 border shadow-[1.5px_1.5px_0_#171717] rounded-sm mb-1.5 w-fit ${badge.contentBadgeStyle}`}
                            title={badge.reason}
                          >
                            <span>{badge.icon}</span>
                            <span className="font-bold">{badge.label}</span>
                            <span className="text-stone-600 font-normal">· {badge.reason}</span>
                          </div>
                        )
                      })()}

                      <div className="flex items-center justify-between mb-1">
                        <p className="product-category">{t.category}</p>
                        <button
                          type="button"
                          className="text-stone-600 hover:text-rose-600 transition-colors p-0.5"
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleFavorite(t.id)
                          }}
                          aria-label={favorites.includes(t.id) ? "Remove from favorites" : "Favorite template"}
                          title={favorites.includes(t.id) ? "Favorited (Click to remove)" : "Favorite to get personalized recommendations"}
                        >
                          <Heart
                            size={16}
                            className={favorites.includes(t.id) ? "fill-rose-500 text-rose-500" : ""}
                          />
                        </button>
                      </div>

                      <h3 className="product-title">{t.name}</h3>
                      <p className="product-description">{t.note}</p>

                      <div className="product-footer">
                        <span className="product-price">{t.count} photos</span>
                        <button
                          type="button"
                          className="sketch-button sketch-button--dark sketch-button--sm"
                          onClick={() => setPreviewTemplate(t)}
                        >
                          Inspect & Use
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* SCREEN 3: PHOTOBOOTH CAMERA (Burst Capture & Live Stream) */}
        {/* ======================================================== */}
        {(page === "setup" || page === "camera") && (
          <section className="py-4 sm:py-8 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
              <button
                type="button"
                className="sketch-button sketch-button--sm flex items-center gap-2 self-start"
                onClick={() => setPage("templates")}
              >
                <ArrowLeft size={14} /> Back to Templates
              </button>
              <div className="text-left sm:text-right flex items-center justify-between sm:block">
                <span className="text-[11px] uppercase text-stone-500 font-mono block">Active Layout</span>
                <strong className="font-gochi text-xl sm:text-2xl">{currentTemplate.name} ({currentTemplate.count} Cuts)</strong>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              {/* Camera Stream Viewport */}
              <div className="booth-card">
                <div className="camera-frame relative overflow-hidden bg-[#121212]">
                  {/* Live Video Element - ALWAYS rendered in DOM so ref={video} is never null */}
                  <video
                    ref={video}
                    playsInline
                    muted
                    autoPlay
                    onLoadedMetadata={(e) => {
                      e.currentTarget.play().catch(() => {})
                    }}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${
                      settings.mirror && settings.facingMode === "user" ? "scale-x-[-1]" : ""
                    } ${cameraState === "ready" && !demoMode ? "opacity-100" : "opacity-0 absolute pointer-events-none"}`}
                    style={{
                      filter:
                        settings.captureFilter === "Mono"
                          ? "grayscale(1) contrast(1.2)"
                          : settings.captureFilter === "Warm"
                            ? "sepia(0.4) saturate(1.2)"
                            : settings.captureFilter === "Cool"
                              ? "hue-rotate(180deg) saturate(0.8)"
                              : "",
                    }}
                  />

                  {/* Loading State Overlay */}
                  {cameraState === "loading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-300 bg-stone-900/90 z-20 gap-3">
                      <Loader2 size={36} className="animate-spin text-amber-500" />
                      <p className="text-xs font-mono">Initializing camera sensor...</p>
                    </div>
                  )}

                  {/* Simulated Demo Preview when in Demo Mode or Camera Unavailable */}
                  {(demoMode || cameraState === "unavailable" || cameraState === "denied") && cameraState !== "loading" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-900/90 text-stone-200 z-10">
                      <img
                        src={samples[0]}
                        alt="Photobooth preview simulation"
                        className="absolute inset-0 w-full h-full object-cover opacity-50"
                        style={{
                          filter:
                            settings.captureFilter === "Mono"
                              ? "grayscale(1) contrast(1.2)"
                              : settings.captureFilter === "Warm"
                                ? "sepia(0.4) saturate(1.2)"
                                : settings.captureFilter === "Cool"
                                  ? "hue-rotate(180deg) saturate(0.8)"
                                  : "",
                        }}
                      />
                      <div className="relative z-10 text-center p-4 bg-stone-950/85 border border-stone-700 rounded-sm max-w-xs shadow-2xl">
                        <Sparkles size={24} className="mx-auto text-amber-400 mb-2" />
                        <strong className="block text-sm font-mono text-stone-100 mb-1">
                          {cameraState === "denied"
                            ? "Camera Denied · Studio Sensor"
                            : cameraState === "unavailable"
                            ? "Studio Pose Simulation"
                            : "Demo Pose Sensor"}
                        </strong>
                        <p className="text-[11px] text-stone-300 mb-3">
                          Shutter captures authentic photobooth portraits with your selected countdown & film look.
                        </p>
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            className="sketch-button sketch-button--sm text-[11px] bg-stone-100 text-stone-900 py-1"
                            onClick={() => {
                              setDemoMode(false)
                              openCamera()
                            }}
                          >
                            Retry Webcam
                          </button>
                          <button
                            type="button"
                            className="sketch-button sketch-button--sm text-[11px] text-stone-200 border-stone-500 py-1"
                            onClick={() => fileInput.current?.click()}
                          >
                            Upload Photos
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Viewfinder crosshairs and HUD */}
                  <div className="camera-viewfinder pointer-events-none" />
                  <div className="camera-hud z-30">
                    <span className="hud-pill">
                      {capturing
                        ? `BURST: ${burstCount.current} / ${burstCount.total}`
                        : `${currentTemplate.count} SHOTS READY`}
                    </span>
                    <span className="hud-pill font-mono">
                      {demoMode ? "DEMO SENSOR" : settings.captureFilter}
                    </span>
                  </div>

                  {/* Large Countdown Overlay */}
                  {countdown !== null && (
                    <div className="absolute inset-0 grid place-items-center bg-black/40 pointer-events-none z-40">
                      <span className="font-gochi text-9xl text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] animate-pulse">
                        {countdown}
                      </span>
                    </div>
                  )}

                  {/* Flash Screen Overlay */}
                  {flashActive && (
                    <div className="absolute inset-0 bg-white pointer-events-none z-50 animate-out fade-out duration-300" />
                  )}
                </div>

                {/* Shutter Bar */}
                <div className="mt-6 flex items-center justify-between">
                  <button
                    type="button"
                    className="sketch-button sketch-button--sm"
                    onClick={() => {
                      if (demoMode) {
                        setDemoMode(false)
                        openCamera()
                      } else {
                        setSettings((s) => ({
                          ...s,
                          facingMode: s.facingMode === "user" ? "environment" : "user",
                        }))
                        setTimeout(() => openCamera(), 100)
                      }
                    }}
                    title="Switch Camera or Mode"
                  >
                    <SwitchCamera size={16} /> {demoMode ? "Try Webcam" : "Switch"}
                  </button>

                  {/* Primary Red Shutter Button */}
                  <button
                    type="button"
                    disabled={capturing || cameraState === "loading"}
                    className="shutter-btn flex flex-col items-center justify-center text-white disabled:opacity-50"
                    onClick={() => startBurstCapture()}
                    title="Capture Photo Strip"
                  >
                    <Camera size={26} />
                  </button>

                  <button
                    type="button"
                    className="sketch-button sketch-button--sm"
                    onClick={() => fileInput.current?.click()}
                  >
                    <Upload size={14} /> Upload
                  </button>
                </div>
              </div>

              {/* Camera Controls & Settings Drawer */}
              <div className="booth-card flex flex-col justify-between">
                <div>
                  <p className="eyebrow">Booth Settings</p>
                  <h3 className="font-gochi text-3xl mb-4">Capture Controls</h3>

                  <div className="space-y-4 text-xs">
                    {/* Timer */}
                    <div>
                      <label className="block text-stone-600 mb-1">Countdown Timer</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[0, 3, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            className={`py-2 border text-center font-mono ${
                              settings.countdown === s
                                ? "border-stone-900 bg-stone-900 text-white font-bold shadow-[2px_2px_0_#171717]"
                                : "border-stone-300 bg-[#faf8f0] text-stone-800 hover:border-stone-600"
                            }`}
                            onClick={() => setSettings((st) => ({ ...st, countdown: s as any }))}
                          >
                            {s === 0 ? "Off" : `${s}s`}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Filter Presets */}
                    <div>
                      <label className="block text-stone-600 mb-1">Film Look</label>
                      <select
                        value={settings.captureFilter}
                        className="w-full p-2 border border-stone-400 bg-transparent"
                        onChange={(e) => setSettings((s) => ({ ...s, captureFilter: e.target.value }))}
                      >
                        <option value="Original">Original Realism</option>
                        <option value="Mono">Darkroom B&W</option>
                        <option value="Warm">Vintage Warm 70s</option>
                        <option value="Cool">Tokyo Cool Neon</option>
                      </select>
                    </div>

                    {/* Toggles */}
                    <div className="space-y-2 pt-2 border-t border-dashed border-stone-300">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span>Mirror selfie</span>
                        <input
                          type="checkbox"
                          checked={settings.mirror}
                          onChange={(e) => setSettings((s) => ({ ...s, mirror: e.target.checked }))}
                          className="accent-stone-900"
                        />
                      </label>
                      <label className="flex items-center justify-between cursor-pointer">
                        <span>Flash flash effect</span>
                        <input
                          type="checkbox"
                          checked={settings.flash}
                          onChange={(e) => setSettings((s) => ({ ...s, flash: e.target.checked }))}
                          className="accent-stone-900"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Target Template Info Card */}
                <div className="mt-6 pt-4 border-t border-stone-300">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-16 border border-stone-900 bg-stone-100 p-0.5 overflow-hidden flex items-center justify-center">
                      <TemplateThumbnail
                        template={currentTemplate}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <strong className="text-xs block font-mono">{currentTemplate.name}</strong>
                      <span className="text-[10px] text-stone-500 font-mono">
                        Requires {currentTemplate.count} photos
                      </span>
                    </div>
                  </div>

                  {composition.photos.length > 0 && (
                    <button
                      type="button"
                      className="sketch-button sketch-button--dark w-full mt-4 text-xs"
                      onClick={() => setPage("review")}
                    >
                      Review {composition.photos.length} Photo(s) →
                    </button>
                  )}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* SCREEN 4: CAPTURED PHOTO REVIEW & SLOT ASSIGNMENT        */}
        {/* ======================================================== */}
        {page === "review" && (
          <section className="py-4 sm:py-8 max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <p className="eyebrow">Step 4: Match Photos To Slots</p>
                <h2 className="font-gochi text-3xl sm:text-4xl">Review & Assign Shots</h2>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <button
                  type="button"
                  className="sketch-button sketch-button--sm flex-1 sm:flex-none justify-center"
                  onClick={() => {
                    setPage("camera")
                    openCamera()
                  }}
                >
                  <Camera size={14} /> Retake More
                </button>

                <button
                  type="button"
                  className="sketch-button sketch-button--dark flex-1 sm:flex-none justify-center"
                  onClick={() => setPage("editor")}
                >
                  Studio Editor →
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_360px] gap-6 sm:gap-8">
              {/* Photo Slot Mapping Grid */}
              <div className="booth-card">
                <h3 className="font-gochi text-2xl mb-2">Slot Assignments</h3>
                <p className="text-xs text-stone-600 mb-6 font-mono">
                  Each photo is mapped to a specific slot in your template. Click any slot to replace it with a new photo.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Array.from({ length: currentTemplate.count }).map((_, slotIdx) => {
                    const photo = composition.photos[slotIdx]
                    return (
                      <div
                        key={slotIdx}
                        className={`border-2 p-3 transition-all relative ${
                          selectedSlot === slotIdx
                            ? "border-stone-900 bg-stone-100 shadow-[4px_4px_0_#171717]"
                            : "border-dashed border-stone-400 bg-stone-50"
                        }`}
                        onClick={() => setSelectedSlot(slotIdx)}
                      >
                        <span className="text-[10px] font-mono font-bold block mb-1">
                          SLOT {slotIdx + 1}
                        </span>

                        <div className="aspect-[4/3] bg-stone-200 border border-stone-400 overflow-hidden flex items-center justify-center">
                          {photo ? (
                            <img
                              src={photo.src}
                              alt={`Slot ${slotIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <button
                              type="button"
                              className="text-stone-500 hover:text-stone-900 text-xs flex flex-col items-center gap-1"
                              onClick={() => {
                                slotReplaceIndex.current = slotIdx
                                fileInput.current?.click()
                              }}
                            >
                              <Plus size={18} />
                              <span>Add Photo</span>
                            </button>
                          )}
                        </div>

                        {photo && (
                          <div className="mt-2 flex justify-between items-center text-[10px] font-mono">
                            <span className="text-stone-600 truncate max-w-[90px]">{photo.name}</span>
                            <button
                              type="button"
                              className="text-amber-800 hover:underline"
                              onClick={(e) => {
                                e.stopPropagation()
                                slotReplaceIndex.current = slotIdx
                                fileInput.current?.click()
                              }}
                            >
                              Replace
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Template Live Preview Mini */}
              <div className="booth-card flex flex-col items-center justify-between text-center">
                <div>
                  <p className="eyebrow">Composition Preview</p>
                  <strong className="font-gochi text-2xl block mb-4">{currentTemplate.name}</strong>

                  <div className="max-w-[200px] mx-auto border-2 border-stone-900 shadow-[4px_4px_0_#171717] bg-white p-2">
                    <Preview composition={composition} />
                  </div>
                </div>

                <div className="w-full mt-6 space-y-3">
                  <button
                    type="button"
                    className="sketch-button sketch-button--dark w-full"
                    onClick={() => setPage("editor")}
                  >
                    Open in Studio Editor
                  </button>
                  <button
                    type="button"
                    className="sketch-button w-full text-xs"
                    onClick={() => setPage("templates")}
                  >
                    Switch to Another Template
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* SCREEN 5: STUDIO EDITOR (Full Interactive Customization) */}
        {/* ======================================================== */}
        {page === "editor" && (
          <section className="flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-[#faf8f2] border-b-2 border-stone-900 flex-shrink-0 z-20">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  type="button"
                  className="sketch-button sketch-button--sm flex items-center gap-1 text-xs py-1 px-2.5 active:scale-95 flex-shrink-0"
                  onClick={() => setPage("templates")}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <h2 className="font-gochi text-lg sm:text-2xl truncate max-w-[130px] xs:max-w-[180px] sm:max-w-none">{currentTemplate.name}</h2>
              </div>

              <div className="flex items-center gap-1.5 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="sketch-button sketch-button--sm p-1.5 text-xs disabled:opacity-40 active:scale-95"
                    onClick={() => undo()}
                    disabled={!history.length}
                    title="Undo"
                  >
                    <Undo2 size={13} />
                  </button>
                  <button
                    type="button"
                    className="sketch-button sketch-button--sm p-1.5 text-xs disabled:opacity-40 active:scale-95"
                    onClick={() => redo()}
                    disabled={!future.length}
                    title="Redo"
                  >
                    <Redo2 size={13} />
                  </button>
                  <button
                    type="button"
                    className="sketch-button sketch-button--sm text-xs py-1 px-2.5 active:scale-95 hidden xs:inline-block"
                    onClick={() => saveCurrentCreation()}
                  >
                    Save
                  </button>
                </div>

                <button
                  type="button"
                  className="sketch-button sketch-button--dark text-xs py-1 px-3 whitespace-nowrap active:scale-95"
                  onClick={() => setPage("export")}
                >
                  Export →
                </button>
              </div>
            </div>

            {/* Studio Canvas & Inspector Viewport */}
            <Suspense
              fallback={
                <div className="py-24 text-center">
                  <Loader2 size={36} className="animate-spin mx-auto mb-3 text-stone-800" />
                  <p className="font-gochi text-2xl">Preparing Creative Canvas...</p>
                </div>
              }
            >
              <Studio
                composition={composition}
                onChange={(next, before) => edit(next, before)}
                onTransient={(next) => setComposition(next)}
                onDone={() => setPage("export")}
                onSave={() => saveCurrentCreation()}
                saveStatus={saveStatus}
                notify={(msg) => notify(msg)}
              />
            </Suspense>
          </section>
        )}

        {/* ======================================================== */}
        {/* SCREEN 6: EXPORT & SHARING                               */}
        {/* ======================================================== */}
        {page === "export" && (
          <section className="py-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button
                type="button"
                className="sketch-button sketch-button--sm"
                onClick={() => setPage("editor")}
              >
                <ArrowLeft size={14} /> Back to Studio
              </button>
              <h2 className="font-gochi text-3xl">Export & Share</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 sm:gap-8">
              {/* Composition Final Preview */}
              <div className="booth-card flex flex-col items-center justify-center p-8 bg-[#faf8f0]">
                <div className="max-w-[340px] max-h-[580px] p-2 bg-white shadow-[8px_8px_0_#171717] border-2 border-stone-900">
                  <Preview composition={composition} />
                </div>
                <p className="pencil-note mt-6 text-center text-xl">
                  ✧ approved print keepsake ✧
                </p>
              </div>

              {/* Export Controls Drawer */}
              <div className="booth-card flex flex-col justify-between">
                <div>
                  <p className="eyebrow">Print Options</p>
                  <h3 className="font-gochi text-3xl mb-4">Export Settings</h3>

                  <div className="space-y-4 text-xs font-mono">
                    {/* Format Selector */}
                    <div>
                      <label className="block text-stone-600 mb-1">Image Format</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(["png", "jpeg"] as const).map((fmt) => (
                          <button
                            key={fmt}
                            type="button"
                            className={`py-2 border uppercase ${
                              format === fmt
                                ? "border-stone-900 bg-stone-900 text-stone-100 font-bold"
                                : "border-stone-300"
                            }`}
                            onClick={() => setFormat(fmt)}
                          >
                            {fmt === "png" ? "PNG (Lossless)" : "JPEG (Compact)"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Resolution Multiplier */}
                    <div>
                      <label className="block text-stone-600 mb-1">Print Resolution</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          [1, "Standard (1x)"],
                          [2, "High Res (2x)"],
                        ].map(([scale, label]) => (
                          <button
                            key={scale}
                            type="button"
                            className={`py-2 border ${
                              exportScale === scale
                                ? "border-stone-900 bg-stone-900 text-stone-100 font-bold"
                                : "border-stone-300"
                            }`}
                            onClick={() => setExportScale(scale as number)}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  <button
                    type="button"
                    disabled={busy}
                    className="sketch-button sketch-button--dark w-full text-sm"
                    onClick={() => exportFinal()}
                  >
                    {busy ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    Download Final Print
                  </button>

                  <button
                    type="button"
                    className="sketch-button w-full text-xs"
                    onClick={async () => {
                      try {
                        const canvas = document.createElement("canvas")
                        await renderComposition(canvas, composition, currentTemplate, 1)
                        canvas.toBlob(async (blob) => {
                          if (blob && navigator.clipboard?.write) {
                            await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
                            notify("Copied image to clipboard!")
                          } else {
                            notify("Clipboard copy not supported on this browser.")
                          }
                        }, "image/png")
                      } catch {
                        notify("Could not copy image.")
                      }
                    }}
                  >
                    <Copy size={14} /> Copy to Clipboard
                  </button>

                  <button
                    type="button"
                    className="sketch-button w-full text-xs"
                    onClick={() => {
                      saveCurrentCreation()
                      setPage("creations")
                    }}
                  >
                    View in My Creations
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ======================================================== */}
        {/* SCREEN 7: SAVED CREATIONS GALLERY                        */}
        {/* ======================================================== */}
        {page === "creations" && (
          <section className="shop-section border-t-0 pt-6">
            <header className="section-heading mb-8">
              <div>
                <p className="eyebrow">Your Archive</p>
                <h2>My Saved Creations</h2>
              </div>
              <p>
                All compositions saved on this device. You can download them anytime
                or reopen them in the Studio to keep editing.
              </p>
            </header>

            {saved.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-stone-300 p-8">
                <Camera size={36} className="mx-auto text-stone-400 mb-3" />
                <h3 className="font-gochi text-2xl text-stone-700">No saved creations yet</h3>
                <p className="text-xs text-stone-500 font-mono my-3">
                  Take some booth shots or browse templates to craft your first print strip.
                </p>
                <button
                  type="button"
                  className="sketch-button sketch-button--dark mt-2"
                  onClick={() => setPage("templates")}
                >
                  Explore Templates →
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6">
                {saved.map((item) => (
                  <div
                    key={item.id}
                    className="booth-card flex flex-col justify-between hover:shadow-[8px_8px_0_#171717] transition-all"
                  >
                    <div className="aspect-[3/4] bg-stone-100 border border-stone-900 mb-3 flex items-center justify-center p-2 overflow-hidden">
                      <img
                        src={item.image}
                        alt="Saved keepsake"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-xs font-mono text-stone-500 mb-2">
                        <span>{item.date}</span>
                        <span>{item.composition.photos.length} photos</span>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <button
                          type="button"
                          className="sketch-button sketch-button--dark sketch-button--sm flex-1 text-xs"
                          onClick={() => {
                            setComposition(item.composition)
                            setPage("editor")
                          }}
                        >
                          Reopen & Edit
                        </button>
                        <button
                          type="button"
                          className="p-2 border border-stone-400 hover:border-red-600 hover:text-red-600"
                          onClick={() => {
                            removeProject(item.id)
                            setSaved((prev) => prev.filter((x) => x.id !== item.id))
                            notify("Deleted from creations.")
                          }}
                          aria-label="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ======================================================== */}
        {/* SCREEN 8: SETTINGS & PREFERENCES                         */}
        {/* ======================================================== */}
        {page === "settings" && (
          <section className="py-8 max-w-2xl mx-auto">
            <header className="mb-6">
              <p className="eyebrow">Studio Preferences</p>
              <h2 className="font-gochi text-4xl">Settings</h2>
            </header>

            <div className="booth-card space-y-6 text-xs font-mono">
              <div>
                <strong className="block text-sm mb-1 font-bold">Default Countdown</strong>
                <p className="text-stone-500 mb-2">Number of seconds before the first snapshot.</p>
                <div className="grid grid-cols-2 sm:flex gap-2">
                  {[0, 3, 5, 10].map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`px-4 py-2 border ${
                        settings.countdown === s
                          ? "border-stone-900 bg-stone-900 text-white font-bold"
                          : "border-stone-300"
                      }`}
                      onClick={() => setSettings((st) => ({ ...st, countdown: s as any }))}
                    >
                      {s === 0 ? "Instant" : `${s} Seconds`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-dashed border-stone-300">
                <strong className="block text-sm mb-1 font-bold">Shutter Flash</strong>
                <p className="text-stone-500 mb-2">Simulate real photobooth flash lamps.</p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.flash}
                    onChange={(e) => setSettings((s) => ({ ...s, flash: e.target.checked }))}
                    className="accent-stone-900 w-4 h-4"
                  />
                  <span>Enable photobooth flash screen</span>
                </label>
              </div>

              <div className="pt-4 border-t border-dashed border-stone-300">
                <strong className="block text-sm mb-1 font-bold">Local Storage & Privacy</strong>
                <p className="text-stone-500 mb-2">
                  All photos, compositions, and drafts stay 100% on this device in your browser. Nothing is ever uploaded to external servers.
                </p>
                <button
                  type="button"
                  className="sketch-button text-red-600 border-red-400 hover:border-red-600 hover:bg-red-50 text-xs"
                  onClick={() => {
                    localStorage.removeItem("little-creations")
                    localStorage.removeItem("little-settings")
                    localStorage.removeItem("little-favorites")
                    localStorage.removeItem("little-template-usage")
                    localStorage.removeItem("little-recent-templates")
                    setSaved([])
                    setFavorites([])
                    setUsageHistory({})
                    setRecentTemplates([])
                    notify("Cleared all local app data, favorites, and recent history.")
                  }}
                >
                  Clear All Local App Data
                </button>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ======================================================== */}
      {/* CODEPEN MODAL: TEMPLATE INSPECTION & USE DIALOG          */}
      {/* ======================================================== */}
      {previewTemplate && (
        <div className="product-modal is-open">
          <div
            className="modal-backdrop"
            onClick={() => setPreviewTemplate(null)}
          />

          <article className="modal-card">
            <button
              type="button"
              className="modal-close"
              aria-label="Close"
              onClick={() => setPreviewTemplate(null)}
            >
              ×
            </button>

            {/* Left Frame with Crosshairs */}
            <div className="modal-image-frame flex items-center justify-center p-3 bg-stone-900">
              <div className="w-full max-w-[210px] aspect-[1/2.35] shadow-xl border border-stone-700 overflow-hidden bg-[#09090b] p-1">
                <TemplateThumbnail template={previewTemplate} className="w-full h-full object-contain" />
              </div>
              <span>approved layout no. {previewTemplate.id.replace("tmpl-", "")}</span>
            </div>

            {/* Right Details Copy */}
            <div className="modal-copy">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                <p className="eyebrow">{previewTemplate.category} · {previewTemplate.orientation}</p>
                {(() => {
                  const badge = getRecommendationBadge(previewTemplate)
                  if (!badge) return null
                  return (
                    <span className={`inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 border shadow-[1.5px_1.5px_0_#171717] rounded-sm ${badge.contentBadgeStyle}`}>
                      <span>{badge.icon}</span>
                      <span className="font-bold">{badge.label}</span>
                      <span className="text-stone-600 font-normal">· {badge.reason}</span>
                    </span>
                  )
                })()}
              </div>
              <h2>{previewTemplate.name}</h2>
              <p>{previewTemplate.note}</p>

              <div className="modal-warning">
                <strong>Creative warning:</strong>
                <span>
                  Requires {previewTemplate.count} photos. Each slot supports independent pan, zoom, crop, 90° rotation, horizontal flip, and film filters.
                </span>
              </div>

              <div className="modal-purchase">
                <div className="flex items-center justify-between mb-2">
                  <strong className="font-caveat text-3xl font-bold">
                    {previewTemplate.count} Cut Layout
                  </strong>
                  <span className="text-[10px] font-mono border border-stone-800 px-2 py-0.5 bg-stone-100 shadow-[1px_1px_0_#171717]">
                    Difficulty: {previewTemplate.count <= 2 ? "Simple (1–2 Cuts)" : previewTemplate.count >= 6 ? "Complex (Multi-Shot Matrix)" : "Standard (3–4 Cuts)"}
                  </span>
                </div>

                <div className="space-y-2 mt-2">
                  <button
                    type="button"
                    className="sketch-button sketch-button--dark w-full text-xs"
                    onClick={() => startWithTemplate(previewTemplate, "booth")}
                  >
                    Use in Photobooth (Take Photos)
                  </button>

                  <button
                    type="button"
                    className="sketch-button w-full text-xs"
                    onClick={() => startWithTemplate(previewTemplate, "upload")}
                  >
                    Upload My Photos Directly
                  </button>

                  <button
                    type="button"
                    className="sketch-button w-full text-xs text-stone-600"
                    onClick={() => startWithTemplate(previewTemplate, "sample")}
                  >
                    Open in Studio with Sample Photos
                  </button>
                </div>
              </div>
            </div>
          </article>
        </div>
      )}

      {/* CodePen Toast Notification */}
      <div className={`toast ${toast ? "is-visible" : ""}`} role="status">
        {toast}
      </div>

      {/* Android APK Bottom Navigation Bar (Optimized for Phones & Tablets, hidden in Studio mode to avoid tool overlap) */}
      {page !== "editor" && (
        <nav
          aria-label="Android Bottom Navigation"
          className="fixed bottom-0 left-0 right-0 z-40 bg-[#faf8f2]/95 backdrop-blur-md border-t-2 border-stone-900 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] lg:hidden px-2 sm:px-6 pt-1.5 pb-2 safe-bottom flex items-center justify-around"
        >
          <button
            type="button"
            className={`flex flex-col items-center justify-center py-1 px-3 sm:px-5 rounded-full text-[10px] font-mono tracking-tight transition-all active:scale-95 ${
              page === "home"
                ? "bg-stone-900 text-amber-300 font-bold shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
            onClick={() => {
              setPage("home")
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
          >
            <Home size={19} className={page === "home" ? "stroke-[2.5]" : "stroke-[1.8]"} />
            <span className="mt-0.5">Home</span>
          </button>

          <button
            type="button"
            className={`flex flex-col items-center justify-center py-1 px-3 sm:px-5 rounded-full text-[10px] font-mono tracking-tight transition-all active:scale-95 ${
              page === "templates"
                ? "bg-stone-900 text-amber-300 font-bold shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
            onClick={() => {
              setPage("templates")
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
          >
            <div className="relative">
              <Grid2X2 size={19} className={page === "templates" ? "stroke-[2.5]" : "stroke-[1.8]"} />
              <span className="absolute -top-1 -right-2 text-[8px] font-mono font-bold bg-amber-500 text-stone-950 px-1 rounded-full leading-tight">
                {templates.length}
              </span>
            </div>
            <span className="mt-0.5">Templates</span>
          </button>

          {/* Elevated Center Android Camera Shutter Action Button */}
          <button
            type="button"
            className="relative -top-3.5 flex flex-col items-center justify-center group active:scale-90 transition-transform"
            onClick={() => {
              setPage("camera")
              openCamera()
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
            title="Launch Photobooth Camera"
            aria-label="Start Photobooth Camera"
          >
            <div className="w-13 h-13 rounded-full bg-rose-600 border-[3px] border-stone-900 text-white flex items-center justify-center shadow-[0_4px_12px_rgba(225,29,72,0.4)] group-hover:bg-rose-500">
              <Camera size={24} className="stroke-[2.4]" />
            </div>
            <span className="text-[10px] font-mono font-bold text-stone-900 mt-0.5">Booth</span>
          </button>

          <button
            type="button"
            className="flex flex-col items-center justify-center py-1 px-3 sm:px-5 rounded-full text-[10px] font-mono tracking-tight transition-all active:scale-95 text-stone-600 hover:text-stone-900"
            onClick={() => {
              if (!composition.photos.length) {
                setComposition((c) => ({
                  ...c,
                  photos: Array.from({ length: currentTemplate.count }, (_, i) => ({
                    id: crypto.randomUUID(),
                    src: samples[i % samples.length],
                    name: `Sample Photo ${i + 1}`,
                    adjustments: defaultAdjustments(),
                  })),
                }))
              }
              setPage("editor")
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
          >
            <Paintbrush size={19} className="stroke-[1.8]" />
            <span className="mt-0.5">Studio</span>
          </button>

          <button
            type="button"
            className={`relative flex flex-col items-center justify-center py-1 px-3 sm:px-5 rounded-full text-[10px] font-mono tracking-tight transition-all active:scale-95 ${
              page === "creations"
                ? "bg-stone-900 text-amber-300 font-bold shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
            onClick={() => {
              setPage("creations")
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
          >
            <div className="relative">
              <Bookmark size={19} className={page === "creations" ? "stroke-[2.5]" : "stroke-[1.8]"} />
              {saved.length > 0 && (
                <span className="absolute -top-1 -right-2.5 min-w-[15px] h-[15px] rounded-full bg-rose-600 text-[9px] text-white font-mono flex items-center justify-center font-bold px-0.5">
                  {saved.length}
                </span>
              )}
            </div>
            <span className="mt-0.5">Prints</span>
          </button>
        </nav>
      )}

      {/* CodePen Site Footer - only on informational pages */}
      {(page === "home" || page === "templates") && (
        <footer className="site-footer">
          <span>© Little Moments Creative Print Studio</span>
          <span>Crafted with vintage ink & real paper textures.</span>
        </footer>
      )}
    </div>
  )
}
