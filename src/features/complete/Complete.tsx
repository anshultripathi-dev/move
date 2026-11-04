import { motion } from 'framer-motion'
import { AlertTriangle, Boxes, Check, Download, FileText, PartyPopper, ShieldAlert, Sofa, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { HomeScene } from '../../components/3d/HomeScene'
import { Scene3D } from '../../components/3d/Scene3D'
import { Badge, Card, Modal, StatePill } from '../../components/ui'
import { DEST_HOME } from '../../data/layouts'
import { useDestItems } from '../../hooks/useScene'
import { navigate } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'
import { ROOM_LABEL, ROOM_ORDER } from '../../models/types'
import { useMove } from '../../state/store'
import { cn, fmtTime } from '../../utils/format'

export default function Complete() {
  const { stats, exceptions } = useStats()
  const phase = useMove((s) => s.phase)
  const setPhase = useMove((s) => s.setPhase)
  const meta = useMove((s) => s.meta)
  const objects = useMove((s) => s.objects)
  const boxes = useMove((s) => s.boxes)
  const events = useMove((s) => s.events)
  const damage = useMove((s) => s.damage)
  const items = useDestItems()
  const [report, setReport] = useState(false)
  const blockers = exceptions.filter((e) => e.level !== 'blue')
  const complete = phase >= 4 && blockers.length === 0
  const arrived = phase >= 3
  const recon = arrived ? Math.round((stats.reconciled / stats.items) * 100) : 0
  const accounted = arrived ? stats.accounted : 0
  const tiles = [
    { l: 'Items accounted for', v: `${accounted} / ${stats.items}`, ok: accounted === stats.items, icon: <Check size={16} /> },
    { l: 'Boxes', v: `${stats.boxesArrived} / ${stats.boxCount}`, ok: stats.boxesArrived === stats.boxCount, icon: <Boxes size={16} /> },
    { l: 'Missing', v: String(stats.missing), ok: stats.missing === 0, icon: <AlertTriangle size={16} /> },
    { l: 'Damage detected', v: String(stats.damageCount), ok: false, warn: stats.damageCount > 0, icon: <ShieldAlert size={16} /> },
    { l: 'Furniture items', v: `${stats.furnitureArrived} / ${stats.furnitureTotal}`, ok: stats.furnitureArrived === stats.furnitureTotal, icon: <Sofa size={16} /> },
    { l: 'Reconciliation', v: `${recon}%`, ok: recon === 100, icon: <Sparkles size={16} /> },
  ]
  return (
    <div>
      <Card glow={complete} className="relative overflow-hidden p-8 text-center sm:p-12">
        <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
        {complete && Array.from({ length: 18 }).map((_, i) => <motion.span key={i} className="absolute h-1.5 w-1.5 rounded-full" style={{ left: `${8 + i * 5}%`, background: ['#6d8bff', '#2dd4bf', '#fbbf24', '#34d399'][i % 4] }} initial={{ y: 200, opacity: 0 }} animate={{ y: [200, -40 - (i % 5) * 20], opacity: [0, 1, 0] }} transition={{ duration: 2.4, delay: i * 0.06 }} />)}
        <div className="relative">
          <motion.div initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={cn('mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2', complete ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300 shadow-[0_0_50px_-5px_#34d399]' : 'border-amber-400/60 bg-amber-400/10 text-amber-300')}>{complete ? <Check size={38} strokeWidth={2.5} /> : <PartyPopper size={34} />}</motion.div>
          <div className="label mt-6">{meta.id}</div>
          <h1 className="h-display mt-2 text-4xl tracking-tight sm:text-6xl">{complete ? 'MOVE COMPLETE' : 'ALMOST THERE'}</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-400">{complete ? `${accounted} / ${stats.items} items accounted for · ${meta.from.split(',')[0]} → ${meta.to.split(',')[0]}` : phase < 3 ? 'Your move is still underway. Advance the lifecycle to see the completed state.' : `${blockers.length} exception${blockers.length > 1 ? 's' : ''} still need resolving before the move can be verified.`}</p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {complete ? <button className="btn-primary !px-6 !py-3" onClick={() => setReport(true)}><FileText size={16} /> View Move Report</button> : <button className="btn-primary !px-6 !py-3" onClick={() => setPhase(4)}>{phase < 3 ? 'Fast-forward to completion' : 'Resolve all & finalise'}</button>}
            <button className="btn-ghost !px-6 !py-3" onClick={() => navigate('/exceptions')}>Exceptions</button>
          </div>
        </div>
      </Card>

      <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {tiles.map((t) => (
          <Card key={t.l} className={cn('p-4', t.warn && 'ring-1 ring-orange-400/40')}>
            <div className="flex items-center justify-between text-slate-500"><span className="label">{t.l}</span>{t.icon}</div>
            <div className={cn('mt-2 text-3xl font-semibold tracking-tight', t.warn ? 'text-orange-300' : t.ok ? 'text-emerald-300' : 'text-white')}>{t.v}</div>
          </Card>
        ))}
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.2fr_1fr]">
        <Card className="relative h-[460px] overflow-hidden">
          <Scene3D className="!absolute inset-0" camera={[5, 8.5, 9]} autoRotate rotateSpeed={0.5} minDistance={5} maxDistance={20}>
            <HomeScene home={DEST_HOME} items={items.map((i) => ({ ...i, hidden: false }))} wallOpacity={0.12} showLabels={false} />
          </Scene3D>
          <div className="pointer-events-none absolute left-4 top-4"><div className="label">Final digital twin</div><div className="text-sm font-medium text-white">{meta.to.split(',')[0]} · all {stats.items} objects placed</div></div>
        </Card>
        <div className="space-y-5">
          <Card className="p-5">
            <div className="label">Move summary</div>
            <div className="mt-3 space-y-2 text-sm">
              {[['Route', `${meta.from.split(',')[0]} → ${meta.to.split(',')[0]}`], ['Type', meta.type], ['Date', new Date(meta.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })], ['Volume · weight', `${stats.volume.toFixed(1)} m³ · ${Math.round(stats.weight)} kg`], ['Vehicle', '8 m³ Box Truck S · 86% utilised'], ['Events logged', `${events.length}`]].map(([k, v]) => <div key={k} className="flex justify-between gap-4"><span className="text-slate-500">{k}</span><span className="text-right text-slate-100">{v}</span></div>)}
            </div>
          </Card>
          <Card className="p-5">
            <div className="flex items-center justify-between"><div className="label">Damage report</div>{damage && <Badge tone={damage.status === 'reported' ? 'ok' : 'warn'}>{damage.status}</Badge>}</div>
            {damage ? <div className="mt-3 text-sm text-slate-300"><b className="text-white">Wardrobe</b> · {damage.type.toLowerCase()} · {damage.severity.toLowerCase()} · {damage.location.toLowerCase()}<div className="mono mt-1 text-[11px] text-slate-500">{damage.reportId ?? 'No report filed'} · {fmtTime(damage.ts)}</div><button className="btn-ghost mt-3 !py-1.5 text-xs" onClick={() => navigate('/damage/report')}>Open report</button></div> : <div className="mt-3 text-sm text-slate-500">No damage detected.</div>}
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="label">Inventory by room</div>
          <div className="mt-3 space-y-2.5">
            {ROOM_ORDER.map((r) => { const l = objects.filter((o) => o.destRoom === r); const ok = l.filter((o) => o.missing !== 'suspected' && o.missing !== 'reported'); return <div key={r}><div className="mb-1 flex justify-between text-sm"><span className="text-slate-300">{ROOM_LABEL[r]}</span><span className="mono text-slate-400">{ok.length}/{l.length}</span></div><div className="h-1.5 rounded-full bg-white/[0.06]"><div className="h-full rounded-full bg-emerald-400" style={{ width: `${(ok.length / l.length) * 100}%` }} /></div></div> })}
          </div>
        </Card>
        <Card className="p-5">
          <div className="label">Box history</div>
          <div className="mt-3 max-h-[230px] space-y-1 overflow-y-auto pr-1">
            {boxes.map((b) => <button key={b.id} onClick={() => navigate(`/box/${b.id}`)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.04]"><span className="text-sm text-slate-200">#{String(b.num).padStart(3, '0')} · {b.label}</span><span className="flex items-center gap-2"><span className="mono text-[11px] text-slate-500">{events.filter((e) => e.boxId === b.id).length} events</span><StatePill state={b.state} /></span></button>)}
          </div>
        </Card>
      </div>

      <Modal open={report} onClose={() => setReport(false)} width="max-w-2xl" title="Move report" footer={<><button className="btn-ghost" onClick={() => setReport(false)}>Close</button><button className="btn-primary"><Download size={14} /> Download PDF (simulated)</button></>}>
        <div className="text-center"><div className="label">{meta.id}</div><div className="mt-1 text-2xl font-semibold text-white">Verified Move Report</div><div className="text-sm text-slate-500">{meta.from.split(',')[0]} → {meta.to.split(',')[0]}</div></div>
        <div className="mt-5 grid grid-cols-3 gap-3">{tiles.map((t) => <div key={t.l} className="rounded-xl bg-white/[0.04] p-3"><div className="label">{t.l}</div><div className="mt-1 text-xl font-semibold text-white">{t.v}</div></div>)}</div>
        <div className="mt-5 space-y-2 text-sm text-slate-300">
          <div className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-400" /> 37 objects tracked through 8 lifecycle states with full event history.</div>
          <div className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-400" /> Desk lamp located in Box #007 packing paper; documents folder returned to the Study.</div>
          <div className="flex gap-2"><AlertTriangle size={15} className="mt-0.5 text-orange-300" /> 1 damage record (Wardrobe scratch, medium) — report {damage?.reportId ?? 'RPT-2841-01'} filed.</div>
          <div className="flex gap-2"><Check size={15} className="mt-0.5 text-emerald-400" /> 4 furniture items reassembled; destination twin archived.</div>
        </div>
      </Modal>
    </div>
  )
}
