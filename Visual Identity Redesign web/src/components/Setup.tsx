import { ArrowRight, Clock, ImagePlus, Lock } from 'lucide-react'
import type { Settings } from '../types'
import { PHOTO_COUNTS } from '../lib/templates'
import { FILTERS } from '../lib/filters'
import { Arrow, Btn, Chip, Note, Panel, Squiggle, Toggle } from './ui'

export default function Setup({
  settings,
  onSettings,
  onNext,
  onUpload,
}: {
  settings: Settings
  onSettings: (p: Partial<Settings>) => void
  onNext: () => void
  onUpload: () => void
}) {
  const total = settings.countdown + (settings.count - 1) * settings.interval + settings.count * 0.5
  const intervalPreset = [2, 3, 5, 10]

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-8 lg:grid-cols-[minmax(0,1fr)_330px]">
      <div className="grid gap-6">
        <div>
          <h1 className="text-5xl sm:text-6xl">Set up your booth</h1>
          <Squiggle className="mt-1 h-3 w-48 text-accent" />
          <p className="mt-2 max-w-xl text-graphite">Decide how many shots, how long to wait, and how the camera behaves. Every choice here is used in your capture session.</p>
        </div>

        <Panel title="How many photos?" note="pick one">
          <div role="group" aria-label="Photo count" className="flex flex-wrap gap-2">
            {PHOTO_COUNTS.map((n) => (
              <Chip key={n} on={settings.count === n} onClick={() => onSettings({ count: n })} className="min-w-14 justify-center text-lg">
                {n}
              </Chip>
            ))}
          </div>
          <p className="mt-3 flex items-center gap-2 text-inkblue">
            <Arrow variant={2} className="h-7 w-10 shrink-0" draw={false} />
            <Note rotate={-1}>next you will pick a frame that fits exactly {settings.count} {settings.count === 1 ? 'photo' : 'photos'}</Note>
          </p>
        </Panel>

        <Panel title="Timing" note="two separate delays">
          <div className="grid gap-5 md:grid-cols-2">
            <fieldset>
              <legend className="mb-2 font-note font-bold">Countdown before the first photo</legend>
              <div className="flex flex-wrap gap-2">
                {[0, 3, 5, 10].map((s) => (
                  <Chip key={s} on={settings.countdown === s} onClick={() => onSettings({ countdown: s })}>
                    {s === 0 ? 'None' : `${s}s`}
                  </Chip>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-2 font-note font-bold">Pause between photos</legend>
              <div className="flex flex-wrap gap-2">
                {intervalPreset.map((s) => (
                  <Chip key={s} on={!settings.customInterval && settings.interval === s} onClick={() => onSettings({ interval: s, customInterval: false })}>
                    {s}s
                  </Chip>
                ))}
                <Chip on={settings.customInterval} onClick={() => onSettings({ customInterval: true })}>
                  Custom
                </Chip>
              </div>
              {settings.customInterval && (
                <label className="mt-3 flex items-center gap-2 font-note text-sm font-bold">
                  Seconds
                  <input
                    type="number"
                    min={1}
                    max={60}
                    inputMode="numeric"
                    className="field !w-24"
                    value={settings.interval}
                    onChange={(e) => onSettings({ interval: Math.min(60, Math.max(1, Math.round(Number(e.target.value) || 1))) })}
                  />
                  <span className="font-normal text-muted">(1 to 60)</span>
                </label>
              )}
            </fieldset>
          </div>
        </Panel>

        <Panel title="Camera" note="permission is asked only when you open the camera">
          <div className="grid gap-4 md:grid-cols-2">
            <fieldset>
              <legend className="mb-2 font-note font-bold">Which camera</legend>
              <div className="flex flex-wrap gap-2">
                <Chip on={settings.facing === 'user'} onClick={() => onSettings({ facing: 'user', deviceId: '' })}>
                  Front (selfie)
                </Chip>
                <Chip on={settings.facing === 'environment'} onClick={() => onSettings({ facing: 'environment', deviceId: '' })}>
                  Rear
                </Chip>
              </div>
              <p className="mt-2 text-xs text-muted">Have several cameras? You can pick a specific device once the live preview opens.</p>
            </fieldset>
            <div className="grid gap-1">
              <Toggle label="Mirror the preview" hint="Like a mirror while posing. Saved photos are never flipped." on={settings.mirror} onChange={(v) => onSettings({ mirror: v })} />
              <Toggle label="Flash animation" on={settings.flash} onChange={(v) => onSettings({ flash: v })} />
              <Toggle label="Shutter sound" on={settings.shutter} onChange={(v) => onSettings({ shutter: v })} />
              <Toggle label="Countdown beeps" hint="The big on-screen number always shows too." on={settings.countdownSound} onChange={(v) => onSettings({ countdownSound: v })} />
            </div>
          </div>
        </Panel>

        <Panel title="Look & restart" note="optional">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-1 font-note font-bold">
              Filter while shooting
              <select className="field" value={settings.captureFilter} onChange={(e) => onSettings({ captureFilter: e.target.value })}>
                {FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
              <span className="text-xs font-normal text-muted">Your originals stay untouched; you can change this per photo later.</span>
            </label>
            <Toggle label="Ask before restarting a session" hint="Prevents losing photos by accident." on={settings.confirmRestart} onChange={(v) => onSettings({ confirmRestart: v })} />
          </div>
        </Panel>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="sk sk-card relative p-5">
          <h2 className="text-3xl">Your session</h2>
          <dl className="mt-3 grid gap-2 font-note">
            {[
              ['Photos', `${settings.count}`],
              ['First countdown', settings.countdown ? `${settings.countdown} seconds` : 'None'],
              ['Pause between', settings.count > 1 ? `${settings.interval} seconds` : 'n/a'],
              ['Camera', `${settings.facing === 'user' ? 'Front' : 'Rear'}, ${settings.mirror ? 'mirrored' : 'unmirrored'} preview`],
              ['Filter', FILTERS.find((f) => f.id === settings.captureFilter)?.name ?? 'Original'],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 border-b border-dashed border-faint pb-1">
                <dt className="text-muted">{k}</dt>
                <dd className="text-right font-bold">{v}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 flex items-center gap-2 font-note text-sm text-graphite">
            <Clock size={16} /> About {Math.ceil(total)} seconds start to finish
          </p>
          <Btn variant="accent" className="mt-4 w-full text-lg" onClick={onNext}>
            Choose a frame <ArrowRight size={18} />
          </Btn>
          <Btn variant="ghost" className="mt-2 w-full" onClick={onUpload}>
            <ImagePlus size={16} /> Use uploaded photos instead
          </Btn>
          <p className="mt-4 flex gap-2 text-xs text-muted">
            <Lock size={14} className="mt-0.5 shrink-0" /> Photos are processed in your browser. Nothing is uploaded.
          </p>
        </div>
      </aside>
    </div>
  )
}
