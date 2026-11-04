import { motion } from 'framer-motion'
import { AlertTriangle, Check, GripVertical, Package, Sparkles, Wand2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { fragTone, priTone } from '../../components/ObjectPanels'
import { Badge, Card, PageHeader, Progress, StatePill } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'
import { ROOM_COLOR, ROOM_LABEL } from '../../models/types'
import { useMove } from '../../state/store'
import { boxStats, cn } from '../../utils/format'

const LIMIT = 18

export default function SmartPacking() {
  const { stats } = useStats()
  const boxes = useMove((s) => s.boxes)
  const objects = useMove((s) => s.objects)
  const assign = useMove((s) => s.assignBox)
  const pack = useMove((s) => s.packObject)
  const phase = useMove((s) => s.phase)
  const [gen, setGen] = useState<'busy' | 'ready'>('busy')
  const [dragId, setDragId] = useState<string | null>(null)
  const [over, setOver] = useState<string | null>(null)
  const run = () => { setGen('busy'); setTimeout(() => setGen('ready'), 1500) }
  useEffect(run, [])
  const loose = objects.filter((o) => !o.boxId)
  const drop = (boxId: string | null) => { if (dragId) assign(dragId, boxId); setDragId(null); setOver(null) }

  return (
    <div>
      <PageHeader eyebrow="Smart packing" title="Suggested boxes" sub="MOVE groups your inventory by room, fragility, weight and destination into ready-to-label boxes. Drag items between boxes to adjust." actions={
        <><button className="btn-ghost" onClick={run}><Wand2 size={14} /> Re-generate</button><button className="btn-primary" onClick={() => navigate('/boxes')}>Open box management</button></>
      } />
      <Card className="mb-5 flex flex-wrap items-center gap-6 p-5">
        <div className="min-w-[220px] flex-1"><div className="flex justify-between text-sm"><span className="text-slate-300">Packing progress</span><span className="mono text-white">{stats.packed}/{stats.items} items</span></div><Progress value={(stats.packed / stats.items) * 100} className="mt-2" /></div>
        <div className="text-sm text-slate-400"><span className="text-white">{boxes.filter((b) => b.state !== 'CREATED').length}</span>/{boxes.length} boxes sealed</div>
        <div className="text-sm text-slate-400"><span className="text-white">{stats.scannedOnly}</span> items to pack</div>
      </Card>

      {gen === 'busy' ? (
        <Card className="p-10 text-center"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: 'linear' }} className="mx-auto mb-4 flex h-12 w-12 items-center justify-center text-accent-soft"><Sparkles size={28} /></motion.div><div className="text-sm font-medium text-white">Grouping 37 objects into optimal boxes…</div><div className="mt-1 text-xs text-slate-500">Balancing weight, fragility and destination room</div></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {boxes.map((b, i) => {
            const bs = boxStats(b, objects)
            const heavy = bs.weight > LIMIT
            return (
              <motion.div key={b.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                onDragOver={(e) => { e.preventDefault(); setOver(b.id) }} onDragLeave={() => setOver(null)} onDrop={() => drop(b.id)}
                className={cn('card p-4 transition-all', over === b.id && 'ring-2 ring-accent bg-accent/10')}>
                <div className="flex items-start justify-between">
                  <div><div className="flex items-center gap-2"><span className="mono text-xs text-slate-500">BOX {String(b.num).padStart(2, '0')}</span><span className="h-1.5 w-1.5 rounded-full" style={{ background: ROOM_COLOR[b.room] }} /><span className="text-xs text-slate-400">{ROOM_LABEL[b.room]}</span></div><button onClick={() => navigate(`/box/${b.id}`)} className="mt-1 text-left text-base font-semibold text-white hover:text-accent-soft">{b.label}</button></div>
                  <StatePill state={b.state} />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Badge tone={fragTone[bs.fragility]}>{bs.fragility === 'High' ? 'Fragile' : bs.fragility} </Badge><Badge tone={priTone[b.priority]}>{b.priority}</Badge><Badge tone="teal">→ {ROOM_LABEL[b.destRoom]}</Badge>
                </div>
                <div className="mt-3 space-y-1">
                  {bs.items.map((o) => (
                    <div key={o.id} draggable onDragStart={() => setDragId(o.id)} onDragEnd={() => { setDragId(null); setOver(null) }} className="group flex cursor-grab items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5 active:cursor-grabbing">
                      <GripVertical size={12} className="text-slate-600" />
                      <span className="flex-1 truncate text-[13px] text-slate-200">{o.name}</span>
                      {o.state === 'PACKED' || ['LOADED', 'IN_TRANSIT', 'ARRIVED', 'PLACED', 'UNPACKED'].includes(o.state) ? <Check size={13} className="text-emerald-400" /> : phase === 0 ? <button onClick={() => pack(o.id)} className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-soft hover:bg-accent/40">Pack</button> : null}
                    </div>
                  ))}
                  {bs.items.length === 0 && <div className="rounded-lg border border-dashed border-white/10 py-3 text-center text-xs text-slate-600">Drop items here</div>}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-xs">
                  <div><div className="label">Weight</div><div className={cn('mono mt-0.5', heavy ? 'text-red-300' : 'text-white')}>{bs.weight.toFixed(1)} kg</div></div>
                  <div><div className="label">Volume</div><div className="mono mt-0.5 text-white">{bs.volume.toFixed(2)} m³</div></div>
                  <div><div className="label">Items</div><div className="mono mt-0.5 text-white">{bs.items.length}</div></div>
                </div>
                {heavy && <div className="mt-2 flex items-center gap-1.5 text-[11px] text-red-300"><AlertTriangle size={12} /> Over {LIMIT} kg limit — split this box</div>}
              </motion.div>
            )
          })}
          <div onDragOver={(e) => { e.preventDefault(); setOver('loose') }} onDragLeave={() => setOver(null)} onDrop={() => drop(null)} className={cn('card p-4', over === 'loose' && 'ring-2 ring-accent bg-accent/10')}>
            <div className="flex items-center gap-2"><Package size={15} className="text-slate-400" /><div className="text-base font-semibold text-white">Furniture / Unboxed</div></div>
            <div className="mt-1 text-xs text-slate-500">Wrapped, blanketed or disassembled for loading</div>
            <div className="mt-3 space-y-1">
              {loose.map((o) => (
                <div key={o.id} draggable onDragStart={() => setDragId(o.id)} onDragEnd={() => { setDragId(null); setOver(null) }} className="flex cursor-grab items-center gap-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2 py-1.5">
                  <GripVertical size={12} className="text-slate-600" />
                  <span className="flex-1 truncate text-[13px] text-slate-200">{o.name}</span>
                  {['SCANNED', 'VERIFIED'].includes(o.state) && phase === 0 ? <button onClick={() => pack(o.id)} className="rounded-md bg-accent/20 px-1.5 py-0.5 text-[10px] font-semibold text-accent-soft hover:bg-accent/40">Wrap</button> : <Check size={13} className="text-emerald-400" />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
