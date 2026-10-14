import type { Design, Settings } from '../types'

const K = {
  settings: 'sb.settings',
  favs: 'sb.favorites',
  recents: 'sb.recents',
  theme: 'sb.theme',
  design: 'sb.design',
}

export const DEFAULT_SETTINGS: Settings = {
  count: 4,
  countdown: 5,
  interval: 3,
  customInterval: false,
  facing: 'user',
  deviceId: '',
  mirror: true,
  flash: true,
  shutter: true,
  countdownSound: false,
  captureFilter: 'original',
  confirmRestart: true,
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? ({ ...(typeof fallback === 'object' && !Array.isArray(fallback) ? fallback : {}), ...JSON.parse(raw) } as T) : fallback
  } catch {
    return fallback
  }
}

function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable or full */
  }
}

export const loadSettings = () => read<Settings>(K.settings, DEFAULT_SETTINGS)
export const saveSettings = (s: Settings) => write(K.settings, s)

export function loadList(kind: 'favs' | 'recents'): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(K[kind]) ?? '[]')
    return Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []
  } catch {
    return []
  }
}
export const saveList = (kind: 'favs' | 'recents', v: string[]) => write(K[kind], v)

export const loadTheme = (): 'light' | 'dark' => (localStorage.getItem(K.theme) === 'dark' ? 'dark' : 'light')
export const saveTheme = (t: 'light' | 'dark') => {
  try {
    localStorage.setItem(K.theme, t)
  } catch {
    /* ignore */
  }
}

export interface SavedLook {
  templateId: string
  style: Design['style']
  stickers: Design['stickers']
  texts: Design['texts']
  editsBySlot: (Design['edits'][string] | null)[]
}

export function saveLook(d: Design) {
  const look: SavedLook = {
    templateId: d.templateId,
    style: d.style,
    stickers: d.stickers,
    texts: d.texts,
    editsBySlot: d.slotAssign.map((id) => (id ? d.edits[id] ?? null : null)),
  }
  write(K.design, look)
}

export function loadLook(): SavedLook | null {
  try {
    const raw = localStorage.getItem(K.design)
    return raw ? (JSON.parse(raw) as SavedLook) : null
  } catch {
    return null
  }
}

export const hasSavedLook = () => !!localStorage.getItem(K.design)

export function clearAllLocal() {
  try {
    Object.values(K).forEach((k) => localStorage.removeItem(k))
  } catch {
    /* ignore */
  }
}
