export interface Photo {
  id: string
  url: string
  w: number
  h: number
  rev: number
}

export interface PhotoEdit {
  filter: string
  intensity: number
  brightness: number
  contrast: number
  saturation: number
  warmth: number
  exposure: number
  blur: number
  grain: number
  vignette: number
  zoom: number
  offX: number
  offY: number
  rotate: number
  flipH: boolean
}

export interface Sticker {
  id: string
  kind: string
  x: number
  y: number
  size: number
  rot: number
  color: string
}

export interface TextLayer {
  id: string
  text: string
  x: number
  y: number
  size: number
  rot: number
  font: string
  color: string
  align: 'left' | 'center' | 'right'
}

export type DecorKind =
  | 'none'
  | 'film'
  | 'hearts'
  | 'stars'
  | 'dots'
  | 'tape'
  | 'grid'
  | 'neon'
  | 'confetti'
  | 'snow'
  | 'checker'

export interface Style {
  bg: string
  bg2: string | null
  padding: number
  gap: number
  radius: number
  border: number
  borderColor: string
  shadow: boolean
  decor: DecorKind
  decorColor: string
  aspect: number
  footerText: string
  footerFont: string
  footerColor: string
}

export interface Design {
  templateId: string
  style: Style
  slotAssign: (string | null)[]
  edits: Record<string, PhotoEdit>
  stickers: Sticker[]
  texts: TextLayer[]
}

export type Rect = { x: number; y: number; w: number; h: number }

export interface Template {
  id: string
  name: string
  cats: string[]
  count: number
  w: number
  h: number
  frs: [number, number, number, number][]
  footer: number
  footerSize: number
  look: Style
  defaultFilter: string
  pop: number
  added: number
  tone: 'light' | 'dark' | 'color'
}

export interface Settings {
  count: number
  countdown: number
  interval: number
  customInterval: boolean
  facing: 'user' | 'environment'
  deviceId: string
  mirror: boolean
  flash: boolean
  shutter: boolean
  countdownSound: boolean
  captureFilter: string
  confirmRestart: boolean
}

export type Stage =
  | 'home'
  | 'setup'
  | 'upload'
  | 'templates'
  | 'capture'
  | 'review'
  | 'editor'
  | 'export'
