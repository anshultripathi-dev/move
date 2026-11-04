import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Check, ShieldCheck, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { STATE_TONE, cn, stateLabel } from '../../utils/format'
import { navigate } from '../../hooks/useRoute'

export function Card({ className, children, onClick, glow }: { className?: string; children: ReactNode; onClick?: () => void; glow?: boolean }) {
  return (
    <div onClick={onClick} className={cn('card', glow && 'shadow-glow', onClick && 'cursor-pointer hover:bg-white/[0.06] transition-colors', className)}>
      {children}
    </div>
  )
}

export function PageHeader({ eyebrow, title, sub, actions, tabs }: { eyebrow?: string; title: string; sub?: string; actions?: ReactNode; tabs?: ReactNode }) {
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          {eyebrow && <div className="label mb-2 text-accent-soft">{eyebrow}</div>}
          <h1 className="h-display text-2xl md:text-[28px] leading-tight">{title}</h1>
          {sub && <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">{sub}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {tabs && <div className="mt-5">{tabs}</div>}
    </div>
  )
}

export function SubTabs({ items, value, onChange }: { items: { id: string; label: string; badge?: string | number }[]; value: string; onChange: (id: string) => void }) {
  return (
    <div className="inline-flex max-w-full gap-1 overflow-x-auto rounded-xl bg-white/[0.04] p-1 border border-white/[0.06]">
      {items.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={cn('relative rounded-lg px-3.5 py-1.5 text-[13px] font-medium whitespace-nowrap transition-colors', value === t.id ? 'text-white' : 'text-slate-400 hover:text-slate-200')}
        >
          {value === t.id && <motion.span layoutId={`tab-${items.map((i) => i.id).join('')}`} className="absolute inset-0 rounded-lg bg-white/10 border border-white/10" transition={{ type: 'spring', duration: 0.4 }} />}
          <span className="relative flex items-center gap-1.5">
            {t.label}
            {t.badge !== undefined && <span className="rounded-md bg-accent/25 px-1.5 text-[10px] text-accent-soft">{t.badge}</span>}
          </span>
        </button>
      ))}
    </div>
  )
}

export function RouteTabs({ items, path }: { items: { to: string; label: string; badge?: string | number }[]; path: string }) {
  const current = items.slice().reverse().find((i) => path === i.to || path.startsWith(i.to + '/'))?.to ?? items[0].to
  return <SubTabs items={items.map((i) => ({ id: i.to, label: i.label, badge: i.badge }))} value={current} onChange={navigate} />
}

export function Badge({ children, tone = 'slate', className, icon }: { children: ReactNode; tone?: 'slate' | 'ok' | 'warn' | 'orange' | 'bad' | 'accent' | 'teal' | 'violet'; className?: string; icon?: ReactNode }) {
  const t: Record<string, string> = {
    slate: 'text-slate-300 bg-white/[0.06] border-white/10',
    ok: 'text-emerald-300 bg-emerald-500/12 border-emerald-500/30',
    warn: 'text-amber-300 bg-amber-500/12 border-amber-500/30',
    orange: 'text-orange-300 bg-orange-500/12 border-orange-500/30',
    bad: 'text-red-300 bg-red-500/12 border-red-500/30',
    accent: 'text-indigo-200 bg-accent/15 border-accent/35',
    teal: 'text-teal-300 bg-teal-500/12 border-teal-500/30',
    violet: 'text-violet-300 bg-violet-500/12 border-violet-500/30',
  }
  return <span className={cn('inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium', t[tone], className)}>{icon}{children}</span>
}

export const StatePill = ({ state, className }: { state: string; className?: string }) => (
  <span className={cn('inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10.5px] font-semibold tracking-wide', STATE_TONE[state] ?? STATE_TONE.SCANNED, className)}>
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {stateLabel(state as never)}
  </span>
)

export function Conf({ value, label, compact }: { value: number; label?: string; compact?: boolean }) {
  const tone = value >= 90 ? 'bg-emerald-400' : value >= 75 ? 'bg-amber-400' : 'bg-red-400'
  return (
    <div className="flex items-center gap-2">
      {label && <span className="w-20 text-xs text-slate-400">{label}</span>}
      <div className={cn('h-1.5 rounded-full bg-white/10 overflow-hidden', compact ? 'w-12' : 'flex-1 min-w-[56px]')}>
        <div className={cn('h-full rounded-full', tone)} style={{ width: `${value}%` }} />
      </div>
      <span className="mono w-9 text-right text-xs text-slate-300">{value}%</span>
    </div>
  )
}

export function VerifyHint({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-[11px] text-amber-300', className)}>
      <AlertTriangle size={12} /> Verification recommended
    </span>
  )
}

export function Stat({ label, value, sub, tone, icon, onClick }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'ok' | 'warn' | 'bad' | 'accent'; icon?: ReactNode; onClick?: () => void }) {
  const c = tone === 'ok' ? 'text-emerald-300' : tone === 'warn' ? 'text-amber-300' : tone === 'bad' ? 'text-red-300' : tone === 'accent' ? 'text-accent-soft' : 'text-white'
  return (
    <Card className="p-4" onClick={onClick}>
      <div className="flex items-center justify-between">
        <span className="label">{label}</span>
        {icon && <span className="text-slate-500">{icon}</span>}
      </div>
      <div className={cn('mt-2 whitespace-nowrap text-[26px] font-semibold tracking-tight leading-none', c)}>{value}</div>
      {sub && <div className="mt-2 text-xs text-slate-500">{sub}</div>}
    </Card>
  )
}

export function Progress({ value, tone = 'accent', height = 6, className }: { value: number; tone?: 'accent' | 'ok' | 'warn' | 'bad' | 'teal'; height?: number; className?: string }) {
  const c = { accent: 'from-accent to-indigo-300', ok: 'from-emerald-500 to-emerald-300', warn: 'from-amber-500 to-amber-300', bad: 'from-red-500 to-red-300', teal: 'from-teal-500 to-teal-300' }[tone]
  return (
    <div className={cn('w-full overflow-hidden rounded-full bg-white/[0.07]', className)} style={{ height }}>
      <motion.div className={cn('h-full rounded-full bg-gradient-to-r', c)} initial={false} animate={{ width: `${Math.min(100, Math.max(0, value))}%` }} transition={{ type: 'spring', stiffness: 90, damping: 20 }} />
    </div>
  )
}

export function Ring({ value, size = 160, stroke = 12, label, sub }: { value: number; size?: number; stroke?: number; label?: ReactNode; sub?: string }) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const color = value >= 90 ? '#34d399' : value >= 60 ? '#6d8bff' : '#fbbf24'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="rgba(255,255,255,0.07)" strokeWidth={stroke} fill="none" />
        <motion.circle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} fill="none" strokeLinecap="round" strokeDasharray={c} initial={false} animate={{ strokeDashoffset: c * (1 - value / 100) }} transition={{ type: 'spring', stiffness: 70, damping: 18 }} style={{ filter: `drop-shadow(0 0 10px ${color}88)` }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="font-semibold tracking-tight text-white" style={{ fontSize: size * 0.27 }}>{label ?? `${value}%`}</div>
        {sub && <div className="label mt-1">{sub}</div>}
      </div>
    </div>
  )
}

export function Modal({ open, onClose, title, children, width = 'max-w-lg', footer }: { open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; width?: string; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[80] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: 20, scale: 0.97, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 10, opacity: 0 }} transition={{ type: 'spring', duration: 0.4 }} className={cn('relative w-full max-h-[88vh] overflow-auto rounded-2xl border border-white/10 bg-[#0d121b] shadow-2xl', width)}>
            <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
              <div className="font-semibold text-white">{title}</div>
              <button onClick={onClose} className="btn-quiet !p-1.5"><X size={16} /></button>
            </div>
            <div className="p-5">{children}</div>
            {footer && <div className="flex justify-end gap-2 border-t border-white/[0.06] px-5 py-3">{footer}</div>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function Tip({ text, children }: { text: string; children: ReactNode }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      <AnimatePresence>
        {show && (
          <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pointer-events-none absolute -top-9 left-1/2 z-50 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-[#0d121b] px-2.5 py-1.5 text-[11px] text-slate-200 shadow-xl">
            {text}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  )
}

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!on)} className={cn('flex items-center gap-2 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors', on ? 'border-accent/50 bg-accent/15 text-white' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200')}>
      <span className={cn('relative h-3.5 w-6 rounded-full transition-colors', on ? 'bg-accent' : 'bg-white/15')}>
        <span className={cn('absolute top-0.5 h-2.5 w-2.5 rounded-full bg-white transition-all', on ? 'left-3' : 'left-0.5')} />
      </span>
      {label}
    </button>
  )
}

export function Meta({ label, value, mono }: { label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div>
      <div className="label">{label}</div>
      <div className={cn('mt-1 text-sm text-slate-100', mono && 'mono')}>{value}</div>
    </div>
  )
}

export function Empty({ icon, title, sub, action }: { icon?: ReactNode; title: string; sub?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="text-slate-600">{icon ?? <ShieldCheck size={32} />}</div>
      <div className="text-sm font-medium text-slate-200">{title}</div>
      {sub && <div className="max-w-sm text-xs text-slate-500">{sub}</div>}
      {action}
    </div>
  )
}

export function Dot({ tone }: { tone: 'red' | 'orange' | 'yellow' | 'blue' | 'green' }) {
  const c = { red: 'bg-red-400', orange: 'bg-orange-400', yellow: 'bg-amber-300', blue: 'bg-sky-400', green: 'bg-emerald-400' }[tone]
  return <span className={cn('inline-block h-2.5 w-2.5 rounded-full', c)} />
}

export function LinkRow({ to, children }: { to: string; children: ReactNode }) {
  return (
    <button onClick={() => navigate(to)} className="group inline-flex items-center gap-1.5 text-xs font-medium text-accent-soft hover:text-white">
      {children}
      <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
    </button>
  )
}

export function CheckRow({ done, label, onClick, sub }: { done: boolean; label: ReactNode; onClick?: () => void; sub?: ReactNode }) {
  return (
    <button onClick={onClick} className="flex w-full items-start gap-3 rounded-lg px-1 py-1.5 text-left hover:bg-white/[0.03]">
      <span className={cn('mt-0.5 flex h-4.5 w-4.5 h-[18px] w-[18px] shrink-0 items-center justify-center rounded-md border', done ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-300' : 'border-white/20')}>
        {done && <Check size={12} />}
      </span>
      <span className="flex-1">
        <span className={cn('text-sm', done ? 'text-slate-500 line-through' : 'text-slate-200')}>{label}</span>
        {sub && <span className="block text-xs text-slate-500">{sub}</span>}
      </span>
    </button>
  )
}

export function Select<T extends string>({ value, onChange, options, className }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; className?: string }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value as T)} className={cn('input !py-2 !pr-8 appearance-none cursor-pointer bg-[length:12px] bg-[right_10px_center] bg-no-repeat', className)} style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")` }}>
      {options.map((o) => <option key={o.value} value={o.value} className="bg-[#0d121b]">{o.label}</option>)}
    </select>
  )
}
