import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Eye, EyeOff, RotateCcw, RotateCw, Ruler } from 'lucide-react'
import { useMemo, useRef, useState, useCallback } from 'react'
import { DragLayer } from '../../components/3d/DragLayer'
import { HomeScene } from '../../components/3d/HomeScene'
import { Scene3D } from '../../components/3d/Scene3D'
import { Badge, Card, Progress, Toggle } from '../../components/ui'
import { DEST_HOME, roomArea } from '../../data/layouts'
import { useDestItems } from '../../hooks/useScene'
import { ROOM_COLOR, ROOM_LABEL, ROOM_ORDER, type RoomId } from '../../models/types'
import { useMove } from '../../state/store'
import { cn } from '../../utils/format'
import { destPlacement, fitReport, footprint, roomAt } from '../../utils/placement'

export default function DestPlanner() {
  const items = useDestItems()
  const boxes = useMove((s) => s.boxes)
  const placements = useMove((s) => s.placements)
  const setPlacement = useMove((s) => s.setPlacement)
  const resetPlacements = useMove((s) => s.resetPlacements)
  const [sel, setSel] = useState<string | null>('OBJ-001')
  const [room, setRoom] = useState<RoomId | null>(null)
  const [hidden, setHidden] = useState<string[]>([])
  const [dims, setDims] = useState(true)
  const [labels, setLabels] = useState(false)
  const [showBoxed, setShowBoxed] = useState(false)
  const [drag, setDrag] = useState<string | null>(null)
  const dragOff = useRef({ dx: 0, dz: 0 })

  const placeable = useMemo(() => items.filter((i) => !i.obj.boxId), [items])
  const scene = useMemo(() => {
    const base = showBoxed ? items : items.filter((i) => !i.obj.boxId && i.p.elev === 0 || (!i.obj.boxId))
    return base.map((i) => ({ ...i, hidden: hidden.includes(i.obj.id) }))
  }, [items, showBoxed, hidden])
  const cur = items.find((i) => i.obj.id === sel)
  const report = cur ? fitReport(cur.obj, cur.p, DEST_HOME, placeable) : null

  const nudge = (dx: number, dz: number) => cur && setPlacement(cur.obj.id, { ...cur.p, x: +(cur.p.x + dx).toFixed(2), z: +(cur.p.z + dz).toFixed(2) })
  const rotate = (dir: 1 | -1) => cur && setPlacement(cur.obj.id, { ...cur.p, rot: cur.p.rot + dir * (Math.PI / 2) })
  const reset = () => { if (!cur) return; const { [cur.obj.id]: _, ...rest } = placements; void _; useMove.setState({ placements: rest }) }

  const onDown = useCallback((id: string) => {
    const it = items.find((i) => i.obj.id === id)
    if (!it || it.obj.boxId || it.p.elev > 0) { setSel(id); return }
    setSel(id)
    setDrag(id)
    dragOff.current = { dx: 0, dz: 0 }
  }, [items])
  const onMove = (x: number, z: number) => {
    const it = items.find((i) => i.obj.id === drag)
    if (!it) return
    if (dragOff.current.dx === 0 && dragOff.current.dz === 0) dragOff.current = { dx: it.p.x - x, dz: it.p.z - z }
    setPlacement(it.obj.id, { ...it.p, x: Math.round((x + dragOff.current.dx) * 20) / 20, z: Math.round((z + dragOff.current.dz) * 20) / 20 })
  }

  const free = (r: RoomId) => {
    const area = roomArea(DEST_HOME, r)
    const used = placeable.filter((i) => roomAt(DEST_HOME, i.p.x, i.p.z) === r && i.p.elev === 0 && i.obj.kind !== 'rug').reduce((a, i) => { const f = footprint(i.obj, i.p); return a + f.hw * f.hd * 4 }, 0)
    return { area, used, free: area - used }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)_300px]">
      <div className="space-y-4">
        <Card className="p-3">
          <div className="label px-2 pb-2 pt-1">Rooms · available space</div>
          {ROOM_ORDER.map((r) => {
            const f = free(r)
            return (
              <button key={r} onClick={() => setRoom(room === r ? null : r)} className={cn('mb-1 w-full rounded-xl px-2.5 py-2 text-left', room === r ? 'bg-white/10' : 'hover:bg-white/5')}>
                <div className="flex items-center justify-between text-sm text-slate-200"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: ROOM_COLOR[r] }} />{ROOM_LABEL[r]}</span><span className="mono text-xs text-slate-400">{f.free.toFixed(1)} m² free</span></div>
                <Progress value={(f.used / f.area) * 100} height={3} className="mt-1.5" tone={f.used / f.area > 0.6 ? 'warn' : 'teal'} />
              </button>
            )
          })}
        </Card>
        <Card className="p-3">
          <div className="label px-2 pb-2 pt-1">Furniture &amp; loose items</div>
          <div className="max-h-[300px] space-y-0.5 overflow-y-auto">
            {placeable.map((i) => (
              <div key={i.obj.id} className={cn('flex items-center gap-1 rounded-lg pr-1', sel === i.obj.id ? 'bg-accent/15 ring-1 ring-accent/30' : 'hover:bg-white/5')}>
                <button onClick={() => setSel(i.obj.id)} className="flex-1 truncate px-2.5 py-1.5 text-left text-sm text-slate-200">{i.obj.name}</button>
                <button className="p-1.5 text-slate-500 hover:text-white" onClick={() => setHidden((h) => (h.includes(i.obj.id) ? h.filter((x) => x !== i.obj.id) : [...h, i.obj.id]))}>{hidden.includes(i.obj.id) ? <EyeOff size={13} /> : <Eye size={13} />}</button>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="relative h-[560px] overflow-hidden lg:h-[calc(100vh-17rem)] lg:min-h-[560px]">
        <Scene3D className="!absolute inset-0" camera={[5, 13, 12]} minDistance={3} maxDistance={22} onMiss={() => setSel(null)}>
          <HomeScene home={DEST_HOME} items={scene} selectedId={sel} onSelect={setSel} onObjectDown={onDown} showDims={dims} showLabels={labels} isolate={room} showDoors boxStacks={{ boxes, hideUnpacked: true }} focusRoom={room} wallOpacity={0.13}>
            <DragLayer active={!!drag} width={DEST_HOME.width} depth={DEST_HOME.depth} onMove={onMove} onEnd={() => setDrag(null)} />
          </HomeScene>
        </Scene3D>
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5"><Toggle on={dims} onChange={setDims} label="Dimensions" /><Toggle on={labels} onChange={setLabels} label="Labels" /><Toggle on={showBoxed} onChange={setShowBoxed} label="Boxed items" /></div>
        <div className="pointer-events-none absolute bottom-3 left-3 rounded-lg bg-black/50 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur">Drag furniture to reposition · cartons show where boxes will land</div>
        {/* mobile/tablet controls */}
        {cur && <div className="absolute inset-x-3 bottom-12 xl:hidden"><Controls cur={cur} nudge={nudge} rotate={rotate} reset={reset} report={report} compact /></div>}
      </Card>

      <div className="hidden xl:block">
        {cur ? (
          <Card className="p-5">
            <div className="label text-accent-soft">Selected</div>
            <div className="mt-1 text-lg font-semibold text-white">{cur.obj.name}</div>
            <div className="mono text-xs text-slate-500">{cur.obj.dims.join(' × ')} cm · {ROOM_LABEL[cur.obj.destRoom]}</div>
            <Controls cur={cur} nudge={nudge} rotate={rotate} reset={reset} report={report} />
          </Card>
        ) : <Card className="p-5 text-sm text-slate-500">Select an item to move, rotate or hide it.</Card>}
      </div>
      <div className="hidden"><Ruler /></div>
    </div>
  )
}

function Controls({ cur, nudge, rotate, reset, report, compact }: { cur: { obj: { id: string; name: string }; p: { x: number; z: number; rot: number } }; nudge: (dx: number, dz: number) => void; rotate: (d: 1 | -1) => void; reset: () => void; report: ReturnType<typeof fitReport> | null; compact?: boolean }) {
  const btn = 'btn-ghost !p-2.5'
  return (
    <div className={cn(compact && 'card p-3')}>
      <div className="mt-4 flex items-center gap-4">
        <div className="grid grid-cols-3 gap-1.5">
          <span /><button className={btn} onClick={() => nudge(0, -0.1)}><ArrowUp size={14} /></button><span />
          <button className={btn} onClick={() => nudge(-0.1, 0)}><ArrowLeft size={14} /></button><button className={btn} onClick={() => nudge(0, 0.1)}><ArrowDown size={14} /></button><button className={btn} onClick={() => nudge(0.1, 0)}><ArrowRight size={14} /></button>
        </div>
        <div className="flex flex-col gap-1.5">
          <button className="btn-ghost" onClick={() => rotate(1)}><RotateCw size={14} /> Rotate 90°</button>
          <button className="btn-quiet" onClick={reset}><RotateCcw size={14} /> Reset</button>
        </div>
      </div>
      {report && (
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center justify-between"><span className="text-slate-400">Fit</span>{report.ok ? <Badge tone="ok">Fits in {report.room ? ROOM_LABEL[report.room] : '—'}</Badge> : <Badge tone="bad">{report.overlap ? 'Overlaps another item' : 'Outside the room'}</Badge>}</div>
          <div className="flex items-center justify-between"><span className="text-slate-400">Nearest obstacle</span><span className="mono text-slate-100">{Number.isFinite(report.obstacle) ? `${Math.round(report.obstacle * 100)} cm` : '—'}</span></div>
          <div className="flex items-center justify-between"><span className="text-slate-400">Wall gap</span><span className="mono text-slate-100">{Number.isFinite(report.wall) ? `${Math.round(report.wall * 100)} cm` : '—'}</span></div>
        </div>
      )}
    </div>
  )
}
