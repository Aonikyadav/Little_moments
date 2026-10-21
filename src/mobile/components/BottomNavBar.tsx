import React from "react"
import { Home, LayoutGrid, Camera, Bookmark, Settings } from "lucide-react"
import type { MobileTab } from "../types"

interface BottomNavBarProps {
  currentTab: MobileTab
  onSelectTab: (tab: MobileTab) => void
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onSelectTab,
}) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[#faf8f2] border-t-2 border-stone-900 px-3 py-1.5 flex items-center justify-around select-none shadow-[0_-4px_16px_rgba(0,0,0,0.06)]"
      style={{ paddingBottom: "max(0.4rem, env(safe-area-inset-bottom))" }}
      aria-label="Mobile Bottom Navigation"
    >
      {/* 1. Home Tab */}
      <button
        type="button"
        onClick={() => onSelectTab("home")}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-90 ${
          currentTab === "home"
            ? "text-stone-950 font-bold"
            : "text-stone-500 hover:text-stone-800"
        }`}
        aria-label="Home"
      >
        <div
          className={`p-1 rounded-lg transition-colors ${
            currentTab === "home" ? "bg-amber-300 text-stone-950" : ""
          }`}
        >
          <Home size={20} strokeWidth={currentTab === "home" ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-mono tracking-tight mt-0.5">Home</span>
      </button>

      {/* 2. Template Tab */}
      <button
        type="button"
        onClick={() => onSelectTab("templates")}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-90 ${
          currentTab === "templates"
            ? "text-stone-950 font-bold"
            : "text-stone-500 hover:text-stone-800"
        }`}
        aria-label="Templates"
      >
        <div
          className={`p-1 rounded-lg transition-colors ${
            currentTab === "templates" ? "bg-amber-300 text-stone-950" : ""
          }`}
        >
          <LayoutGrid size={20} strokeWidth={currentTab === "templates" ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-mono tracking-tight mt-0.5">Template</span>
      </button>

      {/* 3. Central Camera Booth Shutter Button (as shown in sketch) */}
      <button
        type="button"
        onClick={() => onSelectTab("camera")}
        className="relative -top-3 flex flex-col items-center justify-center active:scale-95 transition-transform"
        aria-label="Camera Booth"
      >
        <div className="w-14 h-14 rounded-full bg-stone-900 border-[3px] border-amber-400 shadow-[0_6px_16px_rgba(0,0,0,0.35),2px_2px_0_#1f1d1a] flex items-center justify-center text-white transition-all">
          <div className="w-11 h-11 rounded-full border border-dashed border-amber-300/60 flex items-center justify-center bg-stone-800">
            <Camera size={22} className="text-amber-300" strokeWidth={2.2} />
          </div>
        </div>
        <span className="text-[9.5px] font-mono font-bold text-stone-900 tracking-tight mt-0.5">
          Camera
        </span>
      </button>

      {/* 4. Bookmark / Saved Tab */}
      <button
        type="button"
        onClick={() => onSelectTab("bookmarks")}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-90 ${
          currentTab === "bookmarks"
            ? "text-stone-950 font-bold"
            : "text-stone-500 hover:text-stone-800"
        }`}
        aria-label="Saved Bookmarks"
      >
        <div
          className={`p-1 rounded-lg transition-colors ${
            currentTab === "bookmarks" ? "bg-amber-300 text-stone-950" : ""
          }`}
        >
          <Bookmark size={20} strokeWidth={currentTab === "bookmarks" ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-mono tracking-tight mt-0.5">Saved</span>
      </button>

      {/* 5. Setting Tab */}
      <button
        type="button"
        onClick={() => onSelectTab("settings")}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all active:scale-90 ${
          currentTab === "settings"
            ? "text-stone-950 font-bold"
            : "text-stone-500 hover:text-stone-800"
        }`}
        aria-label="Settings"
      >
        <div
          className={`p-1 rounded-lg transition-colors ${
            currentTab === "settings" ? "bg-amber-300 text-stone-950" : ""
          }`}
        >
          <Settings size={20} strokeWidth={currentTab === "settings" ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-mono tracking-tight mt-0.5">Setting</span>
      </button>
    </nav>
  )
}
