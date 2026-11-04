import { AnimatePresence, motion } from 'framer-motion'
import { Check, Play, RotateCw, X, Ruler, RefreshCcw } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ClearanceScene, type ClearStage } from '../../components/3d/ClearanceScene'
import { Scene3D } from '../../components/3d/Scene3D'
import { Badge, Card, Select } from '../../components/ui'
import { DEST_DOORWAYS } from '../../data/layouts'
import { useMove } from '../../state/store'
import { cn, dimsText } from '../../utils/format'
import { analyzeClearance } from '../../utils/clearance'

export default function Clearance() {
  const objects = useMove((s) => s.objects)
  const candidates = useMemo(() => objects.filter((o) => !o.boxId && Math.max(...o.dims) >= 60), [objects])
  const [id, setId] = useState('OBJ-001')
  const [doorId, setDoorId] = useState('entry')
  const [stage, setStage] = useState<ClearStage>('idle')
  const timers = useRef<number[]>([])
  const obj = candidates.find((o) => o.id === id) ?? candidates[0]
  const door = DEST_DOORWAYS.find((d) => d.id === doorId)!
  const res = useMemo(() => analyzeClearance(obj, door.width, door.height), [obj, door])
  const best = res.best
  const direct = res.direct.ok

  useEffect(() => () => timers.current.forEach(clearTimeout), [])
  useEffect(() => { reset() }, [id, doorId])
  const reset = () => { timers.current.forEach(clearTimeout); timers.current = []; setStage('idle') }
  const at = (ms: number, s: ClearStage) => timers.current.push(window.setTimeout(() => setStage(s), ms))
  const run = () => {
    reset()
    setStage('approach')
    if (direct) { at(1700, 'pass'); at(4200, 'done'); return }
    at(1700, 'blocked')
    if (!best) return
    at(3700, 'solving'); at(5600, 'rotate'); at(7500, 'pass'); at(10000, 'done')
  }

  const rotated = !!best && best.id !== 'upright'
  const detach = !!best && best.detached > 0 && ['rotate', 'pass', 'done'].includes(stage)
  const shown = stage === 'rotate' || stage === 'pass' || stage === 'done' ? best : res.direct
  const cross = shown ? { horiz: shown.horiz, vert: shown.vert } : { horiz: res.direct.horiz, vert: res.direct.vert }
  const blocked = stage === 'blocked' || stage === 'solving'
  const success = stage === 'done' || stage === 'pass' || (stage === 'rotate')

  return (
    <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <Card className="p-5">
          <div className="label">Selected object</div>
          <Select className="mt-2" value={obj.id} onChange={setId} options={candidates.map((o) => ({ value: o.id, label: o.name }))} />
          <div className="mono mt-3 text-sm text-white">{dimsText(obj.dims)}</div>
          <div className="mt-1 text-xs text-slate-500">{obj.weight} kg · {obj.detachNote ?? 'No detachable parts'}</div>
          <div className="label mt-5">Doorway</div>
          <Select className="mt-2" value={doorId} onChange={setDoorId} options={DEST_DOORWAYS.map((d) => ({ value: d.id, label: `${d.label} · ${d.width} cm` }))} />
          <button onClick={run} className="btn-primary mt-5 w-full !py-3"><Play size={15} /> Run clearance check</button>
          <button onClick={reset} className="btn-quiet mt-1 w-full"><RefreshCcw size={13} /> Reset</button>
        </Card>
        <Card className="p-5">
          <div className="label">Doorways at destination</div>
          <div className="mt-3 space-y-1.5">
            {DEST_DOORWAYS.map((d) => {
              const r = analyzeClearance(obj, d.width, d.height)
              return (
                <button key={d.id} onClick={() => setDoorId(d.id)} className={cn('flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm', d.id === doorId ? 'bg-accent/15 ring-1 ring-accent/30' : 'hover:bg-white/5')}>
                  <span className="text-slate-200">{d.label} <span className="mono text-xs text-slate-500">{d.width} cm</span></span>
                  {r.direct.ok ? <Badge tone="ok">Direct</Badge> : r.best ? <Badge tone="warn">Rotate</Badge> : <Badge tone="bad">Blocked</Badge>}
                </button>
              )
            })}
          </div>
        </Card>
      </div>

      <Card className="relative h-[560px] overflow-hidden !rounded-3xl">
        <Scene3D className="!absolute inset-0" camera={[3.9, 3.0, 7.0]} target={[0, 0.8, -0.2]} minDistance={3} maxDistance={12} grid={false}>
          <ClearanceScene obj={obj} doorWidth={door.width} doorHeight={door.height} stage={stage} rotated={rotated} detach={detach} ok={success} crossSection={cross} />
        </Scene3D>
        <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-black/55 px-3 py-2 backdrop-blur"><div className="label">Selected object</div><div className="text-sm font-semibold text-white">{obj.name} <span className="mono ml-1 text-xs font-normal text-slate-400">{dimsText(obj.dims)}</span></div></div>
        <AnimatePresence mode="wait">
          <motion.div key={stage + (direct ? 'd' : 'n')} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-x-4 bottom-4">
            {stage === 'idle' && <Banner tone="idle" title="Ready to test" sub={`Press “Run clearance check” to carry the ${obj.name.toLowerCase()} through the ${door.label.toLowerCase()}.`} />}
            {stage === 'approach' && <Banner tone="idle" title="Approaching doorway…" sub={`Measuring ${obj.name.toLowerCase()} cross-section against ${door.width} cm opening`} />}
            {stage === 'blocked' && <Banner tone="bad" title="Direct entry unavailable" sub={`Cross-section ${res.direct.horiz} cm vs doorway ${door.width} cm — ${Math.abs(res.direct.margin)} cm too wide${best ? '' : ' · no safe orientation found'}`} />}
            {stage === 'solving' && <Banner tone="info" title="Searching orientations…" sub="Evaluating 6 orientations and detachable parts" />}
            {stage === 'rotate' && best && <Banner tone="info" title={best.rotation} sub={`Cross-section becomes ${best.horiz} cm`} />}
            {(stage === 'pass' || stage === 'done') && <Banner tone="ok" title="Clearance achieved" sub={best ? `${best.rotation} · ${best.horiz} cm vs ${door.width} cm → ${best.margin} cm to spare` : `Direct entry · ${res.direct.margin} cm to spare`} />}
          </motion.div>
        </AnimatePresence>
      </Card>

      <div className="space-y-4">
        <Card className="p-5">
          <div className="label">Analysis</div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/[0.04] p-3"><div className="label">Object</div><div className="mono mt-1 text-lg text-white">{res.direct.horiz} cm</div><div className="text-[11px] text-slate-500">narrowest carried width</div></div>
            <div className="rounded-xl bg-white/[0.04] p-3"><div className="label">Doorway</div><div className="mono mt-1 text-lg text-white">{door.width} cm</div><div className="text-[11px] text-slate-500">measured opening</div></div>
          </div>
          <div className="mt-4 space-y-2">
            {res.options.map((o) => {
              const chosen = best?.id === o.id && !direct
              return (
                <div key={o.id} className={cn('rounded-xl border p-3', o.ok ? 'border-emerald-400/30 bg-emerald-400/[0.06]' : 'border-red-400/25 bg-red-400/[0.05]', chosen && stage !== 'idle' && 'ring-1 ring-emerald-300/60')}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-[13px] text-slate-100">{o.label}</div>
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-full', o.ok ? 'bg-emerald-400/20 text-emerald-300' : 'bg-red-400/20 text-red-300')}>{o.ok ? <Check size={12} /> : <X size={12} />}</span>
                  </div>
                  <div className="mono mt-1 text-xs text-slate-400">{o.horiz} cm vs {door.width} cm → {o.margin >= 0 ? `+${o.margin}` : o.margin} cm</div>
                </div>
              )
            })}
          </div>
          {!best && !direct && <div className="mt-3 rounded-lg bg-red-400/10 p-3 text-xs text-red-200">No safe orientation. Consider further disassembly or a crane / window route.</div>}
        </Card>
        {best && !direct && (
          <Card glow className="p-5">
            <div className="flex items-center gap-2 text-emerald-300"><RotateCw size={15} /> Recommended maneuver</div>
            <div className="mt-2 text-lg font-semibold text-white">{best.rotation}</div>
            <p className="mt-1 text-xs leading-relaxed text-slate-400">The movers will be briefed automatically and the Move Day checklist gains a “{obj.detachNote ?? 'rotate 90°'}” step.</p>
          </Card>
        )}
      </div>
      <div className="hidden"><Ruler />{blocked && null}</div>
    </div>
  )
}

function Banner({ tone, title, sub }: { tone: 'idle' | 'bad' | 'ok' | 'info'; title: string; sub: string }) {
  const c = { idle: 'border-white/15 bg-black/60', bad: 'border-red-400/50 bg-red-500/20', ok: 'border-emerald-400/50 bg-emerald-500/20', info: 'border-accent/50 bg-accent/20' }[tone]
  const t = { idle: 'text-white', bad: 'text-red-200', ok: 'text-emerald-200', info: 'text-indigo-100' }[tone]
  return (
    <div className={cn('rounded-2xl border px-5 py-4 backdrop-blur-md', c)}>
      <div className={cn('flex items-center gap-2 text-xl font-semibold', t)}>{tone === 'bad' && <X size={20} />}{tone === 'ok' && <Check size={20} />}{title}</div>
      <div className="mt-0.5 text-sm text-slate-300">{sub}</div>
    </div>
  )
}
