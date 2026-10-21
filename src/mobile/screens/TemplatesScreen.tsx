import React, { useState } from "react"
import { Search, Sparkles, Filter, Check, ArrowRight } from "lucide-react"
import type { MobileTab } from "../types"
import { templates, kBoothTemplates, purikuraTemplates } from "../../templates"

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
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900 pb-24 px-4 pt-3">
      {/* Notebook Stamp Header matching sketch */}
      <header className="flex items-center justify-between pb-2 mb-3 border-b-2 border-stone-900/10">
        <div>
          <div className="flex items-center gap-1.5 font-caveat text-xl text-stone-700 font-bold">
            <span>Template Catalog</span>
            <span className="text-amber-500">✦</span>
          </div>
          <div className="text-[10px] font-mono text-stone-500">
            Slide up to choose your frame & layout
          </div>
        </div>

        {/* Vintage Date / Page stamp from sketch */}
        <div className="px-2 py-1 rounded bg-[#faf8f2] border border-stone-400 font-caveat text-xs text-stone-700 font-bold shadow-xs">
          <span>Date: {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
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

      {/* 2-Column Responsive Card Grid matching sketch */}
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
            {/* Thumbnail */}
            <div className="w-full aspect-[2/3] bg-[#faf8f2] rounded-xl overflow-hidden border border-stone-300 mb-2 relative flex items-center justify-center">
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

              {/* Cut badge */}
              <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-stone-900/90 text-white text-[9px] font-mono font-bold">
                {t.count}-cut
              </div>
            </div>

            {/* Template Name & Action */}
            <div className="flex items-center justify-between pt-1">
              <div className="min-w-0 pr-1">
                <span className="text-xs font-mono font-bold text-stone-900 block truncate">
                  {t.name}
                </span>
                <span className="text-[9.5px] font-mono text-stone-500 block truncate">
                  {t.subtitle || `${t.count} photos`}
                </span>
              </div>
              <div className="w-6 h-6 rounded-full bg-amber-400 border border-stone-900 flex items-center justify-center text-stone-950 shrink-0">
                <ArrowRight size={12} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
