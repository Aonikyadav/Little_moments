import { useMemo, useState } from 'react'
import { ArrowLeft, Eye, Search, Star } from 'lucide-react'
import type { Template } from '../types'
import { CATEGORIES, PHOTO_COUNTS, orientationOf, templatesForCount } from '../lib/templates'
import { Btn, Chip, Modal, Note, Squiggle } from './ui'
import { TemplatePreview } from './shared'

type Sort = 'popular' | 'newest' | 'recent'

export default function Templates({
  count,
  onCount,
  favs,
  onFav,
  recents,
  onUse,
  onBack,
  backLabel,
  initialCategory,
}: {
  count: number
  onCount: (n: number) => void
  favs: string[]
  onFav: (id: string) => void
  recents: string[]
  onUse: (t: Template) => void
  onBack: () => void
  backLabel: string
  initialCategory?: string
}) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>(initialCategory ?? '')
  const [orient, setOrient] = useState('')
  const [tone, setTone] = useState('')
  const [sort, setSort] = useState<Sort>('popular')
  const [favOnly, setFavOnly] = useState(false)
  const [preview, setPreview] = useState<Template | null>(null)

  const base = useMemo(() => templatesForCount(count), [count])

  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    const r = base
      .filter((t) => !cat || t.cats.includes(cat))
      .filter((t) => !orient || orientationOf(t) === orient)
      .filter((t) => !tone || t.tone === tone)
      .filter((t) => !favOnly || favs.includes(t.id))
      .filter((t) => !s || t.name.toLowerCase().includes(s) || t.cats.some((c) => c.toLowerCase().includes(s)))
    const rIdx = (id: string) => {
      const i = recents.indexOf(id)
      return i < 0 ? 999 : i
    }
    return [...r].sort((a, b) => (sort === 'popular' ? b.pop - a.pop : sort === 'newest' ? b.added - a.added : rIdx(a.id) - rIdx(b.id) || b.pop - a.pop))
  }, [base, q, cat, orient, tone, favOnly, favs, sort, recents])

  const catCount = (c: string) => base.filter((t) => t.cats.includes(c)).length

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-5xl sm:text-6xl">Pick a frame</h1>
          <Squiggle className="mt-1 h-3 w-40 text-accent" />
        </div>
        <Btn variant="ghost" onClick={onBack}>
          <ArrowLeft size={16} /> {backLabel}
        </Btn>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="font-note font-bold">Photos in this strip:</span>
        <div role="group" aria-label="Photo count" className="flex flex-wrap gap-2">
          {PHOTO_COUNTS.map((n) => (
            <Chip key={n} on={n === count} onClick={() => onCount(n)} className="min-w-11 justify-center">
              {n}
            </Chip>
          ))}
        </div>
        <Note className="text-inkblue" rotate={-1}>
          only frames with {count} {count === 1 ? 'slot' : 'slots'} are shown
        </Note>
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="sk sk-card grid content-start gap-4 p-4 lg:sticky lg:top-24 lg:self-start">
          <label className="relative block">
            <span className="sr-only">Search frames</span>
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input className="field !pl-9" placeholder="Search frames…" value={q} onChange={(e) => setQ(e.target.value)} />
          </label>

          <fieldset>
            <legend className="mb-1.5 font-note text-sm font-bold">Style</legend>
            <div className="flex max-h-56 flex-wrap gap-1.5 overflow-auto pr-1 lg:max-h-none">
              <Chip on={!cat} onClick={() => setCat('')}>
                All
              </Chip>
              {CATEGORIES.map((c) => (
                <Chip key={c} on={cat === c} disabled={catCount(c) === 0} onClick={() => setCat(cat === c ? '' : c)} className="!min-h-8 !text-[0.85rem]">
                  {c} <span className="text-muted">{catCount(c)}</span>
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 font-note text-sm font-bold">Orientation</legend>
            <div className="flex flex-wrap gap-1.5">
              {['', 'portrait', 'landscape', 'square'].map((o) => (
                <Chip key={o} on={orient === o} onClick={() => setOrient(o)} className="!min-h-8 !text-[0.85rem] capitalize">
                  {o || 'Any'}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-1.5 font-note text-sm font-bold">Colour</legend>
            <div className="flex flex-wrap gap-1.5">
              {[
                ['', 'Any'],
                ['light', 'Light'],
                ['dark', 'Dark'],
                ['color', 'Colourful'],
              ].map(([v, l]) => (
                <Chip key={v} on={tone === v} onClick={() => setTone(v)} className="!min-h-8 !text-[0.85rem]">
                  {l}
                </Chip>
              ))}
            </div>
          </fieldset>

          <label className="grid gap-1 font-note text-sm font-bold">
            Sort by
            <select className="field" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
              <option value="popular">Popular</option>
              <option value="newest">Newest</option>
              <option value="recent" disabled={!recents.length}>
                Recently used
              </option>
            </select>
          </label>

          <Chip on={favOnly} onClick={() => setFavOnly(!favOnly)}>
            <Star size={14} /> Favorites only ({favs.filter((id) => base.some((t) => t.id === id)).length})
          </Chip>
        </aside>

        <section aria-label="Frames">
          <p className="mb-3 font-note text-muted" role="status">
            {list.length} {list.length === 1 ? 'frame' : 'frames'} for {count} {count === 1 ? 'photo' : 'photos'}
          </p>
          {list.length === 0 ? (
            <div className="sk sk-card p-10 text-center">
              <h2 className="text-3xl">Nothing here yet</h2>
              <p className="mt-1 text-graphite">Try clearing a filter, or choose a different number of photos.</p>
              <Btn
                className="mt-4"
                onClick={() => {
                  setQ('')
                  setCat('')
                  setOrient('')
                  setTone('')
                  setFavOnly(false)
                }}
              >
                Clear filters
              </Btn>
            </div>
          ) : (
            <ul className="wob grid grid-cols-2 gap-5 sm:grid-cols-3 xl:grid-cols-4">
              {list.map((t) => (
                <li key={t.id} className="sk sk-card group flex flex-col p-3">
                  <button type="button" onClick={() => setPreview(t)} className="block overflow-hidden rounded-sm bg-paper2 p-3 dots-bg" aria-label={`Preview ${t.name}`}>
                    <div className="mx-auto" style={{ width: `${Math.min(100, (t.w / Math.max(t.w, t.h)) * 100)}%` }}>
                      <TemplatePreview tpl={t} maxSide={360} className="shadow-[3px_4px_0_var(--shade)] transition-transform group-hover:-rotate-1" />
                    </div>
                  </button>
                  <div className="mt-2 flex items-start justify-between gap-1">
                    <div className="min-w-0">
                      <h3 className="truncate text-xl leading-tight">{t.name}</h3>
                      <p className="truncate text-xs text-muted">{t.cats.join(' · ')}</p>
                    </div>
                    <button type="button" aria-pressed={favs.includes(t.id)} aria-label={`${favs.includes(t.id) ? 'Remove' : 'Add'} ${t.name} ${favs.includes(t.id) ? 'from' : 'to'} favorites`} onClick={() => onFav(t.id)} className="grid h-9 w-9 shrink-0 place-items-center rounded-full hover:bg-paper2">
                      <Star size={20} className={favs.includes(t.id) ? 'fill-hl text-ink' : 'text-ink'} />
                    </button>
                  </div>
                  <div className="mt-auto flex gap-2 pt-3">
                    <Btn size="sm" variant="accent" className="flex-1" onClick={() => onUse(t)}>
                      Use frame
                    </Btn>
                    <Btn size="sm" aria-label={`Preview ${t.name}`} onClick={() => setPreview(t)}>
                      <Eye size={16} />
                    </Btn>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {preview && (
        <Modal title={preview.name} onClose={() => setPreview(null)}>
          <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_200px]">
            <div className="dots-bg grid place-items-center bg-paper2 p-5">
              <div className="w-full" style={{ maxWidth: `${Math.min(100, (preview.w / Math.max(preview.w, preview.h)) * 100)}%` }}>
                <TemplatePreview tpl={preview} maxSide={640} className="shadow-[4px_6px_0_var(--shade)]" />
              </div>
            </div>
            <div className="grid content-start gap-2 font-note">
              <p>
                <b>{preview.count}</b> {preview.count === 1 ? 'photo' : 'photos'}
              </p>
              <p className="capitalize">{orientationOf(preview)} · {preview.w}×{preview.h}px base</p>
              <p className="text-sm text-muted">{preview.cats.join(' · ')}</p>
              <p className="text-sm text-muted">Sample sketches stand in for your photos. Colors, spacing and decorations stay editable afterwards.</p>
              <Btn variant="accent" onClick={() => onUse(preview)}>
                Use this frame
              </Btn>
              <Btn onClick={() => onFav(preview.id)}>
                <Star size={16} className={favs.includes(preview.id) ? 'fill-hl' : ''} /> {favs.includes(preview.id) ? 'Unfavorite' : 'Favorite'}
              </Btn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
