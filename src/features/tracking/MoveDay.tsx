import { motion } from 'framer-motion'
import { Activity, Gauge, MapPin, Play, Radio, Truck, Users, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge, Card, Dot, PageHeader, Progress, Ring, StatePill } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'
import { useMove } from '../../state/store'
import { boxAtLeast } from '../../state/selectors'
import { cn, fmtTime } from '../../utils/format'
import { PHASE_LABEL } from '../../layouts/Shell'
import { useAutoLoad } from './Loading'

const levelDot = { red: 'red', orange: 'orange', yellow: 'yellow', blue: 'blue' } as const

export default function MoveDay() {
  const { stats, exceptions } = useStats()
  const phase = useMove((s) => s.phase)
  const setPhase = useMove((s) => s.setPhase)
  const boxes = useMove((s) => s.boxes)
  const objects = useMove((s) => s.objects)
  const events = useMove((s) => s.events)
  const { running, start } = useAutoLoad()
  const [clock, setClock] = useState(0)
  const [speed, setSpeed] = useState(0)
  useEffect(() => { const t = setInterval(() => setClock((c) => c + 1), 1000); return () => clearInterval(t) }, [])
  useEffect(() => { setSpeed(phase === 2 ? 48 : 0); if (phase !== 2) return; const t = setInterval(() => setSpeed(40 + Math.round(Math.random() * 22)), 1400); return () => clearInterval(t) }, [phase])
  const live = events.filter((e) => e.phase >= 1 && !(e.objectId && e.boxId)).slice(-8).reverse()
  const crew = [{ n: 'Marcus R.', r: 'Crew lead' }, { n: 'Dana K.', r: 'Loader' }, { n: 'Pavel S.', r: 'Driver' }]
  const crewStatus = ['Idle · awaiting arrival', 'Loading', 'Driving', 'Unloading', 'Wrapping up'][phase]
  const total = stats.boxCount + stats.furnitureTotal
  const done = phase >= 2 ? total : stats.boxesLoaded + stats.furnitureLoaded
  const critical = objects.filter((o) => o.priority === 'Essential' && ['Wi-Fi Router', 'Monitor 27"', 'Toiletry Kit', 'Documents Folder'].includes(o.name))
  const eta = phase === 2 ? '11:40' : phase >= 3 ? 'Arrived' : '—'

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        {phase === 0 && <button className="btn-primary" onClick={() => setPhase(1)}><Play size={14} /> Start Move Day</button>}
        {phase === 1 && <><button className="btn-primary" disabled={running} onClick={start}><Play size={14} /> {running ? 'Loading…' : 'Auto-load remaining'}</button><button className="btn-ghost" onClick={() => setPhase(2)}><Truck size={14} /> Dispatch truck</button></>}
        {phase === 2 && <button className="btn-primary" onClick={() => setPhase(3)}><MapPin size={14} /> Truck arrived</button>}
        {phase >= 3 && <button className="btn-primary" onClick={() => navigate('/tracking/arrival')}>Open arrival dashboard</button>}
        <Badge tone="accent" className="!py-1"><Radio size={11} className="animate-pulse" /> LIVE · {PHASE_LABEL[phase]}</Badge>
        <span className="mono ml-auto text-xs text-slate-500">{new Date(Date.UTC(2026, 9, 14, 8, 0, 0) + clock * 1000).toISOString().slice(11, 19)} (sim)</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between"><span className="label">Mover status</span><Users size={15} className="text-slate-500" /></div>
          <div className="mt-2 flex items-center gap-2 text-sm text-white"><span className={cn('h-2 w-2 rounded-full', phase === 0 ? 'bg-slate-500' : 'animate-pulse bg-emerald-400')} />{crewStatus}</div>
          <div className="mt-3 space-y-2">{crew.map((c) => <div key={c.n} className="flex items-center gap-3"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[10px] font-bold text-white">{c.n.split(' ').map((x) => x[0]).join('')}</span><div className="text-sm text-slate-200">{c.n}<div className="text-[11px] text-slate-500">{c.r}</div></div></div>)}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><span className="label">Vehicle</span><Truck size={15} className="text-slate-500" /></div>
          <div className="mt-2 text-lg font-semibold text-white">8 m³ Box Truck S</div>
          <div className="mono text-xs text-slate-500">MV-4821 · plate KX 28 TRN</div>
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div><div className="label">Speed</div><div className="mono mt-1 flex items-center gap-1 text-white"><Gauge size={13} className="text-accent-soft" />{speed} km/h</div></div>
            <div><div className="label">ETA</div><div className="mono mt-1 text-white">{eta}</div></div>
          </div>
          <Progress className="mt-4" value={phase === 2 ? 62 : phase >= 3 ? 100 : 0} tone="teal" />
          <div className="mt-1.5 text-[11px] text-slate-500">{phase >= 3 ? 'Arrived at Harbor Street' : phase === 2 ? '5.8 km remaining' : 'Awaiting departure'}</div>
        </Card>
        <Card className="flex items-center gap-5 p-5">
          <Ring value={Math.round((done / total) * 100)} size={112} stroke={9} />
          <div><div className="label">Loading progress</div><div className="mt-1 text-sm text-slate-300"><span className="text-white">{stats.boxesLoaded}</span>/{stats.boxCount} boxes</div><div className="text-sm text-slate-300"><span className="text-white">{stats.furnitureLoaded}</span>/{stats.furnitureTotal} furniture</div><div className="text-sm text-slate-300"><span className="text-white">{stats.fragileLoaded}</span>/{stats.fragileTotal} fragile</div></div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><span className="label">Critical items</span><Zap size={15} className="text-amber-300" /></div>
          <div className="mt-3 space-y-2">{critical.map((o) => <button key={o.id} onClick={() => navigate(`/object/${o.id}`)} className="flex w-full items-center justify-between text-left"><span className="truncate text-sm text-slate-200">{o.name}</span><StatePill state={o.state} /></button>)}</div>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_1fr_1fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between"><span className="label">Boxes</span><span className="mono text-xs text-slate-500">{boxes.filter((b) => boxAtLeast(b, 'LOADED')).length}/{boxes.length} on truck</span></div>
          <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-7">
            {boxes.map((b) => {
              const st = boxAtLeast(b, 'ARRIVED') ? 'arrived' : boxAtLeast(b, 'IN_TRANSIT') ? 'transit' : boxAtLeast(b, 'LOADED') ? 'loaded' : b.scanned ? 'packed' : 'unscanned'
              const c = { arrived: 'border-teal-400/50 bg-teal-400/10 text-teal-200', transit: 'border-amber-400/50 bg-amber-400/10 text-amber-200', loaded: 'border-violet-400/50 bg-violet-400/10 text-violet-200', packed: 'border-white/10 text-slate-400', unscanned: 'border-amber-400/60 bg-amber-400/10 text-amber-200 animate-pulse' }[st]
              return <motion.button layout key={b.id} onClick={() => navigate(`/box/${b.id}`)} className={cn('rounded-lg border py-2 text-center text-[11px] font-semibold', c)}>#{String(b.num).padStart(3, '0')}</motion.button>
            })}
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-[11px] text-slate-500">{[['Packed', 'bg-white/30'], ['Loaded', 'bg-violet-400'], ['In transit', 'bg-amber-400'], ['Arrived', 'bg-teal-400']].map(([l, c]) => <span key={l} className="flex items-center gap-1.5"><span className={cn('h-2 w-2 rounded-full', c)} />{l}</span>)}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><span className="label">Exceptions</span><Badge tone={exceptions.some((e) => e.level !== 'blue') ? 'bad' : 'ok'}>{exceptions.filter((e) => e.level !== 'blue').length}</Badge></div>
          <div className="mt-3 space-y-1">
            {exceptions.filter((e) => e.level !== 'blue').slice(0, 5).map((x) => <button key={x.id} onClick={() => navigate(x.route)} className="flex w-full items-start gap-2.5 rounded-lg px-1.5 py-1.5 text-left hover:bg-white/[0.04]"><span className="mt-1.5"><Dot tone={levelDot[x.level]} /></span><span><span className="block text-sm text-slate-200">{x.title}</span><span className="block text-[11px] text-slate-500">{x.detail}</span></span></button>)}
            {exceptions.filter((e) => e.level !== 'blue').length === 0 && <div className="py-6 text-center text-sm text-slate-500">All clear.</div>}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><span className="label">Live timeline</span><Activity size={14} className="text-accent-soft" /></div>
          <div className="mt-3 space-y-3">
            {live.length === 0 && <div className="py-6 text-center text-sm text-slate-500">Waiting for Move Day to start…</div>}
            {live.map((e, i) => <motion.div key={e.id} initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3"><span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', i === 0 ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-white/25')} /><div className="min-w-0"><div className="truncate text-sm text-slate-200">{e.text}</div><div className="mono text-[11px] text-slate-500">{fmtTime(e.ts)}</div></div></motion.div>)}
          </div>
        </Card>
      </div>
      <div className="hidden"><PageHeader title="" /></div>
    </div>
  )
}
