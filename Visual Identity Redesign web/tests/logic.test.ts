import { describe, expect, it } from 'vitest'
import { PHOTO_COUNTS, TEMPLATES, templatesForCount } from '../src/lib/templates'
import { applyTemplate, createDesign, reassignSlots } from '../src/lib/design'

describe('templates', () => {
  it('every count has templates and filtering is strict', () => {
    for (const n of PHOTO_COUNTS) {
      const list = templatesForCount(n)
      expect(list.length).toBeGreaterThan(0)
      expect(list.every((t) => t.count === n && t.frs.length === n)).toBe(true)
    }
  })
  it('ids are unique', () => {
    expect(new Set(TEMPLATES.map((t) => t.id)).size).toBe(TEMPLATES.length)
  })
})

describe('design', () => {
  const ids = ['a', 'b', 'c', 'd', 'e']
  it('reassignSlots keeps used photos first and pads with null', () => {
    expect(reassignSlots(['c', 'a'], ids, 3)).toEqual(['c', 'a', 'b'])
    expect(reassignSlots(['a'], ['a'], 3)).toEqual(['a', null, null])
  })
  it('applyTemplate never loses photos from the pool', () => {
    const t4 = templatesForCount(4)[0]
    const t2 = templatesForCount(2)[0]
    const d = createDesign(t4, ids.slice(0, 4))
    const d2 = applyTemplate(d, t2, ids.slice(0, 4))
    expect(d2.slotAssign).toEqual(['a', 'b'])
    expect(Object.keys(d2.edits).sort()).toEqual(['a', 'b', 'c', 'd'])
    const d3 = applyTemplate(d2, t4, ids.slice(0, 4))
    expect(d3.slotAssign).toEqual(['a', 'b', 'c', 'd'])
  })
})
