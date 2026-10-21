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
  findSticker,
} from "./studio/assets"
import { dimensions, orderedLayers, photoBounds } from "./studio/model"
import { findGridLayout } from "./studio/gridEngine"
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
function drawKBoothPattern(
  ctx: CanvasRenderingContext2D,
  p: string,
  w: number,
  h: number,
  c: Composition,
) {
  ctx.save()

  if (p === "K-Booth Dark Marble") {
    // Marble veining
    ctx.strokeStyle = "rgba(255, 255, 255, 0.09)"
    ctx.lineWidth = w * 0.003
    for (let i = 0; i < 6; i++) {
      ctx.beginPath()
      ctx.moveTo(w * (0.1 + i * 0.16), 0)
      ctx.bezierCurveTo(
        w * (0.2 + i * 0.14),
        h * 0.35,
        w * (0.05 + i * 0.18),
        h * 0.65,
        w * (0.25 + i * 0.15),
        h,
      )
      ctx.stroke()
    }
    // Subtle golden/lavender sparkle dust
    for (let i = 0; i < 40; i++) {
      const sx = (((i * 179) % 1000) / 1000) * w
      const sy = (((i * 383) % 1000) / 1000) * h
      ctx.fillStyle =
        i % 2 === 0 ? "rgba(192, 132, 252, 0.25)" : "rgba(253, 230, 138, 0.2)"
      ctx.beginPath()
      ctx.arc(sx, sy, w * 0.002, 0, Math.PI * 2)
      ctx.fill()
    }
    // Twin photobooth backing strips
    const drawStrip = (x: number, y: number, sw: number, sh: number) => {
      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.4)"
      ctx.shadowBlur = w * 0.02
      ctx.shadowOffsetY = h * 0.01
      ctx.fillStyle = "#faf5ef"
      ctx.beginPath()
      ctx.roundRect(x, y, sw, sh, w * 0.015)
      ctx.fill()
      ctx.strokeStyle = "#e8dfd1"
      ctx.lineWidth = w * 0.002
      ctx.stroke()
      ctx.restore()

      // Header text "HAPPY BIRTHDAY" - Increased size and bold
      ctx.save()
      ctx.fillStyle = "#1e1b24"
      ctx.font = `900 ${w * 0.038}px 'DM Sans', sans-serif`
      ctx.textAlign = "center"
      ctx.fillText("✦ HAPPY BIRTHDAY ✦", x + sw / 2, y + sh * 0.042)
      ctx.font = `bold italic ${w * 0.028}px 'Caveat', cursive`
      ctx.fillStyle = "#7c3aed"
      ctx.fillText("little moments · photobooth", x + sw / 2, y + sh * 0.97)
      ctx.restore()
    }
    drawStrip(w * 0.09, h * 0.06, w * 0.4, h * 0.88)
    drawStrip(w * 0.51, h * 0.06, w * 0.4, h * 0.88)
  } else if (p === "K-Booth Espresso Velvet") {
    // Rich espresso velvet gradient
    const g = ctx.createLinearGradient(0, 0, 0, h)
    g.addColorStop(0, "#2c1d16")
    g.addColorStop(0.5, "#221611")
    g.addColorStop(1, "#180f0b")
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    // Fine velvet weave
    ctx.strokeStyle = "rgba(255, 230, 200, 0.03)"
    ctx.lineWidth = 1
    for (let x = -h; x < w + h; x += w * 0.015) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + h, h)
      ctx.stroke()
    }

    // Fanned twin strips in a V shape
    const drawFannedStrip = (
      x: number,
      y: number,
      sw: number,
      sh: number,
      angleDeg: number,
    ) => {
      ctx.save()
      ctx.translate(x + sw / 2, y + sh / 2)
      ctx.rotate((angleDeg * Math.PI) / 180)
      ctx.shadowColor = "rgba(0,0,0,0.5)"
      ctx.shadowBlur = w * 0.025
      ctx.shadowOffsetY = h * 0.015
      ctx.fillStyle = "#f5eee6"
      ctx.beginPath()
      ctx.roundRect(-sw / 2, -sh / 2, sw, sh, w * 0.012)
      ctx.fill()
      ctx.strokeStyle = "#decbc0"
      ctx.lineWidth = w * 0.002
      ctx.stroke()

      // Header & footer branding - Increased size and bold
      ctx.fillStyle = "#2a170e"
      ctx.font = `900 ${w * 0.042}px Georgia, serif`
      ctx.textAlign = "center"
      ctx.fillText("RETRO MEMORIES", 0, -sh / 2 + sh * 0.045)
      ctx.font = `bold ${w * 0.032}px 'Caveat', cursive`
      ctx.fillStyle = "#70381f"
      ctx.fillText("photobooth keepsake", 0, sh / 2 - sh * 0.025)
      ctx.restore()
    }

    drawFannedStrip(w * 0.09, h * 0.1, w * 0.42, h * 0.81, -3.5)
    drawFannedStrip(w * 0.49, h * 0.1, w * 0.42, h * 0.81, 3.5)

    // White delicate lace ribbon bow at top center
    const bx = w * 0.5,
      by = h * 0.11
    ctx.save()
    ctx.fillStyle = "rgba(255,255,255,0.92)"
    ctx.shadowColor = "rgba(0,0,0,0.3)"
    ctx.shadowBlur = w * 0.015
    // Bow center knot
    ctx.beginPath()
    ctx.ellipse(bx, by, w * 0.02, h * 0.012, 0, 0, Math.PI * 2)
    ctx.fill()
    // Left ribbon loop
    ctx.beginPath()
    ctx.ellipse(
      bx - w * 0.04,
      by - h * 0.008,
      w * 0.038,
      h * 0.02,
      -0.2,
      0,
      Math.PI * 2,
    )
    ctx.fill()
    // Right ribbon loop
    ctx.beginPath()
    ctx.ellipse(
      bx + w * 0.04,
      by - h * 0.008,
      w * 0.038,
      h * 0.02,
      0.2,
      0,
      Math.PI * 2,
    )
    ctx.fill()
    // Hanging ribbon tails
    ctx.beginPath()
    ctx.moveTo(bx - w * 0.01, by + h * 0.005)
    ctx.quadraticCurveTo(
      bx - w * 0.03,
      by + h * 0.04,
      bx - w * 0.05,
      by + h * 0.065,
    )
    ctx.lineTo(bx - w * 0.035, by + h * 0.065)
    ctx.quadraticCurveTo(bx - w * 0.02, by + h * 0.035, bx, by + h * 0.01)
    ctx.fill()
    ctx.beginPath()
    ctx.moveTo(bx + w * 0.01, by + h * 0.005)
    ctx.quadraticCurveTo(
      bx + w * 0.03,
      by + h * 0.04,
      bx + w * 0.05,
      by + h * 0.065,
    )
    ctx.lineTo(bx + w * 0.035, by + h * 0.065)
    ctx.quadraticCurveTo(bx + w * 0.02, by + h * 0.035, bx, by + h * 0.01)
    ctx.fill()
    ctx.restore()
  } else if (p === "K-Booth Starry Midnight") {
    // Starry midnight constellations
    for (let i = 0; i < 70; i++) {
      const sx = (((i * 223) % 1000) / 1000) * w
      const sy = (((i * 439) % 1000) / 1000) * h
      const r = i % 3 === 0 ? w * 0.003 : w * 0.0015
      ctx.fillStyle =
        i % 4 === 0 ? "rgba(56, 189, 248, 0.7)" : "rgba(255, 255, 255, 0.6)"
      ctx.beginPath()
      ctx.arc(sx, sy, r, 0, Math.PI * 2)
      ctx.fill()
    }
    // Twin ticket strips
    const drawTicketStrip = (x: number, y: number, sw: number, sh: number) => {
      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.4)"
      ctx.shadowBlur = w * 0.02
      ctx.fillStyle = "#ffffff"
      ctx.beginPath()
      ctx.roundRect(x, y, sw, sh, w * 0.012)
      ctx.fill()

      // Side punch-out notches
      ctx.fillStyle = "#0e1a2f"
      const notchR = w * 0.018
      for (const ny of [y + sh * 0.35, y + sh * 0.58]) {
        ctx.beginPath()
        ctx.arc(x, ny, notchR, -Math.PI / 2, Math.PI / 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x + sw, ny, notchR, Math.PI / 2, -Math.PI / 2)
        ctx.fill()
      }

      // Ticket header - Increased size and bold
      ctx.fillStyle = "#0c4a6e"
      ctx.font = `900 ${w * 0.038}px 'DM Sans', sans-serif`
      ctx.textAlign = "center"
      ctx.fillText("★ ADMIT ONE ★", x + sw / 2, y + sh * 0.05)
      ctx.font = `bold ${w * 0.028}px 'Caveat', cursive`
      ctx.fillStyle = "#0284c7"
      ctx.fillText("Couple Memories", x + sw / 2, y + sh * 0.085)

      // Barcode lines at bottom
      const barY = y + sh * 0.88
      const barH = sh * 0.055
      const barX = x + sw * 0.12
      const barW = sw * 0.76
      ctx.fillStyle = "#0f172a"
      for (let bx = 0; bx < barW; bx += w * 0.006) {
        const lineW = (bx * 7) % 3 === 0 ? w * 0.0035 : w * 0.0018
        ctx.fillRect(barX + bx, barY, lineW, barH)
      }
      ctx.font = `bold ${w * 0.024}px monospace`
      ctx.fillText("№ 2026-COUPLE-08", x + sw / 2, barY + barH + w * 0.025)
      ctx.restore()
    }
    drawTicketStrip(w * 0.08, h * 0.08, w * 0.41, h * 0.84)
    drawTicketStrip(w * 0.51, h * 0.08, w * 0.41, h * 0.84)
  } else if (p === "K-Booth Dark Plum Noir") {
    // Twin staggered monochrome ticket strips
    const drawPlumStrip = (
      x: number,
      y: number,
      sw: number,
      sh: number,
      label: string,
    ) => {
      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.4)"
      ctx.shadowBlur = w * 0.02
      ctx.fillStyle = "#f8fafc"
      ctx.beginPath()
      ctx.roundRect(x, y, sw, sh, w * 0.01)
      ctx.fill()

      // Ticket punch notches
      ctx.fillStyle = "#1c181e"
      const nr = w * 0.016
      ctx.beginPath()
      ctx.arc(x, y + sh * 0.48, nr, -Math.PI / 2, Math.PI / 2)
      ctx.fill()
      ctx.beginPath()
      ctx.arc(x + sw, y + sh * 0.48, nr, Math.PI / 2, -Math.PI / 2)
      ctx.fill()

      ctx.fillStyle = "#0f172a"
      ctx.font = `900 ${w * 0.038}px 'DM Sans', sans-serif`
      ctx.textAlign = "center"
      ctx.fillText(label, x + sw / 2, y + sh * 0.052)
      ctx.font = `bold ${w * 0.026}px monospace`
      ctx.fillStyle = "#475569"
      ctx.fillText("MOMENTS · ARCHIVE", x + sw / 2, y + sh * 0.96)
      ctx.restore()
    }
    drawPlumStrip(w * 0.07, h * 0.06, w * 0.42, h * 0.8, "BEST FRIENDS")
    drawPlumStrip(w * 0.51, h * 0.12, w * 0.42, h * 0.8, "FOREVER TOGETHER")
  } else if (p === "K-Booth Blush Noir") {
    // Soft blush background with fine fiber
    ctx.strokeStyle = "rgba(180, 120, 120, 0.05)"
    for (let y = 0; y < h; y += w * 0.02) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }
    // Twin matte noir strip card backings
    const drawBlushNoirStrip = (
      x: number,
      y: number,
      sw: number,
      sh: number,
    ) => {
      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.25)"
      ctx.shadowBlur = w * 0.02
      ctx.shadowOffsetY = h * 0.008
      ctx.fillStyle = "#1c1b1a"
      ctx.beginPath()
      ctx.roundRect(x, y, sw, sh, w * 0.01)
      ctx.fill()
      // Fine interior border
      ctx.strokeStyle = "rgba(255,255,255,0.18)"
      ctx.lineWidth = 1
      ctx.strokeRect(x + sw * 0.03, y + sh * 0.02, sw * 0.94, sh * 0.96)

      ctx.fillStyle = "#f5ebe6"
      ctx.font = `italic 700 ${w * 0.038}px 'Caveat', cursive`
      ctx.textAlign = "center"
      ctx.fillText("Forever Young · 2026", x + sw / 2, y + sh * 0.045)
      ctx.font = `900 ${w * 0.026}px 'DM Sans', sans-serif`
      ctx.fillStyle = "#ffffff"
      ctx.fillText("LITTLE MOMENTS", x + sw / 2, y + sh * 0.97)
      ctx.restore()
    }
    drawBlushNoirStrip(w * 0.09, h * 0.06, w * 0.4, h * 0.88)
    drawBlushNoirStrip(w * 0.51, h * 0.06, w * 0.4, h * 0.88)
  } else if (p === "K-Booth Olive Slat Shadow") {
    // Leather pebble grain
    for (let i = 0; i < 600; i++) {
      const px = (((i * 269) % 1000) / 1000) * w
      const py = (((i * 571) % 1000) / 1000) * h
      ctx.fillStyle = "rgba(0, 0, 0, 0.05)"
      ctx.fillRect(px, py, w * 0.004, w * 0.004)
    }
    // Off-white photostrip panel in center
    const sx = w * 0.27,
      sy = h * 0.05,
      sw = w * 0.46,
      sh = h * 0.9
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,0.35)"
    ctx.shadowBlur = w * 0.03
    ctx.shadowOffsetY = h * 0.01
    ctx.fillStyle = "#fcf9f2"
    ctx.beginPath()
    ctx.roundRect(sx, sy, sw, sh, w * 0.01)
    ctx.fill()
    ctx.fillStyle = "#1c1e17"
    ctx.font = `900 ${w * 0.038}px 'DM Sans', sans-serif`
    ctx.textAlign = "center"
    ctx.fillText("2026 · AUGUST", sx + sw / 2, sy + sh * 0.035)
    ctx.font = `bold ${w * 0.026}px monospace`
    ctx.fillStyle = "#57534e"
    ctx.fillText("LIFE FOUR CUTS", sx + sw / 2, sy + sh * 0.97)
    ctx.restore()

    // Diagonal window blind cast shadows across the whole canvas
    ctx.save()
    ctx.fillStyle = "rgba(0, 0, 0, 0.16)"
    for (let y = -w; y < h + w; y += w * 0.12) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y + w * 0.6)
      ctx.lineTo(w, y + w * 0.6 + w * 0.06)
      ctx.lineTo(0, y + w * 0.06)
      ctx.fill()
    }
    ctx.restore()
  } else if (p === "K-Booth Wood Slat Beam") {
    // Architectural wood slats
    const slatW = w * 0.04
    for (let x = 0; x < w; x += slatW) {
      ctx.fillStyle = "#1c140e"
      ctx.fillRect(x, 0, slatW - 2, h)
      ctx.fillStyle = "#2a1e16"
      ctx.fillRect(x + 2, 0, slatW - 6, h)
    }
    // Centered bone-white strip
    const sx = w * 0.27,
      sy = h * 0.05,
      sw = w * 0.46,
      sh = h * 0.9
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,0.5)"
    ctx.shadowBlur = w * 0.035
    ctx.fillStyle = "#f8f5ee"
    ctx.beginPath()
    ctx.roundRect(sx, sy, sw, sh, w * 0.01)
    ctx.fill()
    ctx.fillStyle = "#181411"
    ctx.font = `900 ${w * 0.038}px 'DM Sans', sans-serif`
    ctx.textAlign = "center"
    ctx.fillText("PORTRAIT · ARCHIVE", sx + sw / 2, sy + sh * 0.035)
    ctx.font = `bold italic ${w * 0.028}px Georgia, serif`
    ctx.fillStyle = "#3e3229"
    ctx.fillText("Authentic Studio Edition", sx + sw / 2, sy + sh * 0.97)
    ctx.restore()

    // Warm diagonal sunbeam ray
    ctx.save()
    const ray = ctx.createLinearGradient(0, 0, w, h)
    ray.addColorStop(0, "rgba(255, 235, 180, 0.25)")
    ray.addColorStop(0.5, "rgba(255, 235, 180, 0.12)")
    ray.addColorStop(1, "rgba(255, 235, 180, 0.0)")
    ctx.fillStyle = ray
    ctx.beginPath()
    ctx.moveTo(w * 0.1, 0)
    ctx.lineTo(w * 0.7, 0)
    ctx.lineTo(w, h * 0.8)
    ctx.lineTo(w * 0.4, h)
    ctx.fill()
    ctx.restore()
  } else if (p === "K-Booth Pink Croc Leather") {
    // Embossed crocodile leather pattern
    ctx.save()
    ctx.strokeStyle = "rgba(0,0,0,0.22)"
    ctx.lineWidth = w * 0.003
    const tileW = w * 0.08,
      tileH = h * 0.06
    for (let y = 0; y < h; y += tileH) {
      for (let x = 0; x < w; x += tileW) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.06)"
        ctx.beginPath()
        ctx.roundRect(x + 2, y + 2, tileW - 4, tileH - 4, w * 0.01)
        ctx.fill()
        ctx.stroke()
      }
    }
    ctx.restore()

    // Stamp backing frame
    if (
      c.photos.length <= 1 &&
      (!c.templateId || c.templateId.includes("09"))
    ) {
      // Giant postage stamp frame (Template 9)
      const sx = w * 0.13,
        sy = h * 0.11,
        sw = w * 0.74,
        sh = h * 0.74
      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.3)"
      ctx.shadowBlur = w * 0.03
      ctx.fillStyle = "#fffdfa"
      ctx.fillRect(sx, sy, sw, sh)
      ctx.fillStyle = c.background
      const pr = w * 0.012
      for (let x = sx; x <= sx + sw; x += w * 0.03) {
        ctx.beginPath()
        ctx.arc(x, sy, pr, 0, Math.PI)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, sy + sh, pr, Math.PI, 0)
        ctx.fill()
      }
      for (let y = sy; y <= sy + sh; y += h * 0.03) {
        ctx.beginPath()
        ctx.arc(sx, y, pr, -Math.PI / 2, Math.PI / 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(sx + sw, y, pr, Math.PI / 2, -Math.PI / 2)
        ctx.fill()
      }
      // Top and bottom bold stamp text
      ctx.fillStyle = "#be123c"
      ctx.font = `900 ${w * 0.040}px 'DM Sans', sans-serif`
      ctx.textAlign = "center"
      ctx.fillText("AIR MAIL · OFFICIAL POSTAGE", sx + sw / 2, sy + sh * 0.045)
      ctx.font = `bold ${w * 0.032}px monospace`
      ctx.fillStyle = "#9f1239"
      ctx.fillText("SEOUL · 2026 · № 09-SOLO", sx + sw / 2, sy + sh * 0.965)
      ctx.restore()
    } else {
      // 3-Cut stamp strip (Template 8)
      const sx = w * 0.23,
        sy = h * 0.07,
        sw = w * 0.54,
        sh = h * 0.86
      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.3)"
      ctx.shadowBlur = w * 0.03
      ctx.fillStyle = "#fffdfa"
      ctx.fillRect(sx, sy, sw, sh)
      ctx.fillStyle = c.background
      const pr = w * 0.012
      for (let x = sx; x <= sx + sw; x += w * 0.03) {
        ctx.beginPath()
        ctx.arc(x, sy, pr, 0, Math.PI)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x, sy + sh, pr, Math.PI, 0)
        ctx.fill()
      }
      for (let y = sy; y <= sy + sh; y += h * 0.03) {
        ctx.beginPath()
        ctx.arc(sx, y, pr, -Math.PI / 2, Math.PI / 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(sx + sw, y, pr, Math.PI / 2, -Math.PI / 2)
        ctx.fill()
      }
      // Cute pink polka dots border
      ctx.fillStyle = "#f472b6"
      for (let y = sy + h * 0.03; y < sy + sh - h * 0.03; y += h * 0.02) {
        ctx.beginPath()
        ctx.arc(sx + sw * 0.04, y, w * 0.003, 0, Math.PI * 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(sx + sw * 0.96, y, w * 0.003, 0, Math.PI * 2)
        ctx.fill()
      }
      // Bold stamp strip header and footer
      ctx.fillStyle = "#be123c"
      ctx.font = `900 ${w * 0.036}px 'DM Sans', sans-serif`
      ctx.textAlign = "center"
      ctx.fillText("★ POSTAGE STAMP · 2026 ★", sx + sw / 2, sy + sh * 0.035)
      ctx.font = `bold italic ${w * 0.028}px 'Caveat', cursive`
      ctx.fillStyle = "#9f1239"
      ctx.fillText("little moments · air mail", sx + sw / 2, sy + sh * 0.97)
      ctx.restore()
    }
  } else if (p === "K-Booth Vintage Parchment") {
    // Parchment texture flecks (Template 10 Moodboard)
    for (let i = 0; i < 400; i++) {
      const px = (((i * 197) % 1000) / 1000) * w
      const py = (((i * 431) % 1000) / 1000) * h
      ctx.fillStyle = "rgba(100, 70, 40, 0.04)"
      ctx.fillRect(px, py, w * 0.006, h * 0.004)
    }
    // Prominent bold vintage moodboard labels
    ctx.save()
    ctx.fillStyle = "#451a03"
    ctx.font = `italic 700 ${w * 0.046}px 'Playfair Display', Georgia, serif`
    ctx.textAlign = "center"
    ctx.fillText("Memories & Stories", w * 0.5, h * 0.045)
    ctx.font = `bold ${w * 0.028}px monospace`
    ctx.fillStyle = "#78350f"
    ctx.fillText("VINTAGE MOODBOARD · PHOTOBOOTH 2026", w * 0.5, h * 0.965)
    ctx.restore()
  } else if (p === "K-Booth Kraft Scrapbook") {
    // Kraft cardboard fiber (Template 11)
    ctx.strokeStyle = "rgba(0,0,0,0.06)"
    for (let i = 0; i < 200; i++) {
      const px = (((i * 311) % 1000) / 1000) * w
      const py = (((i * 617) % 1000) / 1000) * h
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + w * 0.015, py + ((i % 3) - 1))
      ctx.stroke()
    }
    // Prominent bold handcrafted kraft scrapbook labels
    ctx.save()
    ctx.fillStyle = "#fef3c7"
    ctx.font = `italic 700 ${w * 0.050}px 'Caveat', cursive`
    ctx.textAlign = "center"
    ctx.fillText("Our Story & Good Times ✦", w * 0.5, h * 0.045)
    ctx.font = `900 ${w * 0.028}px 'DM Sans', sans-serif`
    ctx.fillStyle = "#fde68a"
    ctx.fillText("KRAFT SCRAPBOOK · 2026 ARCHIVE", w * 0.5, h * 0.965)
    ctx.restore()
  } else if (p === "K-Booth Purple Cinema Night") {
    // Deep royal purple cinema background (Template 12)
    const drawCinemaStrip = (
      x: number,
      y: number,
      sw: number,
      sh: number,
    ) => {
      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.4)"
      ctx.shadowBlur = w * 0.025
      ctx.fillStyle = "#faf4eb"
      ctx.beginPath()
      ctx.roundRect(x, y, sw, sh, w * 0.012)
      ctx.fill()

      // Ticket punch notches
      ctx.fillStyle = "#211029"
      const nr = w * 0.018
      for (const ny of [y + sh * 0.38, y + sh * 0.62]) {
        ctx.beginPath()
        ctx.arc(x, ny, nr, -Math.PI / 2, Math.PI / 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(x + sw, ny, nr, Math.PI / 2, -Math.PI / 2)
        ctx.fill()
      }

      // Title banner - Increased size and bold
      ctx.fillStyle = "#3b0764"
      ctx.font = `italic 700 ${w * 0.052}px 'Caveat', cursive`
      ctx.textAlign = "center"
      ctx.fillText("Night Movie", x + sw / 2, y + sh * 0.065)
      ctx.font = `bold ${w * 0.026}px monospace`
      ctx.fillStyle = "#6b21a8"
      ctx.fillText("CINEMA TICKETS · ROW A", x + sw / 2, y + sh * 0.10)

      // Barcode footer - Increased size and bold
      const barY = y + sh * 0.88,
        barH = sh * 0.05,
        barX = x + sw * 0.12,
        barW = sw * 0.76
      ctx.fillStyle = "#1e1b4b"
      for (let bx = 0; bx < barW; bx += w * 0.006) {
        const lineW = (bx * 9) % 4 === 0 ? w * 0.004 : w * 0.0018
        ctx.fillRect(barX + bx, barY, lineW, barH)
      }
      ctx.font = `bold ${w * 0.024}px monospace`
      ctx.fillText("* 0 8 2 4 9 9 1 2 *", x + sw / 2, barY + barH + w * 0.022)
      ctx.restore()
    }
    drawCinemaStrip(w * 0.07, h * 0.08, w * 0.42, h * 0.84)
    drawCinemaStrip(w * 0.51, h * 0.08, w * 0.42, h * 0.84)
  } else if (p === "K-Booth Cream & Maroon Bookmark") {
    // Rich deep maroon background (Template 13)
    ctx.fillStyle = "#42131b"
    ctx.fillRect(0, 0, w, h)

    // Inner Bookmark Card: Warm Ivory/Cream with rounded corners
    const bx = w * 0.08, by = h * 0.035, bw = w * 0.84, bh = h * 0.93, br = w * 0.04
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,0.4)"
    ctx.shadowBlur = w * 0.03
    ctx.shadowOffsetY = h * 0.01
    ctx.fillStyle = "#faf7f0"
    ctx.beginPath()
    ctx.roundRect(bx, by, bw, bh, br)
    ctx.fill()

    // Fine inner maroon double border with matching corner notches
    ctx.strokeStyle = "#42131b"
    ctx.lineWidth = Math.max(1, w * 0.003)
    const inset = w * 0.025
    ctx.beginPath()
    ctx.roundRect(bx + inset, by + inset, bw - inset * 2, bh - inset * 2, br * 0.6)
    ctx.stroke()
    ctx.restore()

    // Calligraphy Header: "Photograph" in rich maroon - Extra bold and prominent
    ctx.save()
    ctx.fillStyle = "#42131b"
    ctx.font = `italic 700 ${w * 0.088}px 'Playfair Display', Georgia, serif`
    ctx.textAlign = "center"
    ctx.fillText("Photograph", w * 0.5, h * 0.115)

    // 5 Gold Stars ★★★★★
    ctx.fillStyle = "#f59e0b"
    ctx.font = `900 ${w * 0.045}px 'DM Sans', sans-serif`
    ctx.fillText("★ ★ ★ ★ ★", w * 0.5, h * 0.155)

    // Photo Cut Framing Borders (fine maroon stroke around each of the 4 slots)
    ctx.strokeStyle = "#42131b"
    ctx.lineWidth = Math.max(1, w * 0.003)
    const slotYs = [h * 0.188, h * 0.350, h * 0.512, h * 0.674]
    const slotW = w * 0.69, slotH = h * 0.148, slotX = w * 0.155
    for (const sy of slotYs) {
      ctx.strokeRect(slotX - 1, sy - 1, slotW + 2, slotH + 2)
    }

    // Admission Ticket Table at bottom
    const ty = h * 0.845, th = h * 0.055, tx = w * 0.12, tw = w * 0.76
    ctx.strokeStyle = "#42131b"
    ctx.lineWidth = Math.max(1, w * 0.002)
    ctx.strokeRect(tx, ty, tw, th)

    // Inner dividing lines
    const col1W = tw * 0.44, col2W = tw * 0.28
    ctx.beginPath()
    ctx.moveTo(tx + col1W, ty)
    ctx.lineTo(tx + col1W, ty + th)
    ctx.moveTo(tx + col1W + col2W, ty)
    ctx.lineTo(tx + col1W + col2W, ty + th)
    // Horizontal row divider inside column 1, 2, 3
    ctx.moveTo(tx, ty + th * 0.45)
    ctx.lineTo(tx + tw, ty + th * 0.45)
    ctx.stroke()

    // Table labels & values - cleanly proportioned and bold
    ctx.fillStyle = "#42131b"
    ctx.font = `700 ${w * 0.024}px 'DM Sans', sans-serif`
    ctx.textAlign = "center"
    // Col 1: Date & Time
    ctx.fillText("Sunday, 3 May 2047", tx + col1W / 2, ty + th * 0.34)
    ctx.font = `900 ${w * 0.040}px 'DM Sans', sans-serif`
    ctx.fillText("20.00", tx + col1W / 2, ty + th * 0.84)

    // Col 2: Row A
    ctx.font = `700 ${w * 0.024}px 'DM Sans', sans-serif`
    ctx.fillText("Row", tx + col1W + col2W / 2, ty + th * 0.34)
    ctx.font = `900 ${w * 0.040}px 'DM Sans', sans-serif`
    ctx.fillText("A", tx + col1W + col2W / 2, ty + th * 0.84)

    // Col 3: Seat 15
    const col3W = tw - col1W - col2W
    ctx.font = `700 ${w * 0.024}px 'DM Sans', sans-serif`
    ctx.fillText("Seat", tx + col1W + col2W + col3W / 2, ty + th * 0.34)
    ctx.font = `900 ${w * 0.040}px 'DM Sans', sans-serif`
    ctx.fillText("15", tx + col1W + col2W + col3W / 2, ty + th * 0.84)

    // Elegant bottom caption - cleanly sized
    ctx.font = `italic 700 ${w * 0.044}px Georgia, serif`
    ctx.fillText("Enjoy the moment", w * 0.5, h * 0.935)
    ctx.restore()
  } else if (p === "K-Booth Denim & Lace Y2K") {
    // Rich textured denim blue background (Template 14)
    ctx.fillStyle = "#3e5c7d"
    ctx.fillRect(0, 0, w, h)

    // Denim fabric diagonal weave pattern
    ctx.save()
    ctx.strokeStyle = "rgba(255, 255, 255, 0.07)"
    ctx.lineWidth = 1
    for (let x = -h; x < w + h; x += w * 0.012) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + h, h)
      ctx.stroke()
    }
    ctx.strokeStyle = "rgba(0, 0, 0, 0.12)"
    for (let x = w + h; x > -h; x -= w * 0.012) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x - h, h)
      ctx.stroke()
    }

    // Vertical center divider: Double crisp white pinstripe
    ctx.strokeStyle = "rgba(255, 255, 255, 0.85)"
    ctx.lineWidth = Math.max(1, w * 0.002)
    ctx.beginPath()
    ctx.moveTo(w * 0.495, 0)
    ctx.lineTo(w * 0.495, h)
    ctx.moveTo(w * 0.505, 0)
    ctx.lineTo(w * 0.505, h)
    ctx.stroke()

    // LEFT STRIP: Vertical White Lace Crochet Trim & Ribbon Bows
    const laceX = w * 0.03
    ctx.fillStyle = "rgba(255, 255, 255, 0.92)"
    // Scalloped lace edge
    for (let ly = h * 0.02; ly < h * 0.98; ly += h * 0.03) {
      ctx.beginPath()
      ctx.arc(laceX, ly, w * 0.022, -Math.PI / 2, Math.PI / 2)
      ctx.fill()
      // Lace eyelet hole
      ctx.fillStyle = "#3e5c7d"
      ctx.beginPath()
      ctx.arc(laceX - w * 0.004, ly, w * 0.006, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = "rgba(255, 255, 255, 0.92)"
    }

    // Cute denim string bows tied along the lace
    const bowYs = [h * 0.06, h * 0.28, h * 0.52, h * 0.76, h * 0.94]
    for (const by of bowYs) {
      ctx.strokeStyle = "#94a3b8"
      ctx.lineWidth = Math.max(1, w * 0.0025)
      ctx.beginPath()
      ctx.ellipse(laceX + w * 0.005, by, w * 0.016, h * 0.008, 0.2, 0, Math.PI * 2)
      ctx.ellipse(laceX - w * 0.005, by, w * 0.016, h * 0.008, -0.2, 0, Math.PI * 2)
      ctx.stroke()
    }

    // 4 Y2K Browser Window Frames on Left Strip
    const winSlots = [
      { y: h * 0.072, h: h * 0.165 },
      { y: h * 0.306, h: h * 0.165 },
      { y: h * 0.540, h: h * 0.165 },
      { y: h * 0.774, h: h * 0.165 },
    ]
    const winX = w * 0.105, winW = w * 0.35, barH = h * 0.024
    for (const ws of winSlots) {
      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.3)"
      ctx.shadowBlur = w * 0.015
      // Title bar
      ctx.fillStyle = "#e2e8f0"
      ctx.beginPath()
      ctx.roundRect(winX, ws.y - barH, winW, barH + 2, [w * 0.008, w * 0.008, 0, 0])
      ctx.fill()
      // Title bar 3 dots
      ctx.fillStyle = "#94a3b8"
      for (let d = 0; d < 3; d++) {
        ctx.beginPath()
        ctx.arc(winX + w * 0.018 + d * w * 0.014, ws.y - barH / 2, w * 0.004, 0, Math.PI * 2)
        ctx.fill()
      }
      // Browser tab title - Increased size and bold
      ctx.fillStyle = "#cbd5e1"
      ctx.fillRect(winX + w * 0.07, ws.y - barH + 3, winW * 0.45, barH - 3)
      ctx.fillStyle = "#334155"
      ctx.font = `bold ${w * 0.024}px 'DM Sans', sans-serif`
      ctx.fillText("besties.html", winX + w * 0.18, ws.y - barH * 0.25)

      // Window border
      ctx.strokeStyle = "#cbd5e1"
      ctx.lineWidth = Math.max(1, w * 0.002)
      ctx.strokeRect(winX, ws.y, winW, ws.h)
      // Cherry sticker on top right of browser window
      ctx.font = `${w * 0.028}px sans-serif`
      ctx.fillText("🍒", winX + winW - w * 0.02, ws.y - barH * 0.2)
      ctx.restore()
    }

    // RIGHT STRIP: 3 Giant Scalloped Postage Stamp Frames & Denim Stars
    const stampSlots = [
      { y: h * 0.080, h: h * 0.215 },
      { y: h * 0.365, h: h * 0.215 },
      { y: h * 0.650, h: h * 0.215 },
    ]
    const stX = w * 0.585, stW = w * 0.355, stPad = w * 0.028
    for (const ss of stampSlots) {
      const sx = stX - stPad, sy = ss.y - stPad, sw = stW + stPad * 2, sh = ss.h + stPad * 2
      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.35)"
      ctx.shadowBlur = w * 0.02
      ctx.fillStyle = "#f8f5ee"
      ctx.fillRect(sx, sy, sw, sh)

      // Scalloped perforation notches around stamp edges
      ctx.fillStyle = "#3e5c7d"
      const pr = w * 0.009
      for (let px = sx; px <= sx + sw; px += w * 0.024) {
        ctx.beginPath()
        ctx.arc(px, sy, pr, 0, Math.PI)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(px, sy + sh, pr, Math.PI, 0)
        ctx.fill()
      }
      for (let py = sy; py <= sy + sh; py += h * 0.02) {
        ctx.beginPath()
        ctx.arc(sx, py, pr, -Math.PI / 2, Math.PI / 2)
        ctx.fill()
        ctx.beginPath()
        ctx.arc(sx + sw, py, pr, Math.PI / 2, -Math.PI / 2)
        ctx.fill()
      }
      ctx.restore()
    }

    // Stitched Denim Star Patches on Right Strip
    const drawDenimStar = (cx: number, cy: number, r: number) => {
      ctx.save()
      ctx.shadowColor = "rgba(0,0,0,0.3)"
      ctx.shadowBlur = w * 0.015
      ctx.fillStyle = "#2d4866"
      ctx.beginPath()
      for (let i = 0; i < 5; i++) {
        const outerA = ((i * 72 - 90) * Math.PI) / 180
        const innerA = ((i * 72 + 36 - 90) * Math.PI) / 180
        if (i === 0) ctx.moveTo(cx + r * Math.cos(outerA), cy + r * Math.sin(outerA))
        else ctx.lineTo(cx + r * Math.cos(outerA), cy + r * Math.sin(outerA))
        ctx.lineTo(cx + (r * 0.45) * Math.cos(innerA), cy + (r * 0.45) * Math.sin(innerA))
      }
      ctx.closePath()
      ctx.fill()
      // Dashed white perimeter stitching
      ctx.setLineDash([3, 3])
      ctx.strokeStyle = "rgba(255,255,255,0.75)"
      ctx.lineWidth = 1.5
      ctx.stroke()
      ctx.restore()
    }
    drawDenimStar(w * 0.93, h * 0.065, w * 0.055)
    drawDenimStar(w * 0.57, h * 0.355, w * 0.065)
    drawDenimStar(w * 0.94, h * 0.635, w * 0.055)

    // Golden 4-point sparkle stars
    const drawSparkle = (sx: number, sy: number, sz: number) => {
      ctx.save()
      ctx.fillStyle = "#facc15"
      ctx.beginPath()
      ctx.moveTo(sx, sy - sz)
      ctx.quadraticCurveTo(sx, sy, sx + sz, sy)
      ctx.quadraticCurveTo(sx, sy, sx, sy + sz)
      ctx.quadraticCurveTo(sx, sy, sx - sz, sy)
      ctx.quadraticCurveTo(sx, sy, sx, sy - sz)
      ctx.fill()
      ctx.restore()
    }
    drawSparkle(w * 0.54, h * 0.22, w * 0.015)
    drawSparkle(w * 0.96, h * 0.30, w * 0.015)
    drawSparkle(w * 0.54, h * 0.59, w * 0.015)
    drawSparkle(w * 0.96, h * 0.84, w * 0.015)

    // Right Strip Header - Increased size and bold
    ctx.save()
    ctx.fillStyle = "#ffffff"
    ctx.font = `900 ${w * 0.040}px 'DM Sans', sans-serif`
    ctx.textAlign = "center"
    ctx.fillText("★ BEST FRIENDS ★", w * 0.76, h * 0.045)

    // Bold Slab Serif Footer: "Cool" - Extra large & bold
    ctx.font = `900 ${w * 0.11}px 'Clash Display', 'DM Serif Display', Georgia, serif`
    ctx.fillText("Cool", w * 0.77, h * 0.945)
    ctx.restore()
    ctx.restore()
  } else if (p === "K-Booth Retro 70s Groovy") {
    // Rich chocolate backdrop (Template 15)
    ctx.fillStyle = "#23150d"
    ctx.fillRect(0, 0, w, h)

    // Vertical dashed perforation line down center
    ctx.save()
    ctx.setLineDash([6, 6])
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)"
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.moveTo(w * 0.5, 0)
    ctx.lineTo(w * 0.5, h)
    ctx.stroke()
    ctx.restore()

    // LEFT STRIP: Sage Olive Green Panel
    const lx = w * 0.035, ly = h * 0.02, lw = w * 0.44, lh = h * 0.96, lr = w * 0.025
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,0.4)"
    ctx.shadowBlur = w * 0.025
    ctx.fillStyle = "#5c6b48"
    ctx.beginPath()
    ctx.roundRect(lx, ly, lw, lh, lr)
    ctx.fill()

    // Scalloped fluffy cream clouds at top and bottom of left strip
    ctx.fillStyle = "#faf6ea"
    for (let cx = lx + w * 0.04; cx < lx + lw; cx += w * 0.08) {
      ctx.beginPath()
      ctx.arc(cx, ly + h * 0.04, w * 0.05, 0, Math.PI * 2)
      ctx.fill()
    }
    for (let cx = lx + w * 0.04; cx < lx + lw; cx += w * 0.08) {
      ctx.beginPath()
      ctx.arc(cx, ly + lh - h * 0.03, w * 0.05, 0, Math.PI * 2)
      ctx.fill()
    }

    // Top Bubble Header: "Groovy Days" with red sunglasses - Increased size & extra bold
    ctx.fillStyle = "#faf6ea"
    ctx.shadowColor = "rgba(0,0,0,0.3)"
    ctx.shadowBlur = w * 0.01
    ctx.font = `italic 900 ${w * 0.062}px 'Cooper Black', 'Caveat', cursive, serif`
    ctx.textAlign = "center"
    ctx.fillText("Groovy Days", lx + lw / 2, ly + h * 0.075)

    // Retro Red Sunglasses Sticker at header
    ctx.font = `${w * 0.040}px sans-serif`
    ctx.fillText("🕶️", lx + lw / 2, ly + h * 0.038)

    // Photo Frames White Borders on Left
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = Math.max(2, w * 0.004)
    for (const sy of [h * 0.135, h * 0.395, h * 0.655]) {
      ctx.strokeRect(w * 0.065 - 1, sy - 1, w * 0.385 + 2, h * 0.225 + 2)
    }

    // Left Funky 70s Stickers: Rainbow, Tongue, Daisies, Butterfly
    ctx.font = `${w * 0.036}px sans-serif`
    ctx.fillText("🌈", lx + w * 0.04, h * 0.375)
    ctx.fillText("👅", lx + lw - w * 0.04, h * 0.375)
    ctx.fillText("🌼", lx + w * 0.04, h * 0.635)
    ctx.fillText("🦋", lx + lw - w * 0.04, h * 0.635)

    // Left Bottom Caption - Increased size & extra bold
    ctx.fillStyle = "#faf6ea"
    ctx.font = `900 ${w * 0.038}px Georgia, serif`
    ctx.fillText("Good Friends", lx + lw / 2, ly + lh - h * 0.045)
    ctx.fillText("Good Times", lx + lw / 2, ly + lh - h * 0.02)
    ctx.restore()

    // RIGHT STRIP: Mocha Chocolate Brown Panel
    const rx = w * 0.525, ry = h * 0.02, rw = w * 0.44, rh = h * 0.96, rr = w * 0.025
    ctx.save()
    ctx.shadowColor = "rgba(0,0,0,0.4)"
    ctx.shadowBlur = w * 0.025
    ctx.fillStyle = "#422617"
    ctx.beginPath()
    ctx.roundRect(rx, ry, rw, rh, rr)
    ctx.fill()

    // Subtle bohemian star print across brown background
    ctx.fillStyle = "rgba(255, 230, 200, 0.06)"
    for (let y = ry + h * 0.05; y < ry + rh; y += h * 0.08) {
      for (let x = rx + w * 0.03; x < rx + rw; x += w * 0.08) {
        ctx.beginPath()
        ctx.arc(x, y, w * 0.005, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Top Header: 70s Puffy Bubble "GROOVY BABY" - Increased size & extra bold
    ctx.fillStyle = "#fca5a5"
    ctx.shadowColor = "#e11d48"
    ctx.shadowBlur = w * 0.008
    ctx.font = `900 ${w * 0.060}px 'Cooper Black', 'Caveat', cursive, sans-serif`
    ctx.textAlign = "center"
    ctx.fillText("GROOVY", rx + rw / 2, ry + h * 0.055)
    ctx.fillStyle = "#fb923c"
    ctx.fillText("BABY", rx + rw / 2, ry + h * 0.095)

    // Daisies around header
    ctx.font = `${w * 0.028}px sans-serif`
    ctx.fillText("🌸", rx + w * 0.05, ry + h * 0.05)
    ctx.fillText("🌼", rx + rw - w * 0.05, ry + h * 0.05)
    ctx.fillText("🌸", rx + w * 0.07, ry + h * 0.10)
    ctx.fillText("🌼", rx + rw - w * 0.07, ry + h * 0.10)

    // Photo Frames White Borders on Right
    ctx.strokeStyle = "#ffffff"
    ctx.lineWidth = Math.max(2, w * 0.004)
    for (const sy of [h * 0.135, h * 0.395, h * 0.655]) {
      ctx.strokeRect(w * 0.550 - 1, sy - 1, w * 0.385 + 2, h * 0.225 + 2)
    }

    // Right Funky 70s Stickers: Balloon Dogs, Mushrooms, Flowers
    ctx.font = `${w * 0.036}px sans-serif`
    ctx.fillText("🌼", rx + w * 0.04, h * 0.375)
    ctx.fillText("🎈", rx + rw - w * 0.04, h * 0.375)
    ctx.fillText("🍄", rx + w * 0.04, h * 0.835)
    ctx.fillText("🎀", rx + rw - w * 0.04, h * 0.875)

    // Right Bottom Caption - Increased size & extra bold
    ctx.fillStyle = "#faf6ea"
    ctx.font = `900 ${w * 0.038}px Georgia, serif`
    ctx.fillText("Good Friends", rx + rw / 2, ry + rh - h * 0.045)
    ctx.fillText("Good Times", rx + rw / 2, ry + rh - h * 0.02)
    ctx.restore()
  }

  ctx.restore()
}

function drawPurikuraPattern(
  ctx: CanvasRenderingContext2D,
  p: string,
  w: number,
  h: number,
  c: Composition,
) {
  ctx.save()

  if (p === "Purikura Shibuya Sparkle") {
    // Cotton candy diagonal pastel bands
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, "#fdf2f8")
    grad.addColorStop(0.3, "#fce7f3")
    grad.addColorStop(0.7, "#f3e8ff")
    grad.addColorStop(1, "#fdf4ff")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Diagonal candy pinstripes
    ctx.strokeStyle = "rgba(244, 63, 94, 0.08)"
    ctx.lineWidth = w * 0.015
    for (let x = -h; x < w + h; x += w * 0.08) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x + h, h)
      ctx.stroke()
    }

    // Sparkle star bursts & hearts in margins
    ctx.fillStyle = "rgba(244, 63, 94, 0.45)"
    const starCoords = [
      [0.05, 0.03],
      [0.95, 0.03],
      [0.05, 0.25],
      [0.95, 0.25],
      [0.05, 0.47],
      [0.95, 0.47],
      [0.05, 0.69],
      [0.95, 0.69],
      [0.15, 0.95],
      [0.85, 0.95],
      [0.5, 0.02],
      [0.5, 0.97],
    ]
    for (const [sx, sy] of starCoords) {
      const cx = sx * w
      const cy = sy * h
      const r = w * 0.022
      ctx.beginPath()
      ctx.moveTo(cx, cy - r)
      ctx.quadraticCurveTo(cx, cy, cx + r, cy)
      ctx.quadraticCurveTo(cx, cy, cx, cy + r)
      ctx.quadraticCurveTo(cx, cy, cx - r, cy)
      ctx.quadraticCurveTo(cx, cy, cx, cy - r)
      ctx.fill()
    }
  } else if (p === "Purikura Harajuku Hologram") {
    // Iridescent lavender, sky, and soft lemon shimmer gradient
    const grad = ctx.createLinearGradient(0, 0, w, h)
    grad.addColorStop(0, "#f3e8ff")
    grad.addColorStop(0.25, "#e0e7ff")
    grad.addColorStop(0.5, "#dbeafe")
    grad.addColorStop(0.75, "#fce7f3")
    grad.addColorStop(1, "#fef9c3")
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)

    // Holographic shimmer rings
    ctx.strokeStyle = "rgba(168, 85, 247, 0.12)"
    ctx.lineWidth = w * 0.004
    for (let i = 1; i <= 8; i++) {
      ctx.beginPath()
      ctx.arc(w * 0.5, h * 0.5, w * 0.15 * i, 0, Math.PI * 2)
      ctx.stroke()
    }

    // Twinkles
    ctx.fillStyle = "rgba(168, 85, 247, 0.35)"
    for (let i = 0; i < 24; i++) {
      const tx = (((i * 137) % 100) / 100) * w
      const ty = (((i * 241) % 100) / 100) * h
      ctx.beginPath()
      ctx.arc(tx, ty, w * 0.008, 0, Math.PI * 2)
      ctx.fill()
    }
  } else if (p === "Purikura Neon Arcade") {
    // Dark neon arcade background with electric cyan/magenta glow grid
    ctx.fillStyle = "#18181b"
    ctx.fillRect(0, 0, w, h)

    // Neon grid
    const step = w / 20
    ctx.strokeStyle = "rgba(16, 185, 129, 0.18)"
    ctx.lineWidth = w * 0.002
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, h)
      ctx.stroke()
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(w, y)
      ctx.stroke()
    }

    // Neon gel pen doodle accents in corners
    ctx.strokeStyle = "rgba(244, 63, 94, 0.6)"
    ctx.lineWidth = w * 0.006
    ctx.beginPath()
    ctx.moveTo(w * 0.03, h * 0.02)
    ctx.quadraticCurveTo(w * 0.06, h * 0.04, w * 0.03, h * 0.06)
    ctx.stroke()

    // Bottom-right neon star
    ctx.strokeStyle = "rgba(56, 189, 248, 0.7)"
    const cx = w * 0.95
    const cy = h * 0.97
    const r = w * 0.025
    ctx.beginPath()
    ctx.moveTo(cx, cy - r)
    ctx.lineTo(cx, cy + r)
    ctx.moveTo(cx - r, cy)
    ctx.lineTo(cx + r, cy)
    ctx.stroke()
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

  if (p.startsWith("Purikura")) {
    drawPurikuraPattern(ctx, p, w, h, c)
    return
  }

  if (p.startsWith("K-Booth")) {
    drawKBoothPattern(ctx, p, w, h, c)
    return
  }

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
    if (p === "Grass lawn" || p === "Summer grass") {
      ctx.fillStyle = "#3e7927"
      ctx.fillRect(0, 0, w, h)
      ctx.strokeStyle = "#4ea335"
      ctx.lineWidth = Math.max(1.2, w / 700)
      for (let y = 0; y < h; y += step * 0.7) {
        for (let x = 0; x < w; x += step * 0.6) {
          const blade = step * 0.8
          ctx.beginPath()
          ctx.moveTo(x, y + blade)
          ctx.quadraticCurveTo(x + ((x + y) % 2 ? 3 : -3), y, x + ((x * y) % 3 ? 5 : -4), y - blade * 0.3)
          ctx.stroke()
        }
      }
    }
    if (p === "Checkerboard") {
      ctx.fillStyle = "rgba(0,0,0,0.06)"
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          if ((Math.floor(x / step) + Math.floor(y / step)) % 2 === 0) {
            ctx.fillRect(x, y, step, step)
          }
        }
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

  // Render empty slot placeholders if the composition has fewer photos than template slots
  const totalSlots = c.gridLayoutId
    ? (findGridLayout(c.gridLayoutId)?.count ?? t.count ?? t.slots?.length ?? 4)
    : (t.slots?.length || t.count || 4)
  if (c.photos.length < totalSlots) {
    for (let slotIdx = c.photos.length; slotIdx < totalSlots; slotIdx++) {
      const b = photoBounds(c, t, slotIdx),
        w = b.width * sx,
        h = b.height * sy
      ctx.save()
      ctx.translate((b.x + b.width / 2) * sx, (b.y + b.height / 2) * sy)
      ctx.rotate((b.rotation * Math.PI) / 180)
      const rad = Math.min(c.radius * sx * 0.12, w / 2, h / 2)
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)"
      ctx.beginPath()
      ctx.roundRect(-w / 2, -h / 2, w, h, Math.max(2, rad))
      ctx.fill()
      ctx.setLineDash([Math.max(4, 5 * scale), Math.max(4, 5 * scale)])
      ctx.strokeStyle = "rgba(40, 40, 40, 0.4)"
      ctx.lineWidth = Math.max(1.5, 2 * scale)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.fillStyle = "rgba(40, 40, 40, 0.6)"
      ctx.font = `bold ${Math.max(12, w * 0.08)}px monospace`
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText(`+ PHOTO ${slotIdx + 1}`, 0, 0)
      ctx.restore()
    }
  }

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
        const ft = c.frameTransform ?? {
          x: 0,
          y: 0,
          width: 100,
          height: 100,
          rotation: 0,
        }
        const fw = ft.width * sx,
          fh = ft.height * sy
        ctx.translate((ft.x + ft.width / 2) * sx, (ft.y + ft.height / 2) * sy)
        ctx.rotate((ft.rotation * Math.PI) / 180)
        ctx.drawImage(image, -fw / 2, -fh / 2, fw, fh)
      }
    } else if (layer.kind === "sticker") {
      const s = c.stickers.find((s) => s.id === layer.id)!
      ctx.translate(s.x * sx, s.y * sy)
      ctx.rotate((s.rotation * Math.PI) / 180)
      if (s.flipX) ctx.scale(-1, 1)
      const asset = findSticker(s.assetId ?? "") ?? stickers.find((a) => a.id === s.assetId)
      const srcToLoad = s.src ?? (asset ? stickerUrl(asset, s.color) : "")
      if (srcToLoad) {
        const image = await loadImage(srcToLoad)
        const nw = image.naturalWidth || image.width || 1
        const nh = image.naturalHeight || image.height || 1
        const aspect = nw / nh
        const drawW = aspect >= 1 ? s.size * sx : (s.size * sx) * aspect
        const drawH = aspect >= 1 ? (s.size * sx) / aspect : s.size * sx
        ctx.drawImage(
          image,
          -drawW / 2,
          -drawH / 2,
          drawW,
          drawH,
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
