import type {
  Composition,
  PhotoTemplate,
  PhotoTransform,
  LayerProperties,
} from "../types"
export type LayerKind = "photo" | "sticker" | "text" | "frame"
export type StudioLayer = {
  id: string
  kind: LayerKind
  label: string
  properties: LayerProperties
}
export function orderedLayers(c: Composition): StudioLayer[] {
  const all: StudioLayer[] = [
    ...c.photos.map((p, i) => ({
      id: p.id,
      kind: "photo" as const,
      label: p.name || `Photo ${i + 1}`,
      properties: p,
    })),
    ...(c.frameId
      ? [
          {
            id: "frame",
            kind: "frame" as const,
            label: "Creative frame",
            properties: {
              opacity: c.frameOpacity ?? 1,
              hidden: c.frameOpacity === 0,
            },
          },
        ]
      : []),
    ...c.stickers.map((s) => ({
      id: s.id,
      kind: "sticker" as const,
      label: s.name || s.kind,
      properties: s,
    })),
    ...c.texts.map((t) => ({
      id: t.id,
      kind: "text" as const,
      label: t.name || t.text,
      properties: t,
    })),
  ]
  const ranks = new Map((c.layerOrder ?? []).map((id, i) => [id, i]))
  const stableRanks = new Map(
    all.map((l, i) => [
      l.id,
      ranks.get(l.id) ?? (c.layerOrder?.length ?? 0) + i,
    ]),
  )
  return all.sort((a, b) => stableRanks.get(a.id)! - stableRanks.get(b.id)!)
}
export function photoBounds(
  c: Composition,
  t: PhotoTemplate,
  index: number,
): PhotoTransform {
  const p = c.photos[index],
    s = t.slots[index] ?? {
      x: 10 + (index % 3) * 20,
      y: 10 + Math.floor(index / 3) * 15,
      width: 45,
      height: 35,
    }
  if (c.mode === "freeform" && p?.transform) return p.transform
  const inset = c.spacing * 0.08
  return {
    x: s.x + inset,
    y: s.y + inset,
    width: Math.max(1, s.width - inset * 2),
    height: Math.max(1, s.height - inset * 2),
    rotation: 0,
  }
}
export function dimensions(c: Composition, t: PhotoTemplate) {
  if (c.aspectRatio === "square") return { width: 1800, height: 1800 }
  if (c.aspectRatio === "story") return { width: 1440, height: 2560 }
  if (c.aspectRatio === "landscape") return { width: 2400, height: 1600 }
  return { width: t.width, height: t.height }
}
export function enterFreeform(c: Composition, t: PhotoTemplate): Composition {
  return {
    ...c,
    mode: "freeform",
    photos: c.photos.map((p, i) => ({ ...p, transform: photoBounds(c, t, i) })),
  }
}
export function patchLayer(
  c: Composition,
  id: string,
  patch: LayerProperties,
): Composition {
  if (id === "frame")
    return {
      ...c,
      frameOpacity:
        patch.hidden === false
          ? 1
          : patch.hidden
            ? 0
            : (patch.opacity ?? c.frameOpacity ?? 1),
    }
  return {
    ...c,
    photos: c.photos.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    stickers: c.stickers.map((x) => (x.id === id ? { ...x, ...patch } : x)),
    texts: c.texts.map((x) => (x.id === id ? { ...x, ...patch } : x)),
  }
}
export function moveLayer(
  c: Composition,
  id: string,
  direction: number,
): Composition {
  const ids = orderedLayers(c).map((l) => l.id),
    i = ids.indexOf(id),
    j = Math.max(0, Math.min(ids.length - 1, i + direction))
  if (i < 0) return c
  const [moved] = ids.splice(i, 1)
  ids.splice(j, 0, moved)
  return { ...c, layerOrder: ids }
}
export function duplicateLayer(
  c: Composition,
  id: string,
  newId: string,
): Composition {
  const layer = orderedLayers(c).find((l) => l.id === id)
  if (!layer || layer.kind === "frame") return c
  const order = orderedLayers(c).map((l) => l.id)
  order.splice(order.indexOf(id) + 1, 0, newId)
  if (layer.kind === "photo") {
    const p = c.photos.find((p) => p.id === id)!
    return {
      ...c,
      layerOrder: order,
      photos: [
        ...c.photos,
        {
          ...p,
          id: newId,
          locked: false,
          name: `${p.name} copy`,
          transform: p.transform
            ? { ...p.transform, x: p.transform.x + 3, y: p.transform.y + 3 }
            : undefined,
        },
      ],
    }
  }
  if (layer.kind === "sticker") {
    const s = c.stickers.find((s) => s.id === id)!
    return {
      ...c,
      layerOrder: order,
      stickers: [
        ...c.stickers,
        { ...s, id: newId, locked: false, x: s.x + 3, y: s.y + 3 },
      ],
    }
  }
  const t = c.texts.find((t) => t.id === id)!
  return {
    ...c,
    layerOrder: order,
    texts: [
      ...c.texts,
      { ...t, id: newId, locked: false, x: t.x + 3, y: t.y + 3 },
    ],
  }
}
export function deleteLayer(c: Composition, id: string): Composition {
  if (id === "frame") return { ...c, frameId: undefined }
  return {
    ...c,
    photos: c.photos.filter((x) => x.id !== id),
    stickers: c.stickers.filter((x) => x.id !== id),
    texts: c.texts.filter((x) => x.id !== id),
    layerOrder: c.layerOrder?.filter((x) => x !== id),
  }
}
export function distributePhotos(
  c: Composition,
  t: PhotoTemplate,
  ids: string[],
  axis: "x" | "y",
): Composition {
  const active = c.photos
    .map((p, i) => ({ p, b: photoBounds(c, t, i) }))
    .filter(({ p }) => ids.includes(p.id) && !p.locked)
    .sort((a, b) => a.b[axis] - b.b[axis])
  if (active.length < 3) return c
  const extent = axis === "x" ? "width" : "height"
  const start = active[0].b[axis],
    last = active[active.length - 1]
  const end = last.b[axis] + last.b[extent]
  const gap =
    (end - start - active.reduce((sum, p) => sum + p.b[extent], 0)) /
    (active.length - 1)
  const positions = new Map<string, PhotoTransform>()
  let cursor = start
  for (const { p, b } of active) {
    positions.set(p.id, { ...b, [axis]: cursor })
    cursor += b[extent] + gap
  }
  return {
    ...c,
    mode: "freeform",
    photos: c.photos.map((p) =>
      positions.has(p.id) ? { ...p, transform: positions.get(p.id)! } : p,
    ),
  }
}
export function historyStep<T>(
  past: T[],
  current: T,
  future: T[],
  action: "undo" | "redo",
) {
  if (action === "undo" && past.length)
    return {
      past: past.slice(0, -1),
      current: past[past.length - 1],
      future: [current, ...future],
    }
  if (action === "redo" && future.length)
    return {
      past: [...past, current],
      current: future[0],
      future: future.slice(1),
    }
  return { past, current, future }
}
