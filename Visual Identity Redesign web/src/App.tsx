import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Moon, Plus, ShieldCheck, Sun } from 'lucide-react'
import type { Design, Photo, Settings, Stage, Template } from './types'
import { templateById } from './lib/templates'
import { DEFAULT_EDIT } from './lib/filters'
import { applyTemplate, createDesign, uid } from './lib/design'
import { useHistory } from './lib/useHistory'
import { clearAllLocal, DEFAULT_SETTINGS, hasSavedLook, loadList, loadLook, loadSettings, loadTheme, saveLook, saveList, saveSettings, saveTheme } from './lib/storage'
import { readImageFile } from './lib/files'
import { Btn, Logo, Modal, RoughFilter } from './components/ui'
import { useImages } from './components/shared'
import Home from './components/Home'
import Setup from './components/Setup'
import Upload from './components/Upload'
import Templates from './components/Templates'
import Capture from './components/Capture'
import type { Shot } from './components/Capture'
import Review from './components/Review'
import Editor from './components/Editor'
import Export from './components/Export'

type CapMode = { kind: 'new' } | { kind: 'slot'; slot: number } | { kind: 'all' }
type Confirm = { title: string; body: string; label: string; onYes: () => void } | null

const STEPS: { stage: Stage; label: string; session: boolean | null }[] = [
  { stage: 'setup', label: 'Setup', session: false },
  { stage: 'templates', label: 'Frame', session: null },
  { stage: 'review', label: 'Review', session: true },
  { stage: 'editor', label: 'Edit', session: true },
  { stage: 'export', label: 'Export', session: true },
]

export default function App() {
  const [stage, setStage] = useState<Stage>('home')
  const [source, setSource] = useState<'camera' | 'upload'>('camera')
  const [settings, setSettings] = useState<Settings>(() => loadSettings())
  const [photos, setPhotos] = useState<Photo[]>([])
  const hist = useHistory<Design | null>(null)
  const design = hist.state
  const [favs, setFavs] = useState<string[]>(() => loadList('favs'))
  const [recents, setRecents] = useState<string[]>(() => loadList('recents'))
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadTheme())
  const [chosen, setChosen] = useState<Template | null>(null)
  const [capMode, setCapMode] = useState<CapMode>({ kind: 'new' })
  const [initialCat, setInitialCat] = useState('')
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [privacy, setPrivacy] = useState(false)
  const [toast, setToast] = useState('')
  const [savedLook, setSavedLook] = useState(() => hasSavedLook())
  const photosRef = useRef(photos)
  photosRef.current = photos
  const imgs = useImages(photos)

  const tpl = design ? templateById(design.templateId) ?? null : null

  useEffect(() => saveSettings(settings), [settings])
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    saveTheme(theme)
  }, [theme])
  useEffect(() => () => photosRef.current.forEach((p) => URL.revokeObjectURL(p.url)), [])
  useEffect(() => {
    if (!photos.length) return
    const h = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', h)
    return () => window.removeEventListener('beforeunload', h)
  }, [photos.length])
  useEffect(() => {
    if (!toast) return
    const t = window.setTimeout(() => setToast(''), 4500)
    return () => window.clearTimeout(t)
  }, [toast])
  useEffect(() => window.scrollTo({ top: 0 }), [stage])

  const patchSettings = useCallback((p: Partial<Settings>) => setSettings((s) => ({ ...s, ...p })), [])
  const setDesign = useCallback((u: (d: Design) => Design, key?: string) => hist.set((d) => (d ? u(d) : d), key), [hist.set])

  const toggleFav = (id: string) => {
    const n = favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs]
    setFavs(n)
    saveList('favs', n)
  }
  const pushRecent = (id: string) => {
    const n = [id, ...recents.filter((x) => x !== id)].slice(0, 12)
    setRecents(n)
    saveList('recents', n)
  }

  const resetSession = () => {
    photosRef.current.forEach((p) => URL.revokeObjectURL(p.url))
    setPhotos([])
    hist.replace(null)
    setChosen(null)
    setCapMode({ kind: 'new' })
  }

  const begin = (next: Stage, src: 'camera' | 'upload', then?: () => void) => {
    const go = () => {
      resetSession()
      setSource(src)
      then?.()
      setStage(next)
    }
    if (design || photos.length) {
      setConfirm({ title: 'Start a new session?', body: 'Your current photos and edits will be discarded. Export first if you want to keep them.', label: 'Start new session', onYes: go })
    } else {
      go()
    }
  }

  const useTemplate = (t: Template) => {
    pushRecent(t.id)
    if (design) {
      const filled = design.slotAssign.filter(Boolean).length
      const apply = () => {
        hist.set((d) => (d ? applyTemplate(d, t, photos.map((p) => p.id)) : d))
        patchSettings({ count: t.count })
        setStage('review')
      }
      if (t.count < filled) {
        setConfirm({ title: 'Switch to a smaller frame?', body: `“${t.name}” holds ${t.count} photos but ${filled} are in use. The extra photos are kept safe and you can swap them back in from Review.`, label: 'Switch frame', onYes: apply })
      } else apply()
      return
    }
    if (source === 'upload') {
      hist.replace(createDesign(t, photos.map((p) => p.id)))
      setStage('review')
    } else {
      setChosen(t)
      setCapMode({ kind: 'new' })
      patchSettings({ count: t.count })
      setStage('capture')
    }
  }

  const makePhotos = (shots: Shot[]): Photo[] => shots.map((s) => ({ id: uid('p'), url: s.url, w: s.w, h: s.h, rev: 0 }))

  const onCaptured = (shots: Shot[]) => {
    if (!shots.length) return
    if (capMode.kind === 'slot' && design) {
      const id = design.slotAssign[capMode.slot]
      if (id) {
        const old = photos.find((p) => p.id === id)
        if (old) URL.revokeObjectURL(old.url)
        setPhotos((ps) => ps.map((p) => (p.id === id ? { ...p, url: shots[0].url, w: shots[0].w, h: shots[0].h, rev: p.rev + 1 } : p)))
        setDesign((d) => ({ ...d, edits: { ...d.edits, [id]: { ...(d.edits[id] ?? DEFAULT_EDIT), zoom: 1, offX: 0, offY: 0, rotate: 0, flipH: false } } }))
      }
      setStage('review')
      return
    }
    const t = capMode.kind === 'all' && tpl ? tpl : chosen
    if (!t) return
    const np = makePhotos(shots)
    photos.forEach((p) => URL.revokeObjectURL(p.url))
    setPhotos(np)
    const base = createDesign(t, np.map((p) => p.id), settings.captureFilter)
    if (capMode.kind === 'all' && design) hist.replace({ ...base, style: design.style, stickers: design.stickers, texts: design.texts })
    else hist.replace(base)
    setStage('review')
  }

  const replacePhoto = async (target: string, file: File) => {
    try {
      const np = await readImageFile(file)
      if (target.startsWith('new:')) {
        const slot = Number(target.slice(4))
        setPhotos((ps) => [...ps, np])
        setDesign((d) => ({ ...d, slotAssign: d.slotAssign.map((x, i) => (i === slot ? np.id : x)), edits: { ...d.edits, [np.id]: { ...DEFAULT_EDIT, filter: tpl?.defaultFilter ?? 'original' } } }))
      } else {
        const old = photos.find((p) => p.id === target)
        if (old) URL.revokeObjectURL(old.url)
        setPhotos((ps) => ps.map((p) => (p.id === target ? { ...p, url: np.url, w: np.w, h: np.h, rev: p.rev + 1 } : p)))
        setDesign((d) => ({ ...d, edits: { ...d.edits, [target]: { ...(d.edits[target] ?? DEFAULT_EDIT), zoom: 1, offX: 0, offY: 0, rotate: 0, flipH: false } } }))
      }
    } catch (e) {
      setToast(e instanceof Error ? e.message : 'That image could not be read.')
    }
  }

  const assign = (slot: number, id: string | null) =>
    setDesign((d) => {
      const a = [...d.slotAssign]
      if (id) {
        const other = a.indexOf(id)
        if (other >= 0 && other !== slot) a[other] = a[slot]
      }
      a[slot] = id
      return { ...d, slotAssign: a }
    })

  const retakeAll = () => {
    const go = () => {
      setCapMode({ kind: 'all' })
      setStage('capture')
    }
    if (settings.confirmRestart) setConfirm({ title: 'Retake all photos?', body: 'The current photos will be replaced. Frame, stickers and text are kept.', label: 'Retake all', onYes: go })
    else go()
  }

  const restoreLook = () => {
    const look = loadLook()
    if (!look || !design || !tpl) return
    const t = templateById(look.templateId)
    const use = t && t.count === design.slotAssign.length ? t : tpl
    setDesign((d) => {
      const edits = { ...d.edits }
      d.slotAssign.forEach((id, i) => {
        const e = look.editsBySlot[i]
        if (id && e) edits[id] = e
      })
      return { ...d, templateId: use.id, style: look.style, stickers: look.stickers, texts: look.texts, edits }
    })
    setToast('Saved look restored.')
  }

  const reachable = (s: (typeof STEPS)[number]) => (s.session === null ? true : s.session ? !!design : !design)

  const stepCurrent = (s: Stage) => (stage === 'upload' ? s === 'setup' : stage === 'capture' ? s === 'templates' : stage === s)

  const countForCapture = capMode.kind === 'slot' ? 1 : (capMode.kind === 'all' ? tpl?.count : chosen?.count) ?? settings.count
  const captureTpl = capMode.kind === 'all' ? tpl ?? undefined : capMode.kind === 'new' ? chosen ?? undefined : undefined

  const main = (() => {
    switch (stage) {
      case 'home':
        return (
          <Home
            recents={recents}
            onStart={() => (design ? setStage('review') : begin('setup', 'camera'))}
            onUpload={() => begin('upload', 'upload')}
            onCategory={(c) => {
              setInitialCat(c)
              if (design) setStage('templates')
              else begin('templates', 'camera')
            }}
            onTemplate={(t) => {
              if (design) {
                useTemplate(t)
                return
              }
              begin('capture', 'camera', () => {
                setChosen(t)
                setCapMode({ kind: 'new' })
                patchSettings({ count: t.count })
                pushRecent(t.id)
              })
            }}
            onPrivacy={() => setPrivacy(true)}
          />
        )
      case 'setup':
        return <Setup settings={settings} onSettings={patchSettings} onNext={() => (setInitialCat(''), setStage('templates'))} onUpload={() => (setSource('upload'), setStage('upload'))} />
      case 'upload':
        return (
          <Upload
            photos={photos}
            count={settings.count}
            onCount={(n) => patchSettings({ count: n })}
            onAdd={(ps) => setPhotos((x) => [...x, ...ps])}
            onRemove={(id) => {
              const p = photos.find((x) => x.id === id)
              if (p) URL.revokeObjectURL(p.url)
              setPhotos((x) => x.filter((y) => y.id !== id))
            }}
            onMove={(id, dir) =>
              setPhotos((x) => {
                const i = x.findIndex((p) => p.id === id)
                const j = i + dir
                if (i < 0 || j < 0 || j >= x.length) return x
                const n = [...x]
                ;[n[i], n[j]] = [n[j], n[i]]
                return n
              })
            }
            onBack={() => setStage('setup')}
            onNext={() => (setInitialCat(''), setStage('templates'))}
          />
        )
      case 'templates':
        return (
          <Templates
            key={initialCat}
            count={design ? design.slotAssign.length : settings.count}
            onCount={(n) => patchSettings({ count: n })}
            favs={favs}
            onFav={toggleFav}
            recents={recents}
            onUse={useTemplate}
            onBack={() => setStage(design ? 'review' : source === 'upload' ? 'upload' : 'setup')}
            backLabel={design ? 'Back to review' : source === 'upload' ? 'Back to photos' : 'Back to setup'}
            initialCategory={initialCat}
          />
        )
      case 'capture':
        return (
          <Capture
            key={`${capMode.kind}-${capMode.kind === 'slot' ? capMode.slot : ''}`}
            settings={settings}
            onSettings={patchSettings}
            total={countForCapture}
            retakeLabel={capMode.kind === 'slot' ? `Retaking photo ${capMode.slot + 1}` : capMode.kind === 'all' ? 'Retaking all photos' : undefined}
            tpl={captureTpl}
            onDone={onCaptured}
            onBack={() => setStage(capMode.kind === 'new' ? 'templates' : 'review')}
            onUpload={() => {
              if (capMode.kind === 'new') {
                setSource('upload')
                setStage('upload')
              } else setStage('review')
            }}
          />
        )
      case 'review':
        if (!design || !tpl) return null
        return (
          <Review
            photos={photos}
            design={design}
            tpl={tpl}
            imgs={imgs}
            canRetake={source === 'camera'}
            onEdit={(id, patch, key) => setDesign((d) => ({ ...d, edits: { ...d.edits, [id]: { ...(d.edits[id] ?? DEFAULT_EDIT), ...patch } } }), key ? `${key}:${id}` : undefined)}
            onResetPhoto={(id) => setDesign((d) => ({ ...d, edits: { ...d.edits, [id]: { ...DEFAULT_EDIT, filter: tpl.defaultFilter } } }))}
            onAssign={assign}
            onRetake={(slot) => {
              setCapMode({ kind: 'slot', slot })
              setStage('capture')
            }}
            onReplace={(t, f) => void replacePhoto(t, f)}
            onRetakeAll={retakeAll}
            onContinue={() => setStage('editor')}
            onLayout={() => setStage('templates')}
            onNew={() => begin('setup', 'camera')}
          />
        )
      case 'editor':
        if (!design || !tpl) return null
        return (
          <Editor
            photos={photos}
            design={design}
            tpl={tpl}
            imgs={imgs}
            setDesign={setDesign}
            undo={hist.undo}
            redo={hist.redo}
            canUndo={hist.canUndo}
            canRedo={hist.canRedo}
            onApplyTemplate={(t) => {
              pushRecent(t.id)
              hist.set((d) => (d ? applyTemplate(d, t, photos.map((p) => p.id)) : d))
              patchSettings({ count: t.count })
            }}
            onExport={() => setStage('export')}
            onReview={() => setStage('review')}
            onSaveLook={() => {
              saveLook(design)
              setSavedLook(true)
              setToast('Look saved on this device.')
            }}
            onRestoreLook={restoreLook}
            hasSaved={savedLook}
          />
        )
      case 'export':
        if (!design || !tpl) return null
        return <Export photos={photos} design={design} tpl={tpl} imgs={imgs} onBack={() => setStage('editor')} />
    }
  })()

  const content = main ?? (
    <div className="p-10 text-center">
      <p className="font-note">Nothing to show here yet.</p>
      <Btn className="mt-3" onClick={() => setStage('home')}>
        Go home
      </Btn>
    </div>
  )

  return (
    <div className="flex min-h-screen flex-col">
      <RoughFilter />
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-[100] focus:bg-card focus:p-2">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b-2 border-dashed border-faint bg-paper/90 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2">
          <button type="button" onClick={() => setStage('home')} className="flex items-center gap-2 text-left" aria-label="Sketchbooth home">
            <Logo className="h-9 w-10" />
            <span className="font-hand text-3xl leading-none">Sketchbooth</span>
          </button>
          <nav aria-label="Progress" className="order-3 w-full overflow-x-auto md:order-none md:w-auto md:flex-1 md:px-4">
            <ol className="flex items-center gap-1">
              {STEPS.filter((s) => s.session === null || s.session === !!design).map((s, i) => {
                const ok = reachable(s) && stage !== 'capture'
                const cur = stepCurrent(s.stage)
                return (
                  <li key={s.stage} className="flex items-center gap-1">
                    {i > 0 && <span aria-hidden="true" className="text-muted">→</span>}
                    <button
                      type="button"
                      disabled={!ok}
                      aria-current={cur ? 'step' : undefined}
                      onClick={() => {
                        if (s.stage === 'templates') setInitialCat('')
                        setStage(s.stage)
                      }}
                      className={`whitespace-nowrap px-2.5 py-1 font-note text-[0.95rem] font-bold disabled:opacity-40 ${cur ? 'bg-hl shadow-[2px_2px_0_var(--ink)]' : 'hover:bg-paper2'}`}
                      style={{ borderRadius: '8px 3px 8px 3px' }}
                    >
                      {s.label}
                    </button>
                  </li>
                )
              })}
              {stage === 'capture' && (
                <li className="flex items-center gap-1">
                  <span aria-hidden="true" className="text-muted">→</span>
                  <span aria-current="step" className="bg-hl px-2.5 py-1 font-note font-bold" style={{ borderRadius: '8px 3px 8px 3px' }}>
                    Shoot
                  </span>
                </li>
              )}
            </ol>
          </nav>
          <div className="ml-auto flex items-center gap-1">
            {(design || photos.length > 0) && (
              <Btn size="sm" variant="ghost" onClick={() => begin('setup', 'camera')}>
                <Plus size={15} /> New
              </Btn>
            )}
            <Btn size="icon" variant="ghost" aria-label="Privacy and local data" title="Privacy and local data" onClick={() => setPrivacy(true)}>
              <ShieldCheck size={19} />
            </Btn>
            <Btn size="icon" variant="ghost" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              {theme === 'dark' ? <Sun size={19} /> : <Moon size={19} />}
            </Btn>
          </div>
        </div>
      </header>

      <main id="main" className="flex-1">
        {content}
      </main>

      <footer className="border-t-2 border-dashed border-faint px-4 py-5 text-center font-note text-sm text-muted">Everything happens in your browser. No photos are uploaded or stored on a server.</footer>

      <div aria-live="polite" className="pointer-events-none fixed bottom-4 left-1/2 z-[95] -translate-x-1/2 px-4">
        {toast && <p className="sk sk-card pointer-events-auto bg-card px-4 py-2 font-note font-bold">{toast}</p>}
      </div>

      {confirm && (
        <Modal title={confirm.title} onClose={() => setConfirm(null)}>
          <p className="text-graphite">{confirm.body}</p>
          <div className="mt-4 flex justify-end gap-2">
            <Btn onClick={() => setConfirm(null)}>Cancel</Btn>
            <Btn
              variant="accent"
              onClick={() => {
                const y = confirm.onYes
                setConfirm(null)
                y()
              }}
            >
              {confirm.label}
            </Btn>
          </div>
        </Modal>
      )}

      {privacy && (
        <Modal title="Privacy and local data" onClose={() => setPrivacy(false)}>
          <ul className="grid list-disc gap-2 pl-5 text-graphite">
            <li>The camera is used only on the capture screen, and your browser asks first. Closing the screen stops it.</li>
            <li>Photos are processed on your device. There is no server, account or analytics.</li>
            <li>Photos and edits are held in memory only. Closing or reloading the tab discards them, so export what you want to keep.</li>
            <li>Saved on this device: your booth settings, favorite frames, recently used frames, theme, and one saved look (no photos).</li>
          </ul>
          <div className="mt-4 flex justify-end gap-2">
            <Btn onClick={() => setPrivacy(false)}>Close</Btn>
            <Btn
              variant="accent"
              onClick={() => {
                clearAllLocal()
                setSettings(DEFAULT_SETTINGS)
                setFavs([])
                setRecents([])
                setSavedLook(false)
                setTheme('light')
                setPrivacy(false)
                setToast('Local data cleared.')
              }}
            >
              Clear local data
            </Btn>
          </div>
        </Modal>
      )}
    </div>
  )
}
