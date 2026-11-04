import { AlertTriangle, ArrowRight, Boxes, Check, Radar, ShieldAlert, Sofa, Package, Truck } from 'lucide-react'
import { Badge, Card, Progress } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'
import { useMove } from '../../state/store'
import { cn } from '../../utils/format'

export default function Arrival() {
  const { stats } = useStats()
  const phase = useMove((s) => s.phase)
  const setPhase = useMove((s) => s.setPhase)
  const reconRun = useMove((s) => s.reconRun)
  const arrived = phase >= 3
  const cards = [
    { l: 'Expected items', v: stats.items, t: `${stats.items}`, ok: true, icon: <Package size={16} />, sub: 'in the digital twin' },
    { l: 'Detected', v: arrived ? stats.detected : 0, t: `${stats.items}`, ok: arrived && stats.detected === stats.items, icon: <Radar size={16} />, sub: arrived ? (stats.detected === stats.items ? 'Every item detected' : `${stats.items - stats.detected} not detected`) : 'awaiting arrival scan' },
    { l: 'Boxes', v: arrived ? stats.boxesArrived : 0, t: `${stats.boxCount}`, ok: arrived && stats.boxesArrived === stats.boxCount, icon: <Boxes size={16} />, sub: 'scanned off the truck' },
    { l: 'Furniture', v: arrived ? stats.furnitureArrived : 0, t: `${stats.furnitureTotal}`, ok: arrived && stats.furnitureArrived === stats.furnitureTotal, icon: <Sofa size={16} />, sub: 'sofa · desk · bed · wardrobe' },
  ]
  return (
    <div className="space-y-5">
      {!arrived && (
        <Card glow className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="flex items-center gap-3"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/20 text-accent-soft"><Truck size={18} /></span><div><div className="text-base font-semibold text-white">Truck has not arrived yet</div><div className="text-sm text-slate-400">Fast-forward the demo to the arrival scan at Harbor Street.</div></div></div>
          <button className="btn-primary" onClick={() => setPhase(3)}>Simulate arrival <ArrowRight size={14} /></button>
        </Card>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.l} className={cn('p-5', arrived && !c.ok && 'ring-1 ring-amber-400/40')}>
            <div className="flex items-center justify-between text-slate-500"><span className="label">{c.l}</span>{c.icon}</div>
            <div className="mt-3 flex items-baseline gap-1"><span className={cn('text-4xl font-semibold tracking-tight', !arrived ? 'text-slate-600' : c.ok ? 'text-white' : 'text-amber-300')}>{c.v}</span><span className="text-lg text-slate-500">/ {c.t}</span></div>
            <Progress className="mt-3" value={(c.v / Number(c.t)) * 100} tone={c.ok ? 'ok' : 'warn'} />
            <div className={cn('mt-2 flex items-center gap-1.5 text-xs', arrived ? (c.ok ? 'text-emerald-300' : 'text-amber-300') : 'text-slate-500')}>{arrived && (c.ok ? <Check size={12} /> : <AlertTriangle size={12} />)}{c.sub}</div>
          </Card>
        ))}
        <Card className={cn('p-5', arrived && stats.damageCount > 0 && 'ring-1 ring-orange-400/40')} onClick={() => navigate('/damage')}>
          <div className="flex items-center justify-between text-slate-500"><span className="label">Damage</span><ShieldAlert size={16} /></div>
          <div className={cn('mt-3 text-4xl font-semibold tracking-tight', arrived && stats.damageCount ? 'text-orange-300' : 'text-white')}>{arrived ? stats.damageCount : 0}</div>
          <div className="mt-3 h-1.5 rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-orange-400" style={{ width: arrived && stats.damageCount ? '100%' : 0 }} /></div>
          <div className="mt-2 text-xs text-slate-400">{arrived && stats.damageCount ? 'Wardrobe · scratch · medium' : 'No damage detected'}</div>
        </Card>
      </div>
      {arrived && (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-6">
            <div className="label">Status cards</div>
            <div className="mt-4 space-y-3">
              {[
                { ok: stats.boxesArrived === stats.boxCount, t: 'All 13 boxes arrived', d: 'Every QR label scanned off the truck.' },
                { ok: stats.furnitureArrived === stats.furnitureTotal, t: 'All 4 furniture items arrived', d: 'Sofa, desk, bed and wardrobe inspected.' },
                { ok: stats.missing === 0, t: stats.missing ? `${stats.missing} item may be missing` : 'No missing items', d: stats.missing ? 'Desk Lamp not detected — last seen in Box #007.' : 'Reconciliation found nothing missing.' },
                { ok: stats.misplaced === 0, t: stats.misplaced ? 'An item is in the wrong room' : 'Everything is in the right room', d: stats.misplaced ? 'Documents Folder is in the Bedroom, expected Study.' : 'All placements verified.' },
                { ok: stats.damageOpen === 0, t: stats.damageOpen ? '1 damage record open' : 'No open damage', d: stats.damageOpen ? 'Wardrobe — new scratch, right panel.' : 'Damage report filed.' },
              ].map((s) => (
                <div key={s.t} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] p-3.5"><span className={cn('mt-0.5 flex h-6 w-6 items-center justify-center rounded-full', s.ok ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300')}>{s.ok ? <Check size={13} /> : <AlertTriangle size={13} />}</span><div><div className="text-sm font-medium text-white">{s.t}</div><div className="text-xs text-slate-500">{s.d}</div></div></div>
              ))}
            </div>
          </Card>
          <Card glow className="flex flex-col justify-between p-6">
            <div>
              <div className="label text-accent-soft">Next step</div>
              <div className="mt-2 text-2xl font-semibold tracking-tight text-white">Reconcile expected vs arrived</div>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">MOVE compares the digital twin of your old home against what the arrival scan detected in the new one, then flags anything missing, misplaced or damaged.</p>
              {reconRun && <Badge tone="ok" className="mt-3">Reconciliation complete</Badge>}
            </div>
            <div className="mt-6 flex flex-wrap gap-2"><button className="btn-primary" onClick={() => navigate('/reconciliation')}><Radar size={15} /> {reconRun ? 'View reconciliation' : 'Run reconciliation'}</button><button className="btn-ghost" onClick={() => navigate('/damage')}>Damage detection</button></div>
          </Card>
        </div>
      )}
    </div>
  )
}
