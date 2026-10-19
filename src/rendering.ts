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

      // Header text "HAPPY BIRTHDAY"
      ctx.save()
      ctx.fillStyle = "#1e1b24"
      ctx.font = `bold ${w * 0.022}px 'DM Sans', sans-serif`
      ctx.textAlign = "center"
      ctx.fillText("✦ HAPPY BIRTHDAY ✦", x + sw / 2, y + sh * 0.04)
      ctx.font = `italic ${w * 0.016}px 'Caveat', cursive`
      ctx.fillStyle = "#8b5cf6"
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

      // Header & footer branding
      ctx.fillStyle = "#3e271d"
      ctx.font = `bold ${w * 0.024}px Georgia, serif`
      ctx.textAlign = "center"
      ctx.fillText("RETRO MEMORIES", 0, -sh / 2 + sh * 0.04)
      ctx.font = `${w * 0.018}px 'Caveat', cursive`
      ctx.fillStyle = "#8c5338"
      ctx.fillText("photobooth keepsake", 0, sh / 2 - sh * 0.02)
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

      // Ticket header
      ctx.fillStyle = "#0c4a6e"
      ctx.font = `bold ${w * 0.022}px 'DM Sans', sans-serif`
      ctx.textAlign = "center"
      ctx.fillText("★ ADMIT ONE ★", x + sw / 2, y + sh * 0.05)
      ctx.font = `${w * 0.016}px 'Caveat', cursive`
      ctx.fillStyle = "#0284c7"
      ctx.fillText("Couple Memories", x + sw / 2, y + sh * 0.08)

      // Barcode lines at bottom
      const barY = y + sh * 0.88
      const barH = sh * 0.06
      const barX = x + sw * 0.12
      const barW = sw * 0.76
      ctx.fillStyle = "#0f172a"
      for (let bx = 0; bx < barW; bx += w * 0.006) {
        const lineW = (bx * 7) % 3 === 0 ? w * 0.0035 : w * 0.0018
        ctx.fillRect(barX + bx, barY, lineW, barH)
      }
      ctx.font = `${w * 0.014}px monospace`
      ctx.fillText("№ 2026-COUPLE-08", x + sw / 2, barY + barH + w * 0.02)
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
      ctx.font = `bold ${w * 0.02}px 'DM Sans', sans-serif`
      ctx.textAlign = "center"
      ctx.fillText(label, x + sw / 2, y + sh * 0.05)
      ctx.font = `${w * 0.015}px monospace`
      ctx.fillStyle = "#64748b"
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
      ctx.font = `italic ${w * 0.022}px 'Caveat', cursive`
      ctx.textAlign = "center"
      ctx.fillText("Forever Young · 2026", x + sw / 2, y + sh * 0.045)
      ctx.font = `${w * 0.014}px 'DM Sans', sans-serif`
      ctx.fillStyle = "rgba(255,255,255,0.6)"
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
    ctx.fillStyle = "#2c2f24"
    ctx.font = `bold ${w * 0.02}px 'DM Sans', sans-serif`
    ctx.textAlign = "center"
    ctx.fillText("2026 · AUGUST", sx + sw / 2, sy + sh * 0.035)
    ctx.font = `${w * 0.014}px monospace`
    ctx.fillStyle = "#78716c"
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
    ctx.font = `bold ${w * 0.02}px 'DM Sans', sans-serif`
    ctx.textAlign = "center"
    ctx.fillText("PORTRAIT · ARCHIVE", sx + sw / 2, sy + sh * 0.035)
    ctx.font = `${w * 0.015}px Georgia, serif`
    ctx.fillStyle = "#574c43"
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
      // Giant postage stamp frame
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
      ctx.restore()
    } else {
      // 3-Cut stamp strip
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
      ctx.restore()
    }
  } else if (p === "K-Booth Vintage Parchment") {
    // Parchment texture flecks
    for (let i = 0; i < 400; i++) {
      const px = (((i * 197) % 1000) / 1000) * w
      const py = (((i * 431) % 1000) / 1000) * h
      ctx.fillStyle = "rgba(100, 70, 40, 0.04)"
      ctx.fillRect(px, py, w * 0.006, h * 0.004)
    }
  } else if (p === "K-Booth Kraft Scrapbook") {
    // Kraft cardboard fiber
    ctx.strokeStyle = "rgba(0,0,0,0.06)"
    for (let i = 0; i < 200; i++) {
      const px = (((i * 311) % 1000) / 1000) * w
      const py = (((i * 617) % 1000) / 1000) * h
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px + w * 0.015, py + ((i % 3) - 1))
      ctx.stroke()
    }
  } else if (p === "K-Booth Purple Cinema Night") {
    // Deep royal purple cinema background
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

      // Title banner
      ctx.fillStyle = "#3b0764"
      ctx.font = `italic bold ${w * 0.03}px 'Caveat', cursive`
      ctx.textAlign = "center"
      ctx.fillText("Night Movie", x + sw / 2, y + sh * 0.06)
      ctx.font = `${w * 0.014}px monospace`
      ctx.fillStyle = "#7e22ce"
      ctx.fillText("CINEMA TICKETS · ROW A", x + sw / 2, y + sh * 0.09)

      // Barcode footer
      const barY = y + sh * 0.88,
        barH = sh * 0.05,
        barX = x + sw * 0.12,
        barW = sw * 0.76
      ctx.fillStyle = "#1e1b4b"
      for (let bx = 0; bx < barW; bx += w * 0.006) {
        const lineW = (bx * 9) % 4 === 0 ? w * 0.004 : w * 0.0018
        ctx.fillRect(barX + bx, barY, lineW, barH)
      }
      ctx.font = `${w * 0.013}px monospace`
      ctx.fillText("* 0 8 2 4 9 9 1 2 *", x + sw / 2, barY + barH + w * 0.018)
      ctx.restore()
    }
    drawCinemaStrip(w * 0.07, h * 0.08, w * 0.42, h * 0.84)
    drawCinemaStrip(w * 0.51, h * 0.08, w * 0.42, h * 0.84)
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
