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
    <div className="min-h-screen bg-[#f8f6f0] text-stone-900 pb-24 px-3.5 pt-3">
      {/* Header matching sketch */}
      <header className="flex items-center justify-between pb-2 mb-4 border-b-2 border-stone-900/10">
        <div>
          <div className="flex items-center gap-1.5 font-caveat text-xl text-stone-700 font-bold">
            <span>Saved Bookmarks</span>
            <span className="text-amber-500">✦</span>
          </div>
          <div className="text-[10px] font-mono text-stone-500">
            {savedCreations.length} personal strips & keepsakes preserved
          </div>
        </div>

        {/* Vintage Stamp */}
        <div className="px-2 py-1 rounded bg-[#faf8f2] border border-stone-400 font-mono text-[10px] font-bold text-stone-700 shadow-xs flex items-center gap-1">
          <Bookmark size={11} className="text-amber-500" />
          <span>{savedCreations.length} Saved</span>
        </div>
      </header>

      {/* Empty State */}
      {savedCreations.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-stone-400 p-8 text-center my-6 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center mx-auto mb-3 text-amber-700">
            <Bookmark size={20} />
          </div>
          <h3 className="font-sans font-bold text-sm text-stone-900 mb-1">
            No Bookmarks Yet
          </h3>
          <p className="text-xs font-mono text-stone-500 max-w-xs mx-auto mb-4 leading-relaxed">
            Snap photos in the Camera Booth or customize a strip in the Studio to preserve your first keepsake.
          </p>
          <div className="flex items-center justify-center gap-2">
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
        /* 3-Column Compact Card Grid (Half the previous card size) */
        <div className="grid grid-cols-3 gap-2.5">
          {savedCreations.map((item: any) => (
            <div
              key={item.id}
              onClick={() => onOpenCreationInStudio(item)}
              className="bg-white rounded-xl border-2 border-stone-900 p-1.5 shadow-[2px_2px_0_#1f1d1a] cursor-pointer active:scale-95 transition-all flex flex-col justify-between group"
            >
              {/* Tape accent */}
              <div className="w-6 h-2 bg-amber-200/80 -rotate-3 mx-auto -mt-2.5 mb-1 border-t border-b border-amber-300 shadow-xs" />

              {/* Strip Image */}
              <div className="w-full aspect-[2/3] bg-[#faf8f2] rounded-lg overflow-hidden border border-stone-300 mb-1.5 relative">
                <img
                  src={item.image}
                  alt={item.title || "Saved Strip"}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Title & Actions */}
              <div className="pt-0.5">
                <div className="text-[10px] font-mono font-bold text-stone-900 truncate mb-1 leading-tight">
                  {item.title || "Photobooth Keepsake"}
                </div>
                <div className="flex items-center justify-between text-stone-500 pt-1 border-t border-stone-100">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleDownload(item.image, e)}
                      className="p-1 rounded hover:bg-stone-100 text-stone-700 active:scale-90"
                      title="Download"
                    >
                      <Download size={11} />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(item.id, e)}
                      className="p-1 rounded hover:bg-rose-50 text-rose-600 active:scale-90"
                      title="Delete"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>

                  <span className="text-[7.5px] font-mono text-stone-400">
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

export default BookmarksScreen
