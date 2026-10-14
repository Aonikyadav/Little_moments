import { useMemo } from 'react'
import { Camera, HardDrive, ImagePlus, Lock, ShieldCheck, Wand2 } from 'lucide-react'
import type { Template } from '../types'
import { CATEGORIES, TEMPLATES, templateById } from '../lib/templates'
import { Arrow, Btn, Note, Squiggle, Tape } from './ui'
import { TemplatePreview } from './shared'

export default function Home({
  recents,
  onStart,
  onUpload,
  onCategory,
  onTemplate,
  onPrivacy,
}: {
  recents: string[]
  onStart: () => void
  onUpload: () => void
  onCategory: (c: string) => void
  onTemplate: (t: Template) => void
  onPrivacy: () => void
}) {
  const hero = useMemo(() => TEMPLATES.filter((t) => t.count === 4).sort((a, b) => b.pop - a.pop)[0], [])
  const popular = useMemo(() => [...TEMPLATES].sort((a, b) => b.pop - a.pop).slice(0, 6), [])
  const recent = recents.map(templateById).filter((t): t is Template => !!t).slice(0, 6)
  const catCounts = useMemo(() => CATEGORIES.map((c) => ({ c, n: TEMPLATES.filter((t) => t.cats.includes(c)).length })), [])

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-16">
      <section className="grid items-center gap-10 py-10 md:grid-cols-[1.2fr_1fr] md:py-16">
        <div>
          <Note className="text-accent" rotate={-2}>
            sketchbook edition, page 1
          </Note>
          <h1 className="mt-1 text-6xl leading-[0.95] sm:text-7xl lg:text-8xl">Snap it. Doodle it. Keep it.</h1>
          <Squiggle className="mt-2 h-4 w-64 text-accent" />
          <p className="mt-5 max-w-lg text-lg text-graphite">A photo booth that lives in your browser. Take a few shots with a countdown, pick a hand-drawn frame, add stickers and words, then save the strip.</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Btn variant="accent" className="text-xl" onClick={onStart}>
              <Camera size={20} /> Start Photo Booth
            </Btn>
            <Btn className="text-lg" onClick={onUpload}>
              <ImagePlus size={20} /> Create from uploaded photos
            </Btn>
          </div>
          <p className="mt-4 flex items-center gap-2 text-sm text-muted">
            <Lock size={14} /> Nothing is uploaded. Photos stay in this tab.
          </p>
        </div>

        <div className="relative mx-auto w-full max-w-[300px] rotate-2">
          <Tape className="-top-3 left-1/2 -translate-x-1/2 -rotate-3" />
          <div className="paper-mount !p-3">
            <TemplatePreview tpl={hero} maxSide={560} label="Example photo strip" />
          </div>
          <div className="absolute -left-2 bottom-6 hidden -translate-x-full items-center gap-1 text-inkblue md:flex">
            <Note rotate={-6}>your strip!</Note>
            <Arrow variant={1} className="h-8 w-12" draw={false} />
          </div>
        </div>
      </section>

      <section aria-labelledby="how" className="border-t-2 border-dashed border-faint py-10">
        <h2 id="how" className="text-4xl">How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-4">
          {[
            ['1', 'Set up', 'Photos, countdown, camera.'],
            ['2', 'Pick a frame', 'Filtered to your photo count.'],
            ['3', 'Shoot', 'Retake any single shot.'],
            ['4', 'Decorate & save', 'Filters, stickers, PNG or JPG.'],
          ].map(([n, t, d]) => (
            <li key={n} className="sk sk-card p-4">
              <span className="font-hand text-4xl text-accent">{n}</span>
              <h3 className="text-2xl">{t}</h3>
              <p className="text-sm text-graphite">{d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="styles" className="border-t-2 border-dashed border-faint py-10">
        <h2 id="styles" className="text-4xl">Browse by style</h2>
        <ul className="mt-4 flex flex-wrap gap-3">
          {catCounts.map(({ c, n }, i) => (
            <li key={c}>
              <button type="button" onClick={() => onCategory(c)} className="sk btn" style={{ transform: `rotate(${((i % 5) - 2) * 0.6}deg)` }}>
                {c} <span className="text-muted">{n}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {recent.length > 0 && (
        <section aria-labelledby="recent" className="border-t-2 border-dashed border-faint py-10">
          <h2 id="recent" className="text-4xl">Recently used</h2>
          <TemplateRow list={recent} onPick={onTemplate} />
        </section>
      )}

      <section aria-labelledby="pop" className="border-t-2 border-dashed border-faint py-10">
        <h2 id="pop" className="text-4xl">Popular frames</h2>
        <TemplateRow list={popular} onPick={onTemplate} />
      </section>

      <section aria-labelledby="priv" className="border-t-2 border-dashed border-faint py-10">
        <h2 id="priv" className="text-4xl">Private by design</h2>
        <ul className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            [ShieldCheck, 'Camera only on request', 'Your browser asks permission when you open the live preview. Say no and uploading still works.'],
            [HardDrive, 'Stays on this device', 'No account, no server. Only your settings and favorites are remembered in local storage.'],
            [Wand2, 'Originals stay untouched', 'Filters and crops are non-destructive until you export.'],
          ].map(([Icon, t, d]) => {
            const I = Icon as typeof Lock
            return (
              <li key={t as string} className="sk sk-card p-4">
                <I size={26} />
                <h3 className="mt-1 text-2xl">{t as string}</h3>
                <p className="text-sm text-graphite">{d as string}</p>
              </li>
            )
          })}
        </ul>
        <Btn className="mt-4" variant="ghost" onClick={onPrivacy}>
          Read the privacy details
        </Btn>
      </section>
    </div>
  )
}

function TemplateRow({ list, onPick }: { list: Template[]; onPick: (t: Template) => void }) {
  return (
    <ul className="no-scroll mt-4 flex gap-5 overflow-x-auto pb-3 pt-1">
      {list.map((t) => (
        <li key={t.id} className="w-40 shrink-0">
          <button type="button" onClick={() => onPick(t)} className="sk sk-card block w-full p-2 text-left" aria-label={`Use ${t.name}, ${t.count} photos`}>
            <TemplatePreview tpl={t} maxSide={240} />
            <span className="mt-1 block truncate font-note font-bold">{t.name}</span>
            <span className="text-xs text-muted">{t.count} {t.count === 1 ? 'photo' : 'photos'}</span>
          </button>
        </li>
      ))}
    </ul>
  )
}
