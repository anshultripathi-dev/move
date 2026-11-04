import { motion } from 'framer-motion'
import { AlertTriangle, Check, Clock, Package, RefreshCcw, Sparkles, Truck, Weight } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Scene3D } from '../../components/3d/Scene3D'
import { TruckScene } from '../../components/3d/TruckScene'
import { Badge, Card, PageHeader, Progress, RouteTabs, Stat } from '../../components/ui'
import { useRoute } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'
import { PACK_EFFICIENCY, VEHICLES, shipVolume } from '../../state/selectors'
import { useMove } from '../../state/store'
import { ROOM_COLOR, ROOM_LABEL, ROOM_ORDER } from '../../models/types'
import { buildLoadingOrder, packTruck } from '../../utils/loadplan'
import { cn } from '../../utils/format'

export default function Planning() {
  const { path } = useRoute()
  const vehicle = path.startsWith('/planning/vehicle')
  return (
    <div>
      <PageHeader eyebrow="Intelligent planning" title={vehicle ? 'Vehicle & truck planning' : 'Move planner'} sub={vehicle ? 'Compare vehicles against your real volume and see an approximate cargo layout in 3D.' : 'MOVE turns your digital twin into a plan: capacity, packing strategy, loading order and timing.'}
        tabs={<RouteTabs path={path} items={[{ to: '/planning', label: 'Move Planner' }, { to: '/planning/vehicle', label: 'Vehicle & Truck' }]} />} />
      {vehicle ? <VehiclePlanner /> : <MovePlanner />}
    </div>
  )
}

const dur = (m: number) => `${Math.floor(m / 60)}h ${String(Math.round(m % 60)).padStart(2, '0')}m`

function MovePlanner() {
  const { stats } = useStats()
  const objects = useMove((s) => s.objects)
  const boxes = useMove((s) => s.boxes)
  const [gen, setGen] = useState<'busy' | 'ready'>('busy')
  const [step, setStep] = useState(0)
  const run = () => { setGen('busy'); setStep(0); [1, 2, 3, 4].forEach((i) => setTimeout(() => setStep(i), 450 * i)); setTimeout(() => setGen('ready'), 2000) }
  useEffect(run, [])
  const rec = VEHICLES.find((v) => stats.volume <= v.cap * PACK_EFFICIENCY) ?? VEHICLES[2]
  const order = useMemo(() => buildLoadingOrder(objects, boxes), [objects, boxes])
  const furn = objects.filter((o) => o.isFurniture).length
  const loose = objects.filter((o) => !o.boxId && !o.isFurniture).length
  const loadMin = boxes.length * 3 + furn * 12 + loose * 5
  const driveMin = 55
  const unloadMin = loadMin * 1.15
  const reassMin = 70
  const volByRoom = ROOM_ORDER.map((r) => ({ r, v: objects.filter((o) => o.room === r && !o.boxId).reduce((a, o) => a + shipVolume(o), 0) + boxes.filter((b) => b.room === r).reduce((a, b) => a + (b.dims[0] * b.dims[1] * b.dims[2]) / 1e6, 0) }))
  const maxV = Math.max(...volByRoom.map((x) => x.v))
  const fragile = objects.filter((o) => o.fragility === 'High').length
  const essential = objects.filter((o) => o.priority === 'Essential').length
  const steps = ['Analysing volumes', 'Solving packing constraints', 'Sequencing loading order', 'Estimating timings']
  const strategy = [
    { t: 'Disassemble 4 large pieces', d: 'Sofa feet, desk legs, bed headboard, wardrobe doors — recovers ~2.1 m³ of space and clears the 82 cm entry door.' },
    { t: `Double-wall cartons for ${fragile} fragile items`, d: 'TV, monitor, glassware, plates, vase and frames travel in dedicated cartons, loaded on the top layer.' },
    { t: 'Cap book & kitchen boxes at 15 kg', d: 'Heavy contents are split across small boxes to protect the crew and the cartons.' },
    { t: `Essentials load last — ${essential} items`, d: 'Night Essentials, Electronics and Documents come off the truck first.' },
  ]
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <Stat label="Total volume" value={<>{stats.volume.toFixed(1)}<span className="text-sm text-slate-500"> m³</span></>} icon={<Package size={15} />} />
        <Stat label="Est. weight" value={<>{Math.round(stats.weight)}<span className="text-sm text-slate-500"> kg</span></>} icon={<Weight size={15} />} />
        <Stat label="Objects" value={stats.items} />
        <Stat label="Boxes" value={stats.boxCount} />
        <Stat label="Large furniture" value={furn} />
        <Stat label="Fragile items" value={fragile} tone="warn" />
        <Stat label="Essential items" value={essential} tone="accent" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        <Card className="p-5">
          <div className="label">Volume by room</div>
          <div className="mt-4 space-y-3.5">
            {volByRoom.map(({ r, v }) => (
              <div key={r}>
                <div className="mb-1 flex justify-between text-sm"><span className="flex items-center gap-2 text-slate-300"><span className="h-2 w-2 rounded-full" style={{ background: ROOM_COLOR[r] }} />{ROOM_LABEL[r]}</span><span className="mono text-slate-400">{v.toFixed(2)} m³</span></div>
                <div className="h-2 rounded-full bg-white/[0.06]"><motion.div className="h-full rounded-full" style={{ background: ROOM_COLOR[r] }} initial={{ width: 0 }} animate={{ width: `${(v / maxV) * 100}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-xl bg-white/[0.04] p-3 text-xs leading-relaxed text-slate-400">Volumes use <span className="text-slate-200">shipping volume</span> — bounding boxes reduced by each item&apos;s flat-pack / disassembly factor.</div>
        </Card>

        <Card className="relative overflow-hidden p-5" glow={gen === 'ready'}>
          <div className="flex items-center justify-between"><div className="flex items-center gap-2 label text-accent-soft"><Sparkles size={13} /> AI move plan</div><button className="btn-ghost !px-2.5 !py-1.5 text-xs" onClick={run}><RefreshCcw size={12} /> Regenerate</button></div>
          {gen === 'busy' ? (
            <div className="space-y-3 py-6">
              {steps.map((s, i) => <div key={s} className="flex items-center gap-3 text-sm"><span className={cn('flex h-5 w-5 items-center justify-center rounded-full', step > i ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/5 text-slate-600')}>{step > i ? <Check size={12} /> : <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-current" />}</span><span className={step > i ? 'text-slate-200' : 'text-slate-500'}>{s}</span></div>)}
            </div>
          ) : (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-4"><div className="label">Required capacity</div><div className="mt-2 text-3xl font-semibold text-white">{stats.volume.toFixed(1)}<span className="text-base text-slate-500"> m³</span></div></div>
                <div className="rounded-xl border border-accent/40 bg-accent/10 p-4"><div className="label text-accent-soft">Recommended vehicle</div><div className="mt-2 text-3xl font-semibold text-white">{rec.cap}<span className="text-base text-slate-400"> m³</span></div><div className="text-xs text-slate-400">{rec.name}</div></div>
                <div className="rounded-xl border border-white/[0.07] bg-white/[0.04] p-4"><div className="label">Est. utilization</div><div className="mt-2 text-3xl font-semibold text-emerald-300">{Math.round((stats.volume / (rec.cap * PACK_EFFICIENCY)) * 100)}%</div><div className="text-xs text-slate-500">of {(rec.cap * PACK_EFFICIENCY).toFixed(1)} m³ usable</div></div>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-4">
                {[['Loading', loadMin], ['Drive', driveMin], ['Unloading', unloadMin], ['Reassembly', reassMin]].map(([l, m]) => (
                  <div key={l as string} className="rounded-xl bg-white/[0.03] p-3"><div className="label">{l as string}</div><div className="mono mt-1 text-white">{dur(m as number)}</div></div>
                ))}
              </div>
              <div className="mt-3 flex items-center gap-2 text-sm text-slate-300"><Clock size={14} className="text-accent-soft" /> Estimated total duration <span className="mono font-semibold text-white">{dur(loadMin + driveMin + unloadMin + reassMin)}</span></div>
            </motion.div>
          )}
        </Card>
      </div>

      {gen === 'ready' && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <div className="label">Packing strategy</div>
            <div className="mt-3 space-y-3">{strategy.map((s, i) => <div key={s.t} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/20 text-[11px] font-semibold text-accent-soft">{i + 1}</span><div><div className="text-sm font-medium text-white">{s.t}</div><div className="text-xs leading-relaxed text-slate-400">{s.d}</div></div></div>)}</div>
          </Card>
          <Card className="p-5">
            <div className="label">Loading order</div>
            <div className="mt-3 max-h-[360px] space-y-1 overflow-y-auto pr-1">
              {order.map((s) => (
                <div key={s.id} className="flex items-start gap-3 rounded-lg px-2 py-1.5 hover:bg-white/[0.04]">
                  <span className="mono w-6 text-xs text-slate-500">{String(s.step).padStart(2, '0')}</span>
                  <div className="min-w-0 flex-1"><div className="text-sm text-slate-100">{s.label}</div><div className="truncate text-[11px] text-slate-500">{s.reason}</div></div>
                  {s.fragile && <Badge tone="bad">Fragile</Badge>}{s.essential && <Badge tone="warn">Essential</Badge>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function VehiclePlanner() {
  const { stats } = useStats()
  const objects = useMove((s) => s.objects)
  const boxes = useMove((s) => s.boxes)
  const vehicle = useMove((s) => s.vehicle)
  const setVehicle = useMove((s) => s.setVehicle)
  const order = useMemo(() => buildLoadingOrder(objects, boxes), [objects, boxes])
  const v = VEHICLES.find((x) => x.cap === vehicle) ?? VEHICLES[1]
  const placed = useMemo(() => packTruck(order, v.dims), [order, v])
  const overflow = placed.filter((p) => !p.fits).length
  const rec = VEHICLES.find((x) => stats.volume <= x.cap * PACK_EFFICIENCY) ?? VEHICLES[2]
  return (
    <div className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">
        {VEHICLES.map((x) => {
          const usable = x.cap * PACK_EFFICIENCY
          const util = Math.round((stats.volume / usable) * 100)
          const isRec = x.cap === rec.cap
          const fits = util <= 100
          return (
            <Card key={x.cap} onClick={() => setVehicle(x.cap)} glow={vehicle === x.cap} className={cn('relative p-5', vehicle === x.cap && 'ring-1 ring-accent')}>
              {isRec && <span className="absolute right-4 top-4"><Badge tone="accent">Recommended</Badge></span>}
              <div className="flex items-center gap-2 text-slate-400"><Truck size={16} /><span className="text-sm">{x.name}</span></div>
              <div className="mt-3 text-4xl font-semibold tracking-tight text-white">{x.cap} <span className="text-lg text-slate-500">m³</span></div>
              <div className="mt-1 text-xs text-slate-500">{isRec ? <span className="text-accent-soft">{x.cap} m³ — Recommended</span> : fits ? 'Fits with spare room' : 'Too small for this move'}</div>
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-400">Capacity (usable)</span><span className="mono text-slate-100">{usable.toFixed(1)} m³</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Required volume</span><span className="mono text-slate-100">{stats.volume.toFixed(1)} m³</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Utilization</span><span className={cn('mono', fits ? 'text-emerald-300' : 'text-red-300')}>{util}%</span></div>
                <Progress value={Math.min(100, util)} tone={fits ? (util > 92 ? 'warn' : 'ok') : 'bad'} />
                <div className="flex justify-between pt-1"><span className="text-slate-400">Estimated cost</span><span className="mono text-white">${x.price}</span></div>
                <div className="flex justify-between"><span className="text-slate-400">Crew</span><span className="mono text-slate-100">{x.crew} movers</span></div>
              </div>
            </Card>
          )
        })}
      </div>
      <Card className="relative h-[520px] overflow-hidden !rounded-3xl">
        <Scene3D className="!absolute inset-0" camera={[5.5, 4.6, 7]} target={[0.4, 0.8, 0]} minDistance={3.5} maxDistance={16} grid={false}>
          <TruckScene bay={v.dims} placed={placed} />
        </Scene3D>
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-black/55 px-3 py-2 backdrop-blur"><div className="label">Cargo layout · {v.cap} m³ {v.name}</div><div className="mono mt-0.5 text-xs text-slate-300">{v.dims.join(' × ')} m · {placed.length - overflow}/{placed.length} placed</div></div>
        {overflow > 0 ? <div className="absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-xl border border-red-400/40 bg-red-500/15 px-4 py-3 text-sm text-red-200 backdrop-blur"><AlertTriangle size={16} /> {overflow} item{overflow > 1 ? 's' : ''} do not fit in the {v.cap} m³ vehicle and would need a second trip.</div>
          : <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200 backdrop-blur"><Check size={16} /> Everything fits — heavy pieces at the cab wall, fragile cartons on top, essentials nearest the doors.</div>}
      </Card>
    </div>
  )
}
