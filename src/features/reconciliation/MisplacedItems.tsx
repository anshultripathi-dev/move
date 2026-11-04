import { ArrowRight, Check, MapPin } from 'lucide-react'
import { Badge, Card, Empty } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { ROOM_COLOR, ROOM_LABEL, ROOM_ORDER } from '../../models/types'
import { useMove } from '../../state/store'
import { cn } from '../../utils/format'

export function MisplacedItems() {
  const objects = useMove((s) => s.objects)
  const resolve = useMove((s) => s.resolveMisplaced)
  const list = objects.filter((o) => o.misplacedIn)
  if (list.length === 0) return <Card><Empty icon={<Check size={30} className="text-emerald-400" />} title="Nothing misplaced" /></Card>
  return (
    <div className="space-y-5">
      {list.map((o) => {
        const res = o.misplacedResolved
        const exp = res === 'updated' ? o.misplacedIn! : o.destRoom
        return (
          <Card key={o.id} className={cn('p-6', !res && 'ring-1 ring-amber-400/30')}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div><div className="label">{res ? 'Resolved' : 'Misplaced item'}</div><div className="mt-1 text-3xl font-semibold uppercase tracking-wide text-white">{o.name}</div><div className="mono text-xs text-slate-500">{o.id} · {o.boxId?.replace('BOX-', 'Box #')}</div></div>
              {res ? <Badge tone="ok">{res === 'moved' ? 'Moved to correct room' : res === 'updated' ? 'Destination updated' : 'Ignored'}</Badge> : <Badge tone="warn">Object appears misplaced</Badge>}
            </div>
            <div className="mt-6 grid items-center gap-4 md:grid-cols-[1fr_auto_1fr]">
              <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-5"><div className="label">Expected</div><div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white"><span className="h-3 w-3 rounded-full" style={{ background: ROOM_COLOR[exp] }} />{ROOM_LABEL[exp]}</div></div>
              <ArrowRight className="mx-auto text-slate-600" />
              <div className={cn('rounded-2xl border p-5', res === 'moved' ? 'border-emerald-400/30 bg-emerald-400/5' : 'border-amber-400/30 bg-amber-400/5')}><div className="label">Detected</div><div className="mt-2 flex items-center gap-2 text-2xl font-semibold text-white"><span className="h-3 w-3 rounded-full" style={{ background: ROOM_COLOR[res === 'moved' ? o.destRoom : o.misplacedIn!] }} />{ROOM_LABEL[res === 'moved' ? o.destRoom : o.misplacedIn!]}</div></div>
            </div>
            <div className="mt-5 grid grid-cols-4 gap-2">{ROOM_ORDER.map((r) => <div key={r} className={cn('rounded-lg border p-2 text-center text-xs', r === (res === 'moved' ? o.destRoom : o.misplacedIn) ? 'border-amber-400/50 bg-amber-400/10 text-amber-200' : 'border-white/[0.07] text-slate-500')}>{r === (res === 'moved' ? o.destRoom : o.misplacedIn) && <MapPin size={12} className="mx-auto mb-1" />}{ROOM_LABEL[r]}</div>)}</div>
            <div className="mt-6 flex flex-wrap gap-2">
              <button className="btn-primary" disabled={!!res} onClick={() => resolve(o.id, 'moved')}>Move to Correct Room</button>
              <button className="btn-ghost" disabled={!!res} onClick={() => resolve(o.id, 'ignored')}>Ignore</button>
              <button className="btn-ghost" disabled={!!res} onClick={() => resolve(o.id, 'updated')}>Update Destination</button>
              <button className="btn-quiet" onClick={() => navigate(`/object/${o.id}`)}>Object details</button>
            </div>
          </Card>
        )
      })}
    </div>
  )
}
