import { ArrowLeft, Check, Circle, ScanLine } from 'lucide-react'
import { BoxPreview } from '../../components/3d/BoxPreview'
import { fragTone, priTone } from '../../components/ObjectPanels'
import { QRCode } from '../../components/QRCode'
import { Badge, Card, Empty, Meta, StatePill } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { BOX_STATES, ROOM_LABEL } from '../../models/types'
import { useMove } from '../../state/store'
import { boxStats, cn, fmtTime } from '../../utils/format'

export function BoxTracker({ state, compact }: { state: string; compact?: boolean }) {
  const idx = BOX_STATES.indexOf(state as never)
  const labels = ['Created', 'Packed', 'Loaded', 'In Transit', 'Arrived', 'Unpacked']
  return (
    <div className={cn('space-y-2.5', compact && 'space-y-1.5')}>
      {BOX_STATES.map((s, i) => (
        <div key={s} className="flex items-center gap-3">
          <span className={cn('flex h-6 w-6 items-center justify-center rounded-full border', i <= idx ? 'border-emerald-400/60 bg-emerald-400/15 text-emerald-300' : 'border-white/10 text-slate-600')}>{i <= idx ? <Check size={13} /> : <Circle size={7} />}</span>
          <span className={cn('flex-1 text-sm', i <= idx ? 'text-white' : 'text-slate-500')}>{labels[i]}</span>
          <span className={cn('text-sm', i <= idx ? 'text-emerald-300' : 'text-slate-600')}>{i <= idx ? '✓' : '—'}</span>
        </div>
      ))}
    </div>
  )
}

export default function BoxDetails({ id }: { id: string }) {
  const box = useMove((s) => s.boxes.find((b) => b.id === id))
  const objects = useMove((s) => s.objects)
  const events = useMove((s) => s.events)
  const scan = useMove((s) => s.scanBox)
  if (!box) return <Empty title="Box not found" action={<button className="btn-primary" onClick={() => navigate('/boxes')}>Back to boxes</button>} />
  const bs = boxStats(box, objects)
  const hist = events.filter((e) => e.boxId === box.id || bs.items.some((i) => i.id === e.objectId && e.kind === 'pack')).slice().reverse()
  const uniq = hist.filter((e, i, a) => a.findIndex((x) => x.text === e.text && x.ts === e.ts) === i)
  return (
    <div>
      <button onClick={() => navigate('/boxes')} className="btn-quiet mb-4 -ml-2"><ArrowLeft size={14} /> Boxes</button>
      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="space-y-5">
          <Card className="p-6 text-center">
            <div className="mx-auto w-fit rounded-2xl bg-white p-3"><QRCode value={box.id} size={170} /></div>
            <div className="mono mt-4 text-xs text-slate-500">{box.id} · /m/2841/{box.num}</div>
            <div className="mt-1 text-3xl font-semibold tracking-tight text-white">BOX #{String(box.num).padStart(3, '0')}</div>
            <div className="mt-1 text-sm text-slate-400">{box.label}</div>
            <div className="mt-3 flex justify-center gap-2"><StatePill state={box.state} />{!box.scanned && <Badge tone="warn">Not scanned</Badge>}</div>
            <button onClick={() => scan(box.id)} className="btn-ghost mt-5 w-full" disabled={box.scanned}><ScanLine size={14} /> {box.scanned ? 'Checkpoint scanned' : 'Log checkpoint scan'}</button>
          </Card>
          <Card className="relative h-56 overflow-hidden"><BoxPreview box={box} className="!absolute inset-0" /></Card>
        </div>
        <div className="space-y-5">
          <Card className="p-6">
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
              <Meta label="Room" value={ROOM_LABEL[box.room]} />
              <Meta label="Destination" value={ROOM_LABEL[box.destRoom]} />
              <Meta label="Weight" value={`${bs.weight.toFixed(1)} kg`} mono />
              <Meta label="Priority" value={<Badge tone={priTone[box.priority]}>{box.priority}</Badge>} />
              <Meta label="Fragility" value={<Badge tone={fragTone[bs.fragility]}>{bs.fragility}</Badge>} />
              <Meta label="Dimensions" value={`${box.dims.join(' × ')} cm`} mono />
              <Meta label="Volume" value={`${bs.volume.toFixed(3)} m³`} mono />
              <Meta label="Category" value={box.tag} />
            </div>
          </Card>
          <div className="grid gap-5 md:grid-cols-2">
            <Card className="p-6"><div className="label mb-4">Tracking status</div><BoxTracker state={box.state} /></Card>
            <Card className="p-6">
              <div className="label mb-3">Contents · {bs.items.length}</div>
              <div className="space-y-1.5">
                {bs.items.map((o) => (
                  <button key={o.id} onClick={() => navigate(`/object/${o.id}`)} className="flex w-full items-center justify-between rounded-lg px-2 py-2 text-left hover:bg-white/[0.04]">
                    <span><span className="block text-sm text-slate-100">{o.name}</span><span className="mono text-[11px] text-slate-500">{o.id}</span></span>
                    {o.missing === 'suspected' || o.missing === 'reported' ? <Badge tone="bad">Missing</Badge> : <StatePill state={o.state} />}
                  </button>
                ))}
              </div>
            </Card>
          </div>
          <Card className="p-6">
            <div className="label mb-4">History</div>
            <div className="relative space-y-4 border-l border-white/10 pl-5">
              {uniq.slice(0, 14).map((e) => (
                <div key={e.id} className="relative"><span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-bg bg-accent" /><div className="text-sm text-slate-200">{e.text}</div><div className="mono text-[11px] text-slate-500">{fmtTime(e.ts)} · {e.actor}</div></div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
