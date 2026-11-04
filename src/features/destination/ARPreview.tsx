import { Check, Crosshair, Move, Target, X } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import { DragLayer } from '../../components/3d/DragLayer'
import { HomeScene } from '../../components/3d/HomeScene'
import { Scene3D } from '../../components/3d/Scene3D'
import { Badge, Card } from '../../components/ui'
import { DEST_HOME } from '../../data/layouts'
import { useDestItems } from '../../hooks/useScene'
import { ROOM_LABEL } from '../../models/types'
import { useMove } from '../../state/store'
import { cn, dimsText } from '../../utils/format'
import { destPlacement, fitReport, footprint } from '../../utils/placement'

const PIECES = [
  { id: 'OBJ-001', note: 'Facing the media wall with ~2.0 m viewing distance; leaves a 90 cm walkway to the kitchen opening.' },
  { id: 'OBJ-019', note: 'Against the south wall so the window sits on your side — natural light without screen glare.' },
  { id: 'OBJ-030', note: 'Headboard on the solid south wall, 60 cm either side for access; clear of the bedroom door swing.' },
  { id: 'OBJ-002', note: 'Centred on the north wall opposite the sofa; sits away from the window to avoid reflections.' },
  { id: 'OBJ-031', note: 'East wall alcove — doors open 90° without hitting the bed footprint.' },
]

export default function ARPreview() {
  const objects = useMove((s) => s.objects)
  const placements = useMove((s) => s.placements)
  const setPlacement = useMove((s) => s.setPlacement)
  const items = useDestItems()
  const [sel, setSel] = useState('OBJ-001')
  const [drag, setDrag] = useState(false)
  const off = useRef({ dx: 0, dz: 0, set: false })
  const piece = items.find((i) => i.obj.id === sel)!
  const recommended = useMemo(() => destPlacement(piece.obj, {}), [piece.obj])
  const unboxed = items.filter((i) => !i.obj.boxId)
  const room = piece.obj.destRoom
  const roomItems = unboxed.filter((i) => i.obj.destRoom === room)
  const rep = fitReport(piece.obj, piece.p, DEST_HOME, unboxed)
  const f = footprint(piece.obj, piece.p)
  const isRec = Math.abs(piece.p.x - recommended.x) < 0.02 && Math.abs(piece.p.z - recommended.z) < 0.02 && Math.abs(piece.p.rot - recommended.rot) < 0.01
  const clearCm = Math.round(rep.clearance * 100)
  const fitLabel = !rep.ok ? 'Does not fit' : clearCm >= 60 ? 'Excellent fit' : clearCm >= 25 ? 'Good fit' : 'Tight fit'
  const tone = !rep.ok ? 'bad' : clearCm >= 25 ? 'ok' : 'warn'
  const col = !rep.ok ? '#f87171' : clearCm >= 25 ? '#34d399' : '#fbbf24'
  const R = DEST_HOME.rooms[room]
  const camTarget: [number, number, number] = [(R.x0 + R.x1) / 2 - DEST_HOME.width / 2, 0.4, (R.z0 + R.z1) / 2 - DEST_HOME.depth / 2]
  const camPos: [number, number, number] = [camTarget[0] + 0.5, 5.2, camTarget[2] + 5.4]
  const note = PIECES.find((p) => p.id === sel)?.note
  const recRoomPos = `${((recommended.x - R.x0)).toFixed(2)} m from west wall · ${((recommended.z - R.z0)).toFixed(2)} m from north wall`

  const onDown = useCallback((id: string) => { if (id === sel) { setDrag(true); off.current = { dx: 0, dz: 0, set: false } } else setSel(id) }, [sel])
  const onMove = (x: number, z: number) => {
    if (!off.current.set) off.current = { dx: piece.p.x - x, dz: piece.p.z - z, set: true }
    setPlacement(piece.obj.id, { ...piece.p, x: Math.round((x + off.current.dx) * 20) / 20, z: Math.round((z + off.current.dz) * 20) / 20 })
  }
  const snap = () => { const { [piece.obj.id]: _, ...rest } = placements; void _; useMove.setState({ placements: rest }) }
  const rotate = () => setPlacement(piece.obj.id, { ...piece.p, rot: piece.p.rot + Math.PI / 2 })
  void objects

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {PIECES.map((p) => {
            const o = items.find((i) => i.obj.id === p.id)!.obj
            return <button key={p.id} onClick={() => setSel(p.id)} className={cn('rounded-xl border px-4 py-2 text-sm font-medium transition', sel === p.id ? 'border-accent bg-accent/20 text-white shadow-glow' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]')}>{o.name.replace('Study ', '').replace(' Frame & Mattress', '').replace(' 55"', '')}</button>
          })}
        </div>
        <Card className="relative h-[560px] overflow-hidden !rounded-3xl">
          <Scene3D key={room} className="!absolute inset-0" camera={camPos} target={camTarget} minDistance={3} maxDistance={16} grid={false}>
            <HomeScene home={DEST_HOME} items={roomItems.map((i) => ({ ...i, ghost: i.obj.id !== sel && !!i.obj.isFurniture === false }))} selectedId={sel} onSelect={(id) => id && setSel(id)} onObjectDown={onDown} isolate={room} showDims={false} focusRoom={room} wallOpacity={0.14} roomLabels={false}>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[f.cx, 0.012, f.cz]}>
                <planeGeometry args={[f.hw * 2 + 0.1, f.hd * 2 + 0.1]} />
                <meshBasicMaterial color={col} transparent opacity={0.35} depthWrite={false} />
              </mesh>
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[recommended.x, 0.014, recommended.z]} visible={!isRec}>
                <ringGeometry args={[0.18, 0.24, 32]} />
                <meshBasicMaterial color="#2dd4bf" transparent opacity={0.9} />
              </mesh>
              <DragLayer active={drag} width={DEST_HOME.width} depth={DEST_HOME.depth} onMove={onMove} onEnd={() => setDrag(false)} />
            </HomeScene>
          </Scene3D>
          {/* AR chrome */}
          <div className="pointer-events-none absolute inset-4">
            {['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'left-0 bottom-0 border-l-2 border-b-2', 'right-0 bottom-0 border-r-2 border-b-2'].map((c) => <span key={c} className={`absolute h-6 w-6 border-teal-300/70 ${c}`} />)}
          </div>
          <div className="pointer-events-none absolute left-7 top-7 flex items-center gap-2 text-[11px] font-semibold tracking-wider text-teal-200"><Crosshair size={13} /> AR · SURFACE LOCKED · {ROOM_LABEL[room].toUpperCase()}</div>
          <div className="absolute bottom-6 left-6 right-6 flex flex-wrap items-center justify-between gap-2">
            <div className="rounded-xl border border-white/10 bg-black/60 px-4 py-2 backdrop-blur"><div className="text-sm font-semibold text-white">{piece.obj.name}</div><div className="mono text-[11px] text-slate-400">{dimsText(piece.obj.dims)}</div></div>
            <div className="flex gap-2"><button className="btn-ghost" onClick={rotate}><Move size={14} /> Rotate 90°</button><button className="btn-primary" onClick={snap} disabled={isRec}><Target size={14} /> Snap to recommended</button></div>
          </div>
        </Card>
      </div>
      <div className="space-y-4">
        <Card className="p-5">
          <div className="label">Fit analysis</div>
          <div className={cn('mt-3 flex items-center gap-3 rounded-xl border p-4', tone === 'ok' ? 'border-emerald-400/30 bg-emerald-400/10' : tone === 'warn' ? 'border-amber-400/30 bg-amber-400/10' : 'border-red-400/30 bg-red-400/10')}>
            <span className={cn('flex h-9 w-9 items-center justify-center rounded-full', tone === 'ok' ? 'bg-emerald-400/20 text-emerald-300' : tone === 'warn' ? 'bg-amber-400/20 text-amber-300' : 'bg-red-400/20 text-red-300')}>{rep.ok ? <Check size={18} /> : <X size={18} />}</span>
            <div><div className="text-lg font-semibold text-white">{fitLabel}</div><div className="text-xs text-slate-400">{rep.ok ? `Fits in ${ROOM_LABEL[room]}` : rep.overlap ? 'Overlaps another item' : 'Extends beyond the room'}</div></div>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <Row k="Fit" v={rep.ok ? <Badge tone="ok">Fits</Badge> : <Badge tone="bad">No</Badge>} />
            <Row k="Clearance" v={<span className="mono">{rep.ok ? `${clearCm} cm` : '—'}</span>} />
            <Row k="Wall gap" v={<span className="mono">{Number.isFinite(rep.wall) ? `${Math.round(rep.wall * 100)} cm` : '—'}</span>} />
            <Row k="Position" v={isRec ? <Badge tone="teal">Recommended</Badge> : <Badge tone="slate">Custom</Badge>} />
          </div>
        </Card>
        <Card className="p-5">
          <div className="label">Recommended position</div>
          <div className="mt-2 text-sm font-medium text-white">{ROOM_LABEL[room]}</div>
          <div className="mono mt-1 text-xs text-slate-400">{recRoomPos}</div>
          <p className="mt-3 text-sm leading-relaxed text-slate-400">{note}</p>
        </Card>
      </div>
    </div>
  )
}
const Row = ({ k, v }: { k: string; v: React.ReactNode }) => <div className="flex items-center justify-between"><span className="text-slate-400">{k}</span><span className="text-slate-100">{v}</span></div>
