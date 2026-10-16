import type { Adjustments } from "../types"

export const adjustmentControls = [
  {
    key: "exposure",
    name: "Exposure",
    min: -2,
    max: 2,
    step: 0.05,
    neutral: 0,
  },
  {
    key: "brightness",
    name: "Brightness",
    min: 0,
    max: 200,
    step: 1,
    neutral: 100,
  },
  {
    key: "contrast",
    name: "Contrast",
    min: 0,
    max: 200,
    step: 1,
    neutral: 100,
  },
  {
    key: "highlights",
    name: "Highlights",
    min: -100,
    max: 100,
    step: 1,
    neutral: 0,
  },
  { key: "shadows", name: "Shadows", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "whites", name: "Whites", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "blacks", name: "Blacks", min: -100, max: 100, step: 1, neutral: 0 },
  {
    key: "saturation",
    name: "Saturation",
    min: 0,
    max: 200,
    step: 1,
    neutral: 100,
  },
  {
    key: "vibrance",
    name: "Vibrance",
    min: -100,
    max: 100,
    step: 1,
    neutral: 0,
  },
  {
    key: "warmth",
    name: "Temperature",
    min: -100,
    max: 100,
    step: 1,
    neutral: 0,
  },
  { key: "tint", name: "Tint", min: -100, max: 100, step: 1, neutral: 0 },
  { key: "hue", name: "Hue", min: -180, max: 180, step: 1, neutral: 0 },
  { key: "red", name: "Red channel", min: -100, max: 100, step: 1, neutral: 0 },
  {
    key: "green",
    name: "Green channel",
    min: -100,
    max: 100,
    step: 1,
    neutral: 0,
  },
  {
    key: "blue",
    name: "Blue channel",
    min: -100,
    max: 100,
    step: 1,
    neutral: 0,
  },
  {
    key: "sharpness",
    name: "Sharpness",
    min: 0,
    max: 100,
    step: 1,
    neutral: 0,
  },
  { key: "fade", name: "Fade", min: 0, max: 100, step: 1, neutral: 0 },
  { key: "grain", name: "Film grain", min: 0, max: 100, step: 1, neutral: 0 },
  { key: "vignette", name: "Vignette", min: 0, max: 100, step: 1, neutral: 0 },
  { key: "blur", name: "Blur", min: 0, max: 8, step: 0.1, neutral: 0 },
  { key: "glow", name: "Soft glow", min: 0, max: 100, step: 1, neutral: 0 },
  {
    key: "lightLeak",
    name: "Light leak",
    min: 0,
    max: 100,
    step: 1,
    neutral: 0,
  },
  {
    key: "scratches",
    name: "Film scratches",
    min: 0,
    max: 100,
    step: 1,
    neutral: 0,
  },
] as const

const clamp = (v: number) => Math.max(0, Math.min(255, v))
// Pure RGBA operation shared by Canvas preview and full-resolution output.
export function adjustPixels(data: Uint8ClampedArray, a: Adjustments) {
  const exposure = 2 ** (a.exposure ?? 0)
  const hue = ((a.hue ?? 0) * Math.PI) / 180
  const cos = Math.cos(hue),
    sin = Math.sin(hue)
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i] * exposure,
      g = data[i + 1] * exposure,
      b = data[i + 2] * exposure
    const l = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255
    const lift =
      (a.shadows ?? 0) * (1 - l) ** 2 * 0.65 +
      (a.highlights ?? 0) * l ** 2 * 0.65 +
      (a.whites ?? 0) * Math.max(0, l - 0.55) +
      (a.blacks ?? 0) * Math.max(0, 0.45 - l)
    r += lift + a.warmth * 0.45 + (a.tint ?? 0) * 0.2 + (a.red ?? 0)
    g += lift - (a.tint ?? 0) * 0.35 + (a.green ?? 0)
    b += lift - a.warmth * 0.45 + (a.blue ?? 0)
    const grey = 0.2126 * r + 0.7152 * g + 0.0722 * b
    const chroma = (Math.max(r, g, b) - Math.min(r, g, b)) / 255
    const sat =
      (a.saturation / 100) * (1 + ((a.vibrance ?? 0) / 100) * (1 - chroma))
    r = grey + (r - grey) * sat
    g = grey + (g - grey) * sat
    b = grey + (b - grey) * sat
    if (hue) {
      const rr = r,
        gg = g,
        bb = b
      r =
        (0.213 + 0.787 * cos - 0.213 * sin) * rr +
        (0.715 - 0.715 * cos - 0.715 * sin) * gg +
        (0.072 - 0.072 * cos + 0.928 * sin) * bb
      g =
        (0.213 - 0.213 * cos + 0.143 * sin) * rr +
        (0.715 + 0.285 * cos + 0.14 * sin) * gg +
        (0.072 - 0.072 * cos - 0.283 * sin) * bb
      b =
        (0.213 - 0.213 * cos - 0.787 * sin) * rr +
        (0.715 - 0.715 * cos + 0.715 * sin) * gg +
        (0.072 + 0.928 * cos + 0.072 * sin) * bb
    }
    const fade = (a.fade ?? 0) / 100
    const channel = (v: number) =>
      clamp(
        (((((v - 127.5) * a.contrast) / 100 + 127.5) * a.brightness) / 100) *
          (1 - fade * 0.5) +
          fade * 55,
      )
    data[i] = channel(r)
    data[i + 1] = channel(g)
    data[i + 2] = channel(b)
  }
  return data
}

export function sharpenPixels(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  amount: number,
) {
  if (amount <= 0) return
  const original = new Uint8ClampedArray(data),
    strength = amount / 100
  for (let y = 1; y < height - 1; y++)
    for (let x = 1; x < width - 1; x++) {
      const i = (y * width + x) * 4
      for (let c = 0; c < 3; c++) {
        const average =
          (original[i - 4 + c] +
            original[i + 4 + c] +
            original[i - width * 4 + c] +
            original[i + width * 4 + c]) /
          4
        data[i + c] = clamp(
          original[i + c] + (original[i + c] - average) * strength * 2,
        )
      }
    }
}
