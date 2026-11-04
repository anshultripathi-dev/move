import { AlertTriangle, Check, FileText, ScanSearch, ShieldCheck } from 'lucide-react'
import { Badge, Card, Empty, Meta, PageHeader, RouteTabs, StatePill } from '../../components/ui'
import { navigate, useRoute } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'
import { useMove } from '../../state/store'
import { fmtTime } from '../../utils/format'
import { BeforeAfter } from './BeforeAfter'
import { DamageReport } from './DamageReport'

export default function Damage() {
  const { path } = useRoute()
  const report = path.startsWith('/damage/report')
  const tabs = [{ to: '/damage', label: 'Damage Detection' }, { to: '/damage/report', label: 'Damage Report' }]
  return (
    <div>
      <PageHeader eyebrow="Damage" title={report ? 'Damage report' : 'Damage detection'} sub={report ? 'A claim-ready report assembled from the before/after scans.' : 'MOVE compares the pre-move scan of every furniture item with the arrival scan and flags changes.'} tabs={<RouteTabs items={tabs} path={path} />} />
      {report ? <DamageReport /> : <Detection />}
    </div>
  )
}

function Detection() {
  const damage = useMove((s) => s.damage)
  const objects = useMove((s) => s.objects)
  const phase = useMove((s) => s.phase)
  const setPhase = useMove((s) => s.setPhase)
  const ack = useMove((s) => s.acknowledgeDamage)
  const meta = useMove((s) => s.meta)
  const { stats } = useStats()
  const furniture = objects.filter((o) => o.isFurniture)
  if (phase < 3 || !damage) {
    return (
      <Card className="p-8"><Empty icon={<ScanSearch size={32} />} title="No arrival scan yet" sub="Damage detection runs when furniture is scanned off the truck. Until then, MOVE holds the pre-move condition baseline for every item." action={<button className="btn-primary mt-3" onClick={() => setPhase(3)}>Simulate arrival scan</button>} /></Card>
    )
  }
  const o = objects.find((x) => x.id === damage.objectId)!
  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <Card className="p-5">
        <div className="mb-4 flex items-center justify-between"><div><div className="label">Wardrobe · before / after</div><div className="text-sm text-slate-400">Drag the handle to compare</div></div><Badge tone="orange" icon={<AlertTriangle size={11} />}>New damage</Badge></div>
        <BeforeAfter className="aspect-[6/7] w-full" beforeLabel="BEFORE MOVE · OCT 10 17:20" afterLabel="AFTER MOVE · OCT 14 15:42" />
        <div className="mt-4 grid grid-cols-2 gap-3 text-sm"><div className="rounded-xl bg-emerald-400/[0.07] p-3"><div className="label !text-emerald-300">Before move</div><div className="mt-1 text-white">Condition: Good</div></div><div className="rounded-xl bg-red-400/[0.07] p-3"><div className="label !text-red-300">After move</div><div className="mt-1 text-white">New scratch detected</div></div></div>
      </Card>
      <div className="space-y-5">
        <Card className="p-6">
          <div className="flex items-start justify-between"><div><div className="label">Detected damage</div><div className="mt-1 text-3xl font-semibold uppercase tracking-wide text-white">{o.name}</div></div><StatePill state={o.state} /></div>
          <div className="mt-6 grid grid-cols-2 gap-5">
            <Meta label="Damage type" value={damage.type} />
            <Meta label="Severity" value={<Badge tone="orange">{damage.severity}</Badge>} />
            <Meta label="Location" value={damage.location} />
            <Meta label="Confidence" value={<span className="mono">{damage.confidence}%</span>} />
            <Meta label="Timestamp" value={<span className="mono">{fmtTime(damage.ts)}</span>} />
            <Meta label="Move" value={meta.id} />
            <Meta label="Condition" value={<span>Good → <span className="text-orange-300">{o.condition}</span></span>} />
            <Meta label="Status" value={<Badge tone={damage.status === 'open' ? 'bad' : damage.status === 'acknowledged' ? 'warn' : 'ok'}>{damage.status}</Badge>} />
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            <button className="btn-ghost" disabled={damage.status !== 'open'} onClick={ack}><Check size={14} /> Acknowledge</button>
            <button className="btn-primary" onClick={() => navigate('/damage/report')}><FileText size={14} /> {damage.reportId ? 'View report' : 'Create damage report'}</button>
          </div>
        </Card>
        <Card className="p-6">
          <div className="label">Arrival scan · furniture</div>
          <div className="mt-3 space-y-2">
            {furniture.map((f) => {
              const bad = f.id === damage.objectId
              return <div key={f.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] px-3 py-2.5"><span className="text-sm text-slate-200">{f.name.replace(' Frame & Mattress', '')}</span>{bad ? <Badge tone="orange">Scratch · {damage.confidence}%</Badge> : <Badge tone="ok" icon={<ShieldCheck size={11} />}>No change · {96 + (f.id.charCodeAt(5) % 3)}%</Badge>}</div>
            })}
          </div>
          <div className="mt-3 text-xs text-slate-500">{stats.damageCount} damage record · 3 furniture items unchanged</div>
        </Card>
      </div>
    </div>
  )
}
