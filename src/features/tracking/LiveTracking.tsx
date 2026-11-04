import { motion } from 'framer-motion'
import { Check, Home, Package, Truck, Boxes, Flag, Loader2, PackageOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Card, Progress } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'
import { useMove } from '../../state/store'
import { OBJ_STATES } from '../../models/types'
import { STATE_HEX, cn, fmtTime } from '../../utils/format'

const JOURNEY = [
  { key: 'HOME', label: 'Home', icon: Home, sub: 'Packed & ready in the current home' },
  { key: 'LOADED', label: 'Loaded', icon: Package, sub: 'Scanned onto the truck' },
  { key: 'IN TRANSIT', label: 'In transit', icon: Truck, sub: 'On the road to Harbor Street' },
  { key: 'ARRIVED', label: 'Arrived', icon: Flag, sub: 'Scanned off the truck at destination' },
  { key: 'UNPACKING', label: 'Unpacking', icon: PackageOpen, sub: 'Items placed in their rooms' },
  { key: 'COMPLETE', label: 'Complete', icon: Check, sub: 'Every item accounted for' },
]

export default function LiveTracking() {
  const { stats } = useStats()
  const phase = useMove((s) => s.phase)
  const setPhase = useMove((s) => s.setPhase)
  const objects = useMove((s) => s.objects)
  const events = useMove((s) => s.events)
  const [route, setRoute] = useState(phase === 2 ? 38 : phase >= 3 ? 100 : 0)
  useEffect(() => { if (phase === 2) { const t = setInterval(() => setRoute((r) => Math.min(100, r + 1.5)), 600); return () => clearInterval(t) } setRoute(phase >= 3 ? 100 : 0) }, [phase])
  const stageOf = phase === 0 ? 0 : phase === 1 ? 1 : phase === 2 ? 2 : phase === 3 ? 3 : 5
  const counts = OBJ_STATES.map((s) => ({ s, n: objects.filter((o) => o.state === s).length }))
  const trail = events.filter((e) => e.phase >= 1 && !(e.objectId && e.boxId)).slice(-5).reverse()
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Card className="p-6">
        <div className="mb-6 flex items-center justify-between"><div className="label">Journey</div><Badge tone="accent">Stage {stageOf + 1} of 6</Badge></div>
        <div className="relative">
          {JOURNEY.map((j, i) => {
            const done = i < stageOf, cur = i === stageOf
            const I = j.icon
            return (
              <div key={j.key} className="relative flex gap-4 pb-8 last:pb-0">
                {i < JOURNEY.length - 1 && <div className="absolute left-[19px] top-10 h-[calc(100%-2.5rem)] w-0.5 bg-white/10"><motion.div className="w-full bg-emerald-400" initial={false} animate={{ height: done ? '100%' : '0%' }} /></div>}
                <div className={cn('relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2', done ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300' : cur ? 'border-accent bg-accent text-white shadow-glow' : 'border-white/10 bg-bg text-slate-600')}>{done ? <Check size={17} /> : <I size={17} />}{cur && phase !== 4 && <span className="absolute inset-0 animate-pulseRing rounded-full border-2 border-accent" />}</div>
                <div className="flex-1 pt-1.5">
                  <div className={cn('text-base font-semibold', done || cur ? 'text-white' : 'text-slate-500')}>{j.label}</div>
                  <div className="text-sm text-slate-500">{j.sub}</div>
                  {cur && j.key === 'IN TRANSIT' && <div className="mt-3 max-w-sm"><Progress value={route} tone="teal" /><div className="mono mt-1 text-[11px] text-slate-500">{Math.round(route)}% of route · ETA {route >= 100 ? 'arrived' : '11:40'}</div></div>}
                  {cur && j.key === 'LOADED' && <div className="mt-2 text-xs text-slate-400">{stats.boxesLoaded}/{stats.boxCount} boxes · {stats.furnitureLoaded}/{stats.furnitureTotal} furniture on board</div>}
                </div>
              </div>
            )
          })}
        </div>
        <div className="mt-6 flex flex-wrap gap-2 border-t border-white/[0.06] pt-5">
          <button className="btn-primary" disabled={phase >= 4} onClick={() => setPhase(Math.min(4, phase + 1))}>{phase === 0 ? 'Start loading' : phase === 1 ? 'Dispatch truck' : phase === 2 ? 'Truck arrived' : phase === 3 ? 'Finish unpacking' : 'Move complete'}</button>
          <button className="btn-ghost" onClick={() => navigate('/tracking/moveday')}>Control center</button>
        </div>
      </Card>
      <div className="space-y-5">
        <Card className="p-6">
          <div className="label">Object states</div>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-white/5">{counts.filter((c) => c.n).map((c) => <motion.div key={c.s} layout className="h-full" style={{ background: STATE_HEX[c.s], width: `${(c.n / objects.length) * 100}%` }} />)}</div>
          <div className="mt-4 grid grid-cols-2 gap-2">{counts.map((c) => <div key={c.s} className={cn('flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm', c.n === 0 && 'opacity-40')}><span className="flex items-center gap-2 text-slate-300"><span className="h-2 w-2 rounded-full" style={{ background: STATE_HEX[c.s] }} />{c.s.replace('_', ' ')}</span><span className="mono text-white">{c.n}</span></div>)}</div>
        </Card>
        <Card className="p-6">
          <div className="flex items-center gap-2 label"><Boxes size={13} /> Latest events</div>
          <div className="mt-3 space-y-3">
            {trail.length === 0 && <div className="flex items-center gap-2 text-sm text-slate-500"><Loader2 size={14} className="animate-spin" /> Waiting for Move Day…</div>}
            {trail.map((e) => <div key={e.id} className="flex gap-3"><span className="mt-1.5 h-2 w-2 rounded-full bg-accent" /><div><div className="text-sm text-slate-200">{e.text}</div><div className="mono text-[11px] text-slate-500">{fmtTime(e.ts)} · {e.actor}</div></div></div>)}
          </div>
        </Card>
      </div>
    </div>
  )
}
