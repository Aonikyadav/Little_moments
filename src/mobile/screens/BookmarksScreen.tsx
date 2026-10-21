import React from "react"
import { Bookmark, Download, Share2, Trash2, Paintbrush, Plus, ExternalLink } from "lucide-react"
import type { MobileTab } from "../types"

interface BookmarksScreenProps {
  onNavigate: (tab: MobileTab) => void
  onOpenCreationInStudio: (creation: any) => void
}

export const BookmarksScreen: React.FC<BookmarksScreenProps> = ({
  onNavigate,
  onOpenCreationInStudio,
}) => {
  // Read saved creations from localStorage
  const savedCreations = React.useMemo(() => {
    try {
      const data = localStorage.getItem("little-creations")
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }, [])

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      const updated = savedCreations.filter((c: any) => c.id !== id)
      localStorage.setItem("little-creations", JSON.stringify(updated))
      window.location.reload()
    } catch {
      // safe fallback
    }
  }

  const handleDownload = (imgUrl: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const link = document.createElement("a")
    link.href = imgUrl
    link.download = `little-moments-${Date.now()}.png`
    link.click()
  }

  return (
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900 pb-24 px-4 pt-3 select-none">
      {/* Header matching sketch */}
      <header className="flex items-center justify-between pb-2 mb-4 border-b-2 border-stone-900/10">
        <div>
          <div className="flex items-center gap-1.5 font-caveat text-xl text-stone-700 font-bold">
            <span>Saved Bookmarks</span>
            <span className="text-amber-500">✦</span>
          </div>
          <div className="text-[10px] font-mono text-stone-500">
            Your personal photobooth keepsakes
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-amber-300 text-stone-950 font-mono text-[10px] font-bold border border-stone-900 shadow-xs">
          {savedCreations.length} Saved
        </div>
      </header>

      {/* 2-Column Grid matching sketch */}
      {savedCreations.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-stone-400 p-8 text-center my-6 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-amber-100 border border-stone-900 flex items-center justify-center mx-auto mb-3 text-stone-700">
            <Bookmark size={24} />
          </div>
          <h4 className="font-sans font-bold text-sm text-stone-900 mb-1">
            No Saved Keepsakes Yet
          </h4>
          <p className="text-xs font-mono text-stone-500 mb-4 max-w-xs mx-auto">
            Capture poses in the camera booth or arrange stickers in Studio to save your first photostrip!
          </p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={() => onNavigate("camera")}
              className="px-4 py-2 bg-stone-900 text-white rounded-xl text-xs font-mono font-bold active:scale-95 shadow-[2px_2px_0_#1f1d1a]"
            >
              Start Booth
            </button>
            <button
              type="button"
              onClick={() => onNavigate("studio")}
              className="px-4 py-2 bg-amber-400 text-stone-950 rounded-xl text-xs font-mono font-bold active:scale-95 border border-stone-900 shadow-[2px_2px_0_#1f1d1a]"
            >
              Open Studio
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {savedCreations.map((item: any) => (
            <div
              key={item.id}
              onClick={() => onOpenCreationInStudio(item)}
              className="bg-white rounded-2xl border-2 border-stone-900 p-2 shadow-[3px_3px_0_#1f1d1a] cursor-pointer active:scale-95 transition-all flex flex-col justify-between group"
            >
              {/* Tape accent */}
              <div className="w-8 h-2.5 bg-amber-200/80 -rotate-3 mx-auto -mt-3.5 mb-1.5 border-t border-b border-amber-300 shadow-xs" />

              {/* Strip Image */}
              <div className="w-full aspect-[2/3] bg-[#faf8f2] rounded-xl overflow-hidden border border-stone-300 mb-2 relative">
                <img
                  src={item.image}
                  alt={item.title || "Saved Strip"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Title & Actions */}
              <div className="pt-1">
                <div className="text-[11px] font-mono font-bold text-stone-900 truncate mb-1">
                  {item.title || "Photobooth Keepsake"}
                </div>
                <div className="flex items-center justify-between text-stone-500 pt-1 border-t border-stone-100">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => handleDownload(item.image, e)}
                      className="p-1 rounded hover:bg-stone-100 text-stone-700"
                      title="Download"
                    >
                      <Download size={13} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 rounded hover:bg-rose-50 text-rose-600"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <span className="text-[9px] font-mono text-stone-400">
                    {new Date(item.createdAt || Date.now()).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
