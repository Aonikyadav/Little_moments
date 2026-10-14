import type { Design, PhotoEdit, Template } from '../types'
import { DEFAULT_EDIT } from './filters'

export function reassignSlots(old: (string | null)[], poolIds: string[], count: number): (string | null)[] {
  const used = old.filter((x): x is string => !!x && poolIds.includes(x))
  const rest = poolIds.filter((id) => !used.includes(id))
  const ordered = [...used, ...rest]
  return Array.from({ length: count }, (_, i) => ordered[i] ?? null)
}

export function ensureEdits(edits: Record<string, PhotoEdit>, ids: string[], filter = 'original'): Record<string, PhotoEdit> {
  const next = { ...edits }
  for (const id of ids) if (!next[id]) next[id] = { ...DEFAULT_EDIT, filter }
  return next
}

export function createDesign(tpl: Template, photoIds: string[], filter?: string): Design {
  return {
    templateId: tpl.id,
    style: { ...tpl.look },
    slotAssign: reassignSlots([], photoIds, tpl.count),
    edits: ensureEdits({}, photoIds, filter ?? tpl.defaultFilter),
    stickers: [],
    texts: [],
  }
}

export function applyTemplate(d: Design, tpl: Template, photoIds: string[]): Design {
  return {
    ...d,
    templateId: tpl.id,
    style: { ...tpl.look },
    slotAssign: reassignSlots(d.slotAssign, photoIds, tpl.count),
    edits: ensureEdits(d.edits, photoIds, tpl.defaultFilter),
  }
}

export const unusedIds = (d: Design, photoIds: string[]) => photoIds.filter((id) => !d.slotAssign.includes(id))

export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}`

export const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v))
