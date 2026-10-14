import type { PhotoEdit } from '../types'

export interface Fx {
  brightness: number
  contrast: number
  saturation: number
  warmth: number
  exposure: number
  fade: number
  sepia: number
  tint: [number, number, number]
  grain: number
  vignette: number
  blur: number
}

export const ZERO_FX: Fx = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  exposure: 0,
  fade: 0,
  sepia: 0,
  tint: [0, 0, 0],
  grain: 0,
  vignette: 0,
  blur: 0,
}

export interface FilterDef {
  id: string
  name: string
  fx: Partial<Fx>
}

export const FILTERS: FilterDef[] = [
  { id: 'original', name: 'Original', fx: {} },
  { id: 'natural', name: 'Natural', fx: { contrast: 0.06, saturation: 0.1, brightness: 0.03 } },
  { id: 'warm', name: 'Warm', fx: { warmth: 0.55, saturation: 0.1, brightness: 0.03 } },
  { id: 'cool', name: 'Cool', fx: { warmth: -0.55, tint: [0, 0.01, 0.04], saturation: 0.05 } },
  {
    id: 'vintage',
    name: 'Vintage',
    fx: { sepia: 0.35, contrast: -0.05, fade: 0.5, warmth: 0.25, vignette: 0.35, saturation: -0.1 },
  },
  {
    id: 'retro',
    name: 'Retro film',
    fx: { contrast: 0.15, saturation: 0.2, warmth: 0.2, fade: 0.3, grain: 0.3, tint: [0.02, 0, -0.02], vignette: 0.25 },
  },
  { id: 'bw', name: 'Black & white', fx: { saturation: -1, contrast: 0.18 } },
  { id: 'sepia', name: 'Sepia', fx: { sepia: 0.95, contrast: 0.05 } },
  {
    id: 'cinematic',
    name: 'Cinematic',
    fx: { contrast: 0.22, saturation: -0.12, tint: [-0.02, 0.01, 0.04], vignette: 0.4, brightness: -0.05, warmth: 0.12 },
  },
  {
    id: 'pastel',
    name: 'Soft pastel',
    fx: { brightness: 0.1, saturation: -0.25, fade: 0.6, contrast: -0.15, tint: [0.03, 0, 0.03] },
  },
  { id: 'bright', name: 'Bright', fx: { brightness: 0.15, exposure: 0.25, saturation: 0.12 } },
  { id: 'contrast', name: 'High contrast', fx: { contrast: 0.55, saturation: 0.2 } },
  { id: 'dreamy', name: 'Dreamy', fx: { blur: 1.4, brightness: 0.1, saturation: 0.1, fade: 0.3, warmth: 0.15 } },
  { id: 'fade', name: 'Fade', fx: { fade: 0.85, contrast: -0.1, saturation: -0.15 } },
  {
    id: 'night',
    name: 'Night',
    fx: { brightness: -0.15, exposure: -0.3, warmth: -0.4, saturation: -0.1, contrast: 0.2, vignette: 0.45, tint: [-0.03, 0, 0.06] },
  },
  { id: 'grainy', name: 'Grainy film', fx: { grain: 0.85, contrast: 0.12, saturation: -0.2, fade: 0.15 } },
]

export const filterById = (id: string) => FILTERS.find((f) => f.id === id) ?? FILTERS[0]

export const DEFAULT_EDIT: PhotoEdit = {
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

export function effectiveFx(e: PhotoEdit): Fx {
  const f = { ...ZERO_FX, ...filterById(e.filter).fx }
  const k = e.intensity
  return {
    brightness: f.brightness * k + e.brightness / 100,
    contrast: f.contrast * k + e.contrast / 100,
    saturation: f.saturation * k + e.saturation / 100,
    warmth: f.warmth * k + e.warmth / 100,
    exposure: f.exposure * k + (e.exposure / 100) * 1.5,
    fade: f.fade * k,
    sepia: f.sepia * k,
    tint: [f.tint[0] * k, f.tint[1] * k, f.tint[2] * k],
    grain: f.grain * k + e.grain / 100,
    vignette: f.vignette * k + e.vignette / 100,
    blur: f.blur * k + e.blur,
  }
}

export function isIdentityFx(f: Fx): boolean {
  return (
    Math.abs(f.brightness) < 1e-3 &&
    Math.abs(f.contrast) < 1e-3 &&
    Math.abs(f.saturation) < 1e-3 &&
    Math.abs(f.warmth) < 1e-3 &&
    Math.abs(f.exposure) < 1e-3 &&
    f.fade < 1e-3 &&
    f.sepia < 1e-3 &&
    f.tint.every((t) => Math.abs(t) < 1e-3) &&
    f.grain < 1e-3 &&
    f.vignette < 1e-3
  )
}

/** Approximate CSS filter used only for the live camera preview. */
export function cssFilterFor(filterId: string): string {
  const e: PhotoEdit = { ...DEFAULT_EDIT, filter: filterId }
  const f = effectiveFx(e)
  const bright = 1 + f.brightness * 0.5 + (Math.pow(2, f.exposure) - 1)
  const parts = [
    `brightness(${Math.max(0.2, bright).toFixed(2)})`,
    `contrast(${Math.max(0.2, 1 + f.contrast).toFixed(2)})`,
    `saturate(${Math.max(0, 1 + f.saturation).toFixed(2)})`,
  ]
  if (f.sepia > 0.01) parts.push(`sepia(${Math.min(1, f.sepia).toFixed(2)})`)
  if (f.warmth > 0.05) parts.push(`sepia(${(f.warmth * 0.25).toFixed(2)})`)
  if (f.warmth < -0.05) parts.push(`hue-rotate(${(f.warmth * 18).toFixed(0)}deg)`)
  if (f.blur > 0.1) parts.push(`blur(${(f.blur * 0.8).toFixed(1)}px)`)
  return parts.join(' ')
}

const noise = (() => {
  const a = new Float32Array(65536)
  let s = 1234567
  for (let i = 0; i < a.length; i++) {
    s = (s * 1664525 + 1013904223) >>> 0
    a[i] = s / 4294967296 - 0.5
  }
  return a
})()

export function applyFxPixels(data: ImageData, f: Fx) {
  const { width: w, height: h } = data
  const d = data.data
  const expMul = Math.pow(2, f.exposure)
  const cMul = 1 + f.contrast
  const sat = 1 + f.saturation
  const warm = f.warmth * 32
  const tint = f.tint.map((t) => t * 255)
  const grainAmp = f.grain * 70
  const vig = f.vignette
  const fade = f.fade
  const sepia = f.sepia
  const bAdd = f.brightness * 120
  for (let y = 0; y < h; y++) {
    const ny = (y / h - 0.5) * 2
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      let r = d[i] * expMul + bAdd
      let g = d[i + 1] * expMul + bAdd
      let b = d[i + 2] * expMul + bAdd
      r = (r - 128) * cMul + 128
      g = (g - 128) * cMul + 128
      b = (b - 128) * cMul + 128
      const l = 0.299 * r + 0.587 * g + 0.114 * b
      r = l + (r - l) * sat
      g = l + (g - l) * sat
      b = l + (b - l) * sat
      if (sepia > 0) {
        const sr = 0.393 * r + 0.769 * g + 0.189 * b
        const sg = 0.349 * r + 0.686 * g + 0.168 * b
        const sb = 0.272 * r + 0.534 * g + 0.131 * b
        r += (sr - r) * sepia
        g += (sg - g) * sepia
        b += (sb - b) * sepia
      }
      r += warm + tint[0]
      g += tint[1] + warm * 0.15
      b += -warm + tint[2]
      if (fade > 0) {
        r = r * (1 - fade * 0.3) + fade * 38
        g = g * (1 - fade * 0.3) + fade * 38
        b = b * (1 - fade * 0.3) + fade * 38
      }
      if (vig > 0) {
        const nx = (x / w - 0.5) * 2
        const dist = Math.sqrt(nx * nx + ny * ny)
        const t = Math.min(1, Math.max(0, (dist - 0.45) / 0.95))
        const m = 1 - vig * 0.85 * t * t
        r *= m
        g *= m
        b *= m
      }
      if (grainAmp > 0) {
        const n = noise[(x * 7 + y * 131 + ((y * 13) ^ x)) & 65535] * grainAmp
        r += n
        g += n
        b += n
      }
      d[i] = r < 0 ? 0 : r > 255 ? 255 : r
      d[i + 1] = g < 0 ? 0 : g > 255 ? 255 : g
      d[i + 2] = b < 0 ? 0 : b > 255 ? 255 : b
    }
  }
}
