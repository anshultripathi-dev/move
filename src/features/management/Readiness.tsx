import { ArrowRight, Check } from 'lucide-react'
import { Card, CheckRow, PageHeader, Progress, Ring } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'
import { useMove } from '../../state/store'
import { cn } from '../../utils/format'

export default function Readiness() {
  const { stats } = useStats()
  const docs = useMove((s) => s.docs)
  const toggleDoc = useMove((s) => s.toggleDoc)
  const b = stats.breakdown
  const rows = [
    { l: 'Inventory', v: b.inventory, w: 10, d: '37 objects scanned & identified', to: '/inventory' },
    { l: 'Packing', v: b.packing, w: 32, d: `${stats.packed}/${stats.items} items packed`, to: '/packing' },
    { l: 'Destination', v: b.destination, w: 10, d: 'Rooms, doorways & clearances verified', to: '/destination' },
    { l: 'Vehicle', v: b.vehicle, w: 10, d: `${stats.volume.toFixed(1)} m³ on an 8 m³ truck`, to: '/planning/vehicle' },
    { l: 'Documentation', v: b.documentation, w: 38, d: `${docs.filter((d) => d.done).length}/${docs.length} documents complete`, to: '/readiness' },
  ]
  return (
    <div>
      <PageHeader eyebrow="Management" title="Move readiness" sub="One score for how prepared you are. Each area is weighted by how much it can derail Move Day." />
      <div className="grid gap-5 xl:grid-cols-[400px_1fr]">
        <Card glow className="flex flex-col items-center justify-center p-8">
          <div className="label mb-5">Move readiness</div>
          <Ring value={stats.readiness} size={240} stroke={16} sub={stats.readiness >= 100 ? 'Ready' : 'Ready to move'} />
          <div className="mt-6 text-center">
            <div className="text-2xl font-semibold text-white">{stats.remaining.length} action{stats.remaining.length === 1 ? '' : 's'} remaining</div>
            <div className="mt-3 space-y-2">{stats.remaining.map((r) => <div key={r} className="flex items-center gap-2 text-sm text-slate-300"><span className="h-1.5 w-1.5 rounded-full bg-accent" />{r}</div>)}{stats.remaining.length === 0 && <div className="flex items-center justify-center gap-2 text-sm text-emerald-300"><Check size={14} /> Everything is in place</div>}</div>
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-6">
            <div className="label">Breakdown</div>
            <div className="mt-4 space-y-5">
              {rows.map((r) => (
                <button key={r.l} onClick={() => navigate(r.to)} className="block w-full text-left">
                  <div className="flex items-baseline justify-between"><div><span className="text-base font-medium text-white">{r.l}</span><span className="ml-2 text-[11px] text-slate-600">weight {r.w}%</span></div><span className={cn('mono text-lg', r.v >= 90 ? 'text-emerald-300' : r.v >= 60 ? 'text-white' : 'text-amber-300')}>{r.v}%</span></div>
                  <Progress className="mt-2" value={r.v} tone={r.v >= 90 ? 'ok' : r.v >= 60 ? 'accent' : 'warn'} height={7} />
                  <div className="mt-1.5 text-xs text-slate-500">{r.d}</div>
                </button>
              ))}
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between"><div className="label">Documentation checklist</div><span className="mono text-xs text-slate-500">{b.documentation}%</span></div>
            <div className="mt-3">{docs.map((d) => <CheckRow key={d.id} done={d.done} label={d.label} onClick={() => toggleDoc(d.id)} />)}</div>
            <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">Tick items to watch readiness update live <ArrowRight size={11} /></div>
          </Card>
        </div>
      </div>
    </div>
  )
}
