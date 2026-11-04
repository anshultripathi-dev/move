import { LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { fragTone } from '../../components/ObjectPanels'
import { Badge, Card, Conf, PageHeader, Select, StatePill, VerifyHint } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { ROOM_LABEL, ROOM_ORDER, OBJ_STATES } from '../../models/types'
import { useMove } from '../../state/store'
import { cn, dimsText, needsVerify, minConf } from '../../utils/format'

type F = { room: string; cat: string; frag: string; pri: string; state: string; dest: string; cond: string; q: string }
const ALL = 'all'

export default function Inventory() {
  const objects = useMove((s) => s.objects)
  const [f, setF] = useState<F>({ room: ALL, cat: ALL, frag: ALL, pri: ALL, state: ALL, dest: ALL, cond: ALL, q: '' })
  const [view, setView] = useState<'table' | 'cards'>('table')
  const set = (k: keyof F, v: string) => setF((x) => ({ ...x, [k]: v }))
  const cats = [...new Set(objects.map((o) => o.category))]
  const list = useMemo(() => objects.filter((o) =>
    (f.room === ALL || o.room === f.room) && (f.cat === ALL || o.category === f.cat) && (f.frag === ALL || o.fragility === f.frag) &&
    (f.pri === ALL || o.priority === f.pri) && (f.state === ALL || (f.state === 'unpacked' ? OBJ_STATES.indexOf(o.state) < 2 : f.state === 'packed' ? OBJ_STATES.indexOf(o.state) >= 2 : o.state === f.state)) &&
    (f.dest === ALL || o.destRoom === f.dest) && (f.cond === ALL || o.condition === f.cond) &&
    (!f.q || `${o.name} ${o.id} ${o.category}`.toLowerCase().includes(f.q.toLowerCase())),
  ), [objects, f])
  const opt = (arr: string[], label: string) => [{ value: ALL, label }, ...arr.map((v) => ({ value: v, label: v }))]
  const verifyCount = objects.filter(needsVerify).length
  return (
    <div>
      <PageHeader eyebrow="AI inventory" title="Inventory" sub={`${objects.length} objects identified by computer vision. ${verifyCount ? `${verifyCount} need verification.` : 'All data verified.'}`}
        actions={<><button onClick={() => navigate('/scan')} className="btn-ghost">Re-scan</button><button onClick={() => navigate('/detect')} className="btn-ghost">Detect from photo</button><div className="flex rounded-xl border border-white/10 bg-white/[0.04] p-0.5"><button onClick={() => setView('table')} className={cn('rounded-lg p-2', view === 'table' ? 'bg-white/10 text-white' : 'text-slate-500')}><List size={15} /></button><button onClick={() => setView('cards')} className={cn('rounded-lg p-2', view === 'cards' ? 'bg-white/10 text-white' : 'text-slate-500')}><LayoutGrid size={15} /></button></div></>} />
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[180px] flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input className="input !pl-9" placeholder="Filter objects…" value={f.q} onChange={(e) => set('q', e.target.value)} /></div>
          <SlidersHorizontal size={15} className="text-slate-500" />
          <Select className="w-36" value={f.room} onChange={(v) => set('room', v)} options={[{ value: ALL, label: 'All rooms' }, ...ROOM_ORDER.map((r) => ({ value: r, label: ROOM_LABEL[r] }))]} />
          <Select className="w-36" value={f.cat} onChange={(v) => set('cat', v)} options={opt(cats, 'All categories')} />
          <Select className="w-32" value={f.frag} onChange={(v) => set('frag', v)} options={opt(['Low', 'Medium', 'High'], 'Fragility')} />
          <Select className="w-32" value={f.pri} onChange={(v) => set('pri', v)} options={opt(['Essential', 'Important', 'Standard'], 'Priority')} />
          <Select className="w-36" value={f.state} onChange={(v) => set('state', v)} options={[{ value: ALL, label: 'Packing status' }, { value: 'packed', label: 'Packed or later' }, { value: 'unpacked', label: 'Not yet packed' }, ...OBJ_STATES.map((s) => ({ value: s, label: s.replace('_', ' ') }))]} />
          <Select className="w-36" value={f.dest} onChange={(v) => set('dest', v)} options={[{ value: ALL, label: 'Destination' }, ...ROOM_ORDER.map((r) => ({ value: r, label: ROOM_LABEL[r] }))]} />
          <Select className="w-32" value={f.cond} onChange={(v) => set('cond', v)} options={opt(['Excellent', 'Good', 'Fair', 'Damaged'], 'Condition')} />
        </div>
      </Card>
      <div className="mb-3 text-xs text-slate-500">{list.length} of {objects.length} objects</div>
      {view === 'table' ? (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead><tr className="border-b border-white/[0.06] text-left">{['Object', 'Room', 'Dimensions', 'Weight', 'Fragility', 'Priority', 'State', 'AI confidence'].map((h) => <th key={h} className="label px-4 py-3 font-medium">{h}</th>)}</tr></thead>
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} onClick={() => navigate(`/object/${o.id}`)} className="cursor-pointer border-b border-white/[0.04] hover:bg-white/[0.04]">
                    <td className="px-4 py-2.5"><div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10" style={{ background: o.color + '33' }}><span className="h-3.5 w-3.5 rounded-[4px]" style={{ background: o.color }} /></span><div><div className="font-medium text-white">{o.name}</div><div className="mono text-[11px] text-slate-500">{o.id} · {o.boxId ? o.boxId.replace('BOX-', 'Box #') : 'Unboxed'}</div></div></div></td>
                    <td className="px-4 py-2.5 text-slate-300">{ROOM_LABEL[o.room]}</td>
                    <td className="mono px-4 py-2.5 text-xs text-slate-300">{dimsText(o.dims)}</td>
                    <td className="mono px-4 py-2.5 text-slate-300">{o.weight} kg</td>
                    <td className="px-4 py-2.5"><Badge tone={fragTone[o.fragility]}>{o.fragility}</Badge></td>
                    <td className="px-4 py-2.5 text-slate-300">{o.priority}</td>
                    <td className="px-4 py-2.5"><StatePill state={o.state} /></td>
                    <td className="w-44 px-4 py-2.5">{needsVerify(o) ? <div><Conf value={minConf(o)} compact /><VerifyHint className="mt-1" /></div> : <Conf value={o.conf.detect} />}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {list.map((o) => (
            <Card key={o.id} onClick={() => navigate(`/object/${o.id}`)} className="overflow-hidden">
              <div className="flex h-28 items-center justify-center bg-gradient-to-b from-white/[0.04] to-transparent"><span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10" style={{ background: o.color + '33' }}><span className="h-8 w-8 rounded-lg shadow-lg" style={{ background: o.color }} /></span></div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2"><div><div className="font-medium text-white">{o.name}</div><div className="text-xs text-slate-500">{ROOM_LABEL[o.room]} · {o.id}</div></div><StatePill state={o.state} /></div>
                <div className="mono mt-2 text-xs text-slate-400">{dimsText(o.dims)} · {o.weight} kg</div>
                <div className="mt-3 flex items-center justify-between"><Badge tone={fragTone[o.fragility]}>{o.fragility}</Badge>{needsVerify(o) ? <VerifyHint /> : <span className="mono text-xs text-slate-400">{o.conf.detect}% conf.</span>}</div>
              </div>
            </Card>
          ))}
        </div>
      )}
      {list.length === 0 && <div className="py-16 text-center text-sm text-slate-500">No objects match these filters.</div>}
    </div>
  )
}
