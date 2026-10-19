import type {
  Composition,
  LayerProperties,
  Photo,
  PhotoTemplate,
  PhotoTransform,
  StickerLayer,
  TextLayer,
} from "../types"

export type LayerItem = {
  id: string
  kind: "photo" | "frame" | "sticker" | "text"
  label: string
  properties: LayerProperties
}

import { findGridLayout } from "./gridEngine"

export function dimensions(
  c: Composition,
  t: PhotoTemplate,
): { width: number; height: number } {
  const ar = c.aspectRatio
  if (ar === "story" || ar === "9:16") {
    return { width: 1440, height: 2560 }
  }
  if (ar === "square" || ar === "1:1") {
    return { width: 1800, height: 1800 }
  }
  if (ar === "4:5") {
    return { width: 1600, height: 2000 }
  }
  if (ar === "2:3") {
    return { width: 1600, height: 2400 }
  }
  if (ar === "3:4") {
    return { width: 1800, height: 2400 }
  }
  if (ar === "3:2") {
    return { width: 2400, height: 1600 }
  }
  if (ar === "landscape" || ar === "16:9") {
    return { width: 2560, height: 1440 }
  }
  return { width: t.width, height: t.height }
}

export function photoBounds(
  c: Composition,
  t: PhotoTemplate,
  index: number,
): PhotoTransform {
  if (c.mode === "freeform" && c.photos[index]?.transform) {
    return c.photos[index].transform!
  }
  if (c.gridLayoutId) {
    const layout = findGridLayout(c.gridLayoutId)
    if (layout) {
      const slots = layout.getSlots(c.spacing ?? 2, c.padding ?? 4)
      const slot = slots[index]
      if (slot) {
        return {
          x: slot.x,
          y: slot.y,
          width: slot.width,
          height: slot.height,
          rotation: 0,
        }
      }
    }
  }
  const slot = t.slots[index] ?? {
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  }
  return {
    x: slot.x,
    y: slot.y,
    width: slot.width,
    height: slot.height,
    rotation: 0,
  }
}

export function orderedLayers(c: Composition): LayerItem[] {
  const all: LayerItem[] = []

  c.photos.forEach((p, i) => {
    all.push({
      id: p.id,
      kind: "photo",
      label: p.name || `Photo ${i + 1}`,
      properties: p,
    })
  })

  if (c.frameId) {
    all.push({
      id: "frame",
      kind: "frame",
      label: "Decorative frame",
      properties: { opacity: c.frameOpacity ?? 1 },
    })
  }

  for (const s of c.stickers) {
    all.push({
      id: s.id,
      kind: "sticker",
      label: (s as unknown as { name?: string }).name || s.kind || "Sticker",
      properties: s,
    })
  }

  for (const t of c.texts) {
    all.push({
      id: t.id,
      kind: "text",
      label: t.text ? t.text.slice(0, 24) : "Caption",
      properties: t,
    })
  }

  if (c.layerOrder && c.layerOrder.length > 0) {
    all.sort((a, b) => {
      const idxA = c.layerOrder!.indexOf(a.id)
      const idxB = c.layerOrder!.indexOf(b.id)
      const rankA = idxA === -1 ? 9999 : idxA
      const rankB = idxB === -1 ? 9999 : idxB
      return rankA - rankB
    })
  }

  return all
}

export function enterFreeform(
  c: Composition,
  t: PhotoTemplate,
): Composition {
  return {
    ...c,
    mode: "freeform",
    photos: c.photos.map((p, i) => ({
      ...p,
      transform: p.transform ?? photoBounds(c, t, i),
    })),
  }
}

export function moveLayer(
  c: Composition,
  id: string,
  targetIndex: number,
): Composition {
  const currentLayers = orderedLayers(c).map((l) => l.id)
  const fromIdx = currentLayers.indexOf(id)
  if (fromIdx === -1) return c

  const newOrder = [...currentLayers]
  newOrder.splice(fromIdx, 1)
  const clampedTarget = Math.max(0, Math.min(targetIndex, newOrder.length))
  newOrder.splice(clampedTarget, 0, id)

  // Also maintain relative photo array order for compatibility
  let newPhotos = [...c.photos]
  const photoIdx = newPhotos.findIndex((p) => p.id === id)
  if (photoIdx !== -1) {
    const [targetPhoto] = newPhotos.splice(photoIdx, 1)
    const photoTarget = Math.max(0, Math.min(targetIndex, newPhotos.length))
    newPhotos.splice(photoTarget, 0, targetPhoto)
  }

  return {
    ...c,
    photos: newPhotos,
    layerOrder: newOrder,
  }
}

export function duplicateLayer(
  c: Composition,
  id: string,
  newId: string,
): Composition {
  const photo = c.photos.find((p) => p.id === id)
  if (photo) {
    const clone: Photo = {
      ...photo,
      id: newId,
      name: `${photo.name || "Photo"} copy`,
      transform: photo.transform
        ? {
            ...photo.transform,
            x: Math.min(90, photo.transform.x + 3),
            y: Math.min(90, photo.transform.y + 3),
          }
        : undefined,
    }
    const nextPhotos = [...c.photos, clone]
    const nextOrder = c.layerOrder ? [...c.layerOrder, newId] : undefined
    return { ...c, photos: nextPhotos, layerOrder: nextOrder }
  }

  const sticker = c.stickers.find((s) => s.id === id)
  if (sticker) {
    const clone: StickerLayer = {
      ...sticker,
      id: newId,
      x: Math.min(95, sticker.x + 3),
      y: Math.min(95, sticker.y + 3),
    }
    const nextStickers = [...c.stickers, clone]
    const nextOrder = c.layerOrder ? [...c.layerOrder, newId] : undefined
    return { ...c, stickers: nextStickers, layerOrder: nextOrder }
  }

  const text = c.texts.find((t) => t.id === id)
  if (text) {
    const clone: TextLayer = {
      ...text,
      id: newId,
      x: Math.min(95, text.x + 3),
      y: Math.min(95, text.y + 3),
    }
    const nextTexts = [...c.texts, clone]
    const nextOrder = c.layerOrder ? [...c.layerOrder, newId] : undefined
    return { ...c, texts: nextTexts, layerOrder: nextOrder }
  }

  return c
}

export function deleteLayer(c: Composition, id: string): Composition {
  return {
    ...c,
    photos: c.photos.filter((p) => p.id !== id),
    stickers: c.stickers.filter((s) => s.id !== id),
    texts: c.texts.filter((t) => t.id !== id),
    layerOrder: c.layerOrder ? c.layerOrder.filter((item) => item !== id) : undefined,
  }
}

export function patchLayer(
  c: Composition,
  id: string,
  patch: LayerProperties,
): Composition {
  if (id === "frame") {
    return {
      ...c,
      frameOpacity: patch.opacity !== undefined ? patch.opacity : c.frameOpacity,
    }
  }

  const inPhotos = c.photos.some((p) => p.id === id)
  if (inPhotos) {
    return {
      ...c,
      photos: c.photos.map((p) => (p.id === id ? { ...p, ...patch } : p)),
    }
  }

  const inStickers = c.stickers.some((s) => s.id === id)
  if (inStickers) {
    return {
      ...c,
      stickers: c.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    }
  }

  const inTexts = c.texts.some((t) => t.id === id)
  if (inTexts) {
    return {
      ...c,
      texts: c.texts.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    }
  }

  return c
}

export function distributePhotos(
  c: Composition,
  t: PhotoTemplate,
  ids: string[],
  axis: "x" | "y" | "horizontal" | "vertical",
): Composition {
  const isHoriz = axis === "x" || axis === "horizontal"
  if (ids.length < 3) return c

  const targetPhotos = c.photos.filter(
    (p) => ids.includes(p.id) && !p.locked,
  )
  if (targetPhotos.length < 3) return c

  const getPos = (p: Photo) => {
    const b = p.transform ?? photoBounds(c, t, c.photos.indexOf(p))
    return isHoriz ? b.x : b.y
  }

  const sorted = [...targetPhotos].sort((a, b) => getPos(a) - getPos(b))
  const first = getPos(sorted[0])
  const last = getPos(sorted[sorted.length - 1])
  const step = (last - first) / (sorted.length - 1)

  return {
    ...c,
    mode: "freeform",
    photos: c.photos.map((p, i) => {
      const idx = sorted.indexOf(p)
      if (idx === -1) return p
      const b = p.transform ?? photoBounds(c, t, i)
      const newPos = first + step * idx
      return {
        ...p,
        transform: {
          ...b,
          [isHoriz ? "x" : "y"]: newPos,
        },
      }
    }),
  }
}

export function historyStep(
  past: Composition[],
  current: Composition,
  future: Composition[],
  action: "undo" | "redo",
): { past: Composition[]; current: Composition; future: Composition[] } {
  if (action === "undo") {
    if (past.length === 0) return { past, current, future }
    const prev = past[past.length - 1]
    return {
      past: past.slice(0, -1),
      current: prev,
      future: [current, ...future],
    }
  } else {
    if (future.length === 0) return { past, current, future }
    const next = future[0]
    return {
      past: [...past, current],
      current: next,
      future: future.slice(1),
    }
  }
}
