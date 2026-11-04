import { ArrowLeft, Box, Edit3, History, ShieldCheck, Tag, Wand2 } from 'lucide-react'
import { useState } from 'react'
import { ObjectPreview } from '../../components/3d/ObjectPreview'
import { AssignBoxModal, EditObjectModal, HistoryModal, StateStepper, fragTone, priTone } from '../../components/ObjectPanels'
import { Badge, Card, Conf, Empty, Meta, StatePill, VerifyHint } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { ROOM_LABEL } from '../../models/types'
import { useMove } from '../../state/store'
import { dimsText, fmtTime, needsVerify, vol } from '../../utils/format'

export default function ObjectDetails({ id }: { id: string }) {
  const o = useMove((s) => s.objects.find((x) => x.id === id))
  const events = useMove((s) => s.events)
  const confirm = useMove((s) => s.confirmObject)
  const toggleFragile = useMove((s) => s.toggleFragile)
  const [edit, setEdit] = useState(false)
  const [assign, setAssign] = useState(false)
  const [hist, setHist] = useState(false)
  if (!o) return <Empty title="Object not found" action={<button className="btn-primary" onClick={() => navigate('/inventory')}>Back to inventory</button>} />
  const verify = needsVerify(o)
  const trail = events.filter((e) => e.objectId === o.id).slice(-6).reverse()
  return (
    <div>
      <button onClick={() => navigate('/inventory')} className="btn-quiet mb-4 -ml-2"><ArrowLeft size={14} /> Inventory</button>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
        <Card className="relative h-[420px] overflow-hidden lg:h-auto lg:min-h-[560px]">
          <ObjectPreview obj={o} className="!absolute inset-0" />
          <div className="absolute left-5 top-5"><div className="label text-accent-soft">3D preview</div><div className="mono mt-1 text-xs text-slate-500">{o.id}</div></div>
          <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-1.5">
            <Badge tone="teal">W {o.dims[0]} cm</Badge><Badge tone="teal">D {o.dims[1]} cm</Badge><Badge tone="teal">H {o.dims[2]} cm</Badge>
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="label">{o.category}</div>
                <h1 className="h-display mt-1 text-3xl uppercase tracking-wide">{o.name}</h1>
              </div>
              <StatePill state={o.state} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3">
              <Meta label="Dimensions" value={dimsText(o.dims)} mono />
              <Meta label="Volume" value={`${vol(o).toFixed(2)} m³`} mono />
              <Meta label="Weight" value={`${o.weight} kg`} mono />
              <Meta label="Fragility" value={<Badge tone={fragTone[o.fragility]}>{o.fragility}</Badge>} />
              <Meta label="Priority" value={<Badge tone={priTone[o.priority]}>{o.priority}</Badge>} />
              <Meta label="Condition" value={o.condition} />
              <Meta label="Current room" value={ROOM_LABEL[o.room]} />
              <Meta label="Destination" value={ROOM_LABEL[o.destRoom]} />
              <Meta label="Box" value={o.boxId ? <button className="text-accent-soft hover:underline" onClick={() => navigate(`/box/${o.boxId}`)}>{o.boxId.replace('BOX-', 'BOX #')}</button> : 'Furniture / Unboxed'} />
            </div>
            <div className="mt-6 rounded-xl border border-white/[0.07] bg-white/[0.03] p-4">
              <div className="mb-1 flex items-center justify-between"><span className="label">State machine</span></div>
              <StateStepper state={o.state} />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between"><div className="label">AI confidence</div>{o.confirmed ? <Badge tone="ok" icon={<ShieldCheck size={11} />}>Human verified</Badge> : verify ? <VerifyHint /> : <Badge tone="slate">AI estimated</Badge>}</div>
            <div className="mt-4 space-y-2.5">
              <Conf label="Detection" value={o.conf.detect} />
              <Conf label="Dimensions" value={o.conf.dims} />
              <Conf label="Fragility" value={o.conf.fragility} />
            </div>
            {verify && <p className="mt-3 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-200">One or more estimates are below 75%. Confirm the AI data or correct it manually to improve packing accuracy.</p>}
            <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
              <button className="btn-ghost" onClick={() => setEdit(true)}><Edit3 size={14} /> Edit</button>
              <button className="btn-ok" onClick={() => confirm(o.id)} disabled={!!o.confirmed}><ShieldCheck size={14} /> {o.confirmed ? 'Confirmed' : 'Confirm AI Data'}</button>
              <button className="btn-ghost" onClick={() => setAssign(true)}><Box size={14} /> Assign Box</button>
              <button className="btn-ghost" onClick={() => toggleFragile(o.id)}><Tag size={14} /> {o.fragility === 'High' ? 'Unmark Fragile' : 'Mark Fragile'}</button>
              <button className="btn-ghost" onClick={() => setHist(true)}><History size={14} /> View History</button>
              {(o.isFurniture || o.kind === 'shelf') && <button className="btn-ghost" onClick={() => navigate('/reassembly')}><Wand2 size={14} /> Assembly</button>}
            </div>
          </Card>
          <Card className="p-6">
            <div className="label">Recent history</div>
            <div className="mt-3 space-y-3">
              {trail.map((e) => <div key={e.id} className="flex gap-3"><div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" /><div><div className="text-sm text-slate-200">{e.text}</div><div className="mono text-[11px] text-slate-500">{fmtTime(e.ts)}</div></div></div>)}
            </div>
          </Card>
        </div>
      </div>
      {edit && <EditObjectModal key={o.id + String(o.dims)} obj={o} open onClose={() => setEdit(false)} />}
      <AssignBoxModal obj={o} open={assign} onClose={() => setAssign(false)} />
      <HistoryModal obj={o} open={hist} onClose={() => setHist(false)} />
    </div>
  )
}
