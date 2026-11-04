import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity, AlertOctagon, Bell, Boxes, Check, ChevronDown, Clock, Compass, Gauge, Hammer, Home, Layers, LayoutDashboard,
  Map, Menu, PackageCheck, Plus, Radar, RotateCcw, Search, ShieldAlert, Sparkles, Truck, X, ArrowRight, ScanSearch, Box, Rocket,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Badge } from '../components/ui'
import { navigate } from '../hooks/useRoute'
import { useStats } from '../hooks/useStats'
import { PHASES } from '../models/types'
import { useMove } from '../state/store'
import { cn } from '../utils/format'
import { searchAll, type SearchHit } from '../utils/search'

const NAV: { group: string; items: { to: string; label: string; icon: ReactNode; match: string[]; badge?: 'exc' | 'box' | 'inv' }[] }[] = [
  {
    group: 'Main',
    items: [
      { to: '/overview', label: 'Overview', icon: <LayoutDashboard size={17} />, match: ['/overview'] },
      { to: '/twin', label: 'Digital Twin', icon: <Layers size={17} />, match: ['/twin', '/scan', '/detect'] },
      { to: '/inventory', label: 'Inventory', icon: <ScanSearch size={17} />, match: ['/inventory', '/object'], badge: 'inv' },
      { to: '/destination', label: 'Destination', icon: <Map size={17} />, match: ['/destination'] },
      { to: '/planning', label: 'Planning', icon: <Compass size={17} />, match: ['/planning'] },
      { to: '/packing', label: 'Packing', icon: <PackageCheck size={17} />, match: ['/packing'] },
      { to: '/boxes', label: 'Boxes', icon: <Boxes size={17} />, match: ['/boxes', '/box/'], badge: 'box' },
      { to: '/tracking', label: 'Tracking', icon: <Truck size={17} />, match: ['/tracking'] },
      { to: '/reconciliation', label: 'Reconciliation', icon: <Radar size={17} />, match: ['/reconciliation'] },
      { to: '/damage', label: 'Damage', icon: <ShieldAlert size={17} />, match: ['/damage'] },
      { to: '/reassembly', label: 'Reassembly', icon: <Hammer size={17} />, match: ['/reassembly'] },
    ],
  },
  {
    group: 'Management',
    items: [
      { to: '/timeline', label: 'Timeline', icon: <Clock size={17} />, match: ['/timeline'] },
      { to: '/readiness', label: 'Readiness', icon: <Gauge size={17} />, match: ['/readiness'] },
      { to: '/exceptions', label: 'Exceptions', icon: <AlertOctagon size={17} />, match: ['/exceptions'], badge: 'exc' },
      { to: '/complete', label: 'Move Complete', icon: <Check size={17} />, match: ['/complete'] },
    ],
  },
  {
    group: 'AI',
    items: [{ to: '/assistant', label: 'MOVE Assistant', icon: <Sparkles size={17} />, match: ['/assistant'] }],
  },
]

export const PHASE_LABEL = ['Packing', 'Loading', 'In Transit', 'Arrived', 'Complete']

function Logo({ small }: { small?: boolean }) {
  return (
    <button onClick={() => navigate('/')} className="flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-accent to-indigo-400 shadow-[0_6px_20px_-6px_rgba(109,139,255,0.9)]">
        <svg width="18" height="18" viewBox="0 0 32 32" fill="none"><path d="M7 23V9l9 9 9-9v14" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </span>
      {!small && <span className="text-[17px] font-semibold tracking-[0.14em] text-white">MOVE</span>}
    </button>
  )
}

function Sidebar({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  const { stats, exceptions } = useStats()
  const meta = useMove((s) => s.meta)
  const badge = (b?: string) => (b === 'exc' ? exceptions.filter((e) => e.level !== 'blue').length : b === 'box' ? stats.boxCount : b === 'inv' ? stats.items : null)
  return (
    <aside className="flex h-full w-[248px] flex-col border-r border-white/[0.06] bg-[#080b11]/90 backdrop-blur-xl">
      <div className="flex h-16 items-center px-5"><Logo /></div>
      <div className="px-3">
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3">
          <div className="label">Active move</div>
          <div className="mt-1 text-sm font-semibold text-white">{meta.id}</div>
          <div className="mt-0.5 text-xs text-slate-500">{meta.type}</div>
        </div>
      </div>
      <nav className="mt-4 flex-1 space-y-5 overflow-y-auto px-3 pb-6">
        {NAV.map((g) => (
          <div key={g.group}>
            <div className="label px-3 pb-2">{g.group}</div>
            <div className="space-y-0.5">
              {g.items.map((it) => {
                const active = it.match.some((m) => path === m || path.startsWith(m + (m.endsWith('/') ? '' : '/')) || path.startsWith(m))
                const b = badge(it.badge)
                return (
                  <button
                    key={it.to}
                    onClick={() => { navigate(it.to); onNavigate?.() }}
                    className={cn('group relative flex w-full items-center gap-3 rounded-xl px-3 py-2 text-[13.5px] font-medium transition-colors', active ? 'text-white' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-100')}
                  >
                    {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-xl bg-gradient-to-r from-accent/25 to-accent/5 ring-1 ring-accent/30" transition={{ type: 'spring', duration: 0.45 }} />}
                    <span className={cn('relative', active && 'text-accent-soft')}>{it.icon}</span>
                    <span className="relative flex-1 text-left">{it.label}</span>
                    {b !== null && b > 0 && (
                      <span className={cn('relative rounded-md px-1.5 text-[10px] font-semibold', it.badge === 'exc' ? 'bg-red-500/20 text-red-300' : 'bg-white/[0.07] text-slate-400')}>{b}</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="border-t border-white/[0.06] p-3">
        <button onClick={() => navigate('/')} className="btn-quiet w-full !justify-start text-xs"><Home size={14} /> Back to welcome</button>
      </div>
    </aside>
  )
}

function LifecycleBar() {
  const phase = useMove((s) => s.phase)
  const setPhase = useMove((s) => s.setPhase)
  return (
    <div className="hidden items-center gap-1 rounded-xl border border-white/[0.07] bg-white/[0.03] p-1 xl:flex">
      <span className="label px-2">Lifecycle</span>
      {PHASES.map((p, i) => (
        <button
          key={p}
          onClick={() => setPhase(i)}
          className={cn('relative rounded-lg px-2.5 py-1 text-[11.5px] font-semibold transition-colors', i === phase ? 'text-white' : i < phase ? 'text-emerald-300/80 hover:text-emerald-200' : 'text-slate-500 hover:text-slate-300')}
        >
          {i === phase && <motion.span layoutId="phase-pill" className="absolute inset-0 rounded-lg bg-accent/90" transition={{ type: 'spring', duration: 0.45 }} />}
          <span className="relative flex items-center gap-1">{i < phase && <Check size={11} />}{PHASE_LABEL[i]}</span>
        </button>
      ))}
      <button
        disabled={phase >= PHASES.length - 1}
        onClick={() => setPhase(phase + 1)}
        className="btn-primary !rounded-lg !px-2.5 !py-1 text-[11.5px]"
      >
        Advance <ArrowRight size={12} />
      </button>
    </div>
  )
}

function Notifications() {
  const notices = useMove((s) => s.notices)
  const readNotice = useMove((s) => s.readNotice)
  const readAll = useMove((s) => s.readAll)
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unread = notices.filter((n) => !n.read).length
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false)
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [])
  const tone = { info: 'bg-accent', ok: 'bg-emerald-400', warn: 'bg-amber-400', bad: 'bg-red-400' }
  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(!open)} className="btn-ghost relative !p-2.5" aria-label="Notifications">
        <Bell size={16} />
        {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold text-white">{unread}</span>}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6 }} className="absolute right-0 top-12 z-50 w-[360px] max-w-[92vw] overflow-hidden rounded-2xl border border-white/10 bg-[#0d121b] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
              <div className="text-sm font-semibold text-white">Notifications</div>
              <button onClick={readAll} className="text-xs text-accent-soft hover:text-white">Mark all read</button>
            </div>
            <div className="max-h-[420px] overflow-y-auto">
              {notices.map((n) => (
                <button key={n.id} onClick={() => { readNotice(n.id); if (n.route) navigate(n.route); setOpen(false) }} className="flex w-full gap-3 border-b border-white/[0.04] px-4 py-3 text-left hover:bg-white/[0.04]">
                  <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', n.read ? 'bg-white/15' : tone[n.tone])} />
                  <span>
                    <span className={cn('block text-[13px] font-medium', n.read ? 'text-slate-400' : 'text-white')}>{n.title}</span>
                    <span className="block text-xs text-slate-500">{n.body}</span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const objects = useMove((s) => s.objects)
  const boxes = useMove((s) => s.boxes)
  const events = useMove((s) => s.events)
  const damage = useMove((s) => s.damage)
  const [q, setQ] = useState('')
  const [idx, setIdx] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const hits = useMemo(() => searchAll(q, { objects, boxes, events, damage }), [q, objects, boxes, events, damage])
  useEffect(() => { if (open) { setQ(''); setIdx(0); setTimeout(() => inputRef.current?.focus(), 50) } }, [open])
  useEffect(() => setIdx(0), [q])
  useEffect(() => {
    if (!open) return
    const k = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [open, onClose])
  const go = (h: SearchHit) => { navigate(h.route); onClose() }
  const groups = hits.reduce<Record<string, SearchHit[]>>((a, h) => ((a[h.group] ??= []).push(h), a), {})
  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-[90] flex items-start justify-center p-4 pt-[12vh]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
          <motion.div initial={{ y: -12, scale: 0.98 }} animate={{ y: 0, scale: 1 }} className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#0d121b] shadow-2xl">
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
              <Search size={17} className="text-slate-500" />
              <input
                ref={inputRef}
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(hits.length - 1, i + 1)) }
                  if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)) }
                  if (e.key === 'Enter' && hits[idx]) go(hits[idx])
                  if (e.key === 'Escape') onClose()
                }}
                placeholder="Search objects, boxes, rooms, events, damage, locations…"
                className="h-14 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-slate-600"
              />
              <kbd className="rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-slate-500">ESC</kbd>
            </div>
            <div className="max-h-[56vh] overflow-y-auto p-2">
              {!q && (
                <div className="p-4 text-sm text-slate-500">
                  Try <button className="text-accent-soft" onClick={() => setQ('HDMI')}>HDMI</button>, <button className="text-accent-soft" onClick={() => setQ('box 7')}>box 7</button>, <button className="text-accent-soft" onClick={() => setQ('study')}>study</button> or <button className="text-accent-soft" onClick={() => setQ('scratch')}>scratch</button>.
                </div>
              )}
              {q && hits.length === 0 && <div className="p-6 text-center text-sm text-slate-500">No results for “{q}”.</div>}
              {Object.entries(groups).map(([g, list]) => (
                <div key={g} className="mb-2">
                  <div className="label px-3 py-2">{g}</div>
                  {list.map((h) => {
                    const i = hits.indexOf(h)
                    return (
                      <button key={h.id + h.group} onMouseEnter={() => setIdx(i)} onClick={() => go(h)} className={cn('flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left', i === idx ? 'bg-accent/15 ring-1 ring-accent/30' : 'hover:bg-white/[0.04]')}>
                        <span className="mt-0.5 text-slate-500"><Box size={15} /></span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium text-white">{h.title}</span>
                          <span className="block text-xs text-slate-500">{h.detail}</span>
                          {h.meta && <span className="mt-1 flex flex-wrap gap-x-4 text-xs text-slate-400">{h.meta.map((m) => <span key={m}>{m}</span>)}</span>}
                        </span>
                        <ArrowRight size={14} className="mt-1 text-slate-600" />
                      </button>
                    )
                  })}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function TopBar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const meta = useMove((s) => s.meta)
  const phase = useMove((s) => s.phase)
  const loadDemo = useMove((s) => s.loadDemo)
  const [menu, setMenu] = useState<'move' | 'profile' | null>(null)
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setMenu(null)
    window.addEventListener('mousedown', h)
    return () => window.removeEventListener('mousedown', h)
  }, [])
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-white/[0.06] bg-bg/70 px-4 backdrop-blur-xl md:px-6">
      <button onClick={onMenu} className="btn-ghost !p-2.5 lg:hidden"><Menu size={17} /></button>
      <div ref={ref} className="relative flex items-center gap-3">
        <button onClick={() => setMenu(menu === 'move' ? null : 'move')} className="btn-ghost !px-3">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_10px_#34d399]" />
          <span className="font-semibold text-white">{meta.id}</span>
          <span className="hidden text-slate-500 sm:inline">· {PHASE_LABEL[phase]}</span>
          <ChevronDown size={14} className="text-slate-500" />
        </button>
        <AnimatePresence>
          {menu === 'move' && (
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute left-0 top-12 z-50 w-72 rounded-2xl border border-white/10 bg-[#0d121b] p-2 shadow-2xl">
              <div className="rounded-xl bg-accent/10 p-3 ring-1 ring-accent/30">
                <div className="text-sm font-semibold text-white">{meta.id}</div>
                <div className="text-xs text-slate-400">{meta.name}</div>
                <div className="mt-1 text-xs text-slate-500">37 objects · 13 boxes · 4 rooms</div>
              </div>
              <button onClick={() => { navigate('/new'); setMenu(null) }} className="btn-quiet mt-1 w-full !justify-start"><Plus size={14} /> Create new move</button>
              <button onClick={() => { loadDemo(); setMenu(null) }} className="btn-quiet w-full !justify-start"><RotateCcw size={14} /> Reset demo move</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <button onClick={onSearch} className="group ml-1 flex h-10 min-w-0 flex-1 max-w-md items-center gap-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03] px-3.5 text-sm text-slate-500 hover:border-white/15">
        <Search size={15} />
        <span className="min-w-0 flex-1 truncate whitespace-nowrap text-left">Search objects, boxes, rooms…</span>
        <kbd className="hidden rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] sm:block">⌘K</kbd>
      </button>
      <div className="flex-1" />
      <LifecycleBar />
      <Notifications />
      <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-400/80 to-accent text-sm font-bold text-white" onClick={() => setMenu(menu === 'profile' ? null : 'profile')} title="Profile">AS</button>
    </header>
  )
}

export function Shell({ path, children }: { path: string; children: ReactNode }) {
  const [drawer, setDrawer] = useState(false)
  const [search, setSearch] = useState(false)
  const phase = useMove((s) => s.phase)
  const setPhase = useMove((s) => s.setPhase)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setSearch((s) => !s) }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [])
  useEffect(() => { setSearch(false); setDrawer(false) }, [path])
  const root = '/' + (path.split('/')[1] ?? '')
  return (
    <div className="flex h-full">
      <div className="hidden lg:block"><Sidebar path={path} /></div>
      <AnimatePresence>
        {drawer && (
          <motion.div className="fixed inset-0 z-[70] lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="absolute inset-0 bg-black/60" onClick={() => setDrawer(false)} />
            <motion.div initial={{ x: -260 }} animate={{ x: 0 }} exit={{ x: -260 }} className="relative h-full w-[248px]"><Sidebar path={path} onNavigate={() => setDrawer(false)} /></motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setDrawer(true)} onSearch={() => setSearch(true)} />
        {/* mobile lifecycle control */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2 xl:hidden">
          <span className="label">Lifecycle</span>
          <Badge tone="accent">{PHASE_LABEL[phase]}</Badge>
          <button disabled={phase >= 4} onClick={() => setPhase(phase + 1)} className="btn-primary !px-2.5 !py-1 text-xs ml-auto">Advance <Rocket size={12} /></button>
        </div>
        <main className="min-h-0 flex-1 overflow-y-auto">
          <motion.div key={root} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mx-auto w-full max-w-[1480px] p-4 md:p-6 lg:p-8">
            {children}
          </motion.div>
        </main>
      </div>
      <SearchPalette open={search} onClose={() => setSearch(false)} />
    </div>
  )
}

export { Activity, X }
