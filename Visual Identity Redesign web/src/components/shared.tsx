import { useEffect, useRef, useState } from 'react'
import type { Design, Photo, PhotoEdit, Style, Template } from '../types'
import { DEFAULT_EDIT } from '../lib/filters'
import { ensureFonts, getProcessed, loadImage, photoKey, renderComposition } from '../lib/render'
import type { ImageSrc } from '../lib/render'
import { makeSamples } from '../lib/samples'

let fontsDone = false

export function useFontsReady() {
  const [ready, setReady] = useState(fontsDone)
  useEffect(() => {
    if (ready) return
    let dead = false
    ensureFonts().then(() => {
      fontsDone = true
      if (!dead) setReady(true)
    })
    return () => {
      dead = true
    }
  }, [ready])
  return ready
}

export function useImages(photos: Photo[]) {
  const cacheRef = useRef(new Map<string, ImageSrc>())
  const [map, setMap] = useState<Map<string, ImageSrc>>(new Map())
  useEffect(() => {
    let dead = false
    const keys = new Set(photos.map(photoKey))
    for (const k of [...cacheRef.current.keys()]) if (!keys.has(k)) cacheRef.current.delete(k)
    const missing = photos.filter((p) => !cacheRef.current.has(photoKey(p)))
    if (!missing.length) {
      setMap(new Map(cacheRef.current))
      return
    }
    Promise.all(
      missing.map(async (p) => {
        try {
          cacheRef.current.set(photoKey(p), await loadImage(p.url))
        } catch {
          /* undecodable photo is skipped */
        }
      }),
    ).then(() => {
      if (!dead) setMap(new Map(cacheRef.current))
    })
    return () => {
      dead = true
    }
  }, [photos])
  return map
}

let samples: HTMLCanvasElement[] | null = null
const samplePhotos: Photo[] = Array.from({ length: 9 }, (_, i) => ({ id: `s${i}`, url: '', w: 800, h: 600, rev: 0 }))
const samplePhotoMap = new Map(samplePhotos.map((p) => [p.id, p]))

function sampleImgs() {
  samples = samples ?? makeSamples()
  return new Map(samplePhotos.map((p, i) => [photoKey(p), samples![i]] as [string, ImageSrc]))
}

export function TemplatePreview({
  tpl,
  style,
  maxSide = 420,
  className = '',
  label,
}: {
  tpl: Template
  style?: Style
  maxSide?: number
  className?: string
  label?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  const ready = useFontsReady()
  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const design: Design = {
      templateId: tpl.id,
      style: style ?? tpl.look,
      slotAssign: samplePhotos.slice(0, tpl.count).map((p) => p.id),
      edits: Object.fromEntries(samplePhotos.map((p) => [p.id, { ...DEFAULT_EDIT, filter: tpl.defaultFilter }])),
      stickers: [],
      texts: [],
    }
    const long = Math.max(tpl.w, tpl.h)
    renderComposition(cv, { design, tpl, photos: samplePhotoMap, imgs: sampleImgs(), scale: Math.min(1, maxSide / long) })
  }, [tpl, style, maxSide, ready])
  return <canvas ref={ref} role="img" aria-label={label ?? `${tpl.name} layout preview with sample sketches`} className={`block h-auto w-full ${className}`} />
}

export function PhotoThumb({
  photo,
  img,
  edit,
  aspect = 4 / 3,
  width = 160,
  className = '',
  label,
}: {
  photo: Photo
  img?: ImageSrc
  edit?: PhotoEdit
  aspect?: number
  width?: number
  className?: string
  label?: string
}) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv || !img) return
    const w = Math.round(width * 1.5)
    const h = Math.round(w / aspect)
    const proc = getProcessed(`${photoKey(photo)}-t`, img, edit ?? DEFAULT_EDIT, w, h)
    cv.width = w
    cv.height = h
    cv.getContext('2d')!.drawImage(proc, 0, 0)
  }, [photo, img, edit, aspect, width])
  return <canvas ref={ref} role="img" aria-label={label ?? 'Photo thumbnail'} className={`block h-auto w-full bg-paper2 ${className}`} style={{ aspectRatio: String(aspect) }} />
}
