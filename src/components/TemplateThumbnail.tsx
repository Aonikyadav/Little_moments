import { useState, useEffect } from "react"
import type { PhotoTemplate } from "../types"
import {
  resolveTemplateLocalAsset,
  type TemplateImageAsset,
} from "../utils/templateImageMap"

export interface TemplateThumbnailProps {
  /** Template object or partial template with an ID */
  template?: PhotoTemplate | { id: string; name?: string; count?: number; category?: string; background?: string } | null
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
 * Exclusively uses paths derived from the local '/images' folder structure.
 * Implements a robust resolver that maps any template ID (like 'tmpl-001', 'tmpl-user-001',
 * 'tmpl-015', or numeric string) to its corresponding physical asset in the provided sub-folders:
 *   - /images/#cool #animated #romantic/...
 *   - /images/#propose #love #greeting #years #birthday/...
 *   - /images/#romantic #love #kisspose #asthetic/...
 *
 * Guarantees that NO remote or generated images are ever displayed.
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

  // Resolve exclusively to local /images asset
  const resolvedAsset: TemplateImageAsset = resolveTemplateLocalAsset(
    targetId ? targetId : template
  )

  // Candidate paths derived strictly from the /images folder structure
  const directThumb =
    template &&
    "thumbnail" in template &&
    typeof template.thumbnail === "string" &&
    template.thumbnail.startsWith("/images/")
      ? template.thumbnail
      : null

  const candidates: string[] = []
  if (directThumb) {
    candidates.push(directThumb)
  }
  if (resolvedAsset?.allCandidateUrls) {
    for (const url of resolvedAsset.allCandidateUrls) {
      if (url.startsWith("/images/") && !candidates.includes(url)) {
        candidates.push(url)
      }
    }
  }
  if (candidates.length === 0 && resolvedAsset) {
    candidates.push(`/images/${encodeURIComponent(resolvedAsset.folder)}/${encodeURIComponent(resolvedAsset.fileName)}`)
  }

  const [candidateIndex, setCandidateIndex] = useState(0)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)

  // Reset state whenever the resolved asset or template changes
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

  // Graceful pure HTML/CSS badge if image cannot be rendered (NO remote or generated images)
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
      {/* Smooth skeleton loader while image loads */}
      {!isLoaded && (
        <div
          className="absolute inset-0 animate-pulse bg-stone-800/40 z-10"
          aria-hidden="true"
        />
      )}

      {/* Real local photo from /images folder structure */}
      <img
        src={currentSrc}
        alt={resolvedAlt}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        className={`${className} transition-opacity duration-250 ease-out ${
          isLoaded ? "opacity-100" : "opacity-0"
        }`}
        data-local-folder={resolvedAsset.folder}
        data-asset-index={resolvedAsset.index}
      />
    </div>
  )
}

export default TemplateThumbnail
