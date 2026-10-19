import { useState, useEffect } from "react"
import type { PhotoTemplate } from "../types"
import {
  resolveTemplateLocalAsset,
  type TemplateImageAsset,
} from "../utils/templateImageMap"

export interface TemplateThumbnailProps {
  /** Template object or partial template with an ID */
  template?: PhotoTemplate | { id: string; name?: string; count?: number; category?: string; background?: string; thumbnail?: string } | null
  /** Explicit template ID (e.g. 'tmpl-001', 'tmpl-user-001') */
  templateId?: string
  /** Custom CSS classes for the <img> element */
  className?: string
  /** Custom image alt text */
  alt?: string
  /** Loading attribute ('lazy' | 'eager') */
  loading?: "lazy" | "eager"
  /** Aspect ratio style override */
  aspectRatio?: string
  /** Callback when image loads successfully */
  onLoad?: () => void
}

/**
 * TemplateThumbnail Component
 *
 * Exclusively displays authentic user-provided cover images from the Images/ folders:
 *   - /Images/#cool #animated #romantic/...
 *   - /Images/#propose #love #greeting #years #birthday/...
 *   - /Images/#romantic #love #kisspose #asthetic/...
 *
 * Guarantees that only authentic user covers/images are displayed, never dummy cartoons or synthetic graphics.
 */
export function TemplateThumbnail({
  template,
  templateId,
  className = "w-full h-full object-cover",
  alt,
  loading = "lazy",
  aspectRatio,
  onLoad,
}: TemplateThumbnailProps) {
  const targetId = templateId || template?.id || ""

  // Resolve to authentic local asset from Images/ folders
  const resolvedAsset: TemplateImageAsset = resolveTemplateLocalAsset(
    targetId ? targetId : template
  )

  const candidates: string[] = []

  // 1. Direct thumbnail property on template if provided
  if (template && "thumbnail" in template && typeof template.thumbnail === "string" && template.thumbnail) {
    candidates.push(template.thumbnail)
  }

  // 2. Primary encodedUrl from resolved asset
  if (resolvedAsset?.encodedUrl && !candidates.includes(resolvedAsset.encodedUrl)) {
    candidates.push(resolvedAsset.encodedUrl)
  }

  // 3. Fallback candidate URLs from asset registry
  if (resolvedAsset?.allCandidateUrls) {
    for (const url of resolvedAsset.allCandidateUrls) {
      if (url && !candidates.includes(url)) {
        candidates.push(url)
      }
    }
  }

  // 4. Fallback directly to tmpl-user-XXX.jpg
  const paddedIdx = String(resolvedAsset.index || 1).padStart(3, "0")
  const defaultTmplUrl = `/templates/tmpl-user-${paddedIdx}.jpg`
  if (!candidates.includes(defaultTmplUrl)) {
    candidates.push(defaultTmplUrl)
  }

  const [candidateIndex, setCandidateIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)

  // Reset state whenever target template changes
  useEffect(() => {
    setCandidateIndex(0)
    setIsLoaded(false)
    setHasFailed(false)
  }, [resolvedAsset.templateId, resolvedAsset.fileName, targetId])

  const currentSrc = candidates[candidateIndex] || candidates[0]

  const handleImageError = () => {
    if (candidateIndex + 1 < candidates.length) {
      setCandidateIndex((prev) => prev + 1)
    } else {
      setHasFailed(true)
    }
  }

  const handleImageLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  // Graceful pure HTML/CSS badge only if image cannot be rendered
  if (hasFailed || !currentSrc) {
    const bgColor = template?.background || "#f5f5f4"
    const displayName = template?.name || resolvedAsset.title
    const displayCount = template?.count || resolvedAsset.count
    const displayCategory = template?.category || resolvedAsset.category

    return (
      <div
        className="w-full h-full flex flex-col items-center justify-center p-3 text-center select-none border border-stone-300"
        style={{ backgroundColor: bgColor, aspectRatio }}
        role="img"
        aria-label={alt || displayName}
      >
        <span className="text-xs font-mono font-bold uppercase tracking-wider text-stone-800 line-clamp-2">
          {displayName}
        </span>
        <span className="text-[10px] text-stone-600 font-mono mt-1">
          {displayCount} Cuts · {displayCategory}
        </span>
        <span className="text-[9px] text-stone-400 font-mono mt-0.5">
          #{resolvedAsset.index} {resolvedAsset.folder.replace(/#/g, "").trim()}
        </span>
      </div>
    )
  }

  const resolvedAlt = alt || template?.name || resolvedAsset.title

  return (
    <div
      className="relative w-full h-full overflow-hidden bg-transparent flex items-center justify-center"
      style={aspectRatio ? { aspectRatio } : undefined}
    >
      {/* Subtle skeleton pulse while loading */}
      {!isLoaded && (
        <div
          className="absolute inset-0 animate-pulse bg-stone-300/30 z-10"
          aria-hidden="true"
        />
      )}

      {/* Real authentic cover photo */}
      <img
        src={currentSrc}
        alt={resolvedAlt}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`${className} transition-opacity duration-200 ease-out ${
          isLoaded ? "opacity-100" : "opacity-90"
        }`}
        data-local-folder={resolvedAsset.folder}
        data-asset-index={resolvedAsset.index}
      />
    </div>
  )
}

export default TemplateThumbnail
