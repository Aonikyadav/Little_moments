import { useEffect, useRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { RotateCcw, X } from 'lucide-react'

export function RoughFilter() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
      <filter id="rough" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="4" result="n" />
        <feDisplacementMap in="SourceGraphic" in2="n" scale="3.2" />
      </filter>
    </svg>
  )
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'plain' | 'accent' | 'ghost'
  size?: 'md' | 'sm' | 'icon'
}

export function Btn({ variant = 'plain', size = 'md', className = '', type = 'button', ...p }: BtnProps) {
  const v = variant === 'accent' ? 'btn-accent' : variant === 'ghost' ? 'btn-ghost' : ''
  const s = size === 'sm' ? 'btn-sm' : size === 'icon' ? 'btn-icon' : ''
  return <button type={type} {...p} className={`sk btn ${v} ${s} ${className}`} />
}

export function Chip({ on, className = '', children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { on?: boolean }) {
  return (
    <button type="button" aria-pressed={on} {...p} className={`chip ${className}`}>
      {on && <span aria-hidden="true">✓</span>}
      {children}
    </button>
  )
}

export function Panel({ title, note, children, className = '' }: { title?: ReactNode; note?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`sk sk-card p-5 ${className}`}>
      {(title || note) && (
        <header className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3">
          {title && <h3 className="text-2xl leading-tight">{title}</h3>}
          {note && <span className="font-note text-sm text-muted">{note}</span>}
        </header>
      )}
      {children}
    </section>
  )
}

export function Arrow({ variant = 1, className = '', draw = true }: { variant?: 1 | 2 | 3; className?: string; draw?: boolean }) {
  const paths = {
    1: 'M6 52C20 14 62 6 100 34M84 18 102 35 80 44',
    2: 'M8 14C34 4 74 18 92 54M74 46 92 58 100 36',
    3: 'M104 40C80 70 30 66 8 30M22 28 7 29 10 46',
  }
  return (
    <svg viewBox="0 0 110 70" className={`${draw ? 'anim-draw' : ''} ${className}`} fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={paths[variant]} />
    </svg>
  )
}

export function Squiggle({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 14" preserveAspectRatio="none" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
      <path d="M3 9C24 2 36 12 58 6S96 4 118 9 158 3 197 7" />
    </svg>
  )
}

export function Note({ children, className = '', rotate = -2 }: { children: ReactNode; className?: string; rotate?: number }) {
  return (
    <span className={`font-note text-[0.95rem] leading-snug ${className}`} style={{ display: 'inline-block', transform: `rotate(${rotate}deg)` }}>
      {children}
    </span>
  )
}

export function Tape({ className = '', color = 'var(--hl)' }: { className?: string; color?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute z-10 block h-6 w-20 opacity-80 ${className}`}
      style={{ background: color, boxShadow: '0 1px 2px rgba(0,0,0,.2)', clipPath: 'polygon(0 8%,4% 0,8% 10%,100% 0,96% 100%,92% 90%,0 100%)' }}
    />
  )
}

export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  onReset,
  unit = '',
  resetValue = 0,
  decimals = 0,
}: {
  label: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  onReset?: () => void
  unit?: string
  resetValue?: number
  decimals?: number
}) {
  const id = `sl-${label.replace(/\W+/g, '-').toLowerCase()}`
  return (
    <div className="grid gap-0.5">
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="font-note text-sm font-bold">
          {label}
        </label>
        <span className="flex items-center gap-1 font-note text-sm tabular-nums text-muted">
          {value.toFixed(decimals)}
          {unit}
          {onReset && (
            <button type="button" aria-label={`Reset ${label}`} title={`Reset ${label}`} disabled={value === resetValue} onClick={onReset} className="grid h-6 w-6 place-items-center rounded-full text-ink hover:bg-paper2 disabled:opacity-30">
              <RotateCcw size={13} />
            </button>
          )}
        </span>
      </div>
      <input id={id} className="rng" type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    </div>
  )
}

export function Toggle({ label, hint, on, onChange }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-start gap-3 rounded-lg px-1 py-1.5 text-left hover:bg-paper2">
      <span className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center border-2 border-ink ${on ? 'bg-hl' : 'bg-card'}`} style={{ borderRadius: '5px 3px 6px 3px' }}>
        {on && (
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 11 8 16 17 4" />
          </svg>
        )}
      </span>
      <span className="grid">
        <span className="font-note text-[0.95rem] font-bold leading-tight">{label}</span>
        {hint && <span className="text-xs text-muted">{hint}</span>}
      </span>
    </button>
  )
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.focus()
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => {
      window.removeEventListener('keydown', k)
      prev?.focus?.()
    }
  }, [onClose])
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center p-4" role="presentation">
      <div className="absolute inset-0 bg-black/45" onClick={onClose} />
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={title} className={`sk sk-card anim-rise relative max-h-[92vh] w-full overflow-auto p-5 outline-none sm:p-6 ${wide ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-3xl leading-tight">{title}</h2>
          <Btn size="icon" variant="ghost" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </Btn>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 56" className={className} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 18c0-3 2-5 5-5h9l4-6h18l4 6h9c3 0 5 2 5 5v28c0 3-2 5-5 5H11c-3 0-5-2-5-5Z" />
      <circle cx="32" cy="32" r="12" />
      <path d="M26 30c2-4 8-5 11-1M50 21h3" strokeWidth="2.2" />
      <path d="M12 44l8-8M14 49l12-12" strokeWidth="1.4" opacity="0.6" />
    </svg>
  )
}
