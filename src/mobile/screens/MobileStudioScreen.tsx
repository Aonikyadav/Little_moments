import React, { useState, useRef, useEffect, lazy, Suspense } from "react"
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Download,
  Share2,
  Copy,
  Sparkles,
  Check,
  Loader2,
  X,
  Layers,
  RotateCcw,
  Camera,
} from "lucide-react"
import "../../studio/studio.css"
import type { Composition, Photo, Adjustments } from "../../types"
import { defaultAdjustments } from "../../types"
import { getTemplate, getCustomTemplateDefinition } from "../../templates"
import { renderComposition } from "../../rendering"
import { saveProject } from "../../studio/storage"
import { findGridLayout, getActiveAspectRatio } from "../../studio/gridEngine"

const Studio = lazy(() => import("../../studio/Studio"))

interface MobileStudioScreenProps {
  onClose: () => void
  onNavigateToCamera?: () => void
  initialTemplateId?: string
  incomingPhotos?: string[]
}

function createInitialComposition(templateId: string, incomingPhotos: string[]): Composition {
  const t = getTemplate(templateId || "tmpl-user-001")
  // Zero dummy images: only populate with real photos provided by user
  const photoSources = incomingPhotos && incomingPhotos.length > 0
    ? incomingPhotos
    : []

  const photos: Photo[] = photoSources.map((url, i) => ({
    id: `photo-${Date.now()}-${i}`,
    src: url,
    name: `Shot ${i + 1}`,
    adjustments: defaultAdjustments(),
  }))

  const customDef = getCustomTemplateDefinition(templateId)
  if (customDef) {
    return {
      templateId: customDef.id,
      background: customDef.background || "#ffffff",
      borderColor: customDef.accent || "#171717",
      borderWidth: 0,
      radius: customDef.slots?.[0]?.radius ?? 4,
      spacing: 0,
      padding: 0,
      photos,
      stickers: customDef.stickers ? [...customDef.stickers] : [],
      texts: customDef.texts ? [...customDef.texts] : [],
      backgroundPattern: customDef.backgroundPattern,
      backgroundOpacity: customDef.backgroundOpacity,
      frameId: customDef.frameId,
      frameColor: customDef.frameColor,
      frameOpacity: customDef.frameOpacity,
      aspectRatio: customDef.aspectRatio,
    }
  }

  return {
    templateId: t.id,
    background: t.background || "#f8f6f0",
    borderColor: "#171717",
    borderWidth: 0,
    radius: 2,
    spacing: 0,
    padding: 0,
    photos,
    stickers: [],
    texts: [],
  }
}

export const MobileStudioScreen: React.FC<MobileStudioScreenProps> = ({
  onClose,
  onNavigateToCamera,
  initialTemplateId = "tmpl-user-001",
  incomingPhotos = [],
}) => {
  const [composition, setComposition] = useState<Composition>(() =>
    createInitialComposition(initialTemplateId, incomingPhotos),
  )

  const [history, setHistory] = useState<Composition[]>([])
  const [future, setFuture] = useState<Composition[]>([])
  const [saveStatus, setSaveStatus] = useState<string>("Saved")
  const [toast, setToast] = useState<string | null>(null)
  const [showExportModal, setShowExportModal] = useState<boolean>(false)
  const [exportPreviewUrl, setExportPreviewUrl] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState<boolean>(false)

  const galleryInputRef = useRef<HTMLInputElement>(null)
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null)
  const currentTemplate = getTemplate(composition.templateId)

  const notify = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast(msg)
    toastTimerRef.current = setTimeout(() => setToast(null), 3000)
  }

  // Direct Gallery Upload in Studio
  const handleStudioGalleryUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    const readPromises = Array.from(files).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.readAsDataURL(file)
      })
    })

    Promise.all(readPromises).then((urls) => {
      const newPhotos: Photo[] = urls.map((url, i) => ({
        id: `photo-${Date.now()}-${i}`,
        src: url,
        name: `Shot ${composition.photos.length + i + 1}`,
        adjustments: defaultAdjustments(),
      }))
      handleEdit({
        ...composition,
        photos: [...composition.photos, ...newPhotos].slice(0, currentTemplate.count),
      })
      notify(`Added ${urls.length} real photo(s)! ✧`)
    })
  }

  // Update composition when incoming template changes
  useEffect(() => {
    if (initialTemplateId && initialTemplateId !== composition.templateId) {
      setComposition(createInitialComposition(initialTemplateId, incomingPhotos))
    }
  }, [initialTemplateId])

  // Self-healing: if composition was built before customDef was populated (race condition),
  // re-apply stickers/texts/frame once the definition becomes available. Preserves user photos.
  useEffect(() => {
    if (!initialTemplateId) return
    const customDef = getCustomTemplateDefinition(initialTemplateId)
    if (!customDef) return
    // Only re-apply if composition looks like the generic fallback (no decorative layers from template)
    const hasNoDecorativeLayers =
      composition.stickers.length === 0 &&
      composition.texts.length === 0 &&
      !composition.frameId
    const templateHasLayers =
      (customDef.stickers && customDef.stickers.length > 0) ||
      (customDef.texts && customDef.texts.length > 0) ||
      customDef.frameId
    if (hasNoDecorativeLayers && templateHasLayers) {
      setComposition((prev) => ({
        ...prev,
        stickers: customDef.stickers ? [...customDef.stickers] : prev.stickers,
        texts: customDef.texts ? [...customDef.texts] : prev.texts,
        frameId: customDef.frameId || prev.frameId,
        frameColor: customDef.frameColor || prev.frameColor,
        frameOpacity: customDef.frameOpacity ?? prev.frameOpacity,
        backgroundPattern: customDef.backgroundPattern || prev.backgroundPattern,
        backgroundOpacity: customDef.backgroundOpacity ?? prev.backgroundOpacity,
      }))
    }
  }, [initialTemplateId, composition.templateId])

  // Studio History Management
  const handleEdit = (next: Composition, before?: Composition) => {
    setHistory((prev) => [...prev.slice(-30), before ?? composition])
    setFuture([])
    setComposition(next)
  }

  const handleUndo = () => {
    if (!history.length) return
    const prev = history[history.length - 1]
    setHistory((h) => h.slice(0, -1))
    setFuture((f) => [composition, ...f])
    setComposition(prev)
  }

  const handleRedo = () => {
    if (!future.length) return
    const next = future[0]
    setFuture((f) => f.slice(1))
    setHistory((h) => [...h, composition])
    setComposition(next)
  }

  // Save creation to keepsakes & IndexedDB
  const handleSave = async () => {
    setSaveStatus("Saving...")
    try {
      const canvas = document.createElement("canvas")
      await renderComposition(canvas, composition, currentTemplate, 0.5)
      const thumb = canvas.toDataURL("image/jpeg", 0.75)

      const record = {
        id: `creation-${Date.now()}`,
        date: new Date().toISOString(),
        image: thumb,
        composition,
      }

      await saveProject(record)

      // Also save to localStorage little-creations for BookmarksScreen album
      try {
        const savedList = JSON.parse(localStorage.getItem("little-creations") || "[]")
        localStorage.setItem("little-creations", JSON.stringify([record, ...savedList]))
      } catch (e) {
        console.warn("Could not save to localStorage", e)
      }

      setSaveStatus("Saved")
      notify("Saved to Keepsakes album! ✧")
    } catch (err) {
      console.error(err)
      setSaveStatus("Error")
      notify("Could not save creation.")
    }
  }

  // Open Export Modal with high-res render
  const handleOpenExport = async () => {
    setIsExporting(true)
    try {
      const canvas = document.createElement("canvas")
      await renderComposition(canvas, composition, currentTemplate, 1)
      setExportPreviewUrl(canvas.toDataURL("image/png"))
      setShowExportModal(true)
    } catch (err) {
      notify("Failed to generate export preview.")
    } finally {
      setIsExporting(false)
    }
  }

  // Download high-res PNG print
  const handleDownloadPng = async () => {
    setIsExporting(true)
    try {
      const canvas = document.createElement("canvas")
      await renderComposition(canvas, composition, currentTemplate, 2)
      const link = document.createElement("a")
      link.download = `little-moments-${currentTemplate.id}-${Date.now()}.png`
      link.href = canvas.toDataURL("image/png")
      link.click()
      notify("High-res photostrip downloaded! ✧")
    } catch (err) {
      notify("Download failed. Try saving first.")
    } finally {
      setIsExporting(false)
    }
  }

  // Copy PNG to clipboard
  const handleCopyClipboard = async () => {
    try {
      const canvas = document.createElement("canvas")
      await renderComposition(canvas, composition, currentTemplate, 1)
      canvas.toBlob(async (blob) => {
        if (blob && navigator.clipboard?.write) {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
          notify("Copied keepsake to clipboard!")
        } else {
          notify("Clipboard copy not supported on this device.")
        }
      }, "image/png")
    } catch {
      notify("Could not copy image to clipboard.")
    }
  }

  // Native Web Share API
  const handleShare = async () => {
    try {
      const canvas = document.createElement("canvas")
      await renderComposition(canvas, composition, currentTemplate, 1.5)
      canvas.toBlob(async (blob) => {
        if (!blob) return
        const file = new File([blob], `little-moments-${Date.now()}.png`, { type: "image/png" })
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Little Moments Photostrip",
            text: "Captured & customized in Little Moments Studio ✧",
            files: [file],
          })
          notify("Shared successfully!")
        } else {
          handleDownloadPng()
        }
      }, "image/png")
    } catch {
      notify("Share cancelled or not available.")
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#f8f6f0] flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden select-none">
      {/* Atelier Studio Top Navigation Bar (matching Web Mobile & Desktop) */}
      <header className="flex items-center justify-between gap-2 px-3 py-2 bg-[#faf8f2] border-b border-stone-200/90 shadow-xs flex-shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-white border border-stone-300 hover:border-stone-900 text-xs font-semibold text-stone-800 shadow-2xs active:scale-95 transition-all flex-shrink-0"
            onClick={onClose}
            aria-label="Back to home"
          >
            <ArrowLeft size={13} />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="px-1.5 py-0.5 bg-stone-900 text-white rounded text-[10px] font-mono font-bold tracking-wider flex-shrink-0">
              STUDIO
            </span>
            <h2 className="text-xs sm:text-sm font-semibold text-stone-900 truncate max-w-[120px] xs:max-w-[200px]">
              {composition.gridLayoutId
                ? (findGridLayout(composition.gridLayoutId)?.name ?? currentTemplate.name)
                : currentTemplate.name}
            </h2>
            <span className="hidden xs:inline-flex px-1.5 py-0.5 rounded-full bg-stone-200/70 text-stone-700 text-[9.5px] font-mono font-medium flex-shrink-0">
              {getActiveAspectRatio(composition, currentTemplate)}
            </span>
          </div>
        </div>

        {/* Action Controls: Undo/Redo, Save, Export */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <div className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200">
            <button
              type="button"
              className="p-1.5 text-stone-700 hover:text-stone-950 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent active:scale-95 transition-all"
              onClick={handleUndo}
              disabled={!history.length}
              title="Undo"
              aria-label="Undo"
            >
              <Undo2 size={13} />
            </button>
            <button
              type="button"
              className="p-1.5 text-stone-700 hover:text-stone-950 rounded hover:bg-white disabled:opacity-30 disabled:hover:bg-transparent active:scale-95 transition-all"
              onClick={handleRedo}
              disabled={!future.length}
              title="Redo"
              aria-label="Redo"
            >
              <Redo2 size={13} />
            </button>
          </div>

          {/* Quick Add Photo button */}
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-full bg-amber-200 border border-stone-800 text-stone-950 text-xs font-semibold shadow-2xs active:scale-95 transition-all flex items-center gap-1"
            title="Upload Photo from Gallery"
          >
            <Camera size={12} />
            <span className="text-[11px] font-bold">+ Photo</span>
          </button>

          <button
            type="button"
            className="px-2.5 py-1.5 rounded-full bg-white border border-stone-300 hover:border-stone-900 text-xs font-semibold text-stone-800 shadow-2xs active:scale-95 transition-all hidden xs:inline-flex items-center gap-1"
            onClick={handleSave}
            title="Save to Album"
          >
            Save
          </button>

          <button
            type="button"
            className="px-3.5 py-1.5 rounded-full bg-stone-900 hover:bg-black text-white text-xs font-semibold shadow-xs active:scale-95 transition-all flex items-center gap-1"
            onClick={handleOpenExport}
            title="Export Photostrip"
          >
            <span>Export</span>
            <span>→</span>
          </button>
        </div>
      </header>

      {/* Empty Photos Guide Pill (No Dummy Images) */}
      {composition.photos.length === 0 && (
        <div className="bg-amber-100/95 border-b border-amber-300 px-3 py-1.5 flex items-center justify-between text-xs font-mono text-stone-900 z-20 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <Sparkles size={13} className="text-amber-700 flex-shrink-0" />
            <span className="font-bold">Blank Frame:</span>
            <span className="text-stone-600 hidden xs:inline">Requires {currentTemplate.count} real photos</span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {onNavigateToCamera && (
              <button
                type="button"
                onClick={onNavigateToCamera}
                className="px-2.5 py-1 rounded-md bg-stone-900 text-white text-[10.5px] font-bold flex items-center gap-1 active:scale-95"
              >
                <Camera size={11} className="text-amber-300" />
                <span>Snap Camera</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="px-2.5 py-1 rounded-md bg-amber-300 border border-stone-800 text-stone-950 text-[10.5px] font-bold flex items-center gap-1 active:scale-95"
            >
              <span>Upload Gallery</span>
            </button>
          </div>
        </div>
      )}

      {/* Hidden gallery file input */}
      <input
        ref={galleryInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={handleStudioGalleryUpload}
      />

      {/* Main Full-Featured Studio Component (Exact Web Studio with tactile tools, layers, stickers, filters) */}
      <div className="flex-1 min-h-0 h-full overflow-hidden flex flex-col relative">
        <Suspense
          fallback={
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#f8f6f0]">
              <Loader2 size={36} className="animate-spin text-stone-800 mb-3" />
              <p className="font-caveat text-2xl font-bold text-stone-700">Preparing Studio Canvas...</p>
            </div>
          }
        >
          <Studio
            composition={composition}
            onChange={(next, before) => handleEdit(next, before)}
            onTransient={(next) => setComposition(next)}
            onDone={handleOpenExport}
            onSave={handleSave}
            saveStatus={saveStatus}
            notify={notify}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={Boolean(history.length)}
            canRedo={Boolean(future.length)}
            onClose={onClose}
          />
        </Suspense>
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 bg-stone-900 text-white text-xs font-mono py-2 px-4 rounded-full shadow-lg border border-amber-400/40 animate-fade-in flex items-center gap-2 pointer-events-none">
          <Sparkles size={14} className="text-amber-300 flex-shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {/* Export & Share Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-xs flex items-center justify-center p-3 animate-fade-in">
          <div className="bg-[#faf8f0] border-2 border-stone-900 rounded-2xl shadow-[6px_6px_0_#171717] w-full max-w-sm max-h-[92dvh] overflow-y-auto p-4 flex flex-col justify-between">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-3 border-b-2 border-dashed border-stone-300">
              <div className="flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-500" />
                <h3 className="font-caveat text-xl font-bold text-stone-900">Approved Keepsake</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="w-7 h-7 rounded-full bg-white border border-stone-400 flex items-center justify-center text-stone-700 hover:text-stone-950 active:scale-90"
                aria-label="Close export dialog"
              >
                <X size={15} />
              </button>
            </div>

            {/* Rendered Preview Card */}
            <div className="bg-white border-2 border-stone-900 rounded-xl p-2.5 shadow-xs flex items-center justify-center mb-4 overflow-hidden max-h-[380px]">
              {exportPreviewUrl ? (
                <img
                  src={exportPreviewUrl}
                  alt="Final Photostrip"
                  className="max-h-[360px] object-contain shadow-xs rounded"
                />
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-stone-500">
                  <Loader2 size={24} className="animate-spin mb-2" />
                  <span className="text-xs font-mono">Rendering high-res print...</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="space-y-2 mb-3">
              <button
                type="button"
                onClick={handleDownloadPng}
                disabled={isExporting}
                className="w-full py-2.5 rounded-xl bg-stone-900 text-white font-mono text-xs font-bold border-2 border-stone-900 shadow-[2px_2px_0_#d97762] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-2"
              >
                {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                <span>Download Print Ready PNG (2x)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleShare}
                  className="py-2 rounded-xl bg-amber-200 text-stone-950 font-mono text-xs font-bold border-2 border-stone-900 shadow-[2px_2px_0_#171717] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
                >
                  <Share2 size={13} />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyClipboard}
                  className="py-2 rounded-xl bg-white text-stone-800 font-mono text-xs font-bold border-2 border-stone-900 shadow-[2px_2px_0_#171717] active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all flex items-center justify-center gap-1.5"
                >
                  <Copy size={13} />
                  <span>Copy</span>
                </button>
              </div>
            </div>

            {/* Exit Footer */}
            <div className="pt-2 border-t border-dashed border-stone-300 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowExportModal(false)
                  onClose()
                }}
                className="text-xs font-mono text-stone-600 hover:text-stone-950 underline"
              >
                Done & Return Home
              </button>
              <button
                type="button"
                onClick={() => setShowExportModal(false)}
                className="text-xs font-mono font-bold text-amber-800 hover:underline"
              >
                Keep Editing Canvas →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default MobileStudioScreen
