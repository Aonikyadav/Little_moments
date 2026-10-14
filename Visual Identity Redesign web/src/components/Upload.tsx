import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, ImagePlus, Trash2, UploadCloud } from 'lucide-react'
import type { Photo } from '../types'
import { MAX_FILE_MB, readImageFiles } from '../lib/files'
import { PHOTO_COUNTS } from '../lib/templates'
import { Btn, Chip, Note, Panel, Squiggle } from './ui'

const MAX_POOL = 24

export default function Upload({
  photos,
  count,
  onCount,
  onAdd,
  onRemove,
  onMove,
  onBack,
  onNext,
}: {
  photos: Photo[]
  count: number
  onCount: (n: number) => void
  onAdd: (p: Photo[]) => void
  onRemove: (id: string) => void
  onMove: (id: string, dir: -1 | 1) => void
  onBack: () => void
  onNext: () => void
}) {
  const input = useRef<HTMLInputElement>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [over, setOver] = useState(false)

  const handle = async (list: FileList | File[] | null) => {
    if (!list || !list.length) return
    setBusy(true)
    const files = Array.from(list)
    const room = MAX_POOL - photos.length
    const { photos: ok, errors: errs } = await readImageFiles(files.slice(0, Math.max(0, room)))
    if (files.length > room) errs.push(`Only ${MAX_POOL} photos can be loaded at once; ${files.length - room} skipped.`)
    setErrors(errs)
    if (ok.length) onAdd(ok)
    setBusy(false)
    if (input.current) input.current.value = ''
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-6 px-4 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-5xl sm:text-6xl">Bring your own photos</h1>
          <Squiggle className="mt-1 h-3 w-48 text-accent" />
        </div>
        <Btn variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} /> Back to setup
        </Btn>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          setOver(true)
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setOver(false)
          void handle(e.dataTransfer.files)
        }}
        className={`sk sk-card flex flex-col items-center gap-3 p-8 text-center ${over ? 'bg-hl' : 'crosshatch'}`}
      >
        <UploadCloud size={40} />
        <h2 className="text-3xl">Drop photos here</h2>
        <p className="max-w-md text-sm text-graphite">JPG, PNG, WebP, GIF or AVIF up to {MAX_FILE_MB} MB each. They never leave this browser tab.</p>
        <input ref={input} id="photo-upload" type="file" accept="image/*" multiple className="sr-only" onChange={(e) => void handle(e.target.files)} />
        <Btn variant="accent" disabled={busy || photos.length >= MAX_POOL} onClick={() => input.current?.click()}>
          <ImagePlus size={18} /> {busy ? 'Reading…' : 'Choose photos'}
        </Btn>
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="sk grid gap-1 px-4 py-3 text-sm text-accent">
          {errors.map((e, i) => (
            <li key={i}>• {e}</li>
          ))}
        </ul>
      )}

      <Panel title={`Your photos (${photos.length})`} note="the first ones fill the frame in order; reorder with the arrows">
        {photos.length === 0 ? (
          <p className="py-6 text-center font-note text-muted">No photos yet. Add a few above to continue.</p>
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((p, i) => (
              <li key={p.id} className="relative">
                <div className="paper-mount !p-2">
                  <img src={p.url} alt={`Uploaded photo ${i + 1}`} className="aspect-[4/3] w-full object-cover" />
                </div>
                <span className="absolute -left-2 -top-2 grid h-8 w-8 place-items-center rounded-full border-2 border-ink bg-hl font-hand text-lg">{i + 1}</span>
                <div className="mt-2 flex justify-center gap-1">
                  <Btn size="icon" variant="ghost" aria-label={`Move photo ${i + 1} earlier`} disabled={i === 0} onClick={() => onMove(p.id, -1)}>
                    <ChevronLeft size={18} />
                  </Btn>
                  <Btn size="icon" variant="ghost" aria-label={`Move photo ${i + 1} later`} disabled={i === photos.length - 1} onClick={() => onMove(p.id, 1)}>
                    <ChevronRight size={18} />
                  </Btn>
                  <Btn size="icon" variant="ghost" aria-label={`Remove photo ${i + 1}`} onClick={() => onRemove(p.id)}>
                    <Trash2 size={18} />
                  </Btn>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="How many slots in the frame?">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Frame photo count">
          {PHOTO_COUNTS.map((n) => (
            <Chip key={n} on={n === count} onClick={() => onCount(n)} className="min-w-11 justify-center">
              {n}
            </Chip>
          ))}
        </div>
        {photos.length > 0 && photos.length < count && (
          <p className="mt-2">
            <Note className="text-accent" rotate={-1}>
              you have {photos.length}, so {count - photos.length} slot{count - photos.length > 1 ? 's' : ''} will stay empty until you add more
            </Note>
          </p>
        )}
        {photos.length > count && (
          <p className="mt-2">
            <Note className="text-inkblue" rotate={-1}>
              extra photos stay in your pool; you can swap them into slots on the next screen
            </Note>
          </p>
        )}
      </Panel>

      <div className="flex justify-end">
        <Btn variant="accent" className="text-lg" disabled={photos.length === 0} onClick={onNext}>
          Choose a frame <ArrowRight size={18} />
        </Btn>
      </div>
    </div>
  )
}
