import React, { useState } from "react"
import { Sparkles, ArrowRight, Flame, Heart } from "lucide-react"
import type { MobileTab } from "../types"
import { kBoothTemplates } from "../../templates"

interface KBoothScreenProps {
  onNavigate: (tab: MobileTab) => void
  onSelectTemplate: (templateId: string) => void
}

export const KBoothScreen: React.FC<KBoothScreenProps> = ({
  onNavigate,
  onSelectTemplate,
}) => {
  const [selectedTag, setSelectedTag] = useState<string>("all")

  const categories = [
    { id: "all", label: "All K-Booth" },
    { id: "twin-strip", label: "Twin Strips" },
    { id: "slat", label: "Minimalist Slats" },
    { id: "ticket", label: "Tickets & Barcodes" },
    { id: "scrapbook", label: "Scrapbook Aesthetic" },
    { id: "retro", label: "70s Retro" },
  ]

  const filtered = kBoothTemplates.filter((k) => {
    if (selectedTag === "all") return true
    return k.tags?.includes(selectedTag)
  })

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900 pb-24 px-4 pt-3">
      {/* Header matching sketch */}
      <header className="pb-2 mb-3 border-b-2 border-stone-900/10">
        <div className="flex items-center gap-1.5 font-caveat text-xl text-stone-700 font-bold">
          <span>Korean Photobooth Keepsakes</span>
          <span className="text-amber-500">✦</span>
        </div>
        <div className="text-[10px] font-mono text-stone-500">
          Seoul-inspired Haru Film, Photoism, & Life Four Cuts styles
        </div>
      </header>

      {/* Filter Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setSelectedTag(c.id)}
            className={`px-3 py-1 text-[11px] font-mono font-bold rounded-full border whitespace-nowrap active:scale-95 transition-all ${
              selectedTag === c.id
                ? "bg-amber-400 text-stone-950 border-stone-900 shadow-xs"
                : "bg-white text-stone-700 border-stone-300"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 2-Column Grid of K-Booth strips matching sketch */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => {
              onSelectTemplate(t.id)
              onNavigate("studio")
            }}
            className="bg-white rounded-2xl border-2 border-stone-900 p-2 shadow-[3px_3px_0_#1f1d1a] cursor-pointer active:scale-95 transition-all flex flex-col justify-between group"
          >
            {/* Visual strip cover */}
            <div className="w-full aspect-[1/2] bg-[#faf8f2] rounded-xl overflow-hidden border border-stone-300 mb-2 relative flex items-center justify-center">
              {t.thumbnail ? (
                <img
                  src={t.thumbnail}
                  alt={t.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  loading="lazy"
                />
              ) : (
                <div className="p-3 text-center text-xs font-mono text-stone-400">
                  {t.name}
                </div>
              )}

              {/* Tag pill */}
              <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-stone-950 font-mono text-[8px] font-bold border border-stone-900">
                K-STYLE
              </div>
            </div>

            {/* Title & Action */}
            <div className="pt-1 flex items-center justify-between">
              <div className="min-w-0 pr-1">
                <span className="text-xs font-mono font-bold text-stone-900 block truncate">
                  {t.name}
                </span>
                <span className="text-[9.5px] font-mono text-stone-500 block truncate">
                  {t.subtitle || "Aesthetic strip"}
                </span>
              </div>
              <div className="w-6 h-6 rounded-full bg-stone-900 text-amber-300 flex items-center justify-center shrink-0">
                <ArrowRight size={12} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
