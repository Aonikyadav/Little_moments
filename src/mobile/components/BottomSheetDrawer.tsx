import React from "react"
import { X, Search, Sparkles } from "lucide-react"
import type { StudioTool } from "../types"
import { templates, kBoothTemplates } from "../../templates"

interface BottomSheetDrawerProps {
  tool: StudioTool
  onClose: () => void
  onAddSticker: (url: string) => void
  onSelectTemplate: (templateId: string) => void
  onSelectBackground: (bg: string) => void
  onSelectFilter: (filter: string) => void
}

export const BottomSheetDrawer: React.FC<BottomSheetDrawerProps> = ({
  tool,
  onClose,
  onAddSticker,
  onSelectTemplate,
  onSelectBackground,
  onSelectFilter,
}) => {
  if (tool === "none") return null

  // Sticker assets
  const stickers = [
    { id: "s1", url: "/images/cool_animated_romantic/001.jpg", label: "Cat Bow" },
    { id: "s2", url: "/images/cool_animated_romantic/002.jpg", label: "Hamster Glasses" },
    { id: "s3", url: "/images/cool_animated_romantic/003.jpg", label: "Baby Penguin" },
    { id: "s4", url: "/images/cool_animated_romantic/004.jpg", label: "Midnight Bloom" },
    { id: "s5", url: "/images/cool_animated_romantic/005.jpg", label: "Vintage Camera" },
    { id: "s6", url: "/images/cool_animated_romantic/006.jpg", label: "Poste Stamp" },
    { id: "s7", url: "/images/cool_animated_romantic/007.jpg", label: "Romantic Heart" },
    { id: "s8", url: "/images/cool_animated_romantic/008.jpg", label: "Collect Moments" },
  ]

  // Background textures
  const backgrounds = [
    { id: "bg-paper", name: "Warm Paper", color: "#f8f6f0" },
    { id: "bg-charcoal", name: "Classic Noir", color: "#1c1917" },
    { id: "bg-rose", name: "Vintage Rose", color: "#ffe4e6" },
    { id: "bg-sage", name: "Sage Mist", color: "#e2e8f0" },
    { id: "bg-amber", name: "Retro Cream", color: "#fef3c7" },
    { id: "bg-lavender", name: "Pastel Lilac", color: "#f3e8ff" },
    { id: "bg-denim", name: "Korean Denim", color: "#1e293b" },
  ]

  // Filters
  const filters = [
    { id: "normal", name: "Original", preview: "grayscale-0" },
    { id: "vintage", name: "Vintage 70s", preview: "sepia" },
    { id: "mono", name: "B&W Film", preview: "grayscale" },
    { id: "soft", name: "Soft Glow", preview: "contrast-75" },
    { id: "warm", name: "Golden Hour", preview: "hue-rotate-15" },
    { id: "cool", name: "Tokyo Chill", preview: "hue-rotate-180" },
  ]

  const allTemplates = [...templates, ...kBoothTemplates].slice(0, 16)

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-xs select-none animate-fadeIn">
      {/* Tap backdrop to dismiss */}
      <div className="flex-1" onClick={onClose} />

      {/* Drawer Card ("Pop showing the all grid, Template, Background, sticker" from sketch) */}
      <div className="bg-white rounded-t-3xl border-t-2 border-x-2 border-stone-900 p-4 max-h-[65vh] flex flex-col shadow-2xl animate-slideUp">
        {/* Top Drag Handle & Title */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-1 rounded-full bg-stone-300 mx-auto" />
            <h4 className="font-sans font-black text-sm text-stone-900 capitalize">
              {tool === "stickers"
                ? "Stickers & Stamps"
                : tool === "templates"
                ? "Choose Strip Layout"
                : tool === "background"
                ? "Canvas Background"
                : tool === "filter"
                ? "Analog Film Filters"
                : tool}
            </h4>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-stone-100 border border-stone-300 flex items-center justify-center text-stone-700 active:scale-95"
          >
            <X size={15} />
          </button>
        </div>

        {/* Dynamic Content based on selected tool */}
        <div className="overflow-y-auto flex-1 pb-4">
          {/* 1. Stickers & Stamps */}
          {tool === "stickers" && (
            <div className="grid grid-cols-4 gap-2.5">
              {stickers.map((s) => (
                <div
                  key={s.id}
                  onClick={() => {
                    onAddSticker(s.url)
                    onClose()
                  }}
                  className="aspect-square bg-[#faf8f2] rounded-xl border border-stone-300 p-1.5 flex flex-col items-center justify-center cursor-pointer active:scale-90 transition-transform shadow-xs hover:border-amber-400"
                >
                  <img src={s.url} alt={s.label} className="w-full h-full object-contain" />
                </div>
              ))}
            </div>
          )}

          {/* 2. Templates & Layouts */}
          {tool === "templates" && (
            <div className="grid grid-cols-3 gap-2.5">
              {allTemplates.map((t) => (
                <div
                  key={t.id}
                  onClick={() => {
                    onSelectTemplate(t.id)
                    onClose()
                  }}
                  className="bg-[#faf8f2] rounded-xl border border-stone-300 p-1.5 cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="aspect-[2/3] rounded bg-stone-100 overflow-hidden mb-1">
                    {t.thumbnail && (
                      <img src={t.thumbnail} alt={t.name} className="w-full h-full object-cover" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono font-bold text-stone-900 block truncate text-center">
                    {t.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 3. Background Colors / Papers */}
          {tool === "background" && (
            <div className="grid grid-cols-4 gap-3">
              {backgrounds.map((bg) => (
                <div
                  key={bg.id}
                  onClick={() => {
                    onSelectBackground(bg.color)
                    onClose()
                  }}
                  className="flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition-transform"
                >
                  <div
                    className="w-14 h-14 rounded-2xl border-2 border-stone-900 shadow-xs flex items-center justify-center"
                    style={{ backgroundColor: bg.color }}
                  />
                  <span className="text-[10px] font-mono font-bold text-stone-800 text-center">
                    {bg.name}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* 4. Analog Film Filters */}
          {tool === "filter" && (
            <div className="grid grid-cols-3 gap-2.5">
              {filters.map((f) => (
                <div
                  key={f.id}
                  onClick={() => {
                    onSelectFilter(f.id)
                    onClose()
                  }}
                  className="bg-[#faf8f2] rounded-xl border border-stone-300 p-2 cursor-pointer active:scale-95 transition-transform text-center"
                >
                  <div className="w-12 h-12 rounded-lg bg-stone-900 mx-auto mb-1 flex items-center justify-center text-amber-400">
                    <Sparkles size={18} />
                  </div>
                  <span className="text-[10.5px] font-mono font-bold text-stone-900 block">
                    {f.name}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
