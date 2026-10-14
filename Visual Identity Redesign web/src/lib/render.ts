import type { Design, Photo, PhotoEdit, Rect, Style, Template } from '../types'
import { applyFxPixels, effectiveFx, isIdentityFx } from './filters'
import { stickerById } from './stickers'
import { formatDate } from './templates'

export type ImageSrc = HTMLImageElement | HTMLCanvasElement

export const photoKey = (p: Photo) => `${p.id}:${p.rev}`

export const srcSize = (s: ImageSrc) =>
  s instanceof HTMLImageElement ? { w: s.naturalWidth, h: s.naturalHeight } : { w: s.width, h: s.height }

export function coverGeom(iw: number, ih: number, w: number, h: number, e: PhotoEdit) {
  const swap = e.rotate % 2 !== 0
  const rw = swap ? ih : iw
  const rh = swap ? iw : ih
  const s = Math.max(w / rw, h / rh) * e.zoom
  return { s, rw, rh, maxX: Math.max(0, (rw * s - w) / 2), maxY: Math.max(0, (rh * s - h) / 2) }
}

const cache = new Map<string, HTMLCanvasElement>()
const CACHE_LIMIT = 48

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = Math.max(1, w)
  c.height = Math.max(1, h)
  return c
}

function blurCanvas(c: HTMLCanvasElement, radius: number) {
  const t = makeCanvas(c.width, c.height)
  const tg = t.getContext('2d')!
  if ((tg as unknown as { filter?: string }).filter !== undefined) {
    tg.filter = `blur(${radius}px)`
    tg.drawImage(c, 0, 0)
    tg.filter = 'none'
  } else {
    const f = 1 / (1 + radius)
    const small = makeCanvas(Math.max(1, Math.round(c.width * f)), Math.max(1, Math.round(c.height * f)))
    small.getContext('2d')!.drawImage(c, 0, 0, small.width, small.height)
    tg.imageSmoothingQuality = 'high'
    tg.drawImage(small, 0, 0, c.width, c.height)
  }
  const g = c.getContext('2d')!
  g.clearRect(0, 0, c.width, c.height)
  g.drawImage(t, 0, 0)
}

/** Crop to the slot, apply geometry, then run the non-destructive filter/adjustment pipeline. */
export function getProcessed(key: string, src: ImageSrc, edit: PhotoEdit, w: number, h: number, useCache = true): HTMLCanvasElement {
  const ck = `${key}|${w}x${h}|${JSON.stringify(edit)}`
  if (useCache) {
    const hit = cache.get(ck)
    if (hit) return hit
  }
  const c = makeCanvas(w, h)
  const g = c.getContext('2d', { willReadFrequently: true })!
  const { w: iw, h: ih } = srcSize(src)
  const geo = coverGeom(iw, ih, w, h, edit)
  g.imageSmoothingQuality = 'high'
  g.save()
  g.translate(w / 2 + edit.offX * geo.maxX, h / 2 + edit.offY * geo.maxY)
  g.rotate((edit.rotate * Math.PI) / 2)
  g.scale(edit.flipH ? -geo.s : geo.s, geo.s)
  g.drawImage(src, -iw / 2, -ih / 2)
  g.restore()
  const fx = effectiveFx(edit)
  if (fx.blur > 0.05) blurCanvas(c, (fx.blur * w) / 400)
  if (!isIdentityFx(fx)) {
    const data = g.getImageData(0, 0, c.width, c.height)
    applyFxPixels(data, fx)
    g.putImageData(data, 0, 0)
  }
  if (useCache) {
    cache.set(ck, c)
    if (cache.size > CACHE_LIMIT) cache.delete(cache.keys().next().value as string)
  }
  return c
}

export function layoutSlots(tpl: Template, style: Style): { W: number; H: number; slots: Rect[]; inner: Rect } {
  const innerW = tpl.w - tpl.look.padding * 2
  const innerH = (tpl.h - tpl.look.padding * 2 - tpl.footer) * style.aspect
  const W = innerW + style.padding * 2
  const H = innerH + style.padding * 2 + tpl.footer
  const g = style.gap / 2
  const ex = { x: style.padding - g, y: style.padding - g, w: innerW + g * 2, h: innerH + g * 2 }
  const slots = tpl.frs.map(([fx, fy, fw, fh]) => ({
    x: ex.x + fx * ex.w + g,
    y: ex.y + fy * ex.h + g,
    w: fw * ex.w - g * 2,
    h: fh * ex.h - g * 2,
  }))
  return { W, H, slots, inner: { x: style.padding, y: style.padding, w: innerW, h: innerH } }
}

function rrect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctx.beginPath()
  ctx.moveTo(x + rr, y)
  ctx.arcTo(x + w, y, x + w, y + h, rr)
  ctx.arcTo(x + w, y + h, x, y + h, rr)
  ctx.arcTo(x, y + h, x, y, rr)
  ctx.arcTo(x, y, x + w, y, rr)
  ctx.closePath()
}

function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const HEART = new Path2D('M50 88C20 66 8 48 8 32 8 18 19 10 30 10c9 0 16 5 20 12 4-7 11-12 20-12 11 0 22 8 22 22 0 16-12 34-42 56Z')
const SPARK = new Path2D('M50 5C53 32 68 47 95 50 68 53 53 68 50 95 47 68 32 53 5 50 32 47 47 32 50 5Z')

function drawDecor(ctx: CanvasRenderingContext2D, st: Style, W: number, H: number, slots: Rect[], phase: 'back' | 'front') {
  const r = rng(11)
  ctx.save()
  ctx.fillStyle = st.decorColor
  ctx.strokeStyle = st.decorColor
  if (phase === 'back') {
    if (st.decor === 'hearts' || st.decor === 'stars') {
      const n = Math.round((W * H) / 26000) + 10
      const path = st.decor === 'hearts' ? HEART : SPARK
      ctx.globalAlpha = 0.6
      for (let i = 0; i < n; i++) {
        const s = 12 + r() * 22
        ctx.save()
        ctx.translate(r() * W, r() * H)
        ctx.rotate((r() - 0.5) * 0.9)
        ctx.scale(s / 100, s / 100)
        ctx.fill(path)
        ctx.restore()
      }
    } else if (st.decor === 'dots') {
      ctx.globalAlpha = 0.55
      for (let y = 20; y < H; y += 44) for (let x = ((y / 44) % 2) * 22 + 10; x < W; x += 44) {
        ctx.beginPath()
        ctx.arc(x, y, 7, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (st.decor === 'grid') {
      ctx.globalAlpha = 0.35
      ctx.lineWidth = 1.5
      ctx.beginPath()
      for (let x = 0; x <= W; x += 40) {
        ctx.moveTo(x, 0)
        ctx.lineTo(x, H)
      }
      for (let y = 0; y <= H; y += 40) {
        ctx.moveTo(0, y)
        ctx.lineTo(W, y)
      }
      ctx.stroke()
    } else if (st.decor === 'confetti') {
      const cols = ['#e63946', '#f4a261', '#2a9d8f', '#457b9d', '#e9c46a', '#d96c8e']
      const n = Math.round((W * H) / 9000) + 20
      for (let i = 0; i < n; i++) {
        ctx.save()
        ctx.globalAlpha = 0.85
        ctx.fillStyle = cols[Math.floor(r() * cols.length)]
        ctx.translate(r() * W, r() * H)
        ctx.rotate(r() * Math.PI)
        ctx.fillRect(-5, -2.5, 10 + r() * 6, 5)
        ctx.restore()
      }
    } else if (st.decor === 'snow') {
      const n = Math.round((W * H) / 8000) + 20
      for (let i = 0; i < n; i++) {
        ctx.globalAlpha = 0.5 + r() * 0.5
        ctx.beginPath()
        ctx.arc(r() * W, r() * H, 2 + r() * 6, 0, Math.PI * 2)
        ctx.fill()
      }
    } else if (st.decor === 'checker') {
      const s = 14
      ctx.globalAlpha = 0.9
      for (const y0 of [0, H - s * 2]) for (let row = 0; row < 2; row++) for (let x = 0; x < W; x += s) {
        if (((x / s) + row) % 2 === 0) ctx.fillRect(x, y0 + row * s, s, s)
      }
    } else if (st.decor === 'film') {
      ctx.globalAlpha = 0.92
      const hw = Math.min(16, st.padding * 0.4)
      const hh = hw * 1.4
      for (let y = 20; y < H - 20; y += hh * 2.2) for (const x of [st.padding / 2 - hw / 2, W - st.padding / 2 - hw / 2]) {
        rrect(ctx, x, y, hw, hh, 3)
        ctx.fill()
      }
    }
  } else if (st.decor === 'tape') {
    slots.forEach((s, i) => {
      const a = (i % 2 ? 1 : -1) * 0.12
      for (const side of [0, 1]) {
        ctx.save()
        ctx.globalAlpha = 0.78
        ctx.fillStyle = st.decorColor
        ctx.translate(side ? s.x + s.w - 14 : s.x + 14, s.y + 2)
        ctx.rotate(side ? -a - 0.5 : a + 0.5)
        ctx.fillRect(-34, -11, 68, 22)
        ctx.restore()
      }
    })
  }
  ctx.restore()
}

export interface ItemBox {
  id: string
  kind: 'sticker' | 'text'
  cx: number
  cy: number
  w: number
  h: number
  rot: number
}

export interface RenderInfo {
  W: number
  H: number
  slots: Rect[]
  items: ItemBox[]
}

export interface RenderOpts {
  design: Design
  tpl: Template
  photos: Map<string, Photo>
  imgs: Map<string, ImageSrc>
  scale: number
  transparent?: boolean
  placeholders?: boolean
  cache?: boolean
}

export function resolveFooter(text: string) {
  return text.replace(/\{date\}/g, formatDate())
}

export function renderComposition(cv: HTMLCanvasElement, o: RenderOpts): RenderInfo {
  const { design, tpl, scale } = o
  const st = design.style
  const { W, H, slots } = layoutSlots(tpl, st)
  cv.width = Math.max(1, Math.round(W * scale))
  cv.height = Math.max(1, Math.round(H * scale))
  const ctx = cv.getContext('2d')!
  ctx.setTransform(scale, 0, 0, scale, 0, 0)
  ctx.clearRect(0, 0, W, H)
  if (!o.transparent) {
    if (st.bg2) {
      const g = ctx.createLinearGradient(0, 0, W * 0.4, H)
      g.addColorStop(0, st.bg)
      g.addColorStop(1, st.bg2)
      ctx.fillStyle = g
    } else ctx.fillStyle = st.bg
    ctx.fillRect(0, 0, W, H)
  }
  drawDecor(ctx, st, W, H, slots, 'back')

  slots.forEach((s, i) => {
    const pid = design.slotAssign[i]
    const photo = pid ? o.photos.get(pid) : undefined
    const src = photo ? o.imgs.get(photoKey(photo)) : undefined
    if (photo && src) {
      if (st.shadow) {
        ctx.save()
        ctx.shadowColor = 'rgba(0,0,0,0.3)'
        ctx.shadowBlur = 14 * scale
        ctx.shadowOffsetY = 5 * scale
        ctx.fillStyle = '#ffffff'
        rrect(ctx, s.x, s.y, s.w, s.h, st.radius)
        ctx.fill()
        ctx.restore()
      }
      const edit = design.edits[photo.id]
      const proc = getProcessed(photoKey(photo), src, edit ?? { ...defaultEdit }, Math.max(1, Math.round(s.w * scale)), Math.max(1, Math.round(s.h * scale)), o.cache !== false)
      ctx.save()
      rrect(ctx, s.x, s.y, s.w, s.h, st.radius)
      ctx.clip()
      ctx.drawImage(proc, s.x, s.y, s.w, s.h)
      ctx.restore()
    } else {
      ctx.save()
      rrect(ctx, s.x, s.y, s.w, s.h, st.radius)
      ctx.fillStyle = 'rgba(120,115,100,0.16)'
      ctx.fill()
      if (o.placeholders) {
        ctx.setLineDash([10, 8])
        ctx.lineWidth = 2
        ctx.strokeStyle = 'rgba(60,58,52,0.6)'
        ctx.stroke()
        ctx.setLineDash([])
        ctx.fillStyle = 'rgba(60,58,52,0.7)'
        ctx.font = '700 34px "Kalam", sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`+ photo ${i + 1}`, s.x + s.w / 2, s.y + s.h / 2)
      }
      ctx.restore()
    }
    if (st.border > 0) {
      ctx.save()
      if (st.decor === 'neon') {
        ctx.shadowColor = st.decorColor
        ctx.shadowBlur = 16 * scale
      }
      ctx.lineWidth = st.border
      ctx.strokeStyle = st.borderColor
      rrect(ctx, s.x + st.border / 2, s.y + st.border / 2, s.w - st.border, s.h - st.border, Math.max(0, st.radius - st.border / 2))
      ctx.stroke()
      ctx.restore()
    }
  })

  drawDecor(ctx, st, W, H, slots, 'front')

  if (tpl.footer > 0 && st.footerText.trim()) {
    const text = resolveFooter(st.footerText)
    let size = tpl.footerSize
    const maxW = W - st.padding * 2
    ctx.save()
    ctx.fillStyle = st.footerColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    for (; size > 14; size -= 2) {
      ctx.font = `700 ${size}px "${st.footerFont}", sans-serif`
      if (ctx.measureText(text).width <= maxW) break
    }
    ctx.fillText(text, W / 2, H - tpl.footer / 2 - 4)
    ctx.restore()
  }

  const items: ItemBox[] = []
  for (const s of design.stickers) {
    const def = stickerById(s.kind)
    if (!def) continue
    const px = s.size * W
    ctx.save()
    ctx.translate(s.x * W, s.y * H)
    ctx.rotate((s.rot * Math.PI) / 180)
    ctx.scale(px / 100, px / 100)
    ctx.translate(-50, -50)
    ctx.lineJoin = 'round'
    ctx.lineCap = 'round'
    ctx.lineWidth = 3.5
    ctx.strokeStyle = '#1d1c1a'
    for (const p of def.paths) {
      const path = new Path2D(p.d)
      if (p.f !== 'n') {
        ctx.fillStyle = p.f === 'c' ? s.color : p.f === 'w' ? '#fffdf7' : '#1d1c1a'
        ctx.fill(path)
      }
      if (p.s) ctx.stroke(path)
    }
    ctx.restore()
    items.push({ id: s.id, kind: 'sticker', cx: s.x * W, cy: s.y * H, w: px, h: px, rot: s.rot })
  }
  for (const t of design.texts) {
    const px = Math.max(8, t.size * W)
    const lines = t.text.split('\n')
    ctx.save()
    ctx.font = `700 ${px}px "${t.font}", sans-serif`
    const bw = Math.max(px * 0.6, ...lines.map((l) => ctx.measureText(l).width))
    const lh = px * 1.15
    const bh = lh * lines.length
    ctx.translate(t.x * W, t.y * H)
    ctx.rotate((t.rot * Math.PI) / 180)
    ctx.fillStyle = t.color
    ctx.textAlign = t.align
    ctx.textBaseline = 'middle'
    const tx = t.align === 'center' ? 0 : t.align === 'left' ? -bw / 2 : bw / 2
    lines.forEach((l, i) => ctx.fillText(l, tx, -bh / 2 + lh * (i + 0.5)))
    ctx.restore()
    items.push({ id: t.id, kind: 'text', cx: t.x * W, cy: t.y * H, w: bw, h: bh, rot: t.rot })
  }
  return { W, H, slots, items }
}

const defaultEdit: PhotoEdit = {
  filter: 'original',
  intensity: 1,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  exposure: 0,
  blur: 0,
  grain: 0,
  vignette: 0,
  zoom: 1,
  offX: 0,
  offY: 0,
  rotate: 0,
  flipH: false,
}

const FONT_SPECS = ['Caveat', 'Kalam', 'Playfair Display', 'Figtree', 'Special Elite', 'Pacifico']

export async function ensureFonts() {
  if (!('fonts' in document)) return
  try {
    await Promise.all(FONT_SPECS.map((f) => document.fonts.load(`700 40px "${f}"`)))
  } catch {
    /* fonts fall back to system faces */
  }
}

export function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Image failed to decode'))
    img.src = url
  })
}
