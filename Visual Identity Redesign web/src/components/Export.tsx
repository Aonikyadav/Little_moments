import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft, Download, Pencil } from 'lucide-react'
import type { Design, Photo, Template } from '../types'
import { layoutSlots, renderComposition, ensureFonts } from '../lib/render'
import type { ImageSrc } from '../lib/render'
import { Btn, Chip, Note, Panel, Slider, Squiggle, Toggle } from './ui'

const MAX_SIDE = 8192
const MAX_PIXELS = 48_000_000

export default function Export({ photos, design, tpl, imgs, onBack }: { photos: Photo[]; design: Design; tpl: Template; imgs: Map<string, ImageSrc>; onBack: () => void }) {
  const [fmt, setFmt] = useState<'png' | 'jpg'>('png')
  const [quality, setQuality] = useState(92)
  const [scale, setScale] = useState(2)
  const [transparent, setTransparent] = useState(false)
  const [zoom, setZoom] = useState(1)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const prevRef = useRef<HTMLCanvasElement>(null)
  const photoMap = useMemo(() => new Map(photos.map((p) => [p.id, p])), [photos])
  const { W, H } = useMemo(() => layoutSlots(tpl, design.style), [tpl, design.style])

  const eff = Math.min(scale, MAX_SIDE / Math.max(W, H), Math.sqrt(MAX_PIXELS / (W * H)))
  const outW = Math.round(W * eff)
  const outH = Math.round(H * eff)
  const clamped = eff < scale
  const canTransparent = fmt === 'png'
  const useTransparent = transparent && canTransparent

  useEffect(() => {
    let dead = false
    void ensureFonts().then(() => {
      const cv = prevRef.current
      if (dead || !cv) return
      renderComposition(cv, { design, tpl, photos: photoMap, imgs, scale: Math.min(1.25, 1000 / Math.max(W, H)), transparent: useTransparent, placeholders: false })
    })
    return () => {
      dead = true
    }
  }, [design, tpl, photoMap, imgs, W, H, useTransparent])

  const filename = () => {
    const d = new Date()
    const p = (n: number) => String(n).padStart(2, '0')
    return `photo-strip-${tpl.id}-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.${fmt === 'png' ? 'png' : 'jpg'}`
  }

  const download = async () => {
    setBusy(true)
    setMsg(null)
    try {
      await ensureFonts()
      const cv = document.createElement('canvas')
      renderComposition(cv, { design, tpl, photos: photoMap, imgs, scale: eff, transparent: useTransparent, placeholders: false, cache: false })
      let out = cv
      if (fmt === 'jpg') {
        out = document.createElement('canvas')
        out.width = cv.width
        out.height = cv.height
        const c = out.getContext('2d')!
        c.fillStyle = '#ffffff'
        c.fillRect(0, 0, out.width, out.height)
        c.drawImage(cv, 0, 0)
      }
      const blob: Blob | null = await new Promise((res) => out.toBlob(res, fmt === 'png' ? 'image/png' : 'image/jpeg', quality / 100))
      if (!blob) throw new Error('The browser could not create the image. Try a smaller size.')
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename()
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 4000)
      setMsg({ ok: true, text: `Saved ${a.download} (${(blob.size / 1024 / 1024).toFixed(2)} MB, ${out.width}×${out.height}px).` })
    } catch (e) {
      setMsg({ ok: false, text: e instanceof Error ? e.message : 'Export failed. Try a smaller size.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid content-start gap-3">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-5xl sm:text-6xl">Ready to keep</h1>
            <Squiggle className="mt-1 h-3 w-40 text-accent" />
          </div>
          <Btn variant="ghost" onClick={onBack}>
            <ArrowLeft size={16} /> <Pencil size={14} /> Back to editor
          </Btn>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 font-note text-sm font-bold">
            Preview zoom
            <input type="range" className="rng !w-40" min={0.5} max={2} step={0.1} value={zoom} onChange={(e) => setZoom(Number(e.target.value))} aria-label="Preview zoom" />
            <span className="tabular-nums text-muted">{Math.round(zoom * 100)}%</span>
          </label>
        </div>
        <div className="dots-bg sk sk-card max-h-[75vh] overflow-auto p-6">
          <div className="mx-auto w-fit" style={{ width: `${zoom * 100}%`, maxWidth: zoom > 1 ? 'none' : undefined }}>
            <canvas ref={prevRef} role="img" aria-label="Final export preview" className="mx-auto block h-auto w-full max-w-[560px] shadow-[5px_7px_0_var(--shade)]" style={useTransparent ? { backgroundImage: 'conic-gradient(#ddd 25%, #fff 0 50%, #ddd 0 75%, #fff 0)', backgroundSize: '16px 16px' } : { background: '#fff' }} />
          </div>
        </div>
      </div>

      <aside className="grid content-start gap-4 lg:sticky lg:top-24 lg:self-start">
        <Panel title="Download" note="made from your real data">
          <div className="grid gap-4">
            <fieldset>
              <legend className="mb-1.5 font-note font-bold">Format</legend>
              <div className="flex gap-2">
                <Chip on={fmt === 'png'} onClick={() => setFmt('png')}>
                  PNG
                </Chip>
                <Chip on={fmt === 'jpg'} onClick={() => setFmt('jpg')}>
                  JPG
                </Chip>
              </div>
              <p className="mt-1 text-xs text-muted">{fmt === 'png' ? 'Lossless, supports transparency.' : 'Smaller files, white background.'}</p>
            </fieldset>

            {fmt === 'jpg' && <Slider label="JPG quality" value={quality} min={40} max={100} unit="%" resetValue={92} onChange={setQuality} onReset={() => setQuality(92)} />}

            <fieldset>
              <legend className="mb-1.5 font-note font-bold">Size</legend>
              <div className="flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((s) => (
                  <Chip key={s} on={scale === s} onClick={() => setScale(s)}>
                    {s}×
                  </Chip>
                ))}
              </div>
              <p className="mt-1 font-note text-sm" role="status">
                {outW} × {outH} px
              </p>
              {clamped && <p className="text-xs text-accent">Reduced from {scale}× to fit your browser's canvas limits.</p>}
            </fieldset>

            <Toggle label="Transparent background" hint={canTransparent ? 'Frame colour is removed; photos keep their look.' : 'Only available for PNG.'} on={useTransparent} onChange={(v) => canTransparent && setTransparent(v)} />

            <Btn variant="accent" className="w-full text-lg" disabled={busy} onClick={() => void download()}>
              <Download size={18} /> {busy ? 'Rendering…' : `Download ${fmt.toUpperCase()}`}
            </Btn>
            <div aria-live="polite">{msg && <p className={`text-sm ${msg.ok ? 'text-sage' : 'text-accent'}`}>{msg.text}</p>}</div>
          </div>
        </Panel>
        <Note className="text-inkblue" rotate={-1}>
          the file is drawn fresh at full size, not screenshotted, and never leaves your device
        </Note>
      </aside>
    </div>
  )
}
