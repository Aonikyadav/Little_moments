import { useCallback, useEffect, useRef, useState } from 'react'
import { Camera, CameraOff, FlipHorizontal2, ImagePlus, RefreshCw, SwitchCamera, X } from 'lucide-react'
import type { Settings, Template } from '../types'
import { useCamera } from '../lib/useCamera'
import { beep, shutterSound, unlockAudio } from '../lib/audio'
import { FILTERS, cssFilterFor } from '../lib/filters'
import { Arrow, Btn, Note, Panel, Tape, Toggle } from './ui'

export interface Shot {
  url: string
  w: number
  h: number
}

type Sess = 'idle' | 'countdown' | 'capturing' | 'interval' | 'completed' | 'cancelled'

class Aborted extends Error {}

function sleep(ms: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(new Aborted())
    const t = window.setTimeout(() => {
      signal.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    const onAbort = () => {
      window.clearTimeout(t)
      reject(new Aborted())
    }
    signal.addEventListener('abort', onAbort, { once: true })
  })
}

interface Props {
  settings: Settings
  onSettings: (p: Partial<Settings>) => void
  total: number
  retakeLabel?: string
  tpl?: Template
  onDone: (shots: Shot[]) => void
  onBack: () => void
  onUpload: () => void
}

export default function Capture({ settings, onSettings, total, retakeLabel, onDone, onBack, onUpload }: Props) {
  const cam = useCamera(settings.facing, settings.deviceId)
  const [sess, setSess] = useState<Sess>('idle')
  const [idx, setIdx] = useState(0)
  const [tick, setTick] = useState(0)
  const [shots, setShots] = useState<Shot[]>([])
  const [flashKey, setFlashKey] = useState(0)
  const [err, setErr] = useState<string | null>(null)
  const acRef = useRef<AbortController | null>(null)
  const runningRef = useRef(false)
  const shotsRef = useRef<Shot[]>([])
  const handedOver = useRef(false)
  const settingsRef = useRef(settings)
  settingsRef.current = settings

  const discard = useCallback(() => {
    if (!handedOver.current) shotsRef.current.forEach((s) => URL.revokeObjectURL(s.url))
    shotsRef.current = []
  }, [])

  useEffect(
    () => () => {
      acRef.current?.abort()
      discard()
    },
    [discard],
  )

  const grab = useCallback(async (): Promise<Shot> => {
    const v = cam.videoRef.current
    if (!v || !v.videoWidth) throw new Error('The camera has no picture yet.')
    const c = document.createElement('canvas')
    c.width = v.videoWidth
    c.height = v.videoHeight
    c.getContext('2d')!.drawImage(v, 0, 0)
    const blob = await new Promise<Blob | null>((res) => c.toBlob(res, 'image/jpeg', 0.93))
    if (!blob) throw new Error('Could not save the photo.')
    return { url: URL.createObjectURL(blob), w: c.width, h: c.height }
  }, [cam.videoRef])

  const begin = async () => {
    if (runningRef.current || cam.status !== 'ready') return
    runningRef.current = true
    const ac = new AbortController()
    acRef.current = ac
    discard()
    setShots([])
    setErr(null)
    unlockAudio()
    try {
      for (let i = 0; i < total; i++) {
        setIdx(i)
        const s = settingsRef.current
        const wait = i === 0 ? s.countdown : s.interval
        setSess(i === 0 ? 'countdown' : 'interval')
        if (wait === 0) {
          setTick(0)
          await sleep(500, ac.signal)
        }
        for (let t = wait; t > 0; t--) {
          setTick(t)
          if (s.countdownSound) beep(t === 1 ? 880 : 620, 0.09)
          await sleep(1000, ac.signal)
        }
        setSess('capturing')
        setTick(0)
        const shot = await grab()
        if (ac.signal.aborted) {
          URL.revokeObjectURL(shot.url)
          throw new Aborted()
        }
        shotsRef.current = [...shotsRef.current, shot]
        setShots(shotsRef.current)
        if (s.flash) setFlashKey((k) => k + 1)
        if (s.shutter) shutterSound()
        await sleep(i === total - 1 ? 700 : 450, ac.signal)
      }
      setSess('completed')
      handedOver.current = true
      onDone(shotsRef.current)
    } catch (e) {
      if (e instanceof Aborted) {
        discard()
        setShots([])
        setSess('cancelled')
      } else {
        discard()
        setShots([])
        setSess('idle')
        setErr(e instanceof Error ? e.message : 'Something went wrong while capturing.')
      }
    } finally {
      runningRef.current = false
    }
  }

  const cancel = () => acRef.current?.abort()
  const leave = () => {
    acRef.current?.abort()
    onBack()
  }

  const running = sess === 'countdown' || sess === 'interval' || sess === 'capturing'
  const filterCss = cssFilterFor(settings.captureFilter)

  const message = (() => {
    if (cam.status === 'requesting') return 'Waiting for camera permission…'
    if (sess === 'countdown') return tick > 0 ? `Get ready: first photo in ${tick}` : 'Get ready…'
    if (sess === 'interval') return `Next photo in ${tick}`
    if (sess === 'capturing') return 'Smile!'
    if (sess === 'cancelled') return 'Session cancelled. Nothing was kept.'
    return 'Camera ready'
  })()

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <div className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h1 className="text-4xl sm:text-5xl">{retakeLabel ?? 'Strike a pose'}</h1>
          <p className="font-note text-lg font-bold" role="status" aria-live="polite">
            {running || sess === 'completed' ? `Photo ${Math.min(idx + 1, total)} of ${total}` : message}
          </p>
        </div>

        <div className="relative">
          <Tape className="-top-3 left-8 -rotate-6" />
          <Tape className="-top-3 right-10 rotate-3" color="color-mix(in oklab, var(--accent) 45%, transparent)" />
          <div className="paper-mount relative">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#2a2926]">
              <video
                ref={cam.videoRef}
                playsInline
                muted
                autoPlay
                aria-label="Live camera preview"
                className="h-full w-full object-cover"
                style={{ transform: settings.mirror ? 'scaleX(-1)' : undefined, filter: filterCss === 'brightness(1.00) contrast(1.00) saturate(1.00)' ? undefined : filterCss }}
              />

              <svg viewBox="0 0 100 75" className="pointer-events-none absolute inset-3 h-[calc(100%-1.5rem)] w-[calc(100%-1.5rem)] text-white/90" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="0.7" aria-hidden="true">
                <path d="M2 12V2h10M88 2h10v10M98 63v10H88M12 73H2V63" />
              </svg>

              {cam.status === 'requesting' && (
                <div className="absolute inset-0 grid place-items-center bg-black/55 p-6 text-center text-white">
                  <div>
                    <Camera className="mx-auto mb-2" size={36} />
                    <p className="font-hand text-3xl">Asking for your camera…</p>
                    <p className="mx-auto mt-1 max-w-xs text-sm">Choose “Allow” in your browser prompt. Pictures stay on this device.</p>
                  </div>
                </div>
              )}

              {cam.status === 'error' && cam.error && (
                <div className="absolute inset-0 grid place-items-center overflow-auto bg-paper p-5 text-ink">
                  <div className="max-w-md text-center">
                    <CameraOff className="mx-auto mb-2" size={40} />
                    <h2 className="text-3xl">No camera yet</h2>
                    <p className="mt-1 font-semibold">{cam.error.message}</p>
                    <ul className="mx-auto mt-2 grid gap-1 text-left text-sm text-graphite">
                      {cam.error.kind === 'denied' && (
                        <>
                          <li>• Click the camera or lock icon in the address bar and set Camera to “Allow”.</li>
                          <li>• Then press “Try again” below.</li>
                        </>
                      )}
                      {cam.error.kind === 'nodevice' && (
                        <>
                          <li>• Plug in or enable a camera, or choose another device.</li>
                          <li>• If you picked a specific camera, switch back to “Default camera”.</li>
                        </>
                      )}
                      {cam.error.kind === 'busy' && <li>• Close other apps or tabs using the camera, then try again.</li>}
                      {(cam.error.kind === 'unsupported' || cam.error.kind === 'other') && <li>• Try a current version of Chrome, Edge, Firefox or Safari over https.</li>}
                      <li>• No camera? You can upload photos instead and keep every editing feature.</li>
                    </ul>
                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                      <Btn variant="accent" onClick={cam.retry}>
                        <RefreshCw size={16} /> Try again
                      </Btn>
                      <Btn onClick={onUpload}>
                        <ImagePlus size={16} /> Upload photos instead
                      </Btn>
                    </div>
                  </div>
                </div>
              )}

              {(sess === 'countdown' || sess === 'interval') && tick > 0 && (
                <div className="pointer-events-none absolute inset-0 grid place-items-center bg-black/20">
                  <div className="text-center">
                    <span key={`${idx}-${tick}`} className="anim-pop block font-hand text-[9rem] leading-none text-white [paint-order:stroke_fill] [-webkit-text-stroke:6px_#1d1c1a] sm:text-[12rem]">
                      {tick}
                    </span>
                    <span className="font-note text-lg font-bold text-white [text-shadow:0_2px_0_#1d1c1a]">{sess === 'countdown' ? 'first photo' : `photo ${idx + 1} coming up`}</span>
                  </div>
                </div>
              )}

              {sess === 'cancelled' && (
                <div className="absolute inset-0 grid place-items-center bg-paper/90 p-6 text-center text-ink">
                  <div>
                    <h2 className="text-4xl">Session cancelled</h2>
                    <p className="mt-1 text-sm text-graphite">Partial photos were discarded. Camera stays on, so you can start again.</p>
                    <div className="mt-3 flex justify-center gap-2">
                      <Btn variant="accent" onClick={() => setSess('idle')}>
                        Ready again
                      </Btn>
                      <Btn onClick={leave}>Back</Btn>
                    </div>
                  </div>
                </div>
              )}

              {flashKey > 0 && <div key={flashKey} className="anim-flash pointer-events-none absolute inset-0 bg-white" />}
            </div>
          </div>
        </div>

        {err && (
          <p role="alert" className="sk px-4 py-2 font-note font-bold text-accent">
            {err}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {!running ? (
            <Btn variant="accent" className="px-6 text-lg" disabled={cam.status !== 'ready' || sess === 'cancelled'} onClick={begin}>
              <Camera size={20} /> {total === 1 ? 'Take the photo' : `Start ${total}-photo session`}
            </Btn>
          ) : (
            <Btn onClick={cancel}>
              <X size={18} /> Cancel session
            </Btn>
          )}
          <Btn variant="ghost" onClick={leave} disabled={sess === 'completed'}>
            Back
          </Btn>
          {sess === 'idle' && cam.status === 'ready' && (
            <span className="hidden items-center gap-2 text-inkblue sm:flex">
              <Arrow variant={3} className="h-8 w-12" draw={false} />
              <Note rotate={-3}>
                countdown {settings.countdown}s, then a photo every {settings.interval}s
              </Note>
            </span>
          )}
        </div>
      </div>

      <aside className="grid content-start gap-4">
        <Panel title="Contact sheet" note={`${shots.length}/${total}`}>
          <ol className={`grid gap-2 ${total > 4 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            {Array.from({ length: total }, (_, i) => {
              const s = shots[i]
              const current = running && i === idx
              return (
                <li key={i} className={`relative aspect-[4/3] overflow-hidden border-2 ${current ? 'border-accent' : 'border-ink'} ${s ? 'bg-paper2' : 'crosshatch border-dashed'}`} style={{ borderRadius: '6px 3px 7px 3px' }}>
                  {s ? <img src={s.url} alt={`Captured photo ${i + 1}`} className="h-full w-full object-cover" /> : <span className="absolute inset-0 grid place-items-center font-hand text-3xl text-muted">{i + 1}</span>}
                </li>
              )
            })}
          </ol>
        </Panel>

        <Panel title="Camera">
          <div className="grid gap-3">
            <div className="flex flex-wrap gap-2">
              <Btn size="sm" disabled={running} onClick={() => onSettings({ facing: settings.facing === 'user' ? 'environment' : 'user', deviceId: '' })}>
                <SwitchCamera size={16} /> {settings.facing === 'user' ? 'Front camera' : 'Rear camera'}
              </Btn>
              <Btn size="sm" aria-pressed={settings.mirror} disabled={running} onClick={() => onSettings({ mirror: !settings.mirror })}>
                <FlipHorizontal2 size={16} /> Mirror {settings.mirror ? 'on' : 'off'}
              </Btn>
            </div>
            {cam.devices.length > 1 && (
              <label className="grid gap-1 font-note text-sm font-bold">
                Camera device
                <select className="field" disabled={running} value={settings.deviceId} onChange={(e) => onSettings({ deviceId: e.target.value })}>
                  <option value="">Default camera</option>
                  {cam.devices.map((d, i) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera ${i + 1}`}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="grid gap-1 font-note text-sm font-bold">
              Capture filter (applied to results, editable later)
              <select className="field" disabled={running} value={settings.captureFilter} onChange={(e) => onSettings({ captureFilter: e.target.value })}>
                {FILTERS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <Toggle label="Flash animation" on={settings.flash} onChange={(v) => onSettings({ flash: v })} />
            <Toggle label="Shutter sound" on={settings.shutter} onChange={(v) => onSettings({ shutter: v })} />
            <Toggle label="Countdown beeps" on={settings.countdownSound} onChange={(v) => onSettings({ countdownSound: v })} />
          </div>
        </Panel>

        <Btn variant="ghost" onClick={onUpload} disabled={running}>
          <ImagePlus size={16} /> Use uploaded photos instead
        </Btn>
      </aside>
    </div>
  )
}
