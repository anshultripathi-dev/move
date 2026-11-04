import { AlertTriangle, Check, Edit3, History, Package, ShieldCheck, Sparkles, Tag, Triangle, X } from 'lucide-react'
import { useState } from 'react'
import { Badge, Conf, Meta, Modal, Select, StatePill, VerifyHint } from './ui'
import { ObjectPreview } from './3d/ObjectPreview'
import { navigate } from '../hooks/useRoute'
import { OBJ_STATES, ROOM_LABEL, ROOM_ORDER, type Fragility, type MoveObject, type Priority } from '../models/types'
import { useMove } from '../state/store'
import { cn, dimsText, fmtTime, minConf, needsVerify, vol } from '../utils/format'

export const fragTone = { Low: 'ok', Medium: 'warn', High: 'bad' } as const
export const priTone = { Essential: 'bad', Important: 'accent', Standard: 'slate' } as const

export function StateStepper({ state }: { state: string }) {
  const idx = OBJ_STATES.indexOf(state as never)
  return (
    <div className="flex items-center overflow-x-auto pb-1">
      {OBJ_STATES.map((s, i) => (
        <div key={s} className="flex items-center">
          <div className="flex flex-col items-center gap-1">
            <div className={cn('flex h-5 w-5 items-center justify-center rounded-full border text-[9px]', i < idx ? 'border-emerald-400/60 bg-emerald-400/20 text-emerald-300' : i === idx ? 'border-accent bg-accent text-white' : 'border-white/10 text-slate-600')}>{i < idx ? <Check size={10} /> : i + 1}</div>
            <span className={cn('text-[9px] font-medium', i === idx ? 'text-white' : 'text-slate-600')}>{s.replace('_', ' ')}</span>
          </div>
          {i < OBJ_STATES.length - 1 && <div className={cn('mx-1 mb-4 h-px w-3 sm:w-5', i < idx ? 'bg-emerald-400/40' : 'bg-white/10')} />}
        </div>
      ))}
    </div>
  )
}

export function EditObjectModal({ obj, open, onClose }: { obj: MoveObject; open: boolean; onClose: () => void }) {
  const update = useMove((s) => s.updateObject)
  const [f, setF] = useState({ name: obj.name, w: obj.dims[0], d: obj.dims[1], h: obj.dims[2], weight: obj.weight, frag: obj.fragility, pri: obj.priority })
  return (
    <Modal open={open} onClose={onClose} title={`Edit ${obj.name}`} footer={<><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={() => { update(obj.id, { name: f.name, dims: [f.w, f.d, f.h], weight: f.weight, fragility: f.frag, priority: f.pri }, `${f.name} corrected manually (AI values overridden)`); onClose() }}>Save correction</button></>}>
      <div className="grid gap-4 sm:grid-cols-3">
        <label className="sm:col-span-3"><span className="label">Name</span><input className="input mt-1.5" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
        {(['w', 'd', 'h'] as const).map((k) => (
          <label key={k}><span className="label">{k === 'w' ? 'Width' : k === 'd' ? 'Depth' : 'Height'} (cm)</span><input type="number" className="input mt-1.5" value={f[k]} onChange={(e) => setF({ ...f, [k]: +e.target.value })} /></label>
        ))}
        <label><span className="label">Weight (kg)</span><input type="number" className="input mt-1.5" value={f.weight} onChange={(e) => setF({ ...f, weight: +e.target.value })} /></label>
        <div><span className="label">Fragility</span><Select className="mt-1.5" value={f.frag} onChange={(v) => setF({ ...f, frag: v as Fragility })} options={['Low', 'Medium', 'High'].map((x) => ({ value: x, label: x }))} /></div>
        <div><span className="label">Priority</span><Select className="mt-1.5" value={f.pri} onChange={(v) => setF({ ...f, pri: v as Priority })} options={['Essential', 'Important', 'Standard'].map((x) => ({ value: x, label: x }))} /></div>
      </div>
      <p className="mt-4 text-xs text-slate-500">Manual corrections override AI estimates and mark the object as human-verified.</p>
    </Modal>
  )
}

export function AssignBoxModal({ obj, open, onClose }: { obj: MoveObject; open: boolean; onClose: () => void }) {
  const boxes = useMove((s) => s.boxes)
  const assign = useMove((s) => s.assignBox)
  return (
    <Modal open={open} onClose={onClose} title={`Assign ${obj.name} to a box`}>
      <div className="grid gap-2 sm:grid-cols-2">
        <button onClick={() => { assign(obj.id, null); onClose() }} className={cn('rounded-xl border p-3 text-left text-sm', !obj.boxId ? 'border-accent bg-accent/15 text-white' : 'border-white/10 text-slate-300 hover:bg-white/5')}>Furniture / Unboxed</button>
        {boxes.map((b) => (
          <button key={b.id} onClick={() => { assign(obj.id, b.id); onClose() }} className={cn('rounded-xl border p-3 text-left', obj.boxId === b.id ? 'border-accent bg-accent/15' : 'border-white/10 hover:bg-white/5')}>
            <div className="text-sm font-medium text-white">BOX #{String(b.num).padStart(3, '0')}</div>
            <div className="text-xs text-slate-500">{b.label} · {ROOM_LABEL[b.room]}</div>
          </button>
        ))}
      </div>
    </Modal>
  )
}

export function HistoryModal({ obj, open, onClose }: { obj: MoveObject; open: boolean; onClose: () => void }) {
  const events = useMove((s) => s.events)
  const list = events.filter((e) => e.objectId === obj.id).slice().reverse()
  return (
    <Modal open={open} onClose={onClose} title={`History · ${obj.name}`} width="max-w-xl">
      <div className="space-y-4">
        {list.map((e) => (
          <div key={e.id} className="flex gap-3">
            <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />
            <div><div className="text-sm text-slate-200">{e.text}</div><div className="mono text-[11px] text-slate-500">{fmtTime(e.ts)} · {e.actor}</div></div>
          </div>
        ))}
        {list.length === 0 && <div className="text-sm text-slate-500">No events yet.</div>}
      </div>
    </Modal>
  )
}

/** Compact "Object Intelligence" side panel used by Digital Twin, Destination, etc. */
export function ObjectIntel({ id, onClose }: { id: string; onClose?: () => void }) {
  const o = useMove((s) => s.objects.find((x) => x.id === id))
  const confirm = useMove((s) => s.confirmObject)
  if (!o) return null
  const verify = needsVerify(o)
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-2 p-5 pb-3">
        <div className="min-w-0">
          <div className="label text-accent-soft">Object intelligence</div>
          <div className="mt-1 truncate text-lg font-semibold text-white">{o.name}</div>
          <div className="mono text-xs text-slate-500">{o.id}</div>
        </div>
        {onClose && <button onClick={onClose} className="btn-quiet !p-1.5"><X size={15} /></button>}
      </div>
      <div className="h-44 shrink-0 bg-gradient-to-b from-white/[0.03] to-transparent"><ObjectPreview obj={o} className="!h-full !w-full" /></div>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-5">
        <div className="flex flex-wrap gap-1.5">
          <StatePill state={o.state} />
          <Badge tone={fragTone[o.fragility]}>{o.fragility} fragility</Badge>
          <Badge tone={priTone[o.priority]}>{o.priority}</Badge>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
          <Meta label="Room" value={ROOM_LABEL[o.room]} />
          <Meta label="Destination" value={ROOM_LABEL[o.destRoom]} />
          <Meta label="Dimensions" value={dimsText(o.dims)} mono />
          <Meta label="Volume" value={`${vol(o).toFixed(2)} m³`} mono />
          <Meta label="Est. weight" value={`${o.weight} kg`} mono />
          <Meta label="Category" value={o.category} />
          <Meta label="Box" value={o.boxId ? o.boxId.replace('BOX-', 'BOX #') : 'Furniture / Unboxed'} />
          <Meta label="Condition" value={o.condition} />
        </div>
        <div className="space-y-2 rounded-xl border border-white/[0.07] bg-white/[0.03] p-3.5">
          <div className="flex items-center justify-between"><span className="label">AI confidence</span>{verify && <VerifyHint />}</div>
          <Conf label="Detection" value={o.conf.detect} />
          <Conf label="Dimensions" value={o.conf.dims} />
          <Conf label="Fragility" value={o.conf.fragility} />
        </div>
      </div>
      <div className="flex gap-2 border-t border-white/[0.06] p-4">
        {verify ? <button onClick={() => confirm(o.id)} className="btn-ok flex-1"><ShieldCheck size={14} /> Confirm AI data</button> : <button onClick={() => navigate(`/object/${o.id}`)} className="btn-primary flex-1">Full details</button>}
        <button onClick={() => navigate(`/object/${o.id}`)} className="btn-ghost">Open</button>
      </div>
    </div>
  )
}

export { AlertTriangle, Edit3, History, Package, Sparkles, Tag, Triangle, minConf }
