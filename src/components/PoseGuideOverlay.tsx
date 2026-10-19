import { useState, useMemo } from "react"
import { Sparkles, Users, Heart, User, RefreshCw, X, ChevronRight, ChevronLeft } from "lucide-react"
import { POSE_GUIDES, PoseGuide, getDynamicPoseForShot } from "../data/poseGuides"

export interface PoseGuideOverlayProps {
  enabled: boolean
  onToggle: (enabled: boolean) => void
  currentBurstShot?: number
  totalBurstShots?: number
  onSelectPose?: (poseId: string) => void
  selectedPoseId?: string
}

export function PoseGuideOverlay({
  enabled,
  onToggle,
  currentBurstShot = 1,
  totalBurstShots = 4,
  selectedPoseId = "dyn-auto",
  onSelectPose,
}: PoseGuideOverlayProps) {
  const [activeCategory, setActiveCategory] = useState<"dynamic" | "couples" | "besties" | "solo">("dynamic")
  const [internalPoseId, setInternalPoseId] = useState<string>("dyn-auto")
  const [drawerOpen, setDrawerOpen] = useState(false)

  const currentPoseId = selectedPoseId ?? internalPoseId

  // Resolve current active pose
  const activePose: PoseGuide = useMemo(() => {
    if (currentPoseId === "dyn-auto" || activeCategory === "dynamic") {
      return getDynamicPoseForShot(currentBurstShot)
    }
    const found = POSE_GUIDES.find((p) => p.id === currentPoseId)
    return found || POSE_GUIDES[0]
  }, [currentPoseId, activeCategory, currentBurstShot])

  // Filtered poses for drawer
  const visiblePoses = useMemo(() => {
    if (activeCategory === "dynamic") {
      return POSE_GUIDES.filter((p) => p.category === "dynamic")
    }
    return POSE_GUIDES.filter((p) => p.category === activeCategory)
  }, [activeCategory])

  if (!enabled) return null

  return (
    <div className="absolute inset-0 z-20 pointer-events-none flex flex-col justify-between overflow-hidden select-none">
      {/* Top Banner / Pose Status Pill */}
      <div className="pt-3 px-3 flex items-center justify-between pointer-events-auto">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-full bg-stone-950/80 backdrop-blur-md border border-amber-400/40 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-lg animate-fadeIn">
            <Sparkles size={12} className="text-amber-400 animate-pulse" />
            <span className="uppercase tracking-wider">
              {currentPoseId === "dyn-auto" || activeCategory === "dynamic"
                ? `AUTO POSE · SHOT ${currentBurstShot}/${totalBurstShots}`
                : activePose.name}
            </span>
          </div>

          <button
            type="button"
            className="px-2.5 py-1 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-200 text-xs font-mono border border-stone-700 transition-colors flex items-center gap-1"
            onClick={() => setDrawerOpen((prev) => !prev)}
            title="Change Pose"
          >
            <span>Change</span>
            <ChevronRight size={13} className={drawerOpen ? "rotate-90 transition-transform" : "transition-transform"} />
          </button>
        </div>

        {/* Dismiss Button */}
        <button
          type="button"
          className="p-1.5 rounded-full bg-stone-900/80 hover:bg-rose-950/90 text-stone-300 hover:text-rose-400 border border-stone-700 transition-colors"
          onClick={() => onToggle(false)}
          title="Turn Off Pose Guides"
        >
          <X size={15} />
        </button>
      </div>

      {/* Center Translucent Ghost Silhouette */}
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative">
        <div className="w-full max-w-[280px] sm:max-w-[340px] aspect-[3/4] text-amber-200/60 drop-shadow-[0_0_12px_rgba(251,191,36,0.35)] flex items-center justify-center transition-all duration-300">
          <svg
            viewBox={activePose.viewBox}
            className="w-full h-full object-contain filter drop-shadow-sm"
            dangerouslySetInnerHTML={{ __html: activePose.svgContent }}
          />
        </div>
      </div>

      {/* Bottom Pose Coaching Tip & Quick Selector Drawer */}
      <div className="pb-3 px-3 pointer-events-auto space-y-2">
        {/* Coaching Tip Pill */}
        <div className="max-w-md mx-auto text-center px-4 py-1.5 rounded-full bg-stone-950/85 backdrop-blur-md border border-stone-800/90 text-stone-200 text-[11.5px] font-medium shadow-xl">
          <span className="text-amber-300 font-bold mr-1.5">★ Tip:</span>
          {activePose.tip}
        </div>

        {/* Expandable Pose Selection Drawer */}
        {drawerOpen && (
          <div className="p-3 bg-stone-950/95 backdrop-blur-lg border border-stone-800 rounded-xl max-w-lg mx-auto shadow-2xl animate-slideUp">
            {/* Category Tabs */}
            <div className="flex items-center gap-1 mb-2.5 pb-2 border-b border-stone-800 overflow-x-auto no-scrollbar">
              {[
                { id: "dynamic", label: "Dynamic 4-Cut", icon: RefreshCw },
                { id: "couples", label: "Couples", icon: Heart },
                { id: "besties", label: "Besties", icon: Users },
                { id: "solo", label: "Solo", icon: User },
              ].map((cat) => {
                const Icon = cat.icon
                const isActive = activeCategory === cat.id
                return (
                  <button
                    key={cat.id}
                    type="button"
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-mono whitespace-nowrap transition-colors ${
                      isActive
                        ? "bg-amber-400 text-stone-950 font-bold"
                        : "text-stone-400 hover:text-stone-200 hover:bg-stone-900"
                    }`}
                    onClick={() => {
                      setActiveCategory(cat.id as any)
                      if (cat.id === "dynamic") {
                        setInternalPoseId("dyn-auto")
                        onSelectPose?.("dyn-auto")
                      }
                    }}
                  >
                    <Icon size={12} />
                    <span>{cat.label}</span>
                  </button>
                )
              })}
            </div>

            {/* Pose Item Thumbnails */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {activeCategory === "dynamic" ? (
                <button
                  type="button"
                  className={`p-2 rounded-lg border text-left transition-all col-span-2 sm:col-span-4 flex items-center gap-3 ${
                    currentPoseId === "dyn-auto"
                      ? "border-amber-400 bg-amber-950/30 text-amber-200"
                      : "border-stone-800 bg-stone-900/60 text-stone-300 hover:bg-stone-800"
                  }`}
                  onClick={() => {
                    setInternalPoseId("dyn-auto")
                    onSelectPose?.("dyn-auto")
                    setDrawerOpen(false)
                  }}
                >
                  <div className="w-10 h-10 rounded-md bg-stone-950 flex items-center justify-center text-amber-300 shrink-0 border border-stone-700">
                    <RefreshCw size={18} className="animate-spin-slow" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-amber-300">Auto-Advancing 4-Cut Sequence</p>
                    <p className="text-[10px] text-stone-400 font-mono">
                      Changes automatically: Smile → Peace → Cheek Heart → Goofy Wink
                    </p>
                  </div>
                </button>
              ) : null}

              {visiblePoses.map((p) => {
                const isSelected = activePose.id === p.id && currentPoseId !== "dyn-auto"
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`p-2 rounded-lg border text-left transition-all flex flex-col justify-between group ${
                      isSelected
                        ? "border-amber-400 bg-amber-950/30 text-amber-200"
                        : "border-stone-800 bg-stone-900/60 text-stone-300 hover:bg-stone-800"
                    }`}
                    onClick={() => {
                      setInternalPoseId(p.id)
                      onSelectPose?.(p.id)
                      setDrawerOpen(false)
                    }}
                  >
                    <div className="w-full aspect-square max-h-16 rounded bg-stone-950/80 mb-1 flex items-center justify-center p-1 text-stone-400 group-hover:text-amber-300">
                      <svg
                        viewBox={p.viewBox}
                        className="w-full h-full object-contain"
                        dangerouslySetInnerHTML={{ __html: p.svgContent }}
                      />
                    </div>
                    <span className="text-[11px] font-bold line-clamp-1">{p.name}</span>
                    <span className="text-[9px] text-stone-400 font-mono line-clamp-1">{p.description}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
