import React, { useState, useRef, useEffect } from "react"
import {
  X,
  Undo2,
  Redo2,
  Eraser,
  Check,
  Download,
  Share2,
  Layers,
  Crop,
  Plus,
  RotateCw,
  Maximize2,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Sparkles,
  Sliders,
  Type,
  Palette,
  Sticker,
  Grid2X2,
  LayoutGrid,
  Trash2,
  Image as ImageIcon,
  Sun,
} from "lucide-react"
import type { MobileStudioLayer, StudioTool } from "../types"
import { BottomSheetDrawer } from "../components/BottomSheetDrawer"

interface MobileStudioScreenProps {
  onClose: () => void
  initialTemplateId?: string
  incomingPhotos?: string[]
}

export const MobileStudioScreen: React.FC<MobileStudioScreenProps> = ({
  onClose,
  initialTemplateId = "tmpl-user-001",
  incomingPhotos = [],
}) => {
  // Photos inside the 4-cut / strip cells
  const [stripPhotos, setStripPhotos] = useState<string[]>(() => {
    if (incomingPhotos.length > 0) return incomingPhotos
    return [
      "/images/romantic_love_kisspose_aesthetic/031.jpg",
      "/images/romantic_love_kisspose_aesthetic/032.jpg",
      "/images/romantic_love_kisspose_aesthetic/033.jpg",
      "/images/romantic_love_kisspose_aesthetic/034.jpg",
    ]
  })

  // Studio Layers (photos, stickers, stamps) matching Image 3
  const [layers, setLayers] = useState<MobileStudioLayer[]>([
    {
      id: "layer-bg",
      name: "Background",
      type: "background",
      thumbnail: "/images/romantic_love_kisspose_aesthetic/031.jpg",
      x: 0,
      y: 0,
      width: 100,
      height: 100,
      rotation: 0,
      scale: 1,
      opacity: 100,
      locked: true,
      visible: true,
    },
    {
      id: "sticker-1",
      name: "Vintage Camera",
      type: "sticker",
      content: "/images/cool_animated_romantic/005.jpg",
      thumbnail: "/images/cool_animated_romantic/005.jpg",
      x: 8,
      y: 22,
      width: 22,
      height: 22,
      rotation: -12,
      scale: 1,
      opacity: 100,
      locked: false,
      visible: true,
    },
    {
      id: "sticker-2",
      name: "Poste Stamp",
      type: "sticker",
      content: "/images/cool_animated_romantic/006.jpg",
      thumbnail: "/images/cool_animated_romantic/006.jpg",
      x: 72,
      y: 6,
      width: 24,
      height: 24,
      rotation: 8,
      scale: 1,
      opacity: 100,
      locked: false,
      visible: true,
    },
    {
      id: "sticker-3",
      name: "Midnight Bloom",
      type: "sticker",
      content: "/images/cool_animated_romantic/004.jpg",
      thumbnail: "/images/cool_animated_romantic/004.jpg",
      x: 35,
      y: 84,
      width: 32,
      height: 16,
      rotation: -4,
      scale: 1,
      opacity: 100,
      locked: false,
      visible: true,
    },
  ])

  const [selectedLayerId, setSelectedLayerId] = useState<string>("sticker-1")
  const [showLayersDrawer, setShowLayersDrawer] = useState<boolean>(true) // default open as shown in Image 3
  const [activeToolDrawer, setActiveToolDrawer] = useState<StudioTool>("none")
  const [canvasBg, setCanvasBg] = useState<string>("#1c1917") // noir strip card as shown in Image 2 & 3
  const [activeFilter, setActiveFilter] = useState<string>("normal")
  const [history, setHistory] = useState<MobileStudioLayer[][]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  const selectedLayer = layers.find((l) => l.id === selectedLayerId)

  // Opacity adjustment matching Image 3 slider
  const handleOpacityChange = (val: number) => {
    if (!selectedLayerId) return
    setLayers((prev) =>
      prev.map((l) => (l.id === selectedLayerId ? { ...l, opacity: val } : l))
    )
  }

  // Delete active layer
  const handleDeleteSelected = () => {
    if (!selectedLayerId || selectedLayerId === "layer-bg") return
    setLayers((prev) => prev.filter((l) => l.id !== selectedLayerId))
    setSelectedLayerId("")
  }

  // Rotate active layer
  const handleRotateSelected = () => {
    if (!selectedLayerId) return
    setLayers((prev) =>
      prev.map((l) =>
        l.id === selectedLayerId ? { ...l, rotation: (l.rotation + 15) % 360 } : l
      )
    )
  }

  // Scale / resize active layer
  const handleScaleSelected = () => {
    if (!selectedLayerId) return
    setLayers((prev) =>
      prev.map((l) =>
        l.id === selectedLayerId
          ? { ...l, scale: l.scale >= 1.6 ? 0.8 : Number((l.scale + 0.2).toFixed(1)) }
          : l
      )
    )
  }

  // Add new sticker from bottom sheet
  const handleAddSticker = (url: string) => {
    const newId = `sticker-${Date.now()}`
    const newLayer: MobileStudioLayer = {
      id: newId,
      name: "Sticker",
      type: "sticker",
      content: url,
      thumbnail: url,
      x: 35,
      y: 45,
      width: 25,
      height: 25,
      rotation: 0,
      scale: 1,
      opacity: 100,
      locked: false,
      visible: true,
    }
    setLayers((prev) => [newLayer, ...prev])
    setSelectedLayerId(newId)
  }

  // Save to creations
  const handleSaveToCreations = () => {
    try {
      const existing = JSON.parse(localStorage.getItem("little-creations") || "[]")
      const newCreation = {
        id: `creation-${Date.now()}`,
        title: "Photobooth Strip Keepsake",
        image: stripPhotos[0] || "/images/romantic_love_kisspose_aesthetic/031.jpg",
        createdAt: Date.now(),
      }
      localStorage.setItem("little-creations", JSON.stringify([newCreation, ...existing]))
      alert("Saved to your Bookmarks!")
      onClose()
    } catch {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#121214] text-white flex flex-col justify-between select-none overflow-hidden font-mono">
      {/* 1. Top Header Bar matching Image 2 & Image 3 */}
      <header className="flex items-center justify-between px-3 py-2.5 bg-[#18181c] border-b border-stone-800 z-30 shadow-md">
        {/* Left: Close */}
        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-full bg-stone-800 flex items-center justify-center text-stone-300 active:scale-95"
          title="Exit Studio"
        >
          <X size={18} />
        </button>

        {/* Center: Undo / Redo / Eraser */}
        <div className="flex items-center gap-3 text-stone-300">
          <button
            type="button"
            className="p-1 rounded hover:bg-stone-800 text-stone-400 active:scale-95"
            title="Undo"
          >
            <Undo2 size={18} />
          </button>
          <button
            type="button"
            className="p-1 rounded hover:bg-stone-800 text-stone-400 active:scale-95"
            title="Redo"
          >
            <Redo2 size={18} />
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm("Reset stickers on this strip?")) {
                setLayers((prev) => prev.filter((l) => l.type === "background"))
              }
            }}
            className="p-1 rounded hover:bg-stone-800 text-stone-400 active:scale-95"
            title="Eraser / Clear"
          >
            <Eraser size={18} />
          </button>
        </div>

        {/* Right: Download, Share, Checkmark */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => alert("Downloading photostrip...")}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-300 active:scale-95"
            title="Download"
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            onClick={() => alert("Share link copied!")}
            className="p-1.5 rounded-full hover:bg-stone-800 text-stone-300 active:scale-95"
            title="Share"
          >
            <Share2 size={18} />
          </button>
          <button
            type="button"
            onClick={handleSaveToCreations}
            className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold active:scale-95 shadow-md"
            title="Save / Done"
          >
            <Check size={18} strokeWidth={3} />
          </button>
        </div>
      </header>

      {/* 2. Main Studio Canvas Viewport (Center) */}
      <div className="relative flex-1 flex items-center justify-center p-3 overflow-hidden bg-[#18181c]/60">
        {/* Photobooth Strip Canvas matching Image 2 & 3 */}
        <div
          className="relative w-full max-w-[280px] aspect-[9/18] rounded-2xl border-2 border-stone-800 shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col p-2.5 transition-colors"
          style={{ backgroundColor: canvasBg }}
        >
          {/* Header on strip: "Forever Young · 2026" */}
          <div className="flex items-center justify-between text-[8px] font-mono tracking-widest text-stone-400 uppercase font-bold mb-1 px-1">
            <span>FOREVER YOUNG · 2026</span>
            <span className="text-amber-400">✦</span>
          </div>

          {/* 4-Cut Photo Slots Grid */}
          <div className="grid grid-cols-2 gap-1.5 flex-1">
            {stripPhotos.slice(0, 4).map((p, idx) => (
              <div
                key={idx}
                className="relative bg-stone-900 rounded-lg overflow-hidden border border-stone-800 flex items-center justify-center group"
              >
                <img
                  src={p}
                  alt={`Slot ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <span className="text-[9px] bg-stone-900/90 text-white px-1.5 py-0.5 rounded font-mono">
                    #{idx + 1}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Lower 4-cut Photo Slots for Double Strip (matching Image 2 & 3!) */}
          <div className="grid grid-cols-2 gap-1.5 flex-1 mt-1.5">
            {stripPhotos.slice(0, 4).map((p, idx) => (
              <div
                key={`second-${idx}`}
                className="relative bg-stone-900 rounded-lg overflow-hidden border border-stone-800 flex items-center justify-center"
              >
                <img
                  src={p}
                  alt={`Slot ${idx + 5}`}
                  className="w-full h-full object-cover filter contrast-105"
                />
              </div>
            ))}
          </div>

          {/* Strip Footer */}
          <div className="mt-1 text-center text-[7.5px] font-mono tracking-widest text-stone-400 uppercase font-bold">
            COLLECT BEAUTIFUL MOMENTS ✦
          </div>

          {/* Render Active Layers & Stickers with Touch Controls (Image 3) */}
          {layers
            .filter((l) => l.type === "sticker" && l.visible)
            .map((layer) => {
              const isSelected = selectedLayerId === layer.id
              return (
                <div
                  key={layer.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    setSelectedLayerId(layer.id)
                  }}
                  className={`absolute cursor-pointer transition-transform ${
                    isSelected ? "ring-2 ring-cyan-400 ring-offset-1 ring-offset-black z-30" : "z-20"
                  }`}
                  style={{
                    left: `${layer.x}%`,
                    top: `${layer.y}%`,
                    width: `${layer.width * layer.scale}%`,
                    height: `${layer.height * layer.scale}%`,
                    transform: `rotate(${layer.rotation}deg)`,
                    opacity: layer.opacity / 100,
                  }}
                >
                  <img
                    src={layer.content}
                    alt={layer.name}
                    className="w-full h-full object-contain pointer-events-none drop-shadow-md"
                  />

                  {/* Corner Handles for Selected Item matching Image 3! */}
                  {isSelected && (
                    <>
                      {/* Top-left: [X] Delete Handle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteSelected()
                        }}
                        className="absolute -top-2.5 -left-2.5 w-5 h-5 rounded-full bg-white text-stone-900 border border-stone-800 flex items-center justify-center shadow-md active:scale-90"
                        title="Delete Layer"
                      >
                        <X size={11} strokeWidth={3} />
                      </button>

                      {/* Top-right: [↻] Rotate Handle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRotateSelected()
                        }}
                        className="absolute -top-2.5 -right-2.5 w-5 h-5 rounded-full bg-white text-stone-900 border border-stone-800 flex items-center justify-center shadow-md active:scale-90"
                        title="Rotate Layer"
                      >
                        <RotateCw size={11} strokeWidth={2.5} />
                      </button>

                      {/* Bottom-right: [⤢] Resize Handle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleScaleSelected()
                        }}
                        className="absolute -bottom-2.5 -right-2.5 w-5 h-5 rounded-full bg-white text-stone-900 border border-stone-800 flex items-center justify-center shadow-md active:scale-90"
                        title="Resize Layer"
                      >
                        <Maximize2 size={11} strokeWidth={2.5} />
                      </button>
                    </>
                  )}
                </div>
              )
            })}
        </div>

        {/* 3. Floating Right Rails: [Layers] & [Crop] matching Image 3! */}
        <div className="absolute top-4 right-3 z-40 flex flex-col items-end gap-2 pointer-events-auto">
          {/* Layers Toggle Button */}
          <button
            type="button"
            onClick={() => setShowLayersDrawer(!showLayersDrawer)}
            className={`p-2 rounded-xl border flex items-center gap-1.5 shadow-lg active:scale-95 transition-all ${
              showLayersDrawer
                ? "bg-stone-900 border-cyan-400 text-cyan-300"
                : "bg-stone-900/90 border-stone-700 text-stone-300"
            }`}
            title="Toggle Layers Panel"
          >
            <Layers size={16} />
            <span className="text-[10px] font-mono font-bold">Layers</span>
          </button>

          {/* Floating Layers Drawer matching exact Image 3! */}
          {showLayersDrawer && (
            <div className="w-44 bg-[#1e1e24] rounded-2xl border-2 border-stone-800 shadow-2xl p-2.5 flex flex-col gap-2 animate-fadeIn max-h-[50vh] overflow-y-auto">
              <div className="flex items-center justify-between pb-1.5 border-b border-stone-800 text-[10px] font-mono text-stone-400 font-bold uppercase">
                <span>Active Layers ({layers.length})</span>
                <button
                  type="button"
                  onClick={() => setShowLayersDrawer(false)}
                  className="text-stone-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              </div>

              {/* Stacked Layer Cards as shown in Image 3 */}
              <div className="space-y-1.5">
                {layers.map((l) => {
                  const isSel = selectedLayerId === l.id
                  return (
                    <div
                      key={l.id}
                      onClick={() => setSelectedLayerId(l.id)}
                      className={`p-1.5 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSel
                          ? "bg-cyan-950/40 border-cyan-400 text-cyan-200"
                          : "bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700"
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-stone-950 border border-stone-800 overflow-hidden shrink-0 flex items-center justify-center p-0.5">
                          {l.thumbnail ? (
                            <img src={l.thumbnail} alt={l.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-stone-800 rounded" />
                          )}
                        </div>
                        <span className="text-[9.5px] font-mono font-bold truncate">
                          {l.name}
                        </span>
                      </div>

                      {/* Actions: Eye & Lock */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setLayers((prev) =>
                              prev.map((item) =>
                                item.id === l.id ? { ...item, visible: !item.visible } : item
                              )
                            )
                          }}
                          className="p-1 rounded text-stone-400 hover:text-white"
                        >
                          {l.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            setLayers((prev) =>
                              prev.map((item) =>
                                item.id === l.id ? { ...item, locked: !item.locked } : item
                              )
                            )
                          }}
                          className="p-1 rounded text-stone-400 hover:text-white"
                        >
                          {l.locked ? <Lock size={12} /> : <Unlock size={12} />}
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Opacity Slider matching exact Image 3! */}
      {selectedLayer && (
        <div className="px-6 py-2 bg-[#18181c] border-t border-stone-800 flex items-center justify-between gap-4 z-30">
          <span className="text-xs font-mono font-bold text-stone-400 shrink-0">
            Opacity
          </span>
          <input
            type="range"
            min="0"
            max="100"
            value={selectedLayer.opacity}
            onChange={(e) => handleOpacityChange(Number(e.target.value))}
            className="flex-1 h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
          />
          <span className="text-xs font-mono font-black text-cyan-300 w-8 text-right">
            {selectedLayer.opacity}
          </span>
        </div>
      )}

      {/* 5. Bottom Toolbar matching Image 2 & 3 */}
      <div className="bg-[#18181c] border-t border-stone-800 z-30 flex flex-col">
        {/* Row 1: Action items as shown in Image 3 */}
        <div className="flex items-center justify-around py-2 px-1 border-b border-stone-800/80 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveToolDrawer("stickers")}
            className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-white px-2.5 active:scale-90"
          >
            <Plus size={16} />
            <span className="text-[9px] font-mono">Add</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveToolDrawer("templates")}
            className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-white px-2.5 active:scale-90"
          >
            <LayoutGrid size={16} />
            <span className="text-[9px] font-mono">Replace</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveToolDrawer("background")}
            className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-white px-2.5 active:scale-90"
          >
            <Palette size={16} />
            <span className="text-[9px] font-mono">Remove BG</span>
          </button>
          <button
            type="button"
            onClick={() => alert("Crop mode active. Drag handles on photo frame.")}
            className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-white px-2.5 active:scale-90"
          >
            <Crop size={16} />
            <span className="text-[9px] font-mono">Crop</span>
          </button>
          <button
            type="button"
            onClick={handleRotateSelected}
            className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-white px-2.5 active:scale-90"
          >
            <RotateCw size={16} />
            <span className="text-[9px] font-mono">Flip/Rotate</span>
          </button>
        </div>

        {/* Row 2: Categories matching blueprint sketch Image 4: Grid, Templates, Adjust, Filter, Text, Background, Stickers */}
        <div className="flex items-center justify-around py-2 px-1 bg-stone-950/80">
          <button
            type="button"
            onClick={() => setActiveToolDrawer("templates")}
            className="flex flex-col items-center gap-0.5 text-amber-300 font-bold px-2 active:scale-90"
          >
            <Grid2X2 size={16} />
            <span className="text-[9.5px] font-mono">Grid</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveToolDrawer("templates")}
            className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-white px-2 active:scale-90"
          >
            <LayoutGrid size={16} />
            <span className="text-[9.5px] font-mono">Templates</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveToolDrawer("filter")}
            className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-white px-2 active:scale-90"
          >
            <Sliders size={16} />
            <span className="text-[9.5px] font-mono">Adjust</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveToolDrawer("filter")}
            className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-white px-2 active:scale-90"
          >
            <Sparkles size={16} />
            <span className="text-[9.5px] font-mono">Filter</span>
          </button>
          <button
            type="button"
            onClick={() => {
              const text = prompt("Enter text for your photostrip:")
              if (text) {
                alert(`Added text "${text}" to keepsake`)
              }
            }}
            className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-white px-2 active:scale-90"
          >
            <Type size={16} />
            <span className="text-[9.5px] font-mono">Text</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveToolDrawer("background")}
            className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-white px-2 active:scale-90"
          >
            <Palette size={16} />
            <span className="text-[9.5px] font-mono">Background</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveToolDrawer("stickers")}
            className="flex flex-col items-center gap-0.5 text-stone-400 hover:text-white px-2 active:scale-90"
          >
            <Sticker size={16} />
            <span className="text-[9.5px] font-mono">Stickers</span>
          </button>
        </div>
      </div>

      {/* 6. Bottom Sheet Drawer from blueprint sketch */}
      <BottomSheetDrawer
        tool={activeToolDrawer}
        onClose={() => setActiveToolDrawer("none")}
        onAddSticker={handleAddSticker}
        onSelectTemplate={(t) => alert(`Layout applied: ${t}`)}
        onSelectBackground={(color) => setCanvasBg(color)}
        onSelectFilter={(f) => setActiveFilter(f)}
      />
    </div>
  )
}
