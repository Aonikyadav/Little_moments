import React, { useState } from "react"
import { Search, Sparkles, Filter, Check, ArrowRight, Paintbrush } from "lucide-react"
import type { MobileTab } from "../types"
import { templates, kBoothTemplates, purikuraTemplates } from "../../templates"
import { TemplateThumbnail } from "../../components/TemplateThumbnail"

interface TemplatesScreenProps {
  onNavigate: (tab: MobileTab) => void
  onSelectTemplate: (templateId: string) => void
}

export const TemplatesScreen: React.FC<TemplatesScreenProps> = ({
  onNavigate,
  onSelectTemplate,
}) => {
  const [filter, setFilter] = useState<string>("all")
  const [search, setSearch] = useState<string>("")

  const allTemplates = [...templates, ...kBoothTemplates, ...purikuraTemplates]

  const categories = [
    { id: "all", label: "All Strips" },
    { id: "4cut", label: "4-Cut Classic" },
    { id: "kbooth", label: "Korean K-Booth" },
    { id: "twin", label: "Twin Strips" },
    { id: "minimal", label: "Minimal" },
    { id: "scrapbook", label: "Scrapbook" },
    { id: "ticket", label: "Ticket & Barcode" },
  ]

  const filtered = allTemplates.filter((t) => {
    if (search.trim()) {
      const match =
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
      if (!match) return false
    }

    if (filter === "all") return true
    if (filter === "4cut") return t.count === 4
    if (filter === "kbooth") return t.tags?.includes("k-booth") || t.id.startsWith("kb-")
    if (filter === "twin") return t.tags?.includes("twin-strip") || t.tags?.includes("v-strip")
    if (filter === "minimal") return t.tags?.includes("minimal") || t.category === "minimal"
    if (filter === "scrapbook") return t.tags?.includes("scrapbook") || t.tags?.includes("moodboard")
    if (filter === "ticket") return t.tags?.includes("ticket") || t.tags?.includes("barcode")
    return true
  })

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900 pb-24 px-3.5 pt-3">
      {/* Notebook Stamp Header matching sketch (Image 1 & 2) */}
      <header className="flex items-center justify-between pb-2 mb-3 border-b-2 border-stone-900/10 gap-2">
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5 font-caveat text-xl text-stone-700 font-bold leading-tight">
            <span>Template Catalog</span>
            <span className="text-amber-500">✦</span>
          </div>
          {/* Vintage Date / Page stamp from sketch */}
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-[#faf8f2] border border-stone-400 font-caveat text-xs text-stone-700 font-bold shadow-2xs mt-1 w-fit">
            <span>Date: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
            <span className="text-stone-300">·</span>
            <span>Page: 01</span>
          </div>
        </div>

        {/* Quick Action Square Buttons matching sketch (Studio & K-Booth) */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* 1. Studio Quick Action (Square button matching Image 2) */}
          <button
            type="button"
            onClick={() => onNavigate("studio")}
            title="Studio (Customize & Edit Layouts)"
            aria-label="Open Studio"
            className="w-10 h-10 rounded-lg border-2 border-stone-900 bg-white shadow-[2px_2px_0_#171717] flex flex-col items-center justify-center text-stone-900 hover:bg-stone-50 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all group"
          >
            <Paintbrush size={16} className="text-stone-900 group-hover:text-amber-700 transition-colors" />
            <span className="text-[7.5px] font-mono font-bold tracking-tight uppercase leading-none mt-0.5">STUDIO</span>
          </button>

          {/* 2. K-Booth Quick Action (Square button matching Image 2) */}
          <button
            type="button"
            onClick={() => onNavigate("kbooth")}
            title="K-Booth (Korean Photostrip Frames)"
            aria-label="Open K-Booth"
            className="w-10 h-10 rounded-lg border-2 border-stone-900 bg-amber-200 shadow-[2px_2px_0_#171717] flex flex-col items-center justify-center text-stone-950 hover:bg-amber-300 active:translate-x-0.5 active:translate-y-0.5 active:shadow-none transition-all group"
          >
            <Sparkles size={16} className="text-amber-900 group-hover:scale-110 transition-transform" />
            <span className="text-[7.5px] font-mono font-bold tracking-tight uppercase leading-none mt-0.5">K-BOOTH</span>
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="relative mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search templates by name, style, cuts..."
          className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-white border-2 border-stone-900 rounded-xl shadow-[2px_2px_0_#1f1d1a] focus:outline-none placeholder:text-stone-400"
        />
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-500" />
      </div>

      {/* Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3">
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setFilter(c.id)}
            className={`px-3 py-1 text-[11px] font-mono font-bold rounded-full border whitespace-nowrap active:scale-95 transition-all ${
              filter === c.id
                ? "bg-stone-900 text-white border-stone-900 shadow-xs"
                : "bg-white text-stone-700 border-stone-300 hover:border-stone-500"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* 3-Column Compact Card Grid (Half the previous card size, matching popular cards) */}
      <div className="grid grid-cols-3 gap-2.5">
        {filtered.map((t) => (
          <div
            key={t.id}
            onClick={() => {
              onSelectTemplate(t.id)
              onNavigate("studio")
            }}
            className="bg-white rounded-xl border-2 border-stone-900 p-1.5 shadow-[2px_2px_0_#1f1d1a] cursor-pointer active:scale-95 transition-all flex flex-col justify-between group"
          >
            {/* Thumbnail */}
            <div className="w-full aspect-[2/3] bg-[#faf8f2] rounded-lg overflow-hidden border border-stone-300 mb-1.5 relative flex items-center justify-center">
              <TemplateThumbnail
                template={t}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              {/* Count Badge */}
              <div className="absolute top-1 left-1 bg-stone-900/85 text-white text-[8px] font-mono font-bold px-1 rounded shadow-xs">
                {t.count}-cut
              </div>
            </div>

            {/* Template Info */}
            <div className="pt-0.5">
              <span className="text-[10px] font-mono font-bold text-stone-900 block truncate leading-tight">
                {t.name}
              </span>
              <span className="text-[8.5px] font-mono text-stone-500 block truncate mt-0.5">
                {t.category}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default TemplatesScreen
