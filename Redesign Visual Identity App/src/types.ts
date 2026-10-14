export type PhotoCount = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 9
export type Stage = "home" | "setup" | "templates" | "camera" | "review" | "editor" | "export"

export type Slot = { x: number; y: number; width: number; height: number; radius?: number }

export type PhotoTemplate = {
  id: string
  name: string
  category: string
  count: PhotoCount
  width: number
  height: number
  slots: Slot[]
  background: string
  accent: string
  orientation: "portrait" | "landscape" | "square"
  note: string
}

export type FilterName =
  | "Original"
  | "Natural"
  | "Warm"
  | "Cool"
  | "Vintage"
  | "Mono"
  | "Sepia"
  | "Cinematic"
  | "Pastel"
  | "Bright"
  | "Contrast"
  | "Dreamy"
  | "Fade"
  | "Night"
  | "Grain"

export type Adjustments = {
  filter: FilterName
  intensity: number
  brightness: number
  contrast: number
  saturation: number
  warmth: number
  blur: number
  grain: number
  vignette: number
  zoom: number
  offsetX: number
  offsetY: number
  rotation: number
  flipX: boolean
}

export type Photo = {
  id: string
  src: string
  name: string
  adjustments: Adjustments
}

export type StickerLayer = {
  id: string
  kind: "heart" | "star" | "sparkle" | "flower" | "smile"
  x: number
  y: number
  size: number
  rotation: number
  color: string
}

export type TextLayer = {
  id: string
  text: string
  x: number
  y: number
  size: number
  rotation: number
  color: string
  font: "hand" | "sans" | "serif"
}

export type Composition = {
  templateId: string
  background: string
  borderColor: string
  borderWidth: number
  radius: number
  spacing: number
  padding: number
  photos: Photo[]
  stickers: StickerLayer[]
  texts: TextLayer[]
}

export type BoothSettings = {
  count: PhotoCount
  countdown: 0 | 3 | 5 | 10
  interval: number
  facingMode: "user" | "environment"
  mirror: boolean
  flash: boolean
  sound: boolean
  visualCountdown: boolean
  captureFilter: FilterName
  deviceId?: string
}

export const defaultAdjustments = (): Adjustments => ({
  filter: "Original",
  intensity: 100,
  brightness: 100,
  contrast: 100,
  saturation: 100,
  warmth: 0,
  blur: 0,
  grain: 0,
  vignette: 0,
  zoom: 1,
  offsetX: 0,
  offsetY: 0,
  rotation: 0,
  flipX: false,
})
