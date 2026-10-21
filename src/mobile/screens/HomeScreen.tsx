import React from "react"
import { Sparkles, ArrowRight, Camera, Paintbrush, Flame, ChevronRight, Layers } from "lucide-react"
import type { MobileTab } from "../types"
import { templates, kBoothTemplates } from "../../templates"

interface HomeScreenProps {
  onNavigate: (tab: MobileTab) => void
  onSelectTemplate: (templateId: string) => void
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  onNavigate,
  onSelectTemplate,
}) => {
  const featuredTemplates = templates.slice(0, 8)
  const featuredKBooth = kBoothTemplates.slice(0, 4)

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900 pb-24 px-4 pt-3">
      {/* Top Header Bar matching sketch */}
      <header className="flex items-center justify-between mb-4 pb-2 border-b-2 border-stone-900/10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#141418] border border-stone-800 flex items-center justify-center p-1 shadow-xs">
            <img src="/lm-logo.svg" alt="LM" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              <span className="font-sans font-black text-base text-stone-900 tracking-tight leading-none">
                Little Moments
              </span>
              <span className="text-amber-500 text-xs">✦</span>
            </div>
            <span className="text-[9px] font-mono uppercase text-stone-500 font-bold tracking-wider leading-none mt-0.5">
              Analog Studio
            </span>
          </div>
        </div>

        {/* Quick K-Booth shortcut pill from sketch */}
        <button
          type="button"
          onClick={() => onNavigate("kbooth")}
          className="flex items-center gap-1.5 px-3 py-1 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-full border border-stone-900 shadow-[2px_2px_0_#1f1d1a] active:scale-95 transition-all text-xs font-mono font-bold"
        >
          <Sparkles size={13} />
          <span>K-Booth</span>
          <span className="bg-stone-900 text-white text-[9px] px-1 py-0.2 rounded-full">15 NEW</span>
        </button>
      </header>

      {/* Hero Card ("Text about APP" + "Mainpic.jpg" from handwritten sketch) */}
      <section className="bg-white rounded-2xl border-2 border-stone-900 p-4 shadow-[4px_4px_0_#1f1d1a] mb-5 relative overflow-hidden">
        {/* Decorative corner tag */}
        <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 text-[9px] font-mono font-bold border border-rose-300">
          Analog Photo Studio
        </div>

        <div className="grid grid-cols-12 gap-3 items-center">
          {/* Text About App column */}
          <div className="col-span-7 flex flex-col justify-center pr-1">
            <span className="text-[10px] font-mono text-stone-500 uppercase font-bold tracking-wider">
              AUTHENTIC STRIPS
            </span>
            <h2 className="text-lg font-black font-sans leading-tight text-stone-900 mt-0.5 mb-1.5">
              Moments worth keeping.
            </h2>
            <p className="text-[11px] font-mono text-stone-600 leading-snug mb-3">
              Snap 4-cut photobooth strips, paste vintage stamps & stickers, and customize your keepsake.
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => onNavigate("camera")}
                className="w-full py-2 px-3 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 shadow-[2px_2px_0_#1f1d1a] active:scale-95 transition-all"
              >
                <Camera size={14} className="text-amber-400" />
                <span>Start Booth</span>
                <ArrowRight size={12} />
              </button>
              <button
                type="button"
                onClick={() => onNavigate("studio")}
                className="w-full py-1.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-1.5 border border-stone-300 active:scale-95 transition-all"
              >
                <Paintbrush size={13} />
                <span>Open Studio</span>
              </button>
            </div>
          </div>

          {/* "Mainpic .jpg" showcase strip column */}
          <div className="col-span-5 flex justify-center">
            <div className="w-full max-w-[125px] bg-[#faf8f2] rounded-xl border-2 border-stone-900 p-1.5 shadow-[3px_3px_0_#1f1d1a] rotate-1">
              {/* Tape accent */}
              <div className="w-10 h-3 bg-amber-200/80 -rotate-6 mx-auto -mt-2.5 mb-1 border-t border-b border-amber-300 shadow-xs" />
              
              <div className="space-y-1">
                <div className="aspect-[4/3] rounded bg-stone-200 overflow-hidden border border-stone-800">
                  <img
                    src="/images/romantic_love_kisspose_aesthetic/031.jpg"
                    alt="Preview 1"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="aspect-[4/3] rounded bg-stone-200 overflow-hidden border border-stone-800">
                  <img
                    src="/images/romantic_love_kisspose_aesthetic/032.jpg"
                    alt="Preview 2"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <div className="aspect-[4/3] rounded bg-stone-200 overflow-hidden border border-stone-800">
                  <img
                    src="/images/romantic_love_kisspose_aesthetic/033.jpg"
                    alt="Preview 3"
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              </div>

              <div className="mt-1 text-center">
                <span className="text-[8px] font-mono tracking-widest text-stone-500 font-bold uppercase">
                  LITTLE MOMENTS ✦
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Templates Section ("Template", "Template" from sketch) */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <h3 className="font-sans font-black text-sm text-stone-900">
              Popular Strip Templates
            </h3>
            <span className="text-[10px] font-mono font-bold bg-amber-300 text-stone-950 px-1.5 py-0.2 rounded-full">
              {templates.length}
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNavigate("templates")}
            className="text-[11px] font-mono font-bold text-stone-700 hover:text-stone-950 flex items-center gap-0.5"
          >
            <span>See all</span>
            <ChevronRight size={13} />
          </button>
        </div>

        {/* Horizontal scroll of template cards */}
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none snap-x">
          {featuredTemplates.map((t) => (
            <div
              key={t.id}
              onClick={() => {
                onSelectTemplate(t.id)
                onNavigate("studio")
              }}
              className="shrink-0 w-28 bg-white rounded-xl border-2 border-stone-900 p-1.5 shadow-[2px_2px_0_#1f1d1a] active:scale-95 transition-all snap-start cursor-pointer group"
            >
              <div className="aspect-[2/3] rounded-lg bg-stone-100 overflow-hidden border border-stone-300 mb-1 flex items-center justify-center relative">
                {t.thumbnail ? (
                  <img
                    src={t.thumbnail}
                    alt={t.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    loading="lazy"
                  />
                ) : (
                  <div className="p-2 text-center text-[10px] font-mono text-stone-500">
                    {t.name}
                  </div>
                )}
                <div className="absolute top-1 left-1 bg-stone-900/80 text-white text-[8px] font-mono px-1 rounded">
                  {t.count}-cut
                </div>
              </div>
              <p className="text-[10px] font-mono font-bold text-stone-800 truncate text-center">
                {t.name}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Korean K-Booth Section ("K-Booth" from sketch) */}
      <section className="bg-gradient-to-r from-amber-50 to-rose-50 rounded-2xl border-2 border-stone-900 p-3.5 shadow-[3px_3px_0_#1f1d1a] mb-5">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Flame size={15} className="text-amber-500" />
            <h3 className="font-sans font-black text-sm text-stone-900">
              Korean Photobooth Keepsakes
            </h3>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("kbooth")}
            className="text-[11px] font-mono font-bold text-stone-700 hover:text-stone-950 flex items-center gap-0.5"
          >
            <span>Explore</span>
            <ChevronRight size={13} />
          </button>
        </div>
        <p className="text-[10.5px] font-mono text-stone-600 mb-3">
          Twin strips, vertical slats, ticket barcodes, and aesthetic scrapbook layouts.
        </p>

        <div className="grid grid-cols-2 gap-2.5">
          {featuredKBooth.map((k) => (
            <div
              key={k.id}
              onClick={() => {
                onSelectTemplate(k.id)
                onNavigate("studio")
              }}
              className="bg-white rounded-xl border border-stone-800 p-2 shadow-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
            >
              <div className="w-10 h-14 bg-stone-100 rounded overflow-hidden shrink-0 border border-stone-300">
                {k.thumbnail && (
                  <img src={k.thumbnail} alt={k.name} className="w-full h-full object-cover" loading="lazy" />
                )}
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-mono font-bold text-stone-900 block truncate">
                  {k.name}
                </span>
                <span className="text-[9px] font-mono text-amber-700 block truncate">
                  {k.subtitle || "Aesthetic strip"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Floating Studio Shortcut */}
      <div className="p-3 bg-stone-900 rounded-xl text-white flex items-center justify-between shadow-[3px_3px_0_#1f1d1a]">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-amber-400 text-stone-950 flex items-center justify-center font-black">
            <Layers size={18} />
          </div>
          <div>
            <div className="text-xs font-mono font-bold">Have snapshots to edit?</div>
            <div className="text-[10px] text-stone-300 font-mono">Open Mobile Studio to arrange & decorate</div>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onNavigate("studio")}
          className="px-3 py-1.5 bg-white text-stone-950 rounded-lg text-xs font-mono font-bold active:scale-95 transition-all"
        >
          Open
        </button>
      </div>
    </div>
  )
}
