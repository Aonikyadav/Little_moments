export type PhotoCount = 1 | 2 | 3 | 4 | 5 | 6 | 8 | 9 | 11
export type Stage = "home" | "setup" | "templates" | "camera" | "review" | "editor" | "export"

export type Slot = {
  x: number
  y: number
  width: number
  height: number
  radius?: number
}

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
  thumbnail?: string
  tags?: string[]
  backgroundPattern?: string
  frameId?: string
  frameColor?: string
}

export type FilterName = string
export type LegacyFilterName = "Original" | "Natural" | "Warm" | "Cool" | "Vintage" | "Mono" | "Sepia" | "Cinematic" | "Pastel" | "Bright" | "Contrast" | "Dreamy" | "Fade" | "Night" | "Grain"

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
  flipY?: boolean
  fit?: "fill" | "fit"
  exposure?: number
  highlights?: number
  shadows?: number
  whites?: number
  blacks?: number
  vibrance?: number
  tint?: number
  hue?: number
  sharpness?: number
  fade?: number
  glow?: number
  lightLeak?: number
  scratches?: number
  red?: number
  green?: number
  blue?: number
  perspectiveX?: number
  perspectiveY?: number
}

export type LayerProperties = {
  name?: string
  hidden?: boolean
  locked?: boolean
  opacity?: number
  groupId?: string
  shadow?: number
  blend?: "source-over" | "multiply" | "screen"
}
export type PhotoTransform = {
  x: number
  y: number
  width: number
  height: number
  rotation: number
}
export type Photo = {
  id: string
  src: string
  name: string
  adjustments: Adjustments
  transform?: PhotoTransform
} & LayerProperties

export type StickerLayer = {
  id: string
  kind: "heart" | "star" | "sparkle" | "flower" | "smile"
  x: number
  y: number
  size: number
  rotation: number
  color: string
  assetId?: string
  src?: string
  flipX?: boolean
} & LayerProperties

export type TextLayer = {
  id: string
  text: string
  x: number
  y: number
  size: number
  rotation: number
  color: string
  font: "hand" | "sans" | "serif"
  align?: "left" | "center" | "right"
  letterSpacing?: number
  lineHeight?: number
  outline?: number
  labelColor?: string
} & LayerProperties

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
  mode?: "guided" | "freeform"
  frameId?: string
  frameColor?: string
  frameOpacity?: number
  backgroundPattern?: string
  backgroundOpacity?: number
  layerOrder?: string[]
  aspectRatio?: "original" | "square" | "story" | "landscape" | "1:1" | "4:5" | "9:16" | "16:9" | "2:3" | "3:4" | "3:2"
  gridLayoutId?: string
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
  flipY: false,
  fit: "fill",
  exposure: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  vibrance: 0,
  tint: 0,
  hue: 0,
  sharpness: 0,
  fade: 0,
  glow: 0,
  lightLeak: 0,
  scratches: 0,
  red: 0,
  green: 0,
  blue: 0,
  perspectiveX: 0,
  perspectiveY: 0,
})
