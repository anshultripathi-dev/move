import { Check, Search, Siren, Waypoints } from 'lucide-react'
import { useState } from 'react'
import { Badge, Card, Empty, Meta, Modal, StatePill } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { ROOM_LABEL, type MoveObject } from '../../models/types'
import { useMove } from '../../state/store'
import { fmtTime } from '../../utils/format'

export function TraceModal({ obj, onClose }: { obj: MoveObject; onClose: () => void }) {
  const events = useMove((s) => s.events)
  const trail = events.filter((e) => e.objectId === obj.id || (obj.lastSeen?.boxId && e.boxId === obj.lastSeen.boxId && ['load', 'transit', 'arrive'].includes(e.kind))).filter((e, i, a) => a.findIndex((x) => x.id === e.id) === i)
  return (
    <Modal open onClose={onClose} title={`Trace history · ${obj.name}`} width="max-w-xl">
      <div className="relative space-y-4 border-l border-white/10 pl-5">
        {trail.slice(-14).map((e) => (
          <div key={e.id} className="relative"><span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d121b] bg-accent" /><div className="text-sm text-slate-200">{e.text}</div><div className="mono text-[11px] text-slate-500">{fmtTime(e.ts)} · {e.actor}</div></div>
        ))}
      </div>
      <div className="mt-5 rounded-xl bg-amber-400/10 p-3 text-xs text-amber-200">Last confirmed custody point: <b>{obj.lastSeen?.boxId?.replace('BOX-', 'Box #')}</b> at state <b>{obj.lastSeen?.state}</b>. No scan recorded after unloading.</div>
    </Modal>
  )
}

export function MissingItems() {
  const objects = useMove((s) => s.objects)
  const markFound = useMove((s) => s.markFound)
  const report = useMove((s) => s.reportMissing)
  const [trace, setTrace] = useState<MoveObject | null>(null)
  const list = objects.filter((o) => o.missing)
  if (list.length === 0) return <Card><Empty icon={<Check size={30} className="text-emerald-400" />} title="Nothing missing" sub="Every expected item was detected at the destination." /></Card>
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {list.map((o) => {
        const found = o.missing === 'found'
        return (
          <Card key={o.id} className={found ? 'p-6 ring-1 ring-emerald-400/30' : 'p-6 ring-1 ring-red-400/30'}>
            <div className="flex items-start justify-between gap-3">
              <div><div className="label">{found ? 'Resolved' : o.missing === 'reported' ? 'Reported missing' : 'Suspected missing'}</div><div className="mt-1 text-3xl font-semibold uppercase tracking-wide text-white">{o.name}</div><div className="mono text-xs text-slate-500">{o.id}</div></div>
              {found ? <Badge tone="ok">Found</Badge> : o.missing === 'reported' ? <Badge tone="bad">Claim opened</Badge> : <Badge tone="bad">Missing</Badge>}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-5">
              <Meta label="Last seen" value={<button className="text-accent-soft hover:underline" onClick={() => navigate(`/box/${o.lastSeen?.boxId}`)}>{o.lastSeen?.boxId?.replace('BOX-', 'Box #')}</button>} />
              <Meta label="Last state" value={<StatePill state={o.lastSeen?.state ?? 'LOADED'} />} />
              <Meta label="Last location" value={o.lastSeen ? ROOM_LABEL[o.lastSeen.room] : '—'} />
              <Meta label="Confidence" value={<span className="mono">89%</span>} />
            </div>
            <p className="mt-4 rounded-lg bg-white/[0.04] p-3 text-xs leading-relaxed text-slate-400">The 3 other items in Box #007 were all scanned at the destination. Small items are often wedged in packing paper — check the box lining first.</p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-ok" disabled={found} onClick={() => markFound(o.id)}><Check size={14} /> Mark Found</button>
              <button className="btn-danger" disabled={found || o.missing === 'reported'} onClick={() => report(o.id)}><Siren size={14} /> {o.missing === 'reported' ? 'Reported' : 'Report Missing'}</button>
              <button className="btn-ghost" onClick={() => setTrace(o)}><Waypoints size={14} /> Trace History</button>
              <button className="btn-quiet" onClick={() => navigate(`/box/${o.lastSeen?.boxId}`)}><Search size={14} /> Open box</button>
            </div>
          </Card>
        )
      })}
      {trace && <TraceModal obj={trace} onClose={() => setTrace(null)} />}
    </div>
  )
}
