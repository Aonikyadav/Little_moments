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
  ExternalLink,
  QrCode,
  Smartphone,
  BookOpen,
  LayoutGrid,
  Database,
  User,
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
import {
  templates,
  getTemplate,
  templatesForCount,
  kBoothTemplates,
  purikuraTemplates,
} from "./templates"
import { cssFilter, renderComposition } from "./rendering"
import "./studio/studio.css"
import { dimensions, historyStep } from "./studio/model"
import { saveProject, loadProjects, removeProject } from "./studio/storage"
import useFontRevision from "./studio/useFontRevision"
import { generateQrCodeDataUrl } from "./utils/qrCode"
import { TemplateThumbnail } from "./components/TemplateThumbnail"
import { findGridLayout } from "./studio/gridEngine"
import { ScrapbookAlbum } from "./components/ScrapbookAlbum"
import { MobileKeepsakeViewer } from "./components/MobileKeepsakeViewer"
import {
  uploadStripToCloudRelay,
  dataUrlToBlob,
  PhotoTransferHost,
} from "./utils/photoTransfer"
import {
  initAuthListener,
  savePhotoboothToCloud,
  isFirebaseConfigured,
  type FirebaseUserAccount,
} from "./services/firebase"
import {
  savePhotoboothToSupabase,
  isSupabaseConfigured,
} from "./services/supabase"
import { UserAccountModal } from "./components/UserAccountModal"

const Studio = lazy(() => import("./studio/Studio"))
const samples = [
  "/images/romantic_love_kisspose_aesthetic/031.jpg",
  "/images/romantic_love_kisspose_aesthetic/032.jpg",
  "/images/romantic_love_kisspose_aesthetic/033.jpg",
  "/images/romantic_love_kisspose_aesthetic/034.jpg",
  "/images/romantic_love_kisspose_aesthetic/035.jpg",
  "/images/romantic_love_kisspose_aesthetic/036.jpg",
  "/images/cool_animated_romantic/001.jpg",
  "/images/propose_love_greeting_years_birthday/017.jpg",
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
  | "kbooth"
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



function getInitialPage(): Page {
  if (typeof window === "undefined") return "home"
  const cleanPath = window.location.pathname.toLowerCase().replace(/\/+$/, "")
  const hash = window.location.hash.toLowerCase().replace(/^#\/?/, "")
  const target = cleanPath.split("/").pop() || hash

  if (target === "studio" || target === "editor") return "editor"
  if (target === "kbooth" || target === "booth") return "kbooth"
  if (target === "templates" || target === "template") return "templates"
  if (target === "creations" || target === "album" || target === "keepsakes") return "creations"
  if (target === "settings") return "settings"
  if (target === "camera") return "camera"
  if (target === "setup") return "setup"
  if (target === "review") return "review"
  if (target === "export") return "export"
  return "home"
}

export default function App() {
  const [page, setPage] = useState<Page>(() => getInitialPage())
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
  const [kBoothCategory, setKBoothCategory] = useState<string>("All")

  const filteredKBooth = useMemo(() => {
    if (kBoothCategory === "All") return kBoothTemplates
    if (kBoothCategory === "Twin Strips")
      return kBoothTemplates.filter(
        (t) => t.tags?.includes("twin-strip") || t.tags?.includes("v-strip"),
      )
    if (kBoothCategory === "Tickets & Barcodes")
      return kBoothTemplates.filter(
        (t) =>
          t.tags?.includes("ticket") ||
          t.tags?.includes("barcode") ||
          t.tags?.includes("bookmark"),
      )
    if (kBoothCategory === "Minimalist & Slats")
      return kBoothTemplates.filter(
        (t) =>
          t.tags?.includes("minimal") ||
          t.tags?.includes("slat") ||
          t.tags?.includes("shadow"),
      )
    if (kBoothCategory === "Postage Stamp & Denim")
      return kBoothTemplates.filter(
        (t) =>
          t.tags?.includes("stamp") ||
          t.tags?.includes("croc") ||
          t.tags?.includes("denim"),
      )
    if (kBoothCategory === "Moodboard & Scrapbook")
      return kBoothTemplates.filter(
        (t) => t.tags?.includes("moodboard") || t.tags?.includes("scrapbook"),
      )
    if (kBoothCategory === "70s Retro Groovy")
      return kBoothTemplates.filter(
        (t) =>
          t.tags?.includes("retro") ||
          t.tags?.includes("70s") ||
          t.tags?.includes("groovy"),
      )
    return kBoothTemplates
  }, [kBoothCategory])
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
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [qrExportUrl, setQrExportUrl] = useState<string>("")
  const [qrLanHost, setQrLanHost] = useState<string>(() =>
    typeof window !== "undefined" ? window.location.host : "localhost:3000",
  )
  const [qrCopied, setQrCopied] = useState(false)
  const [qrSyncStatus, setQrSyncStatus] = useState<"connecting" | "cloud_ready" | "cloud_db_saved" | "p2p_active" | "local">("connecting")
  const qrTransferHostRef = useRef<PhotoTransferHost | null>(null)
  const [creationsTab, setCreationsTab] = useState<"scrapbook" | "grid">("scrapbook")
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUserAccount | null>(null)
  const [accountModalOpen, setAccountModalOpen] = useState(false)

  const draftReady = useRef(false)
  const documentRevision = useRef(0)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const cancel = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const slotReplaceIndex = useRef<number | null>(null)

  const notify = (s: string) => setToast(s)

  useEffect(() => {
    const unsub = initAuthListener((u) => {
      setFirebaseUser(u)
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 3800)
      return () => clearTimeout(t)
    }
  }, [toast])

  useEffect(() => {
    const handlePopState = () => {
      setPage(getInitialPage())
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || window.location.search.includes("view=mobile")) return
    const route = page === "home" ? "/" : `/${page === "editor" ? "studio" : page}`
    const current = window.location.pathname
    if (current !== route && current !== `/${page}`) {
      try {
        window.history.pushState(null, "", route + window.location.search + window.location.hash)
      } catch {
        // Safe fallback in restricted environments
      }
    }
  }, [page])

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

  // Spacebar triggers camera capture when in booth
  useEffect(() => {
    if (page !== "camera" && page !== "setup") return
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === "Space" && !capturing && cameraState !== "loading") {
        e.preventDefault()
        startBurstCapture()
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [page, capturing, cameraState])

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
      backgroundPattern: t.backgroundPattern,
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
    if (!demoMode && v && (v.srcObject || v.videoWidth > 0) && v.videoWidth > 0 && v.videoHeight > 0) {
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

  const openQrTransferModal = async () => {
    setBusy(true)
    try {
      await document.fonts.ready
      const canvas = document.createElement("canvas")
      const t = getTemplate(composition.templateId)
      await renderComposition(canvas, composition, t, 1)
      const dataUrl = canvas.toDataURL("image/png", 0.95)

      const exportId = `export_${Date.now()}`
      try {
        sessionStorage.setItem(`lm_export_${exportId}`, dataUrl)
      } catch (e) {
        console.warn("sessionStorage export cache warning:", e)
      }

      // Cleanup existing P2P host if any
      qrTransferHostRef.current?.destroy()

      // Start P2P Host (Tier 2)
      const hostInstance = new PhotoTransferHost(exportId, dataUrl, () => {
        setQrSyncStatus("p2p_active")
        notify("Phone connected via Wireless P2P!")
      })
      hostInstance.start()
      qrTransferHostRef.current = hostInstance

      const protocol = window.location.protocol
      const host = qrLanHost || window.location.host
      const initialTargetUrl = `${protocol}//${host}/?view=mobile&id=${exportId}&peer=lm-${exportId}`
      setQrExportUrl(initialTargetUrl)
      setQrSyncStatus("connecting")

      const initialQrSvg = generateQrCodeDataUrl(initialTargetUrl, {
        size: 260,
        margin: 3,
        darkColor: "#18181b",
        lightColor: "#ffffff",
      })
      setQrDataUrl(initialQrSvg)
      setQrModalOpen(true)

      // Start Tier 1: Save to Supabase (PostgreSQL + Cloud Storage)
      savePhotoboothToSupabase(exportId, dataUrl, {
        title: t?.name || "Little Moments Keepsake",
        templateId: composition.templateId,
        composition,
      })
        .then((supabaseRes) => {
          if (supabaseRes.success) {
            setQrSyncStatus("cloud_db_saved")
          }
        })
        .catch((err) => {
          console.warn("[Supabase] Save notice:", err)
        })

      // Also save to Firebase if configured
      if (isFirebaseConfigured()) {
        savePhotoboothToCloud(exportId, dataUrl, {
          title: t?.name || "Little Moments Keepsake",
          templateId: composition.templateId,
          composition,
        })
          .then((cloudRes) => {
            if (cloudRes.success) {
              setQrSyncStatus("cloud_db_saved")
            }
          })
          .catch((err) => {
            console.warn("[Firebase Cloud] Save notice:", err)
          })
      }

      // Start Tier 2: Cloud Relay fallback in background
      const blob = dataUrlToBlob(dataUrl)
      uploadStripToCloudRelay(blob)
        .then((uploadRes) => {
          if (uploadRes.success && uploadRes.url) {
            const cloudTargetUrl = `${protocol}//${host}/?view=mobile&img=${encodeURIComponent(uploadRes.url)}&peer=lm-${exportId}&id=${exportId}`
            setQrExportUrl(cloudTargetUrl)
            setQrSyncStatus((prev) => (prev === "cloud_db_saved" ? prev : "cloud_ready"))
            const cloudQrSvg = generateQrCodeDataUrl(cloudTargetUrl, {
              size: 260,
              margin: 3,
              darkColor: "#18181b",
              lightColor: "#ffffff",
            })
            setQrDataUrl(cloudQrSvg)
          }
        })
        .catch(() => {
          // keep existing status
        })
    } catch {
      notify("Failed to generate QR transfer code.")
    } finally {
      setBusy(false)
    }
  }

  const updateQrHost = (newHost: string) => {
    setQrLanHost(newHost)
    const protocol = window.location.protocol
    const targetUrl = `${protocol}//${newHost}/?view=mobile&id=${Date.now()}`
    setQrExportUrl(targetUrl)
    const qrSvg = generateQrCodeDataUrl(targetUrl, {
      size: 260,
      margin: 3,
      darkColor: "#18181b",
      lightColor: "#ffffff",
    })
    setQrDataUrl(qrSvg)
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
        (category.includes("Retro") && t.category.includes("Retro")) ||
        (category.includes("Purikura") &&
          (t.category.includes("Purikura") || t.tags?.includes("purikura")))

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

  // Standalone Mobile Photo Viewer Mode when scanned via QR code
  const searchParams =
    typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null
  const isMobileView = searchParams?.get("view") === "mobile"
  const mobileExportId = searchParams?.get("id")
  const mobileImgUrl = searchParams?.get("img")
  const mobilePeerId = searchParams?.get("peer")

  if (isMobileView) {
    const localPhoto = saved.length > 0 ? saved[0].image : null
    return (
      <MobileKeepsakeViewer
        exportId={mobileExportId}
        imgUrl={mobileImgUrl}
        peerId={mobilePeerId}
        localSavedPhoto={localPhoto}
      />
    )
  }

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
            className={`relative flex items-center gap-1.5 ${page === "kbooth" ? "is-active" : ""}`}
            onClick={() => setPage("kbooth")}
          >
            <span>k-booth</span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-amber-400 text-stone-950 uppercase tracking-wider animate-pulse">
              {kBoothTemplates.length} NEW
            </span>
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
            onClick={() => setPage("editor")}
          >
            studio
          </button>
          <button
            type="button"
            className={page === "creations" ? "is-active" : ""}
            onClick={() => {
              setCreationsTab("scrapbook")
              setPage("creations")
            }}
          >
            scrapbook ({saved.length})
          </button>
          <button
            type="button"
            className={page === "settings" ? "is-active" : ""}
            onClick={() => setPage("settings")}
          >
            settings
          </button>

          {/* Cloud Database & Account Button */}
          <button
            type="button"
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-stone-800 bg-white hover:bg-stone-100 text-xs font-mono shadow-sm transition-all ml-1"
            onClick={() => setAccountModalOpen(true)}
            title="Cloud Database & User Account"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured()
                  ? "bg-emerald-500 animate-pulse"
                  : isFirebaseConfigured()
                    ? "bg-amber-500"
                    : "bg-stone-400"
              }`}
            />
            <span className="font-bold">
              {isSupabaseConfigured()
                ? "Supabase Sync"
                : firebaseUser?.displayName
                  ? firebaseUser.displayName.split(" ")[0]
                  : "Cloud DB"}
            </span>
            <Database size={13} className="text-stone-600" />
          </button>
        </nav>

        {/* Mobile & Tablet quick actions */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            className="w-9 h-9 border-2 border-stone-900 bg-white shadow-[2px_2px_0_#171717] flex items-center justify-center text-stone-900 active:scale-95 transition-transform"
            onClick={() => setAccountModalOpen(true)}
            title="Cloud Database & User Account"
            aria-label="Cloud Database & User Account"
          >
            <Database size={16} />
          </button>

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
            { id: "kbooth", label: "K-Booth 인생네컷", icon: Sparkles, count: kBoothTemplates.length },
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
                    className="sketch-button flex items-center gap-1.5 bg-amber-100/90 hover:bg-amber-200 border-stone-900 text-stone-900 font-bold"
                    onClick={() => setPage("kbooth")}
                  >
                    <Sparkles size={15} className="text-amber-700" />
                    <span>K-Booth Frames (12)</span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono font-bold bg-stone-900 text-amber-300">
                      NEW
                    </span>
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
                    className="sketch-button flex items-center gap-1.5 bg-[#fdfbf7]"
                    onClick={() => {
                      setCreationsTab("scrapbook")
                      setPage("creations")
                    }}
                  >
                    <BookOpen size={15} className="text-amber-800" />
                    <span>Memory Scrapbook</span>
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

            {/* K-Booth Spotlight Section on Home */}
            <section className="mt-14 p-6 sm:p-8 bg-[#f5ede2] border-2 border-stone-900 shadow-[6px_6px_0_#171717]">
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-stone-900 text-amber-300 font-mono text-[11px] font-bold uppercase rounded-sm">
                      NEW COLLECTION
                    </span>
                    <span className="text-xs font-mono text-stone-600">인생네컷 · {kBoothTemplates.length} Authentic Canva Frames</span>
                  </div>
                  <h2 className="font-caveat text-3xl sm:text-4xl text-stone-900 font-bold">
                    K-Booth Photostrips & Memory Stubs
                  </h2>
                </div>
                <button
                  type="button"
                  className="sketch-button sketch-button--dark sketch-button--sm flex items-center gap-1.5 self-start md:self-auto"
                  onClick={() => setPage("kbooth")}
                >
                  <span>Explore All {kBoothTemplates.length} K-Frames</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              {/* Quick Preview Reel */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {kBoothTemplates.slice(0, 6).map((kt) => (
                  <button
                    key={kt.id}
                    type="button"
                    className="p-2 bg-[#faf8f0] border-2 border-stone-800 shadow-[2px_2px_0_#171717] hover:-translate-y-1 transition-transform text-left group"
                    onClick={() => {
                      applyTemplate(kt)
                      setPreviewTemplate(kt)
                    }}
                  >
                    <div className="aspect-square bg-stone-100 border border-stone-300 overflow-hidden mb-2 relative">
                      <TemplateThumbnail template={kt} className="w-full h-full object-contain p-1" />
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 bg-stone-900/80 text-amber-300 font-mono text-[9px] font-bold">
                        {kt.count} CUTS
                      </span>
                    </div>
                    <p className="text-[11px] font-bold text-stone-900 line-clamp-1 group-hover:text-amber-800">
                      {kt.name}
                    </p>
                    <p className="text-[10px] text-stone-500 font-mono">
                      {kt.orientation}
                    </p>
                  </button>
                ))}
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
        {/* SCREEN 1.5: K-BOOTH (인생네컷 · CANVA FRAMES GALLERY)      */}
        {/* ======================================================== */}
        {page === "kbooth" && (
          <section className="kbooth-page pb-16 pt-4">
            {/* Korean Photobooth Banner */}
            <div className="relative mb-8 p-6 sm:p-8 bg-[#f5ede2] border-2 border-stone-900 shadow-[6px_6px_0_#171717] overflow-hidden">
              <div className="relative z-10 max-w-3xl">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="px-2.5 py-1 bg-stone-900 text-amber-300 font-mono text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm flex items-center gap-1.5">
                    <Sparkles size={13} className="text-amber-300 animate-spin" />
                    인생네컷 · K-BOOTH STUDIO
                  </span>
                  <span className="px-2 py-0.5 bg-rose-600 text-white font-mono text-xs font-bold rounded-sm shadow-sm">
                    12 CANVA TEMPLATES
                  </span>
                  <span className="px-2 py-0.5 bg-purple-100 text-purple-900 border border-purple-300 font-mono text-[11px] font-bold rounded-sm">
                    Twin Strips · Tickets · Scrapbooks
                  </span>
                </div>

                <h1 className="font-caveat text-4xl sm:text-5xl md:text-6xl text-stone-900 font-bold leading-tight mb-3">
                  Korean Photobooth Keepsakes
                </h1>

                <p className="text-stone-700 text-sm sm:text-base leading-relaxed mb-6 font-sans">
                  Faithfully crafted from trending Canva templates: twin 4-cut marble strips, fanned V-strips with lace ribbons, starry midnight concert tickets, hot pink crocodile leather postage stamps, and vintage scrapbook moodboards. Snap live bursts in our analog booth or customize layers, text, stickers, and filters in the Studio.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    className="sketch-button sketch-button--dark flex items-center gap-2"
                    onClick={() => {
                      applyTemplate(kBoothTemplates[0])
                      setPage("camera")
                      openCamera()
                    }}
                  >
                    <Camera size={16} />
                    <span>Launch K-Booth Camera Burst</span>
                  </button>

                  <button
                    type="button"
                    className="sketch-button flex items-center gap-2 bg-[#faf8f0]"
                    onClick={() => {
                      applyTemplate(kBoothTemplates[0])
                      setPage("editor")
                    }}
                  >
                    <Paintbrush size={16} />
                    <span>Open in Studio Editor</span>
                  </button>

                  <button
                    type="button"
                    className="sketch-button flex items-center gap-2 text-stone-700"
                    onClick={() => {
                      applyTemplate(kBoothTemplates[0])
                      setPage("review")
                      slotReplaceIndex.current = null
                      fileInput.current?.click()
                    }}
                  >
                    <Upload size={16} />
                    <span>Upload Snapshots</span>
                  </button>
                </div>
              </div>

              {/* Watermark Stamp */}
              <div className="absolute -bottom-8 -right-8 w-44 h-44 rounded-full border-4 border-dashed border-stone-400/40 flex items-center justify-center rotate-12 pointer-events-none select-none">
                <span className="text-[13px] font-mono font-bold tracking-widest text-stone-400/60 uppercase text-center leading-tight">
                  LITTLE MOMENTS<br />★ K-BOOTH ★<br />SEOUL 2026
                </span>
              </div>
            </div>

            {/* Filter Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
              {[
                { label: `All ${kBoothTemplates.length} K-Frames`, key: "All", count: kBoothTemplates.length },
                {
                  label: "Twin Strips (8, 7 & 6 Cuts)",
                  key: "Twin Strips",
                  count: kBoothTemplates.filter((t) => t.tags?.includes("twin-strip") || t.tags?.includes("v-strip")).length,
                },
                {
                  label: "Tickets & Bookmarks",
                  key: "Tickets & Barcodes",
                  count: kBoothTemplates.filter((t) => t.tags?.includes("ticket") || t.tags?.includes("barcode") || t.tags?.includes("bookmark")).length,
                },
                {
                  label: "Postage Stamp & Denim",
                  key: "Postage Stamp & Denim",
                  count: kBoothTemplates.filter((t) => t.tags?.includes("stamp") || t.tags?.includes("croc") || t.tags?.includes("denim")).length,
                },
                {
                  label: "70s Retro Groovy",
                  key: "70s Retro Groovy",
                  count: kBoothTemplates.filter((t) => t.tags?.includes("retro") || t.tags?.includes("70s") || t.tags?.includes("groovy")).length,
                },
                {
                  label: "Minimalist & Slats",
                  key: "Minimalist & Slats",
                  count: kBoothTemplates.filter((t) => t.tags?.includes("minimal") || t.tags?.includes("slat") || t.tags?.includes("shadow")).length,
                },
                {
                  label: "Moodboard & Scrapbook",
                  key: "Moodboard & Scrapbook",
                  count: kBoothTemplates.filter((t) => t.tags?.includes("moodboard") || t.tags?.includes("scrapbook")).length,
                },
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  className={`flex-shrink-0 px-3.5 py-1.5 text-xs font-mono rounded-sm border-2 transition-all active:scale-95 ${
                    kBoothCategory === tab.key
                      ? "bg-stone-900 text-amber-300 border-stone-900 shadow-[2px_2px_0_#171717] font-bold"
                      : "bg-[#faf8f0] text-stone-700 border-stone-800 hover:bg-stone-100 shadow-[1px_1px_0_#171717]"
                  }`}
                  onClick={() => setKBoothCategory(tab.key)}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </div>

            {/* Template Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredKBooth.map((t, idx) => (
                <article
                  key={t.id}
                  className="template-card flex flex-col justify-between bg-[#faf8f0] border-2 border-stone-900 shadow-[4px_4px_0_#171717] p-3 transition-transform hover:-translate-y-1"
                >
                  <div className="relative mb-3">
                    <button
                      type="button"
                      className="w-full aspect-square bg-stone-950/5 border border-stone-300 overflow-hidden relative group block"
                      onClick={() => setPreviewTemplate(t)}
                      title={`Inspect ${t.name}`}
                    >
                      <TemplateThumbnail
                        template={t}
                        className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-300"
                      />
                      <span className="absolute top-2 left-2 px-2 py-0.5 text-[10px] font-mono font-bold bg-stone-900 text-amber-300 border border-stone-800 shadow-sm">
                        {t.count} CUTS
                      </span>
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 text-[9px] font-mono font-bold bg-white/90 border border-stone-400 text-stone-800 uppercase">
                        {t.orientation}
                      </span>
                    </button>

                    <button
                      type="button"
                      className="absolute bottom-2 right-2 p-1.5 rounded-full bg-white/90 border border-stone-800 shadow-sm text-stone-700 hover:text-rose-600 active:scale-90 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleFavorite(t.id)
                      }}
                      title={favorites.includes(t.id) ? "Remove favorite" : "Add to favorites"}
                    >
                      <Heart
                        size={15}
                        className={favorites.includes(t.id) ? "fill-rose-500 text-rose-500" : ""}
                      />
                    </button>
                  </div>

                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-mono font-bold text-amber-700 uppercase tracking-wider">
                          K-Booth · {t.id.replace("tmpl-", "")}
                        </span>
                        {t.canvaUrl && (
                          <a
                            href={t.canvaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] font-mono text-purple-700 hover:text-purple-900 hover:underline"
                            title="View Template on Canva"
                          >
                            <span>Canva</span>
                            <ExternalLink size={10} />
                          </a>
                        )}
                      </div>

                      <h3 className="font-bold text-base text-stone-900 leading-snug mb-1">
                        {t.name}
                      </h3>
                      {t.subtitle && (
                        <p className="text-xs text-stone-500 font-mono mb-2">
                          {t.subtitle}
                        </p>
                      )}
                      <p className="text-xs text-stone-700 line-clamp-2 leading-relaxed mb-3">
                        {t.note}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-dashed border-stone-300">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          className="sketch-button sketch-button--dark text-xs py-2 px-2 flex items-center justify-center gap-1.5"
                          onClick={() => startWithTemplate(t, "booth")}
                          title={`Snap ${t.count} photos in live booth`}
                        >
                          <Camera size={13} />
                          <span className="font-bold">Snap in Booth</span>
                        </button>

                        <button
                          type="button"
                          className="sketch-button text-xs py-2 px-2 flex items-center justify-center gap-1.5 bg-[#f3ede4]"
                          onClick={() => startWithTemplate(t, "sample")}
                          title="Open and edit template in Studio"
                        >
                          <Paintbrush size={13} />
                          <span>Open Studio</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        className="w-full py-1 text-[11px] font-mono text-stone-600 hover:text-stone-900 hover:bg-stone-200/60 border border-stone-300 rounded-sm flex items-center justify-center gap-1.5 transition-colors"
                        onClick={() => startWithTemplate(t, "upload")}
                        title="Directly select images from device"
                      >
                        <Upload size={12} />
                        <span>Upload Photos Directly</span>
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
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
                  "Purikura 90s (プリクラ)",
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
                <div
                  className="camera-frame is-clickable relative overflow-hidden bg-[#121212]"
                  onClick={() => {
                    if (!capturing && cameraState !== "loading") {
                      startBurstCapture()
                    }
                  }}
                  title="Click anywhere to capture photos"
                >
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
                            onClick={(e) => {
                              e.stopPropagation()
                              setDemoMode(false)
                              openCamera()
                            }}
                          >
                            Retry Webcam
                          </button>
                          <button
                            type="button"
                            className="sketch-button sketch-button--sm text-[11px] text-stone-200 border-stone-500 py-1"
                            onClick={(e) => {
                              e.stopPropagation()
                              fileInput.current?.click()
                            }}
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
                    <span className="hud-pill font-mono bg-rose-950/85 text-rose-200 border-rose-500/70 hidden sm:inline-flex items-center gap-1.5 shadow-md">
                      <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping inline-block" />
                      CLICK RED BUTTON OR TAP CAMERA
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
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="relative flex items-center justify-center">
                      <div className="shutter-btn-ring" />
                      <button
                        type="button"
                        id="shutter-button"
                        disabled={capturing || cameraState === "loading"}
                        className="shutter-btn"
                        onClick={(e) => {
                          e.stopPropagation()
                          startBurstCapture()
                        }}
                        title={`Take ${currentTemplate.count} Photobooth Shots`}
                        aria-label="Capture Photos"
                      >
                        <Camera size={28} className={capturing ? "animate-spin" : ""} />
                      </button>
                    </div>
                    <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-stone-800">
                      {capturing ? "Capturing..." : `Snap (${currentTemplate.count} Cuts)`}
                    </span>
                  </div>

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

                        <div className="aspect-[4/3] bg-stone-100 border border-stone-300 overflow-hidden flex items-center justify-center">
                          {photo ? (
                            <img
                              src={photo.src}
                              alt={`Slot ${slotIdx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <button
                              type="button"
                              className="text-stone-500 hover:text-stone-900 text-xs flex flex-col items-center gap-1.5 p-3 w-full h-full justify-center hover:bg-stone-200/60 transition-colors"
                              onClick={() => {
                                slotReplaceIndex.current = slotIdx
                                fileInput.current?.click()
                              }}
                            >
                              <Plus size={20} className="text-amber-700" />
                              <span className="font-mono font-bold text-[10px] uppercase tracking-wide text-stone-700">+ Add Photo</span>
                            </button>
                          )}
                        </div>

                        {photo && (
                          <div className="mt-2.5 pt-2 border-t border-stone-200 flex justify-between items-center gap-1.5 text-[11px] font-mono">
                            <span className="text-stone-700 font-semibold truncate max-w-[100px]">
                              {photo.name && !photo.name.startsWith("Sample Photo") ? photo.name : `Shot ${slotIdx + 1}`}
                            </span>
                            <button
                              type="button"
                              className="px-2 py-0.5 rounded bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold text-[10px] transition-colors shrink-0"
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
            {/* Modern Atelier Studio Header */}
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 bg-[#faf8f2] border-b border-stone-200/90 shadow-sm flex-shrink-0 z-20">
              <div className="flex items-center gap-2.5 min-w-0">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-stone-300 hover:border-stone-900 text-xs font-semibold text-stone-800 shadow-sm active:scale-95 transition-all flex-shrink-0"
                  onClick={() => setPage("templates")}
                >
                  <ArrowLeft size={13} /> Back
                </button>
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 bg-stone-900 text-white rounded text-[10.5px] font-mono font-bold tracking-wider">STUDIO</span>
                  <h2 className="text-sm sm:text-base font-semibold text-stone-900 truncate max-w-[160px] xs:max-w-[240px] sm:max-w-none">
                    {composition.gridLayoutId
                      ? (findGridLayout(composition.gridLayoutId)?.name ?? currentTemplate.name)
                      : currentTemplate.name}
                  </h2>
                  <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-stone-200/70 text-stone-700 text-[10.5px] font-mono font-medium">
                    {composition.aspectRatio ?? "1:1"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
                  <button
                    type="button"
                    className="p-1.5 text-stone-700 hover:text-stone-950 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent active:scale-95 transition-all"
                    onClick={() => undo()}
                    disabled={!history.length}
                    title="Undo"
                  >
                    <Undo2 size={14} />
                  </button>
                  <button
                    type="button"
                    className="p-1.5 text-stone-700 hover:text-stone-950 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent active:scale-95 transition-all"
                    onClick={() => redo()}
                    disabled={!future.length}
                    title="Redo"
                  >
                    <Redo2 size={14} />
                  </button>
                </div>

                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-full bg-white border border-stone-300 hover:border-stone-900 text-xs font-semibold text-stone-800 shadow-sm active:scale-95 transition-all hidden xs:inline-flex items-center gap-1"
                  onClick={() => saveCurrentCreation()}
                >
                  Save
                </button>

                <button
                  type="button"
                  className="px-4 py-1.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-semibold shadow-md active:scale-95 transition-all flex items-center gap-1"
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
                    disabled={busy}
                    className="sketch-button w-full text-xs bg-rose-50 hover:bg-rose-100 border-rose-300 text-rose-950 flex items-center justify-center gap-2 font-medium"
                    onClick={() => openQrTransferModal()}
                  >
                    <QrCode size={15} className="text-rose-600" /> Scan to Mobile (QR Code)
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
        {/* SCREEN 7: INTERACTIVE SCRAPBOOK FLIPBOOK & MEMORY ALBUM  */}
        {/* ======================================================== */}
        {page === "creations" && (
          <section className="shop-section border-t-0 pt-6">
            <header className="section-heading mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <p className="eyebrow">Your Archive & Keepsakes</p>
                <h2>Interactive Memory Scrapbook</h2>
                <p className="mt-1 text-sm text-stone-600">
                  All compositions saved on this device. Flip through your spiral memory album or switch to the card grid.
                </p>
              </div>

              {/* View Switcher: Scrapbook Album vs Grid Gallery */}
              <div className="flex items-center gap-1 p-1 bg-stone-200/80 rounded-lg self-start sm:self-auto border border-stone-300 shadow-sm">
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                    creationsTab === "scrapbook"
                      ? "bg-stone-900 text-amber-300 shadow-sm"
                      : "text-stone-700 hover:text-stone-950"
                  }`}
                  onClick={() => setCreationsTab("scrapbook")}
                >
                  <BookOpen size={14} />
                  <span>Spiral Scrapbook</span>
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-xs font-mono font-bold transition-all ${
                    creationsTab === "grid"
                      ? "bg-stone-900 text-amber-300 shadow-sm"
                      : "text-stone-700 hover:text-stone-950"
                  }`}
                  onClick={() => setCreationsTab("grid")}
                >
                  <LayoutGrid size={14} />
                  <span>Grid ({saved.length})</span>
                </button>
              </div>
            </header>

            {creationsTab === "scrapbook" ? (
              <ScrapbookAlbum
                creations={saved.map((s) => ({
                  id: s.id,
                  name: `Photostrip · ${s.date}`,
                  date: s.date,
                  data: s.composition,
                  previewUrl: s.image,
                }))}
                onOpenInStudio={(comp) => {
                  setComposition(comp)
                  setPage("editor")
                }}
                onExportCreation={(comp) => {
                  setComposition(comp)
                  setPage("export")
                }}
                onNewStrip={() => {
                  setPage("camera")
                  openCamera()
                }}
              />
            ) : saved.length === 0 ? (
              <div className="py-20 text-center border-2 border-dashed border-stone-300 p-8 bg-[#faf8f2]">
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

      {/* QR Code Instant Mobile Transfer Modal */}
      {qrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#faf8f2] border-2 border-stone-900 rounded-2xl shadow-[6px_6px_0_#1c1917] p-6 max-w-md w-full relative">
            <button
              type="button"
              className="absolute top-4 right-4 text-stone-500 hover:text-stone-900 p-1 rounded-full hover:bg-stone-200 transition-colors"
              onClick={() => {
                setQrModalOpen(false)
                qrTransferHostRef.current?.destroy()
                qrTransferHostRef.current = null
              }}
              aria-label="Close QR Modal"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="p-2 rounded-lg bg-rose-100 text-rose-600 border border-rose-300">
                <QrCode size={20} />
              </span>
              <div>
                <h3 className="font-gochi text-2xl text-stone-900 leading-tight">
                  Scan to Mobile
                </h3>
                <p className="text-[11px] font-mono text-stone-500 uppercase tracking-wider">
                  Instant Wireless Photo Transfer
                </p>
              </div>
            </div>

            {/* Live Sync Status Badge */}
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-mono mb-2 bg-stone-100/90 border border-stone-200">
              <span className="flex items-center gap-2">
                {qrSyncStatus === "p2p_active" ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-700 font-bold">✓ Phone Connected via P2P!</span>
                  </>
                ) : qrSyncStatus === "cloud_db_saved" ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-emerald-800 font-bold">● Cloud Database Synced (Universal Scan)</span>
                  </>
                ) : qrSyncStatus === "cloud_ready" ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-emerald-800 font-bold">● Cloud Relay Ready (Any Network / 5G)</span>
                  </>
                ) : (
                  <>
                    <Loader2 size={13} className="animate-spin text-amber-600" />
                    <span className="text-stone-600">Connecting Cloud Sync...</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-stone-400 font-mono">Zero-Install</span>
            </div>

            {/* QR Code Container */}
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-xl border border-stone-300 shadow-inner my-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="Scan with mobile camera"
                  className="w-56 h-56 rounded-lg object-contain shadow-sm"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center text-stone-400">
                  <Loader2 size={32} className="animate-spin" />
                </div>
              )}
              <span className="mt-2 text-[11px] font-mono text-stone-500">
                Point phone camera at QR code to open
              </span>
            </div>

            {/* Step-by-Step Instructions */}
            <div className="bg-stone-100/80 rounded-xl p-3 border border-stone-200 text-xs text-stone-700 space-y-1.5 mb-4 font-mono">
              <div className="flex items-center gap-2 font-bold text-stone-900">
                <Smartphone size={14} className="text-rose-600" />
                <span>How to transfer:</span>
              </div>
              <p>1. Open Camera app on iPhone or Android</p>
              <p>2. Scan code above & tap the yellow banner</p>
              <p>3. Long-press photo or tap Save to Camera Roll</p>
            </div>

            {/* Quick Preview & Link Tools */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="text"
                  value={qrExportUrl}
                  readOnly
                  className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded text-stone-600 text-[11px] font-mono truncate"
                />
                <button
                  type="button"
                  className="sketch-button sketch-button--sm text-xs py-1.5 px-3 flex items-center gap-1 flex-shrink-0"
                  onClick={() => {
                    if (navigator.clipboard) {
                      navigator.clipboard.writeText(qrExportUrl)
                      setQrCopied(true)
                      setTimeout(() => setQrCopied(false), 2000)
                      notify("Link copied to clipboard!")
                    }
                  }}
                >
                  {qrCopied ? (
                    <Check size={12} className="text-green-600" />
                  ) : (
                    <Copy size={12} />
                  )}
                  {qrCopied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-stone-500 border-t border-stone-200">
                <span>Local Wi-Fi Host:</span>
                <input
                  type="text"
                  value={qrLanHost}
                  onChange={(e) => updateQrHost(e.target.value)}
                  placeholder="e.g. 192.168.1.5:3000"
                  className="px-2 py-0.5 bg-white border border-stone-300 rounded text-[11px] font-mono text-right w-44"
                  title="Change if connecting from phone on local Wi-Fi"
                />
              </div>
            </div>
          </div>
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
            className={`flex flex-col items-center justify-center py-1 px-2.5 sm:px-4 rounded-full text-[10px] font-mono tracking-tight transition-all active:scale-95 ${
              page === "kbooth"
                ? "bg-stone-900 text-amber-300 font-bold shadow-sm"
                : "text-stone-600 hover:text-stone-900"
            }`}
            onClick={() => {
              setPage("kbooth")
              window.scrollTo({ top: 0, behavior: "smooth" })
            }}
          >
            <div className="relative">
              <Sparkles size={19} className={page === "kbooth" ? "stroke-[2.5]" : "stroke-[1.8]"} />
              <span className="absolute -top-1 -right-2 text-[8px] font-mono font-bold bg-amber-400 text-stone-950 px-1 rounded-full leading-tight">
                {kBoothTemplates.length}
              </span>
            </div>
            <span className="mt-0.5">K-Booth</span>
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
              setCreationsTab("scrapbook")
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
            <span className="mt-0.5">Scrapbook</span>
          </button>
        </nav>
      )}

      {/* CodePen Site Footer - only on informational pages */}
      {(page === "home" || page === "templates" || page === "kbooth") && (
        <footer className="site-footer">
          <span>© Little Moments Creative Print Studio</span>
          <span>Crafted with vintage ink & real paper textures.</span>
        </footer>
      )}

      {/* Cloud Database & User Account Modal */}
      <UserAccountModal
        isOpen={accountModalOpen}
        onClose={() => setAccountModalOpen(false)}
        user={firebaseUser}
        onUserUpdated={setFirebaseUser}
        cloudCreationsCount={saved.length}
      />
    </div>
  )
}
