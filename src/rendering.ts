import type { Adjustments, Composition, Photo, PhotoTemplate } from "./types"
import { defaultAdjustments } from "./types"
import { filterValues } from "./studio/filters"
import { warpPerspective } from "./studio/perspective"
import { adjustPixels, sharpenPixels } from "./studio/pixels"
import {
  frames,
  frameArtwork,
  svgUrl,
  stickers,
  stickerUrl,
} from "./studio/assets"
import { dimensions, orderedLayers, photoBounds } from "./studio/model"
export { filterValues } from "./studio/filters"

export const resolvedAdjustments = (a: Adjustments): Adjustments => {
  const result = { ...defaultAdjustments(), ...a },
    preset = filterValues[a.filter] ?? {}
  // Presets contribute offsets from neutral, so manual sliders remain effective.
  for (const [key, target] of Object.entries(preset))
    if (typeof target === "number") {
      const k = key as keyof Adjustments,
        base = defaultAdjustments()[k]
      ;(result as unknown as Record<string, unknown>)[k] =
        Number(result[k]) + ((target - Number(base ?? 0)) * a.intensity) / 100
    }
  for (const key of [
    "brightness",
    "contrast",
    "saturation",
    "blur",
    "grain",
    "vignette",
  ] as const) {
    result[key] = Math.max(0, result[key])
  }
  return result
}
export const cssFilter = (a: Adjustments) => {
  const v = resolvedAdjustments(a)
  return `brightness(${v.brightness}%) contrast(${v.contrast}%) saturate(${v.saturation}%) sepia(${Math.max(0, v.warmth) * 0.45}%) hue-rotate(${(v.hue ?? 0) + (v.warmth < 0 ? v.warmth * 0.35 : 0)}deg) blur(${v.blur}px)`
}
const images = new Map<string, Promise<HTMLImageElement>>()
export function loadImage(src: string) {
  let pending = images.get(src)
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = () => {
        images.delete(src)
        reject(new Error("An image could not be decoded."))
      }
      i.src = src
    })
    images.set(src, pending)
    if (images.size > 40) images.delete(images.keys().next().value!)
  }
  return pending
}
const processed = new Map<string, HTMLCanvasElement>()
type SourceVersion = {
  src: string
  version: number
}
const sourceVersions = new Map<string, SourceVersion>()
async function processedPhoto(photo: Photo, maxEdge: number) {
  const a = resolvedAdjustments(photo.adjustments),
    edge = Math.ceil(Math.min(4096, Math.max(300, maxEdge)) / 100) * 100
  const previous = sourceVersions.get(photo.id)
  const version =
    previous?.src === photo.src
      ? previous.version
      : (previous?.version ?? 0) + 1
  sourceVersions.set(photo.id, { src: photo.src, version })
  if (sourceVersions.size > 40)
    sourceVersions.delete(sourceVersions.keys().next().value!)
  const {
    zoom,
    offsetX,
    offsetY,
    rotation,
    flipX,
    flipY,
    fit,
    blur,
    grain,
    vignette,
    glow,
    lightLeak,
    scratches,
    ...pixelValues
  } = a
  const key = JSON.stringify([photo.id, version, edge, pixelValues])
  if (processed.has(key)) return processed.get(key)!
  const image = await loadImage(photo.src),
    ratio = Math.min(1, edge / Math.max(image.width, image.height))
  const canvas = document.createElement("canvas")
  canvas.width = Math.max(1, Math.round(image.width * ratio))
  canvas.height = Math.max(1, Math.round(image.height * ratio))
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height)
  adjustPixels(pixels.data, a)
  sharpenPixels(pixels.data, canvas.width, canvas.height, a.sharpness ?? 0)
  ctx.putImageData(pixels, 0, 0)
  const warped = warpPerspective(
    canvas,
    a.perspectiveX ?? 0,
    a.perspectiveY ?? 0,
  )
  processed.set(key, warped)
  while (
    processed.size > 1 &&
    (processed.size > 12 ||
      [...processed.values()].reduce((sum, v) => sum + v.width * v.height, 0) >
        12_000_000)
  )
    processed.delete(processed.keys().next().value!)
  return warped
}
const clip = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2))
  ctx.clip()
}
async function drawPhoto(
  ctx: CanvasRenderingContext2D,
  photo: Photo,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  const a = resolvedAdjustments(photo.adjustments),
    image = await processedPhoto(photo, Math.max(w, h) * a.zoom)
  ctx.save()
  clip(ctx, x, y, w, h, r)
  const angle = (a.rotation * Math.PI) / 180,
    cs = Math.abs(Math.cos(angle)),
    sn = Math.abs(Math.sin(angle))
  const rotatedWidth = image.width * cs + image.height * sn,
    rotatedHeight = image.width * sn + image.height * cs
  const fit =
    a.fit === "fit"
      ? Math.min(w / rotatedWidth, h / rotatedHeight)
      : Math.max(
          (w * cs + h * sn) / image.width,
          (w * sn + h * cs) / image.height,
        )
  ctx.translate(
    x + w / 2 + a.offsetX * w * 0.005,
    y + h / 2 + a.offsetY * h * 0.005,
  )
  ctx.rotate(angle)
  ctx.scale(a.flipX ? -1 : 1, a.flipY ? -1 : 1)
  ctx.filter = `blur(${(a.blur * w) / 600}px)`
  ctx.drawImage(
    image,
    (-image.width * fit * a.zoom) / 2,
    (-image.height * fit * a.zoom) / 2,
    image.width * fit * a.zoom,
    image.height * fit * a.zoom,
  )
  ctx.filter = "none"
  if ((a.glow ?? 0) > 0) {
    ctx.globalAlpha *= (a.glow ?? 0) / 180
    ctx.globalCompositeOperation = "screen"
    ctx.filter = `blur(${w * 0.025}px)`
    ctx.drawImage(
      image,
      (-image.width * fit * a.zoom) / 2,
      (-image.height * fit * a.zoom) / 2,
      image.width * fit * a.zoom,
      image.height * fit * a.zoom,
    )
  }
  ctx.restore()
  ctx.save()
  clip(ctx, x, y, w, h, r)
  if (a.vignette > 0) {
    const g = ctx.createRadialGradient(
      x + w / 2,
      y + h / 2,
      Math.min(w, h) * 0.12,
      x + w / 2,
      y + h / 2,
      Math.max(w, h) * 0.65,
    )
    g.addColorStop(0, "transparent")
    g.addColorStop(1, `rgba(0,0,0,${a.vignette / 120})`)
    ctx.fillStyle = g
    ctx.fillRect(x, y, w, h)
  }
  if (a.grain > 0) {
    const step = w / 130
    for (let row = 0; row < Math.ceil(h / step); row++)
      for (let col = 0; col < 130; col++) {
        const v = Math.sin(col * 12.9898 + row * 78.233) * 43758.5453,
          n = v - Math.floor(v)
        ctx.fillStyle = `rgba(${
          n > 0.5 ? "255,255,255" : "0,0,0"
        },${(a.grain / 350) * n})`
        ctx.fillRect(x + col * step, y + row * step, step * 0.7, step * 0.7)
      }
  }
  if ((a.lightLeak ?? 0) > 0) {
    const g = ctx.createLinearGradient(x, y, x + w, y + h * 0.2)
    g.addColorStop(0, `rgba(255,90,30,${(a.lightLeak ?? 0) / 100})`)
    g.addColorStop(0.7, "transparent")
    ctx.globalCompositeOperation = "screen"
    ctx.fillStyle = g
    ctx.fillRect(x, y, w, h)
    ctx.globalCompositeOperation = "source-over"
  }
  if ((a.scratches ?? 0) > 0) {
    ctx.strokeStyle = `rgba(255,250,220,${(a.scratches ?? 0) / 150})`
    ctx.lineWidth = Math.max(0.4, w / 800)
    for (let i = 0; i < Math.ceil((a.scratches ?? 0) / 5); i++) {
      const px = x + (((i * 37 + 11) % 100) / 100) * w
      ctx.beginPath()
      ctx.moveTo(px, y + (h * ((i * 7) % 20)) / 100)
      ctx.lineTo(px + w * 0.005, y + h * (0.4 + ((i * 13) % 60) / 100))
      ctx.stroke()
    }
  }
  ctx.restore()
}
function background(
  ctx: CanvasRenderingContext2D,
  c: Composition,
  w: number,
  h: number,
) {
  ctx.fillStyle = c.background
  ctx.fillRect(0, 0, w, h)
  const p = c.backgroundPattern
  if (!p || p === "none") return
  ctx.save()
  ctx.globalAlpha = c.backgroundOpacity ?? 0.35
  ctx.strokeStyle = "#777262"
  ctx.fillStyle = "#777262"
  ctx.lineWidth = w / 1500
  const step = w / 30
  if (p.includes("gradient")) {
    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, c.background)
    g.addColorStop(1, p === "Sunset gradient" ? "#d09b9b" : "#8d9d81")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)
  } else if (p === "Dots") {
    for (let x = step / 2; x < w; x += step)
      for (let y = step / 2; y < h; y += step) {
        ctx.beginPath()
        ctx.arc(x, y, w / 1000, 0, Math.PI * 2)
        ctx.fill()
      }
  } else if (p === "Paper grain") {
    for (let i = 0; i < 2500; i++) {
      ctx.globalAlpha = (c.backgroundOpacity ?? 0.35) * ((i % 5) / 6)
      ctx.fillRect(
        (((i * 193) % 1000) / 1000) * w,
        (((i * 457) % 1000) / 1000) * h,
        w / 650,
        h / 650,
      )
    }
  } else if (p === "Newspaper") {
    ctx.font = `${w / 95}px Georgia`
    for (let y = step; y < h; y += step * 0.6)
      for (let x = step; x < w; x += w / 3)
        ctx.fillText(
          "LITTLE MOMENTS · THE EVERYDAY JOURNAL",
          x,
          y,
          w / 3 - step,
        )
  } else if (p === "Lace") {
    for (let x = 0; x < w; x += step)
      for (let y = 0; y < h; y += step) {
        ctx.beginPath()
        ctx.arc(x, y, step * 0.5, 0, Math.PI * 2)
        ctx.stroke()
        ctx.beginPath()
        ctx.arc(x, y, step * 0.2, 0, Math.PI * 2)
        ctx.stroke()
      }
  } else if (p === "Retro waves") {
    for (let y = 0; y < h; y += step) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      for (let x = 0; x < w; x += step)
        ctx.quadraticCurveTo(x + step / 2, y + step, x + step, y)
      ctx.stroke()
    }
  } else {
    for (let y = 0; y < h; y += p === "Denim" ? step / 6 : step) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    if (p !== "Notebook lines")
      for (let x = 0; x < w; x += p === "Denim" ? step / 5 : step) {
        ctx.beginPath()
        ctx.moveTo(x, 0)
        ctx.lineTo(x, p === "Denim" ? h * 0.98 : h)
        ctx.stroke()
      }
    if (p === "Gingham") {
      ctx.fillStyle = "#97777a"
      for (let x = 0; x < w; x += step * 2) ctx.fillRect(x, 0, step, h)
      for (let y = 0; y < h; y += step * 2) ctx.fillRect(0, y, w, step)
    }
    if (p === "Canvas weave") {
      ctx.setLineDash([step * 0.2, step * 0.3])
      for (let y = step / 3; y < h; y += step * 0.3) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }
    }
  }
  ctx.restore()
}
export async function renderComposition(
  canvas: HTMLCanvasElement,
  c: Composition,
  t: PhotoTemplate,
  scale = 1,
) {
  const size = dimensions(c, t)
  canvas.width = Math.round(size.width * scale)
  canvas.height = Math.round(size.height * scale)
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas rendering is unavailable.")
  const sx = canvas.width / 100,
    sy = canvas.height / 100
  ctx.imageSmoothingQuality = "high"
  background(ctx, c, canvas.width, canvas.height)
  for (const layer of orderedLayers(c)) {
    if (layer.properties.hidden || layer.properties.opacity === 0) continue
    ctx.save()
    ctx.globalAlpha = layer.properties.opacity ?? 1
    ctx.globalCompositeOperation = layer.properties.blend ?? "source-over"
    if (layer.properties.shadow) {
      ctx.shadowColor = "#25221c70"
      ctx.shadowBlur = layer.properties.shadow * sx * 0.08
      ctx.shadowOffsetY = layer.properties.shadow * sx * 0.03
    }
    if (layer.kind === "photo") {
      const index = c.photos.findIndex((p) => p.id === layer.id),
        p = c.photos[index],
        b = photoBounds(c, t, index),
        w = b.width * sx,
        h = b.height * sy
      ctx.translate((b.x + b.width / 2) * sx, (b.y + b.height / 2) * sy)
      ctx.rotate((b.rotation * Math.PI) / 180)
      ctx.fillStyle = c.background
      ctx.fillRect(-w / 2, -h / 2, w, h)
      await drawPhoto(ctx, p, -w / 2, -h / 2, w, h, c.radius * sx * 0.12)
      if (c.borderWidth > 0) {
        ctx.strokeStyle = c.borderColor
        ctx.lineWidth = c.borderWidth * scale
        ctx.beginPath()
        ctx.roundRect(
          -w / 2,
          -h / 2,
          w,
          h,
          Math.min(c.radius * sx * 0.12, w / 2, h / 2),
        )
        ctx.stroke()
      }
    } else if (layer.kind === "frame") {
      const f = frames.find((f) => f.id === c.frameId)
      if (f) {
        const image = await loadImage(
          svgUrl(frameArtwork(f, c.frameColor ?? f.color), 1000, 1400),
        )
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
      }
    } else if (layer.kind === "sticker") {
      const s = c.stickers.find((s) => s.id === layer.id)!
      ctx.translate(s.x * sx, s.y * sy)
      ctx.rotate((s.rotation * Math.PI) / 180)
      if (s.flipX) ctx.scale(-1, 1)
      const asset = stickers.find((a) => a.id === s.assetId)
      if (asset || s.src) {
        const image = await loadImage(s.src ?? stickerUrl(asset!, s.color))
        ctx.drawImage(
          image,
          (-s.size * sx) / 2,
          (-s.size * sx) / 2,
          s.size * sx,
          s.size * sx,
        )
      } else {
        ctx.fillStyle = s.color
        ctx.font = `${s.size * sx * 0.75}px sans-serif`
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(
          { heart: "♡", star: "☆", sparkle: "✦", flower: "✿", smile: "☺" }[
            s.kind
          ],
          0,
          0,
        )
      }
    } else {
      const text = c.texts.find((x) => x.id === layer.id)!
      ctx.translate(text.x * sx, text.y * sy)
      ctx.rotate((text.rotation * Math.PI) / 180)
      ctx.font = `${text.size * sx * 0.18}px ${{ hand: "Caveat, cursive", sans: "DM Sans, sans-serif", serif: "Georgia, serif" }[text.font]}`
      ctx.textAlign = text.align ?? "center"
      ctx.textBaseline = "middle"
      ctx.letterSpacing = `${(text.letterSpacing ?? 0) * scale}px`
      const lines = text.text.split("\n"),
        lineHeight = text.size * sx * 0.18 * (text.lineHeight ?? 1.3)
      if (text.labelColor) {
        ctx.fillStyle = text.labelColor
        const width =
          Math.max(...lines.map((l) => ctx.measureText(l).width)) + sx * 3
        ctx.fillRect(
          -width / 2,
          (-lines.length * lineHeight) / 2,
          width,
          lines.length * lineHeight,
        )
      }
      lines.forEach((line, i) => {
        const y = (i - (lines.length - 1) / 2) * lineHeight
        if (text.outline) {
          ctx.strokeStyle = c.background
          ctx.lineWidth = text.outline * scale
          ctx.strokeText(line, 0, y)
        }
        ctx.fillStyle = text.color
        ctx.fillText(line, 0, y)
      })
    }
    ctx.restore()
  }
  return canvas
}
