export type MobileTab = "home" | "templates" | "camera" | "bookmarks" | "settings" | "kbooth" | "studio"

export interface MobileStudioLayer {
  id: string
  name: string
  type: "photo" | "sticker" | "text" | "background" | "frame"
  thumbnail?: string
  content?: string
  x: number // percentage 0 - 100
  y: number // percentage 0 - 100
  width: number // percentage 0 - 100
  height: number // percentage 0 - 100
  rotation: number // degrees
  scale: number
  opacity: number // 0 - 100
  locked: boolean
  visible: boolean
}

export type StudioTool =
  | "none"
  | "grid"
  | "templates"
  | "adjust"
  | "filter"
  | "text"
  | "background"
  | "stickers"
  | "border"
  | "shape"
  | "mask"
  | "draw"
  | "crop"

export interface MobileSettingsState {
  soundEffects: boolean
  countdownBeep: boolean
  mirrorFrontCamera: boolean
  flashSimulation: boolean
  highResExport: boolean
  autoSaveToGallery: boolean
  hapticFeedback: boolean
  analogPaperTexture: boolean
}
