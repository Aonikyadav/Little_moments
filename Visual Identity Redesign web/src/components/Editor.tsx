import { useEffect, useMemo, useRef, useState } from 'react'
import { Copy, Download, FlipHorizontal2, Layers, Redo2, RotateCcw, RotateCw, Save, Trash2, Undo2, ArrowUp, ArrowDown, History, Eraser } from 'lucide-react'
import type { Design, Photo, PhotoEdit, Sticker, TextLayer, Template } from '../types'
import { coverGeom, layoutSlots, photoKey, renderComposition, getProcessed, srcSize } from '../lib/render'
import type { ImageSrc, RenderInfo } from '../lib/render'
import { DEFAULT_EDIT, FILTERS } from '../lib/filters'
import { STICKERS, STICKER_COLORS, STICKER_GROUPS, TEXT_FONTS, stickerById } from '../lib/stickers'
import { TEMPLATES, formatDate } from '../lib/templates'
import { clamp, createDesign, uid } from '../lib/design'
import { Btn, Chip, Modal, Note, Slider, Toggle } from './ui'
import { PhotoThumb, TemplatePreview, useFontsReady } from './shared'
import type { DecorKind } from '../types'

type Tab = 'photo' | 'frame' | 'stickers' | 'text'
type Sel = { kind: 'sticker' | 'text'; id: string } | null

interface Props {
  photos: Photo[]
  design: Design
  tpl: Template
  imgs: Map<string, ImageSrc>
  setDesign: (u: (d: Design) => Design, key?: string) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  onApplyTemplate: (t: Template) => void
  onExport: () => void
  onReview: () => void
  onSaveLook: () => void
  onRestoreLook: () => void
  hasSaved: boolean
}

const BG_PRESETS = ['#fffdf7', '#f3ead8', '#ffd9e2', '#cfe6f7', '#fff3b0', '#dccdb0', '#171717', '#0a0a1a']
const INK_PRESETS = ['#111111', '#ffffff', '#b4432b', '#35557c', '#4f6f58', '#d1456b', '#e9c46a', '#f2efe6']
const DECORS: { id: DecorKind; label: string }[] = [
  { id: 'none', label: 'None' },
  { id: 'film', label: 'Film holes' },
  { id: 'hearts', label: 'Hearts' },
  { id: 'stars', label: 'Sparkles' },
  { id: 'dots', label: 'Polka dots' },
  { id: 'tape', label: 'Tape' },
  { id: 'grid', label: 'Graph paper' },
  { id: 'confetti', label: 'Confetti' },
  { id: 'snow', label: 'Snow' },
  { id: 'checker', label: 'Checker' },
  { id: 'neon', label: 'Neon glow' },
]

function ColorField({ label, value, onChange, presets }: { label: string; value: string; onChange: (v: string) => void; presets: string[] }) {
  return (
    <div className="grid gap-1">
      <span className="font-note text-sm font-bold">{label}</span>
      <div className="flex flex-wrap items-center gap-1.5">
        {presets.map((c) => (
          <button
            key={c}
            type="button"
            aria-label={`${label}: ${c}`}
            aria-pressed={value.toLowerCase() === c}
            onClick={() => onChange(c)}
            className="h-7 w-7 border-2 border-ink"
            style={{ background: c, borderRadius: '50% 45% 55% 48%', boxShadow: value.toLowerCase() === c ? '0 0 0 3px var(--accent)' : undefined }}
          />
        ))}
        <label className="relative grid h-7 w-10 cursor-pointer place-items-center border-2 border-dashed border-ink font-note text-xs font-bold" style={{ borderRadius: '6px 3px 6px 3px' }}>
          <span aria-hidden="true">+</span>
          <input type="color" aria-label={`${label}: custom colour`} value={/^#[0-9a-f]{6}$/i.test(value) ? value : '#ffffff'} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
      </div>
    </div>
  )
}

function StickerGlyph({ kind, color, className = '' }: { kind: string; color: string; className?: string }) {
  const def = stickerById(kind)
  if (!def) return null
  return (
    <svg viewBox="0 0 100 100" className={className} strokeLinejoin="round" strokeLinecap="round" aria-hidden="true">
      {def.paths.map((p, i) => (
        <path key={i} d={p.d} fill={p.f === 'n' ? 'none' : p.f === 'c' ? color : p.f === 'w' ? '#fffdf7' : '#1d1c1a'} stroke={p.s ? '#1d1c1a' : 'none'} strokeWidth="3.5" />
      ))}
    </svg>
  )
}

function FilterThumb({ photo, img, edit, filter }: { photo: Photo; img?: ImageSrc; edit: PhotoEdit; filter: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const cv = ref.current
    if (!cv || !img) return
    const proc = getProcessed(`${photoKey(photo)}-f`, img, { ...DEFAULT_EDIT, filter, rotate: edit.rotate, flipH: edit.flipH }, 120, 90)
    cv.width = 120
    cv.height = 90
    cv.getContext('2d')!.drawImage(proc, 0, 0)
  }, [photo, img, filter, edit.rotate, edit.flipH])
  return <canvas ref={ref} className="block aspect-[4/3] w-full bg-paper2" />
}

export default function Editor(props: Props) {
  const { photos, design, tpl, imgs, setDesign } = props
  const [tab, setTab] = useState<Tab>('photo')
  const [slotIdx, setSlotIdx] = useState(0)
  const [sel, setSel] = useState<Sel>(null)
  const [info, setInfo] = useState<RenderInfo | null>(null)
  const [showAll, setShowAll] = useState(false)
  const [pending, setPending] = useState<Template | null>(null)
  const [confirmReset, setConfirmReset] = useState(false)
  const [stGroup, setStGroup] = useState<string>('Love')
  const [textDraft, setTextDraft] = useState('')
  const cvRef = useRef<HTMLCanvasElement>(null)
  const ready = useFontsReady()
  const drag = useRef<null | { type: 'item'; kind: 'sticker' | 'text'; id: string; sx: number; sy: number; ox: number; oy: number } | { type: 'pan'; slot: number; lx: number; ly: number }>(null)

  const photoMap = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos])
  const layout = useMemo(() => layoutSlots(tpl, design.style), [tpl, design.style])
  const slotCount = design.slotAssign.length
  const safeSlot = Math.min(slotIdx, slotCount - 1)
  const curId = design.slotAssign[safeSlot]
  const curPhoto = curId ? photoMap.get(curId) : undefined
  const curImg = curPhoto ? imgs.get(photoKey(curPhoto)) : undefined
  const curEdit = (curId && design.edits[curId]) || DEFAULT_EDIT

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const raf = requestAnimationFrame(() => {
      const scale = Math.min(1.5, 1100 / Math.max(layout.W, layout.H))
      setInfo(renderComposition(cv, { design, tpl, photos: photoMap, imgs, scale, placeholders: true }))
    })
    return () => cancelAnimationFrame(raf)
  }, [design, tpl, photoMap, imgs, ready, layout.W, layout.H])

  const setEdit = (id: string, patch: Partial<PhotoEdit>, key?: string) =>
    setDesign((d) => ({ ...d, edits: { ...d.edits, [id]: { ...(d.edits[id] ?? DEFAULT_EDIT), ...patch } } }), key ? `${key}:${id}` : undefined)
  const setStyle = (patch: Partial<Design['style']>, key?: string) => setDesign((d) => ({ ...d, style: { ...d.style, ...patch } }), key ? `style:${key}` : undefined)
  const patchSticker = (id: string, patch: Partial<Sticker>, key?: string) => setDesign((d) => ({ ...d, stickers: d.stickers.map((s) => (s.id === id ? { ...s, ...patch } : s)) }), key ? `st:${key}:${id}` : undefined)
  const patchText = (id: string, patch: Partial<TextLayer>, key?: string) => setDesign((d) => ({ ...d, texts: d.texts.map((s) => (s.id === id ? { ...s, ...patch } : s)) }), key ? `tx:${key}:${id}` : undefined)

  const selSticker = sel?.kind === 'sticker' ? design.stickers.find((s) => s.id === sel.id) : undefined
  const selText = sel?.kind === 'text' ? design.texts.find((s) => s.id === sel.id) : undefined

  const removeSel = () => {
    if (!sel) return
    if (sel.kind === 'sticker') setDesign((d) => ({ ...d, stickers: d.stickers.filter((s) => s.id !== sel.id) }))
    else setDesign((d) => ({ ...d, texts: d.texts.filter((s) => s.id !== sel.id) }))
    setSel(null)
  }

  const duplicateSel = () => {
    if (selSticker) {
      const n = { ...selSticker, id: uid('st'), x: clamp(selSticker.x + 0.04, 0, 1), y: clamp(selSticker.y + 0.03, 0, 1) }
      setDesign((d) => ({ ...d, stickers: [...d.stickers, n] }))
      setSel({ kind: 'sticker', id: n.id })
    } else if (selText) {
      const n = { ...selText, id: uid('tx'), x: clamp(selText.x + 0.04, 0, 1), y: clamp(selText.y + 0.03, 0, 1) }
      setDesign((d) => ({ ...d, texts: [...d.texts, n] }))
      setSel({ kind: 'text', id: n.id })
    }
  }

  const layer = (dir: 1 | -1) => {
    if (!sel) return
    const key = sel.kind === 'sticker' ? 'stickers' : 'texts'
    setDesign((d) => {
      const arr = [...(d[key] as { id: string }[])]
      const i = arr.findIndex((s) => s.id === sel.id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= arr.length) return d
      ;[arr[i], arr[j]] = [arr[j], arr[i]]
      return { ...d, [key]: arr } as Design
    })
  }

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      const typing = t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT'
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        e.shiftKey ? props.redo() : props.undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        props.redo()
      } else if (!typing && sel && (e.key === 'Delete' || e.key === 'Backspace')) {
        e.preventDefault()
        removeSel()
      }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  })

  const toCanvas = (e: React.PointerEvent) => {
    const r = cvRef.current!.getBoundingClientRect()
    return { x: ((e.clientX - r.left) / r.width) * info!.W, y: ((e.clientY - r.top) / r.height) * info!.H }
  }

  const onDown = (e: React.PointerEvent) => {
    if (!info) return
    const { x, y } = toCanvas(e)
    for (let i = info.items.length - 1; i >= 0; i--) {
      const it = info.items[i]
      const a = (-it.rot * Math.PI) / 180
      const dx = x - it.cx
      const dy = y - it.cy
      const lx = dx * Math.cos(a) - dy * Math.sin(a)
      const ly = dx * Math.sin(a) + dy * Math.cos(a)
      if (Math.abs(lx) <= it.w / 2 + 12 && Math.abs(ly) <= it.h / 2 + 12) {
        const src = it.kind === 'sticker' ? design.stickers.find((s) => s.id === it.id) : design.texts.find((s) => s.id === it.id)
        if (!src) return
        setSel({ kind: it.kind, id: it.id })
        setTab(it.kind === 'sticker' ? 'stickers' : 'text')
        drag.current = { type: 'item', kind: it.kind, id: it.id, sx: x, sy: y, ox: src.x, oy: src.y }
        ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
        return
      }
    }
    setSel(null)
    const si = info.slots.findIndex((s) => x >= s.x && x <= s.x + s.w && y >= s.y && y <= s.y + s.h)
    if (si >= 0) {
      setSlotIdx(si)
      setTab((t) => (t === 'stickers' || t === 'text' ? 'photo' : t))
      drag.current = { type: 'pan', slot: si, lx: x, ly: y }
      ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    }
  }

  const onMove = (e: React.PointerEvent) => {
    const dr = drag.current
    if (!dr || !info) return
    const { x, y } = toCanvas(e)
    if (dr.type === 'item') {
      const nx = clamp(dr.ox + (x - dr.sx) / info.W, 0, 1)
      const ny = clamp(dr.oy + (y - dr.sy) / info.H, 0, 1)
      if (dr.kind === 'sticker') patchSticker(dr.id, { x: nx, y: ny }, 'move')
      else patchText(dr.id, { x: nx, y: ny }, 'move')
    } else {
      const id = design.slotAssign[dr.slot]
      const photo = id ? photoMap.get(id) : undefined
      const img = photo ? imgs.get(photoKey(photo)) : undefined
      if (!id || !img) return
      const edit = design.edits[id] ?? DEFAULT_EDIT
      const s = info.slots[dr.slot]
      const { w, h } = srcSize(img)
      const g = coverGeom(w, h, s.w, s.h, edit)
      const patch: Partial<PhotoEdit> = {}
      if (g.maxX > 0) patch.offX = clamp(edit.offX + (x - dr.lx) / g.maxX, -1, 1)
      if (g.maxY > 0) patch.offY = clamp(edit.offY + (y - dr.ly) / g.maxY, -1, 1)
      drag.current = { ...dr, lx: x, ly: y }
      if (Object.keys(patch).length) setEdit(id, patch, 'pan')
    }
  }

  const onUp = () => {
    drag.current = null
  }

  const addSticker = (kind: string) => {
    const n: Sticker = { id: uid('st'), kind, x: 0.5, y: 0.5, size: 0.22, rot: 0, color: STICKER_COLORS[0] }
    setDesign((d) => ({ ...d, stickers: [...d.stickers, n] }))
    setSel({ kind: 'sticker', id: n.id })
  }

  const addText = (text: string, extra: Partial<TextLayer> = {}) => {
    if (!text.trim()) return
    const n: TextLayer = { id: uid('tx'), text, x: 0.5, y: 0.5, size: 0.07, rot: 0, font: 'Caveat', color: '#111111', align: 'center', ...extra }
    setDesign((d) => ({ ...d, texts: [...d.texts, n] }))
    setSel({ kind: 'text', id: n.id })
    setTextDraft('')
  }

  const applyFilterAll = () =>
    setDesign((d) => {
      const edits = { ...d.edits }
      for (const id of d.slotAssign) if (id) edits[id] = { ...(edits[id] ?? DEFAULT_EDIT), filter: curEdit.filter, intensity: curEdit.intensity }
      return { ...d, edits }
    })

  const templatesList = useMemo(() => {
    const same = TEMPLATES.filter((t) => t.count === slotCount)
    return showAll ? [...same, ...TEMPLATES.filter((t) => t.count !== slotCount).sort((a, b) => a.count - b.count)] : same
  }, [slotCount, showAll])

  const chooseTemplate = (t: Template) => {
    if (t.id === tpl.id) return
    if (t.count !== slotCount) setPending(t)
    else props.onApplyTemplate(t)
  }

  const resetAll = () => {
    setDesign((d) => ({ ...createDesign(tpl, photos.map((p) => p.id)), slotAssign: d.slotAssign }))
    setSel(null)
    setConfirmReset(false)
  }

  const tabs: [Tab, string][] = [
    ['photo', 'Photo'],
    ['frame', 'Frame'],
    ['stickers', 'Stickers'],
    ['text', 'Text'],
  ]

  const selBox = info && sel ? info.items.find((i) => i.id === sel.id) : undefined
  const slotBox = info?.slots[safeSlot]

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-5 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_390px]">
      <div className="grid content-start gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Btn size="icon" aria-label="Undo" title="Undo (Ctrl+Z)" disabled={!props.canUndo} onClick={props.undo}>
            <Undo2 size={18} />
          </Btn>
          <Btn size="icon" aria-label="Redo" title="Redo (Ctrl+Shift+Z)" disabled={!props.canRedo} onClick={props.redo}>
            <Redo2 size={18} />
          </Btn>
          <Btn size="sm" onClick={() => setConfirmReset(true)}>
            <Eraser size={15} /> Reset composition
          </Btn>
          <Btn size="sm" onClick={props.onSaveLook} title="Save this look on this device">
            <Save size={15} /> Save look
          </Btn>
          <Btn size="sm" disabled={!props.hasSaved} onClick={props.onRestoreLook}>
            <History size={15} /> Restore saved
          </Btn>
          <span className="flex-1" />
          <Btn size="sm" variant="ghost" onClick={props.onReview}>
            Review photos
          </Btn>
          <Btn variant="accent" onClick={props.onExport}>
            <Download size={16} /> Export
          </Btn>
        </div>

        <div className="dots-bg sk sk-card grid place-items-center overflow-auto p-4 sm:p-6">
          <div className="relative inline-block touch-none select-none leading-none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
            <canvas ref={cvRef} aria-label="Composition preview. Drag a photo to reposition it, or drag stickers and text." role="img" className="block h-auto max-h-[68vh] w-auto max-w-full bg-white shadow-[5px_7px_0_var(--shade)]" />
            {info && slotBox && !sel && (
              <div className="pointer-events-none absolute border-2 border-dashed border-accent" style={{ left: `${(slotBox.x / info.W) * 100}%`, top: `${(slotBox.y / info.H) * 100}%`, width: `${(slotBox.w / info.W) * 100}%`, height: `${(slotBox.h / info.H) * 100}%` }} />
            )}
            {info && selBox && (
              <div
                className="pointer-events-none absolute border-2 border-dashed border-accent"
                style={{
                  left: `${((selBox.cx - selBox.w / 2) / info.W) * 100}%`,
                  top: `${((selBox.cy - selBox.h / 2) / info.H) * 100}%`,
                  width: `${(selBox.w / info.W) * 100}%`,
                  height: `${(selBox.h / info.H) * 100}%`,
                  transform: `rotate(${selBox.rot}deg)`,
                  outline: '1px solid white',
                }}
              />
            )}
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <h2 className="text-2xl">Photos in the frame</h2>
            <Note className="text-inkblue" rotate={-1}>
              pick one, then drag it on the canvas to reposition
            </Note>
          </div>
          <ul className="no-scroll flex gap-3 overflow-x-auto pb-2">
            {design.slotAssign.map((id, i) => {
              const ph = id ? photoMap.get(id) : undefined
              return (
                <li key={i} className="w-24 shrink-0">
                  <button
                    type="button"
                    aria-pressed={i === safeSlot}
                    aria-label={`Select photo slot ${i + 1}`}
                    onClick={() => {
                      setSlotIdx(i)
                      setSel(null)
                      setTab('photo')
                    }}
                    className={`relative block w-full border-2 p-1 ${i === safeSlot ? 'border-accent bg-hl shadow-[3px_3px_0_var(--accent)]' : 'border-ink bg-card'}`}
                    style={{ borderRadius: '8px 3px 8px 3px' }}
                  >
                    {ph ? <PhotoThumb photo={ph} img={imgs.get(photoKey(ph))} edit={design.edits[ph.id]} width={90} /> : <div className="crosshatch aspect-[4/3] border border-dashed border-ink" />}
                    <span className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full border-2 border-ink bg-card font-hand text-sm">{i + 1}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <aside className="sk sk-card grid content-start gap-4 p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-auto">
        <div role="tablist" aria-label="Editing tools" className="flex flex-wrap gap-2">
          {tabs.map(([id, label]) => (
            <Chip key={id} role="tab" aria-selected={tab === id} on={tab === id} onClick={() => setTab(id)}>
              {label}
            </Chip>
          ))}
        </div>

        {tab === 'photo' && (
          <div className="grid gap-5">
            {!curPhoto ? (
              <p className="font-note text-muted">This slot is empty. Pick a photo for it in the Review screen.</p>
            ) : (
              <>
                <section>
                  <h3 className="mb-2 text-2xl">Filter · slot {safeSlot + 1}</h3>
                  <ul className="grid grid-cols-4 gap-2">
                    {FILTERS.map((f) => (
                      <li key={f.id}>
                        <button type="button" aria-pressed={curEdit.filter === f.id} onClick={() => curId && setEdit(curId, { filter: f.id, intensity: 1 })} className={`block w-full border-2 p-0.5 text-center ${curEdit.filter === f.id ? 'border-accent bg-hl shadow-[2px_2px_0_var(--accent)]' : 'border-ink bg-card'}`} style={{ borderRadius: '6px 3px 6px 3px' }}>
                          <FilterThumb photo={curPhoto} img={curImg} edit={curEdit} filter={f.id} />
                          <span className="block truncate px-0.5 font-note text-[0.7rem] font-bold leading-tight">{f.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-3 grid gap-3">
                    <Slider label="Filter intensity" value={Math.round(curEdit.intensity * 100)} min={0} max={100} unit="%" resetValue={100} onChange={(v) => curId && setEdit(curId, { intensity: v / 100 }, 'int')} onReset={() => curId && setEdit(curId, { intensity: 1 })} />
                    <div className="flex flex-wrap gap-2">
                      <Btn size="sm" onClick={applyFilterAll}>
                        <Layers size={15} /> Apply to all photos
                      </Btn>
                      <Btn size="sm" disabled={curEdit.filter === 'original'} onClick={() => curId && setEdit(curId, { filter: 'original', intensity: 1 })}>
                        Reset to original
                      </Btn>
                    </div>
                  </div>
                </section>

                <section className="grid gap-2.5">
                  <h3 className="text-2xl">Adjust</h3>
                  {(
                    [
                      ['brightness', 'Brightness', -100, 100],
                      ['contrast', 'Contrast', -100, 100],
                      ['saturation', 'Saturation', -100, 100],
                      ['warmth', 'Warmth', -100, 100],
                      ['exposure', 'Exposure', -100, 100],
                      ['blur', 'Blur', 0, 10],
                      ['grain', 'Grain', 0, 100],
                      ['vignette', 'Vignette', 0, 100],
                    ] as const
                  ).map(([k, label, min, max]) => (
                    <Slider key={k} label={label} value={curEdit[k]} min={min} max={max} step={k === 'blur' ? 0.5 : 1} decimals={k === 'blur' ? 1 : 0} onChange={(v) => curId && setEdit(curId, { [k]: v }, k)} onReset={() => curId && setEdit(curId, { [k]: 0 })} />
                  ))}
                </section>

                <section className="grid gap-2.5">
                  <h3 className="text-2xl">Position</h3>
                  <Slider label="Zoom" value={curEdit.zoom} min={1} max={3} step={0.01} decimals={2} unit="×" resetValue={1} onChange={(v) => curId && setEdit(curId, { zoom: v }, 'zoom')} onReset={() => curId && setEdit(curId, { zoom: 1, offX: 0, offY: 0 })} />
                  <div className="flex flex-wrap gap-2">
                    <Btn size="icon" aria-label="Rotate left" title="Rotate left" onClick={() => curId && setEdit(curId, { rotate: (curEdit.rotate + 3) % 4, offX: 0, offY: 0 })}>
                      <RotateCcw size={16} />
                    </Btn>
                    <Btn size="icon" aria-label="Rotate right" title="Rotate right" onClick={() => curId && setEdit(curId, { rotate: (curEdit.rotate + 1) % 4, offX: 0, offY: 0 })}>
                      <RotateCw size={16} />
                    </Btn>
                    <Btn size="sm" aria-pressed={curEdit.flipH} onClick={() => curId && setEdit(curId, { flipH: !curEdit.flipH })}>
                      <FlipHorizontal2 size={15} /> Flip
                    </Btn>
                    <Btn size="sm" onClick={() => curId && setEdit(curId, { zoom: 1, offX: 0, offY: 0 })}>
                      Reset crop
                    </Btn>
                    <Btn size="sm" onClick={() => curId && setEdit(curId, { ...DEFAULT_EDIT, filter: tpl.defaultFilter })}>
                      <Eraser size={15} /> Reset photo
                    </Btn>
                  </div>
                  <p className="text-xs text-muted">Photos auto-crop to the frame. Zoom in, then drag the photo on the canvas to place your subject.</p>
                </section>
              </>
            )}
          </div>
        )}

        {tab === 'frame' && (
          <div className="grid gap-5">
            <section>
              <h3 className="mb-1 text-2xl">Layout</h3>
              <p className="mb-2 text-xs text-muted">
                Showing {showAll ? 'all frames' : `frames for ${slotCount} ${slotCount === 1 ? 'photo' : 'photos'}`}. Your photos carry over when you switch.
              </p>
              <ul className="wob grid grid-cols-3 gap-2">
                {templatesList.map((t) => (
                  <li key={t.id} className="sk">
                    <button type="button" aria-pressed={t.id === tpl.id} onClick={() => chooseTemplate(t)} className={`block w-full p-1.5 text-center ${t.id === tpl.id ? 'bg-hl' : ''}`} aria-label={`${t.name}, ${t.count} photos`} style={{ borderRadius: 'inherit' }}>
                      <TemplatePreview tpl={t} maxSide={150} />
                      <span className="mt-1 block truncate font-note text-[0.7rem] font-bold">{t.name}</span>
                      {showAll && <span className="block text-[0.65rem] text-muted">{t.count} photos</span>}
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-2">
                <Toggle label="Show frames with other photo counts" hint="You will be asked before anything changes." on={showAll} onChange={setShowAll} />
              </div>
            </section>

            <section className="grid gap-3">
              <h3 className="text-2xl">Colours</h3>
              <ColorField label="Background" value={design.style.bg} presets={BG_PRESETS} onChange={(v) => setStyle({ bg: v }, 'bg')} />
              <Toggle label="Gradient background" on={!!design.style.bg2} onChange={(v) => setStyle({ bg2: v ? (design.style.bg === '#ffffff' ? '#ffd9e2' : '#ffffff') : null })} />
              {design.style.bg2 && <ColorField label="Gradient end" value={design.style.bg2} presets={BG_PRESETS} onChange={(v) => setStyle({ bg2: v }, 'bg2')} />}
              <ColorField label="Photo border" value={design.style.borderColor} presets={INK_PRESETS} onChange={(v) => setStyle({ borderColor: v }, 'bc')} />
            </section>

            <section className="grid gap-2.5">
              <h3 className="text-2xl">Shape & spacing</h3>
              <Slider label="Border thickness" value={design.style.border} min={0} max={30} onChange={(v) => setStyle({ border: v }, 'border')} onReset={() => setStyle({ border: tpl.look.border })} resetValue={tpl.look.border} />
              <Slider label="Corner radius" value={design.style.radius} min={0} max={60} onChange={(v) => setStyle({ radius: v }, 'radius')} onReset={() => setStyle({ radius: tpl.look.radius })} resetValue={tpl.look.radius} />
              <Slider label="Space between photos" value={design.style.gap} min={0} max={60} onChange={(v) => setStyle({ gap: v }, 'gap')} onReset={() => setStyle({ gap: tpl.look.gap })} resetValue={tpl.look.gap} />
              <Slider label="Outer padding" value={design.style.padding} min={0} max={100} onChange={(v) => setStyle({ padding: v }, 'pad')} onReset={() => setStyle({ padding: tpl.look.padding })} resetValue={tpl.look.padding} />
              <Slider label="Canvas height" value={Math.round(design.style.aspect * 100)} min={80} max={125} unit="%" resetValue={100} onChange={(v) => setStyle({ aspect: v / 100 }, 'aspect')} onReset={() => setStyle({ aspect: 1 })} />
              <Toggle label="Photo shadow" on={design.style.shadow} onChange={(v) => setStyle({ shadow: v })} />
            </section>

            <section className="grid gap-2">
              <h3 className="text-2xl">Decoration</h3>
              <div className="flex flex-wrap gap-1.5">
                {DECORS.map((d) => (
                  <Chip key={d.id} on={design.style.decor === d.id} onClick={() => setStyle({ decor: d.id })} className="!min-h-8 !text-[0.85rem]">
                    {d.label}
                  </Chip>
                ))}
              </div>
              {design.style.decor !== 'none' && design.style.decor !== 'confetti' && <ColorField label="Decoration colour" value={design.style.decorColor} presets={[...INK_PRESETS, '#ff9db5', '#00f0ff']} onChange={(v) => setStyle({ decorColor: v }, 'dc')} />}
            </section>

            {tpl.footer > 0 && (
              <section className="grid gap-2">
                <h3 className="text-2xl">Footer caption</h3>
                <input className="field" aria-label="Footer caption" value={design.style.footerText} onChange={(e) => setStyle({ footerText: e.target.value }, 'ft')} placeholder="Use {date} for today" />
                <select className="field" aria-label="Footer font" value={design.style.footerFont} onChange={(e) => setStyle({ footerFont: e.target.value })}>
                  {TEXT_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
                </select>
                <ColorField label="Footer colour" value={design.style.footerColor} presets={INK_PRESETS} onChange={(v) => setStyle({ footerColor: v }, 'fc')} />
              </section>
            )}

            <Btn size="sm" onClick={() => setDesign((d) => ({ ...d, style: { ...tpl.look } }))}>
              <Eraser size={15} /> Reset frame to template
            </Btn>
          </div>
        )}

        {tab === 'stickers' && (
          <div className="grid gap-4">
            <div className="flex flex-wrap gap-1.5">
              {STICKER_GROUPS.map((g) => (
                <Chip key={g} on={stGroup === g} onClick={() => setStGroup(g)} className="!min-h-8 !text-[0.85rem]">
                  {g}
                </Chip>
              ))}
            </div>
            <ul className="grid grid-cols-4 gap-2">
              {STICKERS.filter((s) => s.group === stGroup).map((s) => (
                <li key={s.id}>
                  <button type="button" aria-label={`Add ${s.label} sticker`} onClick={() => addSticker(s.id)} className="sk grid aspect-square w-full place-items-center p-2 hover:bg-paper2">
                    <StickerGlyph kind={s.id} color={STICKER_COLORS[0]} className="h-full w-full" />
                  </button>
                </li>
              ))}
            </ul>
            {selSticker ? (
              <section className="grid gap-3 border-t-2 border-dashed border-faint pt-3">
                <h3 className="text-2xl">Selected sticker</h3>
                <ColorField label="Colour" value={selSticker.color} presets={STICKER_COLORS} onChange={(v) => patchSticker(selSticker.id, { color: v }, 'col')} />
                <Slider label="Size" value={Math.round(selSticker.size * 100)} min={5} max={80} unit="%" onChange={(v) => patchSticker(selSticker.id, { size: v / 100 }, 'size')} resetValue={22} onReset={() => patchSticker(selSticker.id, { size: 0.22 })} />
                <Slider label="Rotation" value={selSticker.rot} min={-180} max={180} unit="°" onChange={(v) => patchSticker(selSticker.id, { rot: v }, 'rot')} onReset={() => patchSticker(selSticker.id, { rot: 0 })} />
                <ItemActions onDuplicate={duplicateSel} onDelete={removeSel} onLayer={layer} />
              </section>
            ) : (
              <p className="font-note text-sm text-muted">Tap a sticker to add it, then drag it on the canvas.</p>
            )}
            {design.stickers.length > 0 && (
              <p className="text-xs text-muted">
                {design.stickers.length} sticker{design.stickers.length > 1 ? 's' : ''} on the canvas. Click one to select it.
              </p>
            )}
          </div>
        )}

        {tab === 'text' && (
          <div className="grid gap-4">
            <form
              className="grid gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                addText(textDraft)
              }}
            >
              <label className="grid gap-1 font-note text-sm font-bold">
                New text
                <input className="field" value={textDraft} onChange={(e) => setTextDraft(e.target.value)} placeholder="A caption, name or message" maxLength={80} />
              </label>
              <div className="flex flex-wrap gap-2">
                <Btn size="sm" variant="accent" type="submit" disabled={!textDraft.trim()}>
                  Add text
                </Btn>
                <Btn size="sm" onClick={() => addText(formatDate(), { font: 'Special Elite', size: 0.045 })}>
                  Add date
                </Btn>
                <Btn size="sm" onClick={() => addText('Our best day ♥', { font: 'Pacifico', size: 0.06 })}>
                  Message
                </Btn>
                <Btn size="sm" onClick={() => addText('Paris, France', { font: 'Playfair Display', size: 0.05 })}>
                  Location
                </Btn>
              </div>
            </form>
            {selText ? (
              <section className="grid gap-3 border-t-2 border-dashed border-faint pt-3">
                <h3 className="text-2xl">Selected text</h3>
                <textarea className="field" rows={2} aria-label="Text content" value={selText.text} maxLength={120} onChange={(e) => patchText(selText.id, { text: e.target.value }, 'txt')} />
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Font">
                  {TEXT_FONTS.map((f) => (
                    <Chip key={f.id} on={selText.font === f.id} onClick={() => patchText(selText.id, { font: f.id })} className="!min-h-8 !text-[0.85rem]" style={{ fontFamily: `"${f.id}"` }}>
                      {f.label}
                    </Chip>
                  ))}
                </div>
                <ColorField label="Text colour" value={selText.color} presets={INK_PRESETS} onChange={(v) => patchText(selText.id, { color: v }, 'col')} />
                <Slider label="Size" value={Math.round(selText.size * 1000) / 10} min={2} max={20} step={0.5} decimals={1} unit="%" onChange={(v) => patchText(selText.id, { size: v / 100 }, 'size')} resetValue={7} onReset={() => patchText(selText.id, { size: 0.07 })} />
                <Slider label="Rotation" value={selText.rot} min={-180} max={180} unit="°" onChange={(v) => patchText(selText.id, { rot: v }, 'rot')} onReset={() => patchText(selText.id, { rot: 0 })} />
                <div className="flex gap-1.5" role="group" aria-label="Alignment">
                  {(['left', 'center', 'right'] as const).map((a) => (
                    <Chip key={a} on={selText.align === a} onClick={() => patchText(selText.id, { align: a })} className="!min-h-8 !text-[0.85rem] capitalize">
                      {a}
                    </Chip>
                  ))}
                </div>
                <ItemActions onDuplicate={duplicateSel} onDelete={removeSel} onLayer={layer} />
              </section>
            ) : (
              <p className="font-note text-sm text-muted">Add text, then drag it into place on the canvas.</p>
            )}
            {design.texts.length > 0 && (
              <ul className="grid gap-1">
                {design.texts.map((t) => (
                  <li key={t.id}>
                    <button type="button" onClick={() => setSel({ kind: 'text', id: t.id })} aria-pressed={sel?.id === t.id} className={`w-full truncate px-2 py-1 text-left font-note text-sm ${sel?.id === t.id ? 'bg-hl' : 'hover:bg-paper2'}`}>
                      {t.text.replace(/\n/g, ' ')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </aside>

      {pending && (
        <Modal title="Switch to this frame?" onClose={() => setPending(null)}>
          <p className="text-graphite">
            “{pending.name}” has {pending.count} {pending.count === 1 ? 'slot' : 'slots'}; you currently have {slotCount}.
          </p>
          <p className="mt-2 font-note font-bold">
            {pending.count < slotCount
              ? `${slotCount - pending.count} photo${slotCount - pending.count > 1 ? 's' : ''} will move out of the frame. Nothing is deleted: they stay in your pool and you can bring them back from Review.`
              : `${pending.count - slotCount} slot${pending.count - slotCount > 1 ? 's' : ''} will be empty until you add photos in Review.`}
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Btn onClick={() => setPending(null)}>Keep current frame</Btn>
            <Btn
              variant="accent"
              onClick={() => {
                props.onApplyTemplate(pending)
                setPending(null)
                setSlotIdx(0)
              }}
            >
              Switch frame
            </Btn>
          </div>
        </Modal>
      )}

      {confirmReset && (
        <Modal title="Reset the whole composition?" onClose={() => setConfirmReset(false)}>
          <p className="text-graphite">This clears every filter, adjustment, crop, sticker and text layer and restores the template look. Your photos stay. You can undo this.</p>
          <div className="mt-4 flex justify-end gap-2">
            <Btn onClick={() => setConfirmReset(false)}>Cancel</Btn>
            <Btn variant="accent" onClick={resetAll}>
              Reset composition
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}

function ItemActions({ onDuplicate, onDelete, onLayer }: { onDuplicate: () => void; onDelete: () => void; onLayer: (d: 1 | -1) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Btn size="sm" onClick={onDuplicate}>
        <Copy size={15} /> Duplicate
      </Btn>
      <Btn size="icon" aria-label="Bring forward" title="Bring forward" onClick={() => onLayer(1)}>
        <ArrowUp size={16} />
      </Btn>
      <Btn size="icon" aria-label="Send backward" title="Send backward" onClick={() => onLayer(-1)}>
        <ArrowDown size={16} />
      </Btn>
      <Btn size="sm" onClick={onDelete}>
        <Trash2 size={15} /> Delete
      </Btn>
    </div>
  )
}
