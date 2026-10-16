import { lazy, Suspense, useEffect, useRef, useState } from "react"
import {
  Camera,
  ArrowUpRight,
  ArrowRight,
  ArrowLeft,
  Plus,
  Heart,
  Sparkles,
  ShieldCheck,
  SlidersHorizontal,
  Images,
  Home,
  Settings,
  X,
  Check,
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

const Studio = lazy(() => import("./studio/Studio"))
const samples = [
  "/photos/booth.jpg",
  "/photos/friends.jpg",
  "/photos/moments.jpg",
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
const emptyComposition = (id = "four-cut"): Composition => ({
  templateId: id,
  background: getTemplate(id).background,
  borderColor: "#38352f",
  borderWidth: 0,
  radius: 2,
  spacing: 0,
  padding: 0,
  photos: [],
  stickers: [],
  texts: [],
})
type Saved = {
  id: string
  date: string
  image: string
  composition: Composition
}
type Page = "home" | "templates" | "creations" | "settings" | "setup" | "camera" | "review" | "editor" | "export"
function readLocal<T>(key: string, fallback: T): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") ?? fallback
  } catch {
    return fallback
  }
}
function TemplateArt({
  template,
  hero = false,
}: {
  template: PhotoTemplate
  hero?: boolean
}) {
  return (
    <div
      className={`template-art ${hero ? "hero-art" : ""}`}
      style={{
        background: template.background,
        aspectRatio: `${template.width}/${template.height}`,
      }}
    >
      {template.slots.map((s, i) => (
        <img
          key={i}
          alt="Example photo booth composition"
          src={samples[i % samples.length]}
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: `${s.width}%`,
            height: `${s.height}%`,
            filter: template.category === "Retro film" ? "grayscale(1)" : "",
          }}
        />
      ))}
      <span className="strip-sign" style={{ color: template.accent }}>
        little moments ✧
      </span>
    </div>
  )
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
      .catch(() => setError("Could not load this photo. Try replacing it."))
    return () => {
      active = false
    }
  }, [composition, fontRevision])
  return (
    <>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <canvas
          ref={ref}
          className="composition"
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
  const [composition, setComposition] = useState<Composition>(
    emptyComposition(),
  )
  const [saved, setSaved] = useState<Saved[]>(() =>
    readLocal("little-creations", []),
  )
  const [favorites, setFavorites] = useState<string[]>(() =>
    readLocal("little-favorites", []),
  )
  const [toast, setToast] = useState("")
  const [category, setCategory] = useState("All styles")
  const [query, setQuery] = useState("")
  const [picking, setPicking] = useState(false)
  const [uploadFlow, setUploadFlow] = useState(false)
  const [selected, setSelected] = useState(0)
  const [history, setHistory] = useState<Composition[]>([])
  const [future, setFuture] = useState<Composition[]>([])
  const [format, setFormat] = useState<"png" | "jpeg">("png")
  const [busy, setBusy] = useState(false)
  const [quality, setQuality] = useState(96)
  const [exportSize, setExportSize] = useState("original")
  const [saveStatus, setSaveStatus] = useState("Saved on this device")
  const [recovery, setRecovery] = useState<Composition | null>(null)
  const draftReady = useRef(false)
  const documentRevision = useRef(0)
  const [cameraState, setCameraState] = useState("idle")
  const [countdown, setCountdown] = useState<number | null>(null)
  const [capturing, setCapturing] = useState(false)
  const [retake, setRetake] = useState<number | null>(null)
  const [previewTemplate, setPreviewTemplate] = useState<PhotoTemplate | null>(
    null,
  )
  const [confirm, setConfirm] = useState<{
    text: string
    action: () => void
  } | null>(null)
  const [dark, setDark] = useState(false)
  const video = useRef<HTMLVideoElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const cancel = useRef(false)
  const fileInput = useRef<HTMLInputElement>(null)
  const replaceIndex = useRef<number | null>(null)
  const notify = (s: string) => setToast(s)
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(""), 4000)
      return () => clearTimeout(t)
    }
  }, [toast])
  useEffect(() => {
    try {
      localStorage.setItem("little-settings", JSON.stringify(settings))
    } catch {
      notify("Settings could not be stored on this device.")
    }
  }, [settings])
  useEffect(() => {
    try {
      localStorage.setItem("little-favorites", JSON.stringify(favorites))
    } catch {
      notify("Favorites could not be stored on this device.")
    }
  }, [favorites])
  useEffect(() => {
    if (page !== "camera") {
      cancel.current = true
      stream.current?.getTracks().forEach((t) => t.stop())
      stream.current = null
      setCameraState("idle")
      setCapturing(false)
    }
  }, [page])
  useEffect(
    () => () => {
      cancel.current = true
      stream.current?.getTracks().forEach((t) => t.stop())
    },
    [],
  )
  useEffect(() => {
    let active = true
    const revision = documentRevision.current + 1
    loadProjects()
      .then((records) => {
        if (!active) return
        const draft = records.find((r) => r.id === "draft")
        if (
          draft?.composition.photos.length &&
          documentRevision.current === revision
        )
          setRecovery(draft.composition)
        setSaved((old) => [
          ...records.filter((r) => r.id !== "draft"),
          ...old.filter((r) => !records.some((n) => n.id === r.id)),
        ])
        draftReady.current = true
      })
      .catch(() => {
        draftReady.current = true
        setSaveStatus("Save failed")
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
      setSaveStatus("Saving locally…")
      saveProject({
        id: "draft",
        date: new Date().toISOString(),
        image: "",
        composition,
      })
        .then(() => {
          if (active) {
            setSaveStatus("Saved on this device")
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
  const saveEditableProject = async () => {
    try {
      await document.fonts.ready
      const preview = await renderComposition(
        document.createElement("canvas"),
        composition,
        getTemplate(composition.templateId),
        0.2,
      )
      const entry: Saved = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString(),
        image: preview.toDataURL("image/jpeg", 0.75),
        composition,
      }
      await Promise.all([
        saveProject(entry),
        saveProject({ ...entry, id: "draft", image: "" }),
      ])
      setRecovery(composition)
      setSaved((old) => [entry, ...old])
      setSaveStatus("Saved on this device")
      notify(
        "Editable project saved to My creations. Originals and layers preserved.",
      )
    } catch {
      setSaveStatus("Save failed")
      notify(
        "Could not save locally. Storage may be full. Download your image to keep a copy.",
      )
    }
  }
  const deleteSaved = async (id: string) => {
    try {
      await removeProject(id)
      const next = saved.filter((x) => x.id !== id)
      localStorage.setItem(
        "little-creations",
        JSON.stringify(
          next.filter((x) =>
            readLocal<Saved[]>("little-creations", []).some(
              (old) => old.id === x.id,
            ),
          ),
        ),
      )
      setSaved(next)
    } catch {
      notify("Could not remove this project. Please try again.")
    }
  }
  const edit = (next: Composition, before?: Composition) => {
    setHistory((h) => [...h.slice(-49), before ?? composition])
    setFuture([])
    setComposition(next)
  }
  const updatePhoto = (patch: Partial<Photo["adjustments"]>) =>
    edit({
      ...composition,
      photos: composition.photos.map((p, i) =>
        i === selected
          ? { ...p, adjustments: { ...p.adjustments, ...patch } }
          : p,
      ),
    })
  const chooseTemplate = (t: PhotoTemplate) => {
    edit({ ...composition, templateId: t.id, background: t.background })
    setPreviewTemplate(null)
    if (picking) {
      setPage(uploadFlow ? "review" : "camera")
    } else {
      setSettings((s) => ({ ...s, count: t.count }))
      setPage("setup")
    }
  }
  const start = (upload = false) => {
    const begin = () => {
      setComposition(emptyComposition())
      setHistory([])
      setFuture([])
      setSelected(0)
      setUploadFlow(upload)
      setPicking(true)
      setPage("setup")
    }
    if (composition.photos.length)
      setConfirm({
        text: "Start a new session? Download your current composition first if you want to keep it.",
        action: begin,
      })
    else begin()
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
        const image = new Image()
        image.src = src
        await image.decode()
        photos.push({
          id: crypto.randomUUID(),
          src,
          name: file.name,
          adjustments: defaultAdjustments(),
        })
      }
      if (replaceIndex.current !== null && photos[0]) {
        const index = replaceIndex.current
        edit({
          ...composition,
          photos: composition.photos.map((p, i) =>
            i === index ? photos[0] : p,
          ),
        })
        replaceIndex.current = null
      } else {
        edit({
          ...composition,
          photos: [...composition.photos, ...photos].slice(0, settings.count),
        })
      }
      notify("Photos added. Make them yours.")
    } catch {
      notify("This image could not be opened. Try a JPG or PNG.")
    }
    if (fileInput.current) fileInput.current.value = ""
  }
  const openCamera = async () => {
    setCameraState("loading")
    stream.current?.getTracks().forEach((t) => t.stop())
    try {
      const media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: settings.facingMode },
        audio: false,
      })
      if (!video.current) {
        media.getTracks().forEach((track) => track.stop())
        return
      }
      stream.current = media
      if (video.current) {
        video.current.srcObject = media
        await video.current.play()
      }
      media.getVideoTracks()[0].onended = () => setCameraState("disconnected")
      setCameraState("ready")
    } catch (e) {
      setCameraState(
        e instanceof DOMException && e.name === "NotAllowedError"
          ? "denied"
          : "unavailable",
      )
    }
  }
  const capture = async () => {
    if (!video.current || cameraState !== "ready") return
    cancel.current = false
    setCapturing(true)
    const result = [...composition.photos]
    const total = retake !== null ? 1 : settings.count
    for (let i = 0; i < total; i++) {
      const seconds = i === 0 ? settings.countdown : settings.interval
      for (let s = seconds; s > 0; s--) {
        if (cancel.current) break
        setCountdown(s)
        await new Promise((r) => setTimeout(r, 1000))
      }
      if (cancel.current) break
      setCountdown(null)
      const v = video.current
      if (!v || !v.videoWidth) {
        notify("Camera disconnected. Your earlier photos are safe.")
        break
      }
      const c = document.createElement("canvas")
      c.width = v.videoWidth
      c.height = v.videoHeight
      const ctx = c.getContext("2d")!
      if (settings.mirror) {
        ctx.translate(c.width, 0)
        ctx.scale(-1, 1)
      }
      ctx.drawImage(v, 0, 0)
      const photo = {
        id: crypto.randomUUID(),
        src: c.toDataURL("image/jpeg", 0.94),
        name: `Take ${i + 1}`,
        adjustments: defaultAdjustments(),
      }
      if (retake !== null) result[retake] = photo
      else result[i] = photo
      setComposition((prev) => ({ ...prev, photos: [...result] }))
      if (settings.flash) {
        document.body.classList.add("shutter")
        setTimeout(() => document.body.classList.remove("shutter"), 120)
      }
    }
    setCapturing(false)
    setCountdown(null)
    if (!cancel.current) {
      setRetake(null)
      setPage("review")
    }
  }
  const exportImage = async (share = false) => {
    setBusy(true)
    try {
      await document.fonts.ready
      const canvas = await renderComposition(
        document.createElement("canvas"),
        composition,
        getTemplate(composition.templateId),
        exportSize === "original"
          ? 1
          : Number(exportSize) /
              Math.max(
                ...Object.values(
                  dimensions(composition, getTemplate(composition.templateId)),
                ),
              ),
      )
      const blob = await new Promise<Blob>((resolve, reject) =>
        canvas.toBlob(
          (b) => (b ? resolve(b) : reject(new Error())),
          `image/${format}`,
          quality / 100,
        ),
      )
      const file = new File(
        [blob],
        `little-moments.${format === "jpeg" ? "jpg" : "png"}`,
        { type: blob.type },
      )
      if (share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "A little moment" })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = file.name
        a.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        if (share)
          notify(
            "Sharing is unavailable here. Your image was downloaded instead.",
          )
      }
      const entry: Saved = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString(),
        image: canvas.toDataURL("image/jpeg", 0.65),
        composition,
      }
      try {
        await saveProject(entry)
        setSaved((old) => [entry, ...old])
        notify("Saved! A little memory, yours to keep.")
      } catch {
        notify(
          "Downloaded. Local storage could not save an editable copy. Try freeing device space.",
        )
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        notify("Could not export. Please try again.")
    } finally {
      setBusy(false)
    }
  }
  const mainNav = (next: Page) => {
    setPicking(false)
    setPage(next)
  }
  const template = getTemplate(composition.templateId)
  const reviewCount =
    composition.mode === "freeform"
      ? Math.max(composition.photos.length, settings.count)
      : settings.count
  const back = () =>
    setPage(
      page === "setup"
        ? "home"
        : page === "templates"
          ? "setup"
          : page === "camera"
            ? "templates"
            : page === "review"
              ? uploadFlow
                ? "templates"
                : "camera"
              : page === "editor"
                ? "review"
                : "editor",
    )
  const cards = (items: PhotoTemplate[]) =>
    items.map((t) => (
      <article className="template-card" key={t.id}>
        <button
          className={`favorite ${
            favorites.includes(t.id) ? "is-favorite" : ""
          }`}
          aria-label={`Favorite ${t.name}`}
          onClick={() =>
            setFavorites((f) =>
              f.includes(t.id) ? f.filter((x) => x !== t.id) : [...f, t.id],
            )
          }
        >
          <Heart
            size={17}
            fill={favorites.includes(t.id) ? "currentColor" : "none"}
          />
        </button>
        <button className="card-preview" onClick={() => setPreviewTemplate(t)}>
          <TemplateArt template={t} />
        </button>
        <button className="card-label" onClick={() => setPreviewTemplate(t)}>
          <strong>{t.name}</strong>
          <span>
            {t.category} <span>· {t.count} photos</span>
          </span>
        </button>
      </article>
    ))
  return (
    <div
      className={`app ${dark ? "dark" : ""} ${
        page === "editor" ? "studio-active" : ""
      }`}
    >
      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => void upload(e.target.files)}
      />
      <header className="app-header">
        <button className="brand" onClick={() => mainNav("home")}>
          <span className="brand-icon">
            <Camera size={27} />
            <i />
          </span>
          <span>
            little<span className="brand-moments">moments</span>
            <span className="brand-dot">.</span>
          </span>
        </button>
        <nav className="desktop-nav">
          {[
            ["home", "Home"],
            ["templates", "Templates"],
            ["creations", "My creations"],
          ].map(([p, n]) => (
            <button
              className={page === p ? "active" : ""}
              key={p}
              onClick={() => mainNav(p as Page)}
            >
              {n}
              {page === p && <span className="nav-doodle" />}
            </button>
          ))}
        </nav>
        <div className="header-right">
          <span className="local-label">
            <span /> A little space, just for you
          </span>
          <button
            className="icon-button"
            aria-label="Settings"
            onClick={() => mainNav("settings")}
          >
            <Settings size={20} />
          </button>
        </div>
      </header>
      <main>
        {page === "home" && (
          <>
            {recovery && (
              <section className="draft-banner">
                <div>
                  <strong>A little work in progress is waiting.</strong>
                  <p>Your last editable session is safe on this device.</p>
                </div>
                <button
                  onClick={() => {
                    setComposition(recovery)
                    setHistory([])
                    setFuture([])
                    setSettings((s) => ({
                      ...s,
                      count: getTemplate(recovery.templateId).count,
                    }))
                    setPage("editor")
                  }}
                >
                  Resume creating
                  <ArrowRight size={15} />
                </button>
              </section>
            )}
            <section className="hero">
              <div className="hero-copy">
                <div className="eyebrow">
                  <span className="tiny-line" /> YOUR OWN LITTLE PHOTO BOOTH
                </div>
                <h1>
                  Little moments,
                  <br />
                  <span className="underlined">beautifully</span>
                  <br className="mobile-break" /> framed
                  <span className="coral-dot">.</span>
                  <Sparkles className="headline-spark" size={35} />
                </h1>
                <p>
                  Big laughs. Silly faces. Just being you.
                  <br />
                  Turn the everyday into something worth keeping.
                </p>
                <div className="hero-actions">
                  <button className="button primary" onClick={() => start()}>
                    <Camera size={20} />
                    Start photo booth
                    <ArrowUpRight size={19} />
                  </button>
                  <button
                    className="button secondary"
                    onClick={() => start(true)}
                  >
                    <Images size={19} />
                    Create from photos
                  </button>
                </div>
                <div className="privacy">
                  <ShieldCheck size={15} />
                  <span>Your photos stay on your device. Always.</span>
                </div>
                <span className="hand hero-note">
                  no sign-ups, just good memories{" "}
                  <svg width="45" height="28" viewBox="0 0 45 28">
                    <path d="M2 2Q8 26 41 19M32 12l10 7-9 6" />
                  </svg>
                </span>
              </div>
              <div className="hero-collage">
                <span className="hand collage-note">
                  a few seconds.
                  <br />a forever kind of memory.
                </span>
                <svg className="note-arrow" viewBox="0 0 100 70">
                  <path d="M8 4Q3 45 84 48M72 38l13 10-14 10" />
                </svg>
                <div className="hero-grid paper-photo">
                  <span className="tape" />
                  <div className="four-photos">
                    {[0, 1, 2, 3].map((n) => (
                      <img
                        key={n}
                        src={samples[0]}
                        alt="Friends making memories at a photo booth"
                        style={{
                          objectPosition: `${35 + n * 10}% center`,
                          filter: n === 2 ? "grayscale(1)" : "",
                        }}
                      />
                    ))}
                  </div>
                  <div className="hand photo-caption">
                    us, being us. <Heart size={19} />
                  </div>
                </div>
                <div className="hero-strip">
                  <TemplateArt template={getTemplate("three-strip")} />
                  <span className="strip-label">THE GOOD OLD DAYS</span>
                </div>
                <span className="round-stamp">
                  MADE OF
                  <br />
                  <Heart size={17} />
                  <br />
                  LITTLE MOMENTS
                </span>
                <Star className="hero-star" size={42} />
                <span className="hand collage-bottom">
                  perfectly imperfect.
                </span>
                <div className="pencil-marks">///</div>
              </div>
            </section>
            <section className="vibes-section">
              <div className="section-heading">
                <div>
                  <span className="eyebrow">A FRAME FOR EVERY FEELING</span>
                  <h2>
                    Choose your vibe{" "}
                    <span className="hand">what feels like you?</span>
                  </h2>
                </div>
                <button
                  className="text-button"
                  onClick={() => mainNav("templates")}
                >
                  Explore all templates <ArrowRight size={17} />
                </button>
              </div>
              <div className="vibe-list">
                {[
                  { name: "All styles", icon: <Sparkles size={17} /> },
                  { name: "Classic", icon: <Camera size={17} /> },
                  { name: "Korean four-cut", icon: <Images size={17} /> },
                  { name: "Polaroid", icon: <ImageIcon /> },
                  { name: "Retro film", icon: <Aperture size={17} /> },
                  { name: "Scrapbook", icon: <Pencil size={17} /> },
                  { name: "Minimal", icon: <span className="minimal-icon" /> },
                ].map((v) => (
                  <button
                    className={`chip ${category === v.name ? "selected" : ""}`}
                    key={v.name}
                    onClick={() => setCategory(v.name)}
                  >
                    {v.icon}
                    {v.name === "Korean four-cut" ? "Four-cut" : v.name}
                  </button>
                ))}
              </div>
              <div className="home-templates">
                {cards(
                  (category === "All styles"
                    ? [templates[5], templates[0], templates[9], templates[8]]
                    : templates.filter((t) => t.category === category)
                  ).slice(0, 4),
                )}
              </div>
            </section>
            <section className="bottom-note">
              <div className="note-camera">
                <Camera size={33} />
                <Sparkles size={15} />
              </div>
              <div>
                <h3>Not perfect. Just personal.</h3>
                <p>
                  No accounts. No uploads to a server. Just you, your people,
                  and a little creativity.
                </p>
              </div>
              <span className="hand">
                made for the memories <Heart size={19} />
              </span>
            </section>
            <footer>
              <span>little moments, lasting memories.</span>
              <span>YOUR MEMORIES. YOUR DEVICE. YOURS.</span>
            </footer>
          </>
        )}
        {page !== "home" && (
          <div className="workspace">
            <div className="page-top">
              {!["creations", "settings"].includes(page) && (
                <button
                  className="icon-button"
                  onClick={back}
                  aria-label="Go back"
                >
                  <ArrowLeft size={21} />
                </button>
              )}
              <div>
                <span className="eyebrow">
                  {["setup", "camera", "review", "editor", "export"].includes(
                    page,
                  )
                    ? "YOUR LITTLE CREATIVE SESSION"
                    : "YOUR PERSONAL SKETCHBOOK"}
                </span>
                <h1>
                  {
                    ({
                      setup: "Make it your moment.",
                      templates: "Find your perfect frame.",
                      camera: "Ready for your close-up?",
                      review: "The good takes.",
                      editor: "Your creative studio.",
                      export: "Made by you. Kept forever.",
                      creations: "Your little collection.",
                      settings: "Make yourself at home.",
                    } as Record<string, string>)[page]
                  }
                </h1>
              </div>
              {page === "editor" && (
                <div className="history-actions">
                  <button
                    className="icon-button"
                    disabled={!history.length}
                    aria-label="Undo"
                    onClick={() => {
                      const next = historyStep(
                        history,
                        composition,
                        future,
                        "undo",
                      )
                      setFuture(next.future)
                      setComposition(next.current)
                      setHistory(next.past)
                    }}
                  >
                    <Undo2 size={20} />
                  </button>
                  <button
                    className="icon-button"
                    disabled={!future.length}
                    aria-label="Redo"
                    onClick={() => {
                      const next = historyStep(
                        history,
                        composition,
                        future,
                        "redo",
                      )
                      setFuture(next.future)
                      setComposition(next.current)
                      setHistory(next.past)
                    }}
                  >
                    <Redo2 size={20} />
                  </button>
                </div>
              )}
            </div>
            {page === "setup" && (
              <div className="setup-layout">
                <section className="paper-panel">
                  <h2>How many little moments?</h2>
                  <p>Pick your photo count. We’ll find the frames that fit.</p>
                  <div className="count-options">
                    {counts.map((n) => (
                      <button
                        className={
                          settings.count === n
                            ? "count-option selected"
                            : "count-option"
                        }
                        onClick={() => {
                          const change = () => {
                            setSettings((s) => ({ ...s, count: n }))
                            if (composition.photos.length > n)
                              edit({
                                ...composition,
                                photos: composition.photos.slice(0, n),
                              })
                          }
                          if (composition.photos.length > n)
                            setConfirm({
                              text: "This photo count has fewer slots. Photos after the selected count will be removed from this session. Continue?",
                              action: change,
                            })
                          else change()
                        }}
                        key={n}
                      >
                        <span className="count-diagram">
                          {Array.from({ length: n }, (_, i) => (
                            <i key={i} />
                          ))}
                        </span>
                        <strong>{n}</strong>
                        <span>{n === 1 ? "photo" : "photos"}</span>
                        {settings.count === n && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                  <h2>Find your rhythm</h2>
                  <label className="field-label">
                    Initial countdown <span>Time to get into position</span>
                  </label>
                  <div className="choices">
                    {[0, 3, 5, 10].map((n) => (
                      <button
                        className={
                          settings.countdown === n ? "chip selected" : "chip"
                        }
                        key={n}
                        onClick={() =>
                          setSettings((s) => ({
                            ...s,
                            countdown: n as 0 | 3 | 5 | 10,
                          }))
                        }
                      >
                        {n === 0 ? "No delay" : `${n} sec`}
                      </button>
                    ))}
                  </div>
                  <label className="field-label">
                    Between photos{" "}
                    <span>A little time to change your pose</span>
                  </label>
                  <div className="choices">
                    {[2, 3, 5, 10].map((n) => (
                      <button
                        className={
                          settings.interval === n ? "chip selected" : "chip"
                        }
                        key={n}
                        onClick={() =>
                          setSettings((s) => ({ ...s, interval: n }))
                        }
                      >
                        {n} sec
                      </button>
                    ))}
                    <input
                      aria-label="Custom interval in seconds"
                      type="number"
                      min="1"
                      max="60"
                      value={settings.interval}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          interval: Math.max(
                            1,
                            Math.min(60, Number(e.target.value)),
                          ),
                        }))
                      }
                    />
                  </div>
                  {(["mirror", "flash"] as const).map((key) => (
                    <label className="toggle-row" key={key}>
                      <span>
                        {key === "mirror"
                          ? "Mirror camera preview"
                          : "Shutter flash animation"}
                      </span>
                      <input
                        type="checkbox"
                        checked={settings[key]}
                        onChange={(e) =>
                          setSettings((s) => ({
                            ...s,
                            [key]: e.target.checked,
                          }))
                        }
                      />
                    </label>
                  ))}
                  <button
                    className="button primary wide"
                    onClick={() => {
                      setPicking(true)
                      setPage("templates")
                      setCategory("All styles")
                    }}
                  >
                    Find my frame
                    <ArrowRight size={18} />
                  </button>
                </section>
                <aside className="setup-note">
                  <Sparkles size={35} />
                  <h2 className="hand">A tiny tip...</h2>
                  <p>
                    A 3-second countdown is just enough time to find your good
                    side.
                    <br />
                    <br />
                    Or your very silly side. We like that one too.
                  </p>
                  <TemplateArt template={getTemplate("four-cut")} />
                  <span className="hand">
                    four frames. endless possibilities.
                  </span>
                </aside>
              </div>
            )}
            {page === "templates" && (
              <>
                <div className="gallery-controls">
                  <div className="search">
                    <Search size={19} />
                    <input
                      placeholder="Find a frame, a feeling, a style…"
                      aria-label="Search templates"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </div>
                  {picking && (
                    <span className="count-badge">
                      {settings.count} photos · compatible frames
                    </span>
                  )}
                  <button
                    className={
                      category === "Favorites" ? "chip selected" : "chip"
                    }
                    onClick={() =>
                      setCategory(
                        category === "Favorites" ? "All styles" : "Favorites",
                      )
                    }
                  >
                    <Heart size={17} />
                    Favorites
                  </button>
                </div>
                <div className="vibe-list">
                  {[
                    "All styles",
                    ...new Set(templates.map((t) => t.category)),
                  ].map((c) => (
                    <button
                      className={category === c ? "chip selected" : "chip"}
                      key={c}
                      onClick={() => setCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
                <div className="template-gallery">
                  {cards(
                    templates.filter(
                      (t) =>
                        (!picking || t.count === settings.count) &&
                        (category === "All styles" ||
                          (category === "Favorites"
                            ? favorites.includes(t.id)
                            : t.category === category)) &&
                        `${t.name} ${t.category}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                    ),
                  )}
                </div>
                {!templates.some(
                  (t) =>
                    (!picking || t.count === settings.count) &&
                    (category === "All styles" ||
                      (category === "Favorites"
                        ? favorites.includes(t.id)
                        : t.category === category)) &&
                    `${t.name} ${t.category}`
                      .toLowerCase()
                      .includes(query.toLowerCase()),
                ) && (
                  <div className="empty-state">
                    <Search size={35} />
                    <h2>No frames here just yet.</h2>
                    <p>Try another style or clear your search.</p>
                    <button
                      className="button secondary"
                      onClick={() => {
                        setQuery("")
                        setCategory("All styles")
                      }}
                    >
                      Show all compatible frames
                    </button>
                  </div>
                )}
              </>
            )}
            {page === "camera" && (
              <div className="camera-layout">
                <div
                  className={`camera-view ${
                    settings.flash && capturing ? "capture-active" : ""
                  }`}
                >
                  <video
                    ref={video}
                    playsInline
                    muted
                    style={{
                      transform: settings.mirror ? "scaleX(-1)" : "none",
                      opacity: cameraState === "ready" ? 1 : 0,
                    }}
                  />
                  {cameraState !== "ready" && (
                    <div className="camera-message">
                      {cameraState === "loading" ? (
                        <Loader2 className="spin" size={40} />
                      ) : (
                        <Camera size={45} />
                      )}
                      <h2>
                        {cameraState === "idle"
                          ? "Let’s see your lovely face."
                          : cameraState === "loading"
                            ? "Waking up the camera…"
                            : cameraState === "denied"
                              ? "Camera permission is off."
                              : cameraState === "disconnected"
                                ? "Your camera disconnected."
                                : "No camera found."}
                      </h2>
                      <p>
                        {cameraState === "idle"
                          ? "Your camera is only used for this session. Photos are processed on your device, never sent to a server."
                          : cameraState === "denied"
                            ? "Allow camera access in your browser’s site settings, then try again. You can also use your own photos."
                            : "Connect a camera or create something lovely from your photos instead."}
                      </p>
                      {cameraState !== "loading" && (
                        <button
                          className="button primary"
                          onClick={() => void openCamera()}
                        >
                          {cameraState === "idle"
                            ? "Allow camera access"
                            : "Try camera again"}
                        </button>
                      )}
                      <button
                        className="text-button"
                        onClick={() => {
                          setUploadFlow(true)
                          setPage("review")
                        }}
                      >
                        <Upload size={17} />
                        Use photos instead
                      </button>
                    </div>
                  )}
                  <span className="camera-counter">
                    {retake !== null
                      ? `RETAKE ${retake + 1}`
                      : `${composition.photos.length} / ${settings.count}`}{" "}
                    MOMENTS
                  </span>
                  {countdown !== null && (
                    <div className="countdown" aria-live="polite">
                      {countdown}
                    </div>
                  )}
                </div>
                <aside className="camera-controls">
                  <TemplateArt template={template} />
                  <h3>{template.name}</h3>
                  <p>
                    {settings.countdown}s countdown · {settings.interval}s
                    between photos
                  </p>
                  <label className="toggle-row">
                    Mirror preview
                    <input
                      type="checkbox"
                      checked={settings.mirror}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, mirror: e.target.checked }))
                      }
                    />
                  </label>
                  <button
                    className="button secondary wide"
                    disabled={capturing}
                    onClick={() => {
                      setSettings((s) => ({
                        ...s,
                        facingMode:
                          s.facingMode === "user" ? "environment" : "user",
                      }))
                      setCameraState("idle")
                      stream.current?.getTracks().forEach((t) => t.stop())
                    }}
                  >
                    <SwitchCamera size={18} />
                    Switch camera
                  </button>
                  <button
                    className="button primary wide"
                    disabled={cameraState !== "ready" || capturing}
                    onClick={() => void capture()}
                  >
                    <Camera size={20} />
                    {capturing ? "Making memories…" : "Start capture"}
                  </button>
                  {capturing && (
                    <button
                      className="button secondary wide"
                      onClick={() =>
                        setConfirm({
                          text: "Stop this capture? Your completed photos will be kept.",
                          action: () => {
                            cancel.current = true
                            setPage("review")
                          },
                        })
                      }
                    >
                      Stop capture
                    </button>
                  )}
                  <div className="photo-thumbs">
                    {composition.photos.map((p, i) => (
                      <img
                        key={p.id}
                        src={p.src}
                        alt={`Captured photo ${i + 1}`}
                      />
                    ))}
                  </div>
                </aside>
              </div>
            )}
            {page === "review" && (
              <>
                <div className="review-layout">
                  <div className="review-main">
                    {composition.photos[selected] ? (
                      <img
                        src={composition.photos[selected].src}
                        alt={`Selected take ${selected + 1}`}
                        style={{
                          filter: cssFilter(
                            composition.photos[selected].adjustments,
                          ),
                          transform: `rotate(${composition.photos[selected].adjustments.rotation}deg)`,
                        }}
                      />
                    ) : (
                      <div className="empty-state">
                        <Images size={48} />
                        <h2>Your memories go here.</h2>
                        <p>Add {settings.count} photos to fill your frame.</p>
                        <button
                          className="button primary"
                          onClick={() => fileInput.current?.click()}
                        >
                          <Upload size={18} />
                          Choose photos
                        </button>
                      </div>
                    )}
                  </div>
                  <aside className="paper-panel">
                    <h2>
                      {composition.photos.length} of {reviewCount} moments
                    </h2>
                    <p>Pick your favorites. Every take is a keeper.</p>
                    <div className="review-thumbs">
                      {Array.from({ length: reviewCount }, (_, i) => (
                        <button
                          className={selected === i ? "selected" : ""}
                          key={i}
                          onClick={() => setSelected(i)}
                        >
                          {composition.photos[i] ? (
                            <img
                              src={composition.photos[i].src}
                              alt={`Take ${i + 1}`}
                            />
                          ) : (
                            <Plus />
                          )}
                          <span>{i + 1}</span>
                        </button>
                      ))}
                    </div>
                    <button
                      className="button secondary wide"
                      onClick={() => {
                        replaceIndex.current = composition.photos[selected]
                          ? selected
                          : null
                        fileInput.current?.click()
                      }}
                    >
                      <Upload size={18} />
                      {composition.photos[selected]
                        ? "Replace selected photo"
                        : "Add photos"}
                    </button>
                    <button
                      className="button secondary wide"
                      disabled={!composition.photos[selected]}
                      onClick={() => {
                        setRetake(selected)
                        setPage("camera")
                      }}
                    >
                      <Camera size={18} />
                      Retake selected
                    </button>
                    <button
                      className="button secondary wide"
                      disabled={!composition.photos[selected]}
                      onClick={() =>
                        updatePhoto({
                          rotation:
                            (composition.photos[selected].adjustments.rotation +
                              90) %
                            360,
                        })
                      }
                    >
                      <RotateCcw size={18} />
                      Rotate photo
                    </button>
                    <button
                      className="button primary wide"
                      disabled={
                        composition.mode === "freeform"
                          ? !composition.photos.length
                          : composition.photos.length !== settings.count
                      }
                      onClick={() => {
                        setSelected(0)
                        setPage("editor")
                      }}
                    >
                      Customize my photos
                      <Sparkles size={18} />
                    </button>
                  </aside>
                </div>
              </>
            )}
            {page === "editor" && (
              <Suspense
                fallback={
                  <div className="empty-state">
                    <Loader2 className="spin" size={30} />
                    <p>Opening your creative toolkit…</p>
                  </div>
                }
              >
                <Studio
                  composition={composition}
                  onChange={edit}
                  onTransient={setComposition}
                  onDone={() => setPage("export")}
                  onSave={() => void saveEditableProject()}
                  saveStatus={saveStatus}
                  notify={notify}
                />
              </Suspense>
            )}
            {page === "export" && (
              <div className="export-layout">
                <div className="export-preview">
                  <Preview composition={composition} />
                  <span className="hand">
                    a little memory, ready for the world.
                  </span>
                </div>
                <section className="paper-panel">
                  <span className="eyebrow">YOUR MASTERPIECE IS READY</span>
                  <h2>{template.name}</h2>
                  <p>
                    {Math.round(
                      dimensions(composition, template).width *
                        (exportSize === "original"
                          ? 1
                          : Number(exportSize) /
                            Math.max(
                              ...Object.values(
                                dimensions(composition, template),
                              ),
                            )),
                    )}{" "}
                    ×{" "}
                    {Math.round(
                      dimensions(composition, template).height *
                        (exportSize === "original"
                          ? 1
                          : Number(exportSize) /
                            Math.max(
                              ...Object.values(
                                dimensions(composition, template),
                              ),
                            )),
                    )}{" "}
                    px · High resolution
                    <br />
                    Only your composition. No watermarks. Ever.
                  </p>
                  <h3>Choose your format</h3>
                  <div className="choices">
                    {(["png", "jpeg"] as const).map((f) => (
                      <button
                        className={format === f ? "chip selected" : "chip"}
                        key={f}
                        onClick={() => setFormat(f)}
                      >
                        {f === "png"
                          ? "PNG · best quality"
                          : "JPG · smaller file"}
                      </button>
                    ))}
                  </div>
                  <div className="export-quality">
                    <label>
                      Output dimensions
                      <select
                        aria-label="Export dimensions"
                        value={exportSize}
                        onChange={(e) => setExportSize(e.target.value)}
                      >
                        <option value="original">Canvas dimensions</option>
                        <option value="3600">3600 px long edge</option>
                        <option value="5400">
                          5400 px long edge · print-friendly
                        </option>
                      </select>
                    </label>
                    {format === "jpeg" && (
                      <label>
                        JPG quality <output>{quality}%</output>
                        <input
                          aria-label="JPG quality"
                          type="range"
                          min="60"
                          max="100"
                          value={quality}
                          onChange={(e) => setQuality(+e.target.value)}
                        />
                      </label>
                    )}
                    <p>
                      Aspect ratio preserved. Print dimensions depend on your
                      printer’s DPI. PDF export is not supported.
                    </p>
                  </div>
                  <button
                    className="button primary wide"
                    disabled={busy}
                    onClick={() => void exportImage()}
                  >
                    {busy ? (
                      <Loader2 className="spin" size={18} />
                    ) : (
                      <Download size={18} />
                    )}{" "}
                    {busy ? "Saving your moment…" : "Save image"}
                  </button>
                  <button
                    className="button secondary wide"
                    disabled={busy}
                    onClick={() => void exportImage(true)}
                  >
                    <Share2 size={18} />
                    Share a little joy
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setPage("editor")}
                  >
                    <Pencil size={16} />A few more finishing touches
                  </button>
                  <div className="privacy">
                    <ShieldCheck size={17} />
                    Always processed on your device.
                  </div>
                </section>
              </div>
            )}
            {page === "creations" &&
              (saved.length ? (
                <div className="creations-grid">
                  {saved.map((s) => (
                    <article className="saved-card" key={s.id}>
                      <button
                        onClick={() => {
                          setComposition(s.composition)
                          setSettings((v) => ({
                            ...v,
                            count: getTemplate(s.composition.templateId).count,
                          }))
                          setPage("export")
                        }}
                      >
                        <img
                          src={s.image}
                          alt={getTemplate(s.composition.templateId).name}
                        />
                      </button>
                      <h3>{getTemplate(s.composition.templateId).name}</h3>
                      <p>{s.date}</p>
                      <div>
                        <button
                          className="text-button"
                          onClick={() => {
                            setComposition(s.composition)
                            setSettings((v) => ({
                              ...v,
                              count: getTemplate(s.composition.templateId)
                                .count,
                            }))
                            setHistory([])
                            setFuture([])
                            setPage("editor")
                          }}
                        >
                          <Pencil size={15} />
                          Edit again
                        </button>
                        <button
                          className="icon-button"
                          aria-label="Delete creation"
                          onClick={() =>
                            setConfirm({
                              text: "Delete this little memory from your device? This cannot be undone.",
                              action: () => {
                                void deleteSaved(s.id)
                              },
                            })
                          }
                        >
                          <Trash2 size={17} />
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Images size={50} />
                  <h2>A blank page. A thousand possibilities.</h2>
                  <p>
                    Your saved creations will live right here, on this device.
                  </p>
                  <button className="button primary" onClick={() => start()}>
                    <Camera size={19} />
                    Make your first memory
                  </button>
                </div>
              ))}
            {page === "settings" && (
              <div className="settings-layout">
                <section className="paper-panel">
                  <h2>Your studio, your way.</h2>
                  <label className="toggle-row">
                    Evening paper theme
                    <input
                      type="checkbox"
                      checked={dark}
                      onChange={(e) => setDark(e.target.checked)}
                    />
                  </label>
                  <label className="toggle-row">
                    Mirror camera by default
                    <input
                      type="checkbox"
                      checked={settings.mirror}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, mirror: e.target.checked }))
                      }
                    />
                  </label>
                  <label className="toggle-row">
                    Shutter animation
                    <input
                      type="checkbox"
                      checked={settings.flash}
                      onChange={(e) =>
                        setSettings((s) => ({ ...s, flash: e.target.checked }))
                      }
                    />
                  </label>
                  <label className="field-label">
                    Default countdown
                    <select
                      value={settings.countdown}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          countdown: +e.target.value as 0 | 3 | 5 | 10,
                        }))
                      }
                    >
                      {[0, 3, 5, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} seconds
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="field-label">
                    Default photo interval
                    <select
                      value={settings.interval}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          interval: +e.target.value,
                        }))
                      }
                    >
                      {[2, 3, 5, 10].map((n) => (
                        <option key={n} value={n}>
                          {n} seconds
                        </option>
                      ))}
                    </select>
                  </label>
                  <h3>Your device storage</h3>
                  <p>{saved.length} saved creations · Browser-local storage</p>
                  <button
                    className="button secondary"
                    disabled={
                      !saved.length && !recovery && !composition.photos.length
                    }
                    onClick={() =>
                      setConfirm({
                        text: "Clear all locally saved creations and your recovery draft? Downloaded files will not be affected.",
                        action: () => {
                          void Promise.all([
                            ...saved.map((s) => removeProject(s.id)),
                            removeProject("draft"),
                          ])
                            .then(() => {
                              setSaved([])
                              setRecovery(null)
                              setComposition(emptyComposition())
                              setHistory([])
                              setFuture([])
                              localStorage.removeItem("little-creations")
                              notify("Your local collection has been cleared.")
                            })
                            .catch(() =>
                              notify("Some projects could not be cleared."),
                            )
                        },
                      })
                    }
                  >
                    <Trash2 size={17} />
                    Clear local creations
                  </button>
                </section>
                <aside className="privacy-panel">
                  <ShieldCheck size={38} />
                  <h2>Private by nature.</h2>
                  <p>
                    Your photos are captured, edited, and composed entirely on
                    this device. No accounts, no cloud storage, no photo uploads
                    to a server.
                  </p>
                  <h3>A note on camera access</h3>
                  <p>
                    Your camera only starts when you allow it. To change
                    permissions, open your browser’s site settings. On Android,
                    you may also need to enable camera access in Settings → Apps
                    → your browser → Permissions.
                  </p>
                  <p>
                    Saved projects are stored in this browser. Clearing browser
                    data will remove them, so download your favorites.
                  </p>
                  <span className="hand">your moments belong to you.</span>
                </aside>
              </div>
            )}
          </div>
        )}
      </main>
      <nav className="bottom-nav">
        {[
          { p: "home", n: "Home", icon: <Home /> },
          { p: "templates", n: "Templates", icon: <Images /> },
          { p: "creations", n: "My creations", icon: <Heart /> },
          { p: "settings", n: "Settings", icon: <Settings /> },
        ].map(({ p, n, icon }) => (
          <button
            className={page === p ? "active" : ""}
            key={p}
            onClick={() => mainNav(p as Page)}
          >
            {icon}
            <span>{n}</span>
          </button>
        ))}
      </nav>
      {toast && (
        <div className="toast" role="status">
          <Check size={18} />
          {toast}
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast("")}
          >
            <X size={16} />
          </button>
        </div>
      )}
      {previewTemplate && (
        <div
          className="modal-backdrop"
          onClick={() => setPreviewTemplate(null)}
        >
          <section
            className="template-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Template preview"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="icon-button close"
              aria-label="Close preview"
              onClick={() => setPreviewTemplate(null)}
            >
              <X />
            </button>
            <TemplateArt template={previewTemplate} />
            <span className="eyebrow">
              {previewTemplate.category} · {previewTemplate.count} PHOTOS
            </span>
            <h2>{previewTemplate.name}</h2>
            <p>{previewTemplate.note}</p>
            <button
              className="button primary wide"
              onClick={() => chooseTemplate(previewTemplate)}
            >
              Use this template
              <ArrowRight size={18} />
            </button>
          </section>
        </div>
      )}
      {confirm && (
        <div className="modal-backdrop">
          <section
            className="confirm-modal"
            role="alertdialog"
            aria-modal="true"
            aria-label="Please confirm"
          >
            <h2>A little pause.</h2>
            <p>{confirm.text}</p>
            <div className="choices">
              <button
                className="button secondary"
                onClick={() => setConfirm(null)}
              >
                Keep creating
              </button>
              <button
                className="button primary"
                onClick={() => {
                  confirm.action()
                  setConfirm(null)
                }}
              >
                Yes, continue
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}
function ImageIcon() {
  return <Images size={17} />
}
