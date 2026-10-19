import type { Adjustments } from "../types"

export type AdjustmentControl = {
  key: keyof Adjustments
  name: string
  min: number
  max: number
  step: number
  neutral: number
}

export const adjustmentControls: AdjustmentControl[] = [
  { key: "exposure", name: "Exposure", min: -2, max: 2, step: 0.05, neutral: 0 },
  { key: "brightness", name: "Brightness", min: 0, max: 200, step: 1, neutral: 100 },
  { key: "contrast", name: "Contrast", min: 0, max: 200, step: 1, neutral: 100 },
  { key: "highlights", name: "Highlights", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "shadows", name: "Shadows", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "whites", name: "Whites", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "blacks", name: "Blacks", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "saturation", name: "Saturation", min: 0, max: 200, step: 1, neutral: 100 },
  { key: "vibrance", name: "Vibrance", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "warmth", name: "Warmth", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "tint", name: "Tint", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "hue", name: "Hue", min: -180, max: 180, step: 1, neutral: 0 },
  { key: "sharpness", name: "Sharpness", min: 0, max: 100, step: 1, neutral: 0 },
  { key: "fade", name: "Fade", min: 0, max: 100, step: 1, neutral: 0 },
  { key: "red", name: "Red balance", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "green", name: "Green balance", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "blue", name: "Blue balance", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "glow", name: "Glow & bloom", min: 0, max: 100, step: 1, neutral: 0 },
  { key: "grain", name: "Film grain", min: 0, max: 100, step: 1, neutral: 0 },
  { key: "vignette", name: "Vignette", min: 0, max: 100, step: 1, neutral: 0 },
  { key: "lightLeak", name: "Light leak", min: 0, max: 100, step: 1, neutral: 0 },
  { key: "scratches", name: "Dust & scratches", min: 0, max: 100, step: 1, neutral: 0 },
]

function rgbToHsv(r: number, g: number, b: number): [number, number, number] {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  const s = max === 0 ? 0 : d / max
  const v = max

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }
  return [h * 360, s, v]
}

function hsvToRgb(h: number, s: number, v: number): [number, number, number] {
  h = ((h % 360) + 360) % 360
  h /= 60
  const i = Math.floor(h)
  const f = h - i
  const p = v * (1 - s)
  const q = v * (1 - s * f)
  const t = v * (1 - s * (1 - f))

  let r = 0,
    g = 0,
    b = 0
  switch (i) {
    case 0:
      r = v
      g = t
      b = p
      break
    case 1:
      r = q
      g = v
      b = p
      break
    case 2:
      r = p
      g = v
      b = t
      break
    case 3:
      r = p
      g = q
      b = v
      break
    case 4:
      r = t
      g = p
      b = v
      break
    default:
      r = v
      g = p
      b = q
      break
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
}

export function adjustPixels(
  data: Uint8ClampedArray,
  a: Adjustments,
): Uint8ClampedArray {
  const exposureMult = a.exposure ? Math.pow(2, a.exposure) : 1
  const brightnessOffset = a.brightness !== 100 ? (a.brightness - 100) * 1.5 : 0
  const contrastFactor = a.contrast !== 100 ? a.contrast / 100 : 1
  const satFactor = a.saturation !== 100 ? a.saturation / 100 : 1
  const vibFactor = a.vibrance ? a.vibrance / 100 : 0
  const warmthVal = a.warmth ? (a.warmth / 100) * 35 : 0
  const tintVal = a.tint ? (a.tint / 100) * 30 : 0
  const hueVal = a.hue ?? 0
  const redVal = a.red ? (a.red / 100) * 45 : 0
  const greenVal = a.green ? (a.green / 100) * 45 : 0
  const blueVal = a.blue ? (a.blue / 100) * 45 : 0
  const fadeVal = a.fade ? a.fade / 100 : 0
  const highlightsVal = a.highlights ? a.highlights / 100 : 0
  const shadowsVal = a.shadows ? a.shadows / 100 : 0
  const whitesVal = a.whites ? a.whites / 100 : 0
  const blacksVal = a.blacks ? a.blacks / 100 : 0

  const hasAdjustments =
    exposureMult !== 1 ||
    brightnessOffset !== 0 ||
    contrastFactor !== 1 ||
    satFactor !== 1 ||
    vibFactor !== 0 ||
    warmthVal !== 0 ||
    tintVal !== 0 ||
    hueVal !== 0 ||
    redVal !== 0 ||
    greenVal !== 0 ||
    blueVal !== 0 ||
    fadeVal !== 0 ||
    highlightsVal !== 0 ||
    shadowsVal !== 0 ||
    whitesVal !== 0 ||
    blacksVal !== 0

  if (!hasAdjustments) return data

  const len = data.length
  for (let i = 0; i < len; i += 4) {
    let r = data[i]
    let g = data[i + 1]
    let b = data[i + 2]

    // 1. Exposure
    if (exposureMult !== 1) {
      r *= exposureMult
      g *= exposureMult
      b *= exposureMult
    }

    // 2. Brightness
    if (brightnessOffset !== 0) {
      r += brightnessOffset
      g += brightnessOffset
      b += brightnessOffset
    }

    // 3. Contrast
    if (contrastFactor !== 1) {
      r = (r - 128) * contrastFactor + 128
      g = (g - 128) * contrastFactor + 128
      b = (b - 128) * contrastFactor + 128
    }

    // Luminance for range masks
    const luma = 0.299 * r + 0.587 * g + 0.114 * b

    // 4. Highlights & Shadows
    if (highlightsVal !== 0 && luma > 128) {
      const w = (luma - 128) / 127
      const boost = 1 + highlightsVal * w * 0.4
      r *= boost
      g *= boost
      b *= boost
    }
    if (shadowsVal !== 0 && luma < 128) {
      const w = (128 - luma) / 128
      const boost = 1 + shadowsVal * w * 0.4
      r *= boost
      g *= boost
      b *= boost
    }

    // 5. Whites & Blacks
    if (whitesVal !== 0) {
      const w = Math.pow(Math.max(0, Math.min(1, luma / 255)), 2)
      const offset = whitesVal * 45 * w
      r += offset
      g += offset
      b += offset
    }
    if (blacksVal !== 0) {
      const w = Math.pow(Math.max(0, Math.min(1, (255 - luma) / 255)), 2)
      const offset = blacksVal * 45 * w
      r += offset
      g += offset
      b += offset
    }

    // 6. Saturation
    if (satFactor !== 1) {
      const currentLuma = 0.299 * r + 0.587 * g + 0.114 * b
      r = currentLuma + (r - currentLuma) * satFactor
      g = currentLuma + (g - currentLuma) * satFactor
      b = currentLuma + (b - currentLuma) * satFactor
    }

    // 7. Vibrance
    if (vibFactor !== 0) {
      const currentLuma = 0.299 * r + 0.587 * g + 0.114 * b
      const max = Math.max(r, g, b)
      const min = Math.min(r, g, b)
      const sat = max === 0 ? 0 : (max - min) / 255
      const boost = vibFactor * (1 - sat) * 1.5
      r += (r - currentLuma) * boost
      g += (g - currentLuma) * boost
      b += (b - currentLuma) * boost
    }

    // 8. Warmth & Tint
    if (warmthVal !== 0) {
      r += warmthVal
      b -= warmthVal
    }
    if (tintVal !== 0) {
      g -= tintVal
      r += tintVal * 0.5
      b += tintVal * 0.5
    }

    // 9. Color Channel Offsets
    if (redVal !== 0) r += redVal
    if (greenVal !== 0) g += greenVal
    if (blueVal !== 0) b += blueVal

    // 10. Hue rotation
    if (hueVal !== 0) {
      const [h, s, v] = rgbToHsv(
        Math.max(0, Math.min(255, r)),
        Math.max(0, Math.min(255, g)),
        Math.max(0, Math.min(255, b)),
      )
      const [newR, newG, newB] = hsvToRgb(h + hueVal, s, v)
      r = newR
      g = newG
      b = newB
    }

    // 11. Fade
    if (fadeVal !== 0) {
      r = r * (1 - fadeVal * 0.3) + fadeVal * 55
      g = g * (1 - fadeVal * 0.3) + fadeVal * 55
      b = b * (1 - fadeVal * 0.3) + fadeVal * 55
    }

    data[i] = Math.max(0, Math.min(255, Math.round(r)))
    data[i + 1] = Math.max(0, Math.min(255, Math.round(g)))
    data[i + 2] = Math.max(0, Math.min(255, Math.round(b)))
    // Alpha channel data[i + 3] is unchanged
  }

  return data
}

export function sharpenPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
): void {
  if (amount <= 0 || width <= 2 || height <= 2) return

  const original = new Uint8ClampedArray(data)
  const strength = (amount / 100) * 0.65

  for (let y = 1; y < height - 1; y++) {
    const rowOffset = y * width * 4
    const prevRowOffset = (y - 1) * width * 4
    const nextRowOffset = (y + 1) * width * 4

    for (let x = 1; x < width - 1; x++) {
      const idx = rowOffset + x * 4
      const up = prevRowOffset + x * 4
      const down = nextRowOffset + x * 4
      const left = rowOffset + (x - 1) * 4
      const right = rowOffset + (x + 1) * 4

      for (let c = 0; c < 3; c++) {
        const center = original[idx + c]
        const neighbors =
          original[up + c] +
          original[down + c] +
          original[left + c] +
          original[right + c]
        const sharp = center + (center * 4 - neighbors) * strength
        data[idx + c] = Math.max(0, Math.min(255, Math.round(sharp)))
      }
    }
  }
}
