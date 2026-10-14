import { useCallback, useState } from 'react'

interface H<T> {
  past: T[]
  present: T
  future: T[]
  key: string
  t: number
}

export function useHistory<T>(initial: T) {
  const [h, setH] = useState<H<T>>({ past: [], present: initial, future: [], key: '', t: 0 })

  /** Updates sharing the same `key` within 900ms collapse into one undo step (slider drags, pans). */
  const set = useCallback((u: (d: T) => T, key?: string) => {
    setH((s) => {
      const next = u(s.present)
      if (next === s.present) return s
      const now = Date.now()
      if (key && key === s.key && now - s.t < 900) return { ...s, present: next, t: now, future: [] }
      return { past: [...s.past.slice(-80), s.present], present: next, future: [], key: key ?? '', t: now }
    })
  }, [])

  const replace = useCallback((v: T) => setH({ past: [], present: v, future: [], key: '', t: 0 }), [])

  const undo = useCallback(
    () =>
      setH((s) => {
        if (!s.past.length) return s
        const prev = s.past[s.past.length - 1]
        return { past: s.past.slice(0, -1), present: prev, future: [s.present, ...s.future], key: '', t: 0 }
      }),
    [],
  )

  const redo = useCallback(
    () =>
      setH((s) => {
        if (!s.future.length) return s
        const [n, ...rest] = s.future
        return { past: [...s.past, s.present], present: n, future: rest, key: '', t: 0 }
      }),
    [],
  )

  return { state: h.present, set, replace, undo, redo, canUndo: h.past.length > 0, canRedo: h.future.length > 0 }
}
