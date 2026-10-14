import { useMemo, useRef, useState } from 'react'
import { Camera, Eraser, Maximize2, Palette, Pencil, RefreshCw, RotateCcw, RotateCw, Trash2, Upload } from 'lucide-react'
import type { Design, Photo, PhotoEdit, Template } from '../types'
import type { ImageSrc } from '../lib/render'
import { layoutSlots, photoKey } from '../lib/render'
import { DEFAULT_EDIT } from '../lib/filters'
import { unusedIds } from '../lib/design'
import { Arrow, Btn, Modal, Note, Squiggle } from './ui'
import { PhotoThumb } from './shared'

interface Props {
  photos: Photo[]
  design: Design
  tpl: Template
  imgs: Map<string, ImageSrc>
  canRetake: boolean
  onEdit: (id: string, patch: Partial<PhotoEdit>, key?: string) => void
  onResetPhoto: (id: string) => void
  onAssign: (slot: number, id: string | null) => void
  onRetake: (slot: number) => void
  onReplace: (id: string, file: File) => void
  onRetakeAll: () => void
  onContinue: () => void
  onLayout: () => void
  onNew: () => void
}

export default function Review(p: Props) {
  const { photos, design, tpl, imgs } = p
  const [big, setBig] = useState<number | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const replaceFor = useRef<string | null>(null)
  const slots = useMemo(() => layoutSlots(tpl, design.style).slots, [tpl, design.style])
  const byId = useMemo(() => new Map(photos.map((x) => [x.id, x])), [photos])
  const unused = unusedIds(design, photos.map((x) => x.id))

  const pickReplace = (id: string) => {
    replaceFor.current = id
    fileRef.current?.click()
  }

  const slotCard = (i: number) => {
    const pid = design.slotAssign[i]
    const photo = pid ? byId.get(pid) : undefined
    const aspect = slots[i].w / slots[i].h
    const edit = pid ? design.edits[pid] : undefined
    return (
      <li key={i} className="sk sk-card flex flex-col gap-3 p-3">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl">Slot {i + 1}</h3>
          {photo && (
            <Btn size="icon" variant="ghost" aria-label={`Enlarge photo in slot ${i + 1}`} onClick={() => setBig(i)}>
              <Maximize2 size={18} />
            </Btn>
          )}
        </div>
        {photo ? (
          <button type="button" onClick={() => setBig(i)} className="paper-mount !p-2 text-left" aria-label={`Open slot ${i + 1} larger`}>
            <PhotoThumb photo={photo} img={imgs.get(photoKey(photo))} edit={edit} aspect={aspect} width={320} label={`Photo in slot ${i + 1}`} />
          </button>
        ) : (
          <div className="crosshatch grid place-items-center border-2 border-dashed border-ink p-6 text-center" style={{ aspectRatio: String(aspect) }}>
            <span className="font-note font-bold">Empty slot</span>
          </div>
        )}

        <label className="grid gap-1 font-note text-sm font-bold">
          Photo in this slot
          <select className="field" value={pid ?? ''} onChange={(e) => p.onAssign(i, e.target.value || null)}>
            <option value="">Empty</option>
            {photos.map((ph, n) => (
              <option key={ph.id} value={ph.id}>
                Photo {n + 1}
              </option>
            ))}
          </select>
        </label>

        {photo ? (
          <div className="flex flex-wrap gap-1.5">
            {p.canRetake && (
              <Btn size="sm" onClick={() => p.onRetake(i)}>
                <Camera size={15} /> Retake
              </Btn>
            )}
            <Btn size="sm" onClick={() => pickReplace(photo.id)}>
              <Upload size={15} /> Replace
            </Btn>
            <Btn size="icon" aria-label="Rotate left" title="Rotate left" onClick={() => p.onEdit(photo.id, { rotate: (((edit ?? DEFAULT_EDIT).rotate + 3) % 4), offX: 0, offY: 0 })}>
              <RotateCcw size={16} />
            </Btn>
            <Btn size="icon" aria-label="Rotate right" title="Rotate right" onClick={() => p.onEdit(photo.id, { rotate: (((edit ?? DEFAULT_EDIT).rotate + 1) % 4), offX: 0, offY: 0 })}>
              <RotateCw size={16} />
            </Btn>
            <Btn size="sm" onClick={() => p.onResetPhoto(photo.id)}>
              <Eraser size={15} /> Reset edits
            </Btn>
            <Btn size="sm" variant="ghost" onClick={() => p.onAssign(i, null)}>
              <Trash2 size={15} /> Remove
            </Btn>
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {unused[0] && (
              <Btn size="sm" onClick={() => p.onAssign(i, unused[0])}>
                <RefreshCw size={15} /> Restore a photo
              </Btn>
            )}
            <Btn
              size="sm"
              onClick={() => {
                replaceFor.current = `new:${i}`
                fileRef.current?.click()
              }}
            >
              <Upload size={15} /> Add photo
            </Btn>
          </div>
        )}
      </li>
    )
  }

  const bigPhoto = big !== null && design.slotAssign[big] ? byId.get(design.slotAssign[big]!) : undefined

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="sr-only"
        aria-label="Choose a replacement image"
        onChange={(e) => {
          const f = e.target.files?.[0]
          const target = replaceFor.current
          if (f && target) p.onReplace(target, f)
          e.target.value = ''
        }}
      />
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-5xl sm:text-6xl">How did they turn out?</h1>
          <Squiggle className="mt-1 h-3 w-52 text-accent" />
          <p className="mt-2 flex items-center gap-2 text-inkblue">
            <Arrow variant={2} className="h-7 w-10" draw={false} />
            <Note>retake just one, swap them around, then keep editing</Note>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {p.canRetake && (
            <Btn onClick={p.onRetakeAll}>
              <Camera size={16} /> Retake all
            </Btn>
          )}
          <Btn onClick={p.onLayout}>
            <Palette size={16} /> Change frame
          </Btn>
          <Btn variant="accent" onClick={p.onContinue}>
            <Pencil size={16} /> Continue editing
          </Btn>
        </div>
      </div>

      <ul className="wob grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{design.slotAssign.map((_, i) => slotCard(i))}</ul>

      {unused.length > 0 && (
        <section className="mt-8">
          <h2 className="text-3xl">Not in the frame</h2>
          <p className="mb-3 text-sm text-muted">These photos are kept safe. Assign one to a slot above to bring it back.</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 md:grid-cols-6">
            {unused.map((id) => {
              const ph = byId.get(id)!
              return (
                <li key={id} className="paper-mount !p-1.5">
                  <PhotoThumb photo={ph} img={imgs.get(photoKey(ph))} edit={design.edits[id]} width={140} label="Unused photo" />
                </li>
              )
            })}
          </ul>
        </section>
      )}

      <div className="mt-8 flex flex-wrap justify-between gap-3 border-t-2 border-dashed border-faint pt-5">
        <Btn variant="ghost" onClick={p.onNew}>
          Start a new session
        </Btn>
        <Btn variant="accent" className="text-lg" onClick={p.onContinue}>
          Continue editing
        </Btn>
      </div>

      {bigPhoto && big !== null && (
        <Modal title={`Slot ${big + 1}`} onClose={() => setBig(null)} wide>
          <div className="paper-mount mx-auto max-w-3xl">
            <PhotoThumb photo={bigPhoto} img={imgs.get(photoKey(bigPhoto))} edit={design.edits[bigPhoto.id]} aspect={slots[big].w / slots[big].h} width={900} label={`Slot ${big + 1} enlarged`} />
          </div>
        </Modal>
      )}
    </div>
  )
}
