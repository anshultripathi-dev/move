import { Check, Play, ScanLine, Truck } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Scene3D } from '../../components/3d/Scene3D'
import { TruckScene } from '../../components/3d/TruckScene'
import { Badge, Card, Progress, Stat } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'
import { VEHICLES, atLeast, boxAtLeast } from '../../state/selectors'
import { useMove } from '../../state/store'
import { buildLoadingOrder, packTruck } from '../../utils/loadplan'
import { cn } from '../../utils/format'

export function useLoadedSet() {
  const objects = useMove((s) => s.objects)
  const boxes = useMove((s) => s.boxes)
  return useMemo(() => {
    const s = new Set<string>()
    boxes.forEach((b) => boxAtLeast(b, 'LOADED') && s.add(b.id))
    objects.filter((o) => !o.boxId && atLeast(o, 'LOADED')).forEach((o) => s.add(o.id))
    return s
  }, [objects, boxes])
}

export function useAutoLoad() {
  const boxes = useMove((s) => s.boxes)
  const objects = useMove((s) => s.objects)
  const loadBox = useMove((s) => s.loadBox)
  const loadFurniture = useMove((s) => s.loadFurniture)
  const setPhase = useMove((s) => s.setPhase)
  const phase = useMove((s) => s.phase)
  const [running, setRunning] = useState(false)
  const ref = useRef({ boxes, objects, phase })
  ref.current = { boxes, objects, phase }
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => {
      const { boxes: bs, objects: os } = ref.current
      const nb = bs.find((b) => !boxAtLeast(b, 'LOADED'))
      if (nb) return loadBox(nb.id)
      const no = os.find((o) => !o.boxId && !atLeast(o, 'LOADED'))
      if (no) return loadFurniture(no.id)
      setRunning(false)
    }, 900)
    return () => clearInterval(t)
  }, [running, loadBox, loadFurniture])
  const start = () => { if (phase === 0) setPhase(1); setRunning(true) }
  return { running, start }
}

export default function Loading() {
  const { stats } = useStats()
  const phase = useMove((s) => s.phase)
  const boxes = useMove((s) => s.boxes)
  const objects = useMove((s) => s.objects)
  const setPhase = useMove((s) => s.setPhase)
  const loadBox = useMove((s) => s.loadBox)
  const loadFurniture = useMove((s) => s.loadFurniture)
  const loaded = useLoadedSet()
  const { running, start } = useAutoLoad()
  const order = useMemo(() => buildLoadingOrder(objects, boxes), [objects, boxes])
  const v = VEHICLES[1]
  const placed = useMemo(() => packTruck(order, v.dims), [order, v])
  const furn = objects.filter((o) => o.isFurniture)
  const pre = phase === 0

  return (
    <div className="space-y-5">
      {pre && (
        <Card glow className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div><div className="text-base font-semibold text-white">Loading hasn&apos;t started</div><div className="text-sm text-slate-400">Start Move Day to begin loading the truck — the movers scan each box as it goes on.</div></div>
          <button className="btn-primary" onClick={() => setPhase(1)}><Play size={14} /> Start Move Day</button>
        </Card>
      )}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Expected" value={<>{stats.boxCount}<span className="text-base text-slate-500"> boxes</span></>} sub="13 QR labels active" />
        <Stat label="Loaded" value={<>{stats.boxesLoaded}<span className="text-lg text-slate-500"> / {stats.boxCount}</span></>} tone="accent" sub={<Progress value={(stats.boxesLoaded / stats.boxCount) * 100} />} />
        <Stat label="Furniture" value={<>{stats.furnitureLoaded}<span className="text-lg text-slate-500"> / {stats.furnitureTotal}</span></>} tone="accent" sub={<Progress value={(stats.furnitureLoaded / stats.furnitureTotal) * 100} />} />
        <Stat label="Fragile" value={<>{stats.fragileLoaded}<span className="text-lg text-slate-500"> / {stats.fragileTotal}</span></>} tone={stats.fragileLoaded === stats.fragileTotal && stats.fragileTotal > 0 ? 'ok' : 'warn'} sub={<Progress value={(stats.fragileLoaded / stats.fragileTotal) * 100} tone="warn" />} />
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="relative h-[460px] overflow-hidden !rounded-3xl">
          <Scene3D className="!absolute inset-0" camera={[4.8, 3.8, 6]} target={[0.2, 0.7, 0]} grid={false} minDistance={3.5} maxDistance={14}>
            <TruckScene bay={v.dims} placed={placed} loaded={loaded} />
          </Scene3D>
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-black/55 px-3 py-2 backdrop-blur"><div className="label flex items-center gap-1.5"><Truck size={12} /> Truck · 8 m³</div><div className="mono mt-0.5 text-xs text-slate-300">{loaded.size}/{placed.length} cargo items on board · wireframes = still on the kerb</div></div>
          <div className="absolute bottom-4 right-4 flex gap-2"><button onClick={start} disabled={running || (stats.boxesLoaded === stats.boxCount && stats.furnitureLoaded === stats.furnitureTotal)} className="btn-primary"><Play size={14} /> {running ? 'Loading…' : 'Continue loading'}</button></div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><div className="label">Recommended loading sequence</div><Badge>{loaded.size}/{order.length}</Badge></div>
          <div className="mt-3 max-h-[390px] space-y-1 overflow-y-auto pr-1">
            {order.map((s) => {
              const done = loaded.has(s.id)
              return (
                <div key={s.id} className={cn('flex items-center gap-3 rounded-lg px-2 py-1.5', done ? 'opacity-60' : 'bg-white/[0.02]')}>
                  <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full border', done ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-300' : 'border-white/15 text-[10px] text-slate-500')}>{done ? <Check size={11} /> : s.step}</span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-200">{s.label}</span>
                  {s.fragile && <Badge tone="bad">Fragile</Badge>}
                  {!done && !pre && <button onClick={() => (s.kind === 'box' ? loadBox(s.id) : loadFurniture(s.id))} className="rounded-md bg-accent/20 px-2 py-0.5 text-[10px] font-semibold text-accent-soft hover:bg-accent/40"><ScanLine size={10} className="mr-1 inline" />Scan</button>}
                </div>
              )
            })}
          </div>
        </Card>
      </div>
      <Card className="p-5">
        <div className="label">Boxes &amp; furniture</div>
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-7 lg:grid-cols-[repeat(17,minmax(0,1fr))]">
          {boxes.map((b) => { const d = boxAtLeast(b, 'LOADED'); return <button key={b.id} onClick={() => navigate(`/box/${b.id}`)} className={cn('rounded-lg border px-1 py-2 text-center text-[11px] font-semibold', d ? 'border-emerald-400/40 bg-emerald-400/10 text-emerald-200' : !b.scanned && phase > 0 ? 'border-amber-400/50 bg-amber-400/10 text-amber-200' : 'border-white/10 text-slate-500')}>#{String(b.num).padStart(3, '0')}</button> })}
          {furn.map((o) => { const d = atLeast(o, 'LOADED'); return <button key={o.id} onClick={() => navigate(`/object/${o.id}`)} className={cn('rounded-lg border px-1 py-2 text-center text-[10px] font-semibold', d ? 'border-violet-400/40 bg-violet-400/10 text-violet-200' : 'border-white/10 text-slate-500')}>{o.name.split(' ')[0].slice(0, 6)}</button> })}
        </div>
      </Card>
    </div>
  )
}
