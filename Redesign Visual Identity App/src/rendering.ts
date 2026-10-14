import type {
  Adjustments,
  Composition,
  FilterName,
  Photo,
  PhotoTemplate,
} from "./types"

export const filterValues: Record<FilterName, Partial<Adjustments>> = {
  Original: {},
  Natural: { contrast: 104, saturation: 106 },
  Warm: { warmth: 22, saturation: 108 },
  Cool: { warmth: -22, saturation: 104 },
  Vintage: { contrast: 92, saturation: 78, warmth: 18 },
  Mono: { saturation: 0, contrast: 112 },
  Sepia: { saturation: 65, warmth: 38, contrast: 94 },
  Cinematic: { contrast: 122, saturation: 82, warmth: -8 },
  Pastel: { contrast: 86, saturation: 82, brightness: 108 },
  Bright: { brightness: 116, contrast: 102 },
  Contrast: { contrast: 138, saturation: 108 },
  Dreamy: { brightness: 108, contrast: 88, blur: 0.35 },
  Fade: { brightness: 106, contrast: 80, saturation: 75 },
  Night: { brightness: 82, contrast: 128, saturation: 84, warmth: -14 },
  Grain: { contrast: 108, saturation: 86, grain: 35 },
}

const mixed = (base: number, target: number | undefined, intensity: number) =>
  target === undefined ? base : base + (target - base) * (intensity / 100)

export const resolvedAdjustments = (adjustments: Adjustments): Adjustments => {
  const preset = filterValues[adjustments.filter]
  return {
    ...adjustments,
    brightness: mixed(
      adjustments.brightness,
      preset.brightness,
      adjustments.intensity,
    ),
    contrast: mixed(
      adjustments.contrast,
      preset.contrast,
      adjustments.intensity,
    ),
    saturation: mixed(
      adjustments.saturation,
      preset.saturation,
      adjustments.intensity,
    ),
    warmth: mixed(adjustments.warmth, preset.warmth, adjustments.intensity),
    blur: mixed(adjustments.blur, preset.blur, adjustments.intensity),
    grain: mixed(adjustments.grain, preset.grain, adjustments.intensity),
  }
}

export const cssFilter = (adjustments: Adjustments) => {
  const value = resolvedAdjustments(adjustments)
  const sepia = Math.max(0, value.warmth) * 0.45
  const hue = value.warmth < 0 ? value.warmth * 0.35 : value.warmth * -0.08
  return `brightness(${value.brightness}%) contrast(${value.contrast}%) saturate(${value.saturation}%) sepia(${sepia}%) hue-rotate(${hue}deg) blur(${value.blur}px)`
}

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

const roundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
) => {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, radius)
  ctx.clip()
}

const drawPhoto = async (
  ctx: CanvasRenderingContext2D,
  photo: Photo,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const image = await loadImage(photo.src)
  const adjustments = resolvedAdjustments(photo.adjustments)
  const scale =
    Math.max(width / image.width, height / image.height) * adjustments.zoom
  const sourceWidth = width / scale
  const sourceHeight = height / scale
  const sx = Math.max(
    0,
    Math.min(
      image.width - sourceWidth,
      (image.width - sourceWidth) / 2 -
        adjustments.offsetX * image.width * 0.003,
    ),
  )
  const sy = Math.max(
    0,
    Math.min(
      image.height - sourceHeight,
      (image.height - sourceHeight) / 2 -
        adjustments.offsetY * image.height * 0.003,
    ),
  )

  ctx.save()
  roundedRect(ctx, x, y, width, height, radius)
  ctx.filter = cssFilter(photo.adjustments)
  ctx.translate(x + width / 2, y + height / 2)
  ctx.rotate((adjustments.rotation * Math.PI) / 180)
  ctx.scale(adjustments.flipX ? -1 : 1, 1)
  ctx.drawImage(
    image,
    sx,
    sy,
    sourceWidth,
    sourceHeight,
    -width / 2,
    -height / 2,
    width,
    height,
  )
  ctx.restore()

  if (adjustments.grain > 0) {
    ctx.save()
    roundedRect(ctx, x, y, width, height, radius)
    // A deterministic pattern keeps grain identical in preview and export.
    const step = Math.max(2, width / 170)
    for (let gy = 0; gy < height; gy += step) {
      for (let gx = 0; gx < width; gx += step) {
        const value = Math.sin(gx * 12.9898 + gy * 78.233) * 43758.5453
        const noise = value - Math.floor(value)
        ctx.fillStyle = `rgba(${
          noise > 0.5 ? "255,255,255" : "0,0,0"
        },${(adjustments.grain / 500) * noise})`
        ctx.fillRect(x + gx, y + gy, step * 0.6, step * 0.6)
      }
    }
    ctx.restore()
  }

  if (adjustments.vignette > 0) {
    ctx.save()
    roundedRect(ctx, x, y, width, height, radius)
    const gradient = ctx.createRadialGradient(
      x + width / 2,
      y + height / 2,
      width * 0.15,
      x + width / 2,
      y + height / 2,
      width * 0.72,
    )
    gradient.addColorStop(0, "transparent")
    gradient.addColorStop(1, `rgba(0,0,0,${adjustments.vignette / 135})`)
    ctx.fillStyle = gradient
    ctx.fillRect(x, y, width, height)
    ctx.restore()
  }
}

export async function renderComposition(
  canvas: HTMLCanvasElement,
  composition: Composition,
  template: PhotoTemplate,
  scale = 1,
) {
  canvas.width = template.width * scale
  canvas.height = template.height * scale
  const ctx = canvas.getContext("2d")
  if (!ctx) throw new Error("Canvas rendering is unavailable in this browser.")
  const sx = canvas.width / 100
  const sy = canvas.height / 100
  ctx.fillStyle = composition.background
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  for (let index = 0; index < template.slots.length; index += 1) {
    const slot = template.slots[index]
    const inset = composition.spacing * 0.08
    const x = (slot.x + inset) * sx
    const y = (slot.y + inset) * sy
    const width = (slot.width - inset * 2) * sx
    const height = (slot.height - inset * 2) * sy
    ctx.fillStyle = "#d8d0bf"
    ctx.fillRect(x, y, width, height)
    const photo = composition.photos[index]
    if (photo)
      await drawPhoto(
        ctx,
        photo,
        x,
        y,
        width,
        height,
        composition.radius * sx * 0.12,
      )
    ctx.strokeStyle = composition.borderColor
    ctx.lineWidth = composition.borderWidth * scale
    ctx.strokeRect(x, y, width, height)
  }

  composition.stickers.forEach((sticker) => {
    ctx.save()
    ctx.translate(sticker.x * sx, sticker.y * sy)
    ctx.rotate((sticker.rotation * Math.PI) / 180)
    ctx.fillStyle = sticker.color
    ctx.strokeStyle = sticker.color
    ctx.lineWidth = 2 * scale
    ctx.font = `${sticker.size * sx * 0.75}px sans-serif`
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    const marks = {
      heart: "♡",
      star: "☆",
      sparkle: "✦",
      flower: "✿",
      smile: "☺",
    }
    ctx.fillText(marks[sticker.kind], 0, 0)
    ctx.restore()
  })

  composition.texts.forEach((text) => {
    ctx.save()
    ctx.translate(text.x * sx, text.y * sy)
    ctx.rotate((text.rotation * Math.PI) / 180)
    ctx.fillStyle = text.color
    ctx.textAlign = "center"
    const families = {
      hand: '"Caveat", cursive',
      sans: '"DM Sans", sans-serif',
      serif: "Georgia, serif",
    }
    ctx.font = `${text.size * sx * 0.18}px ${families[text.font]}`
    ctx.fillText(text.text, 0, 0, canvas.width * 0.8)
    ctx.restore()
  })

  return canvas
}
