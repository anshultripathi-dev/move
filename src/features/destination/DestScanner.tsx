import { Html } from '../../components/3d/Label3D'
import { motion } from 'framer-motion'
import { ArrowRight, Check, DoorOpen, Grid3x3, Maximize, Pause, Play, RotateCcw, Square } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { HomeScene, ScanSweep } from '../../components/3d/HomeScene'
import { Scene3D } from '../../components/3d/Scene3D'
import { Card, Progress } from '../../components/ui'
import { DEST_HOME, roomArea } from '../../data/layouts'
import { navigate } from '../../hooks/useRoute'
import { ROOM_COLOR, ROOM_LABEL, ROOM_ORDER } from '../../models/types'
import { useDestItems } from '../../hooks/useScene'
import { cn } from '../../utils/format'

interface Det { id: string; kind: 'room' | 'door' | 'window' | 'wall'; label: string; value: string; pos: [number, number]; at: number }

function buildDetections(): Det[] {
  const out: Det[] = []
  ROOM_ORDER.forEach((r, i) => {
    const R = DEST_HOME.rooms[r]
    out.push({ id: `room-${r}`, kind: 'room', label: ROOM_LABEL[r], value: `${roomArea(DEST_HOME, r).toFixed(1)} m²`, pos: [(R.x0 + R.x1) / 2, (R.z0 + R.z1) / 2], at: 8 + i * 6 })
  })
  DEST_HOME.walls.forEach((w, wi) => {
    const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1])
    out.push({ id: `wall-${wi}`, kind: 'wall', label: `Wall ${wi + 1}`, value: `${len.toFixed(2)} m`, pos: [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2], at: 34 + wi * 3 })
    w.openings.forEach((o, oi) => {
      const horizontal = w.a[1] === w.b[1]
      const pos: [number, number] = horizontal ? [o.at, w.a[1]] : [w.a[0], o.at]
      out.push({ id: `op-${wi}-${oi}`, kind: o.type === 'window' ? 'window' : 'door', label: o.label ?? (o.type === 'window' ? 'Window' : 'Door'), value: `${Math.round(o.width * 100)} cm`, pos, at: 55 + (wi * 3 + oi) * 2.4 })
    })
  })
  return out.sort((a, b) => a.at - b.at)
}

export default function DestScanner() {
  const items = useDestItems()
  const dets = useMemo(buildDetections, [])
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(true)
  useEffect(() => {
    if (!running || progress >= 100) return
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 0.7)), 90)
    return () => clearInterval(t)
  }, [running, progress])
  const seen = dets.filter((d) => progress >= d.at)
  const done = progress >= 100
  const doors = dets.filter((d) => d.kind === 'door')
  const narrowest = doors.reduce((a, b) => (parseInt(a.value) <= parseInt(b.value) ? a : b))
  const furniture = items.filter((i) => i.obj.isFurniture)
  const totalArea = ROOM_ORDER.reduce((a, r) => a + roomArea(DEST_HOME, r), 0)
  const phases = ['Rooms', 'Walls', 'Doors & windows', 'Floor space', 'Furniture spots']
  const phaseIdx = progress < 30 ? 0 : progress < 52 ? 1 : progress < 85 ? 2 : progress < 95 ? 3 : 4

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
      <Card className="relative h-[560px] overflow-hidden !rounded-3xl">
        <Scene3D className="!absolute inset-0" camera={[6, 8.5, 9]} autoRotate rotateSpeed={0.4} minDistance={5} maxDistance={20}>
          <HomeScene home={DEST_HOME} items={[]} wallOpacity={Math.min(0.32, 0.05 + progress * 0.004)} roomLabels={progress > 8}>
            {!done && <ScanSweep width={DEST_HOME.width} depth={DEST_HOME.depth} />}
            {seen.filter((d) => d.kind !== 'wall').map((d) => (
              <Html key={d.id} position={[d.pos[0], d.kind === 'room' ? 1.6 : d.kind === 'window' ? 1.7 : 2.3, d.pos[1]]} center distanceFactor={11} style={{ pointerEvents: 'none' }} zIndexRange={[30, 10]}>
                <motion.div initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} className={cn('whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-semibold', d.kind === 'door' ? 'border-teal-400/60 bg-teal-400/15 text-teal-200' : d.kind === 'window' ? 'border-sky-400/50 bg-sky-400/10 text-sky-200' : 'border-white/20 bg-black/60 text-white')}>
                  {d.kind === 'room' ? `${d.label} · ${d.value}` : d.kind === 'window' ? `Window ${d.value}` : `${d.label} ${d.value}`}
                </motion.div>
              </Html>
            ))}
            {progress > 95 && furniture.map((f) => (
              <mesh key={f.obj.id} position={[f.p.x, f.obj.dims[2] / 200, f.p.z]} rotation={[0, f.p.rot, 0]}>
                <boxGeometry args={[f.obj.dims[0] / 100, f.obj.dims[2] / 100, f.obj.dims[1] / 100]} />
                <meshBasicMaterial color="#2dd4bf" transparent opacity={0.2} depthWrite={false} />
              </mesh>
            ))}
          </HomeScene>
        </Scene3D>
        <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_60%,rgba(0,0,0,0.5))]" />
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold tracking-wider text-white"><span className={cn('h-2 w-2 rounded-full bg-teal-400', running && !done && 'animate-pulse')} />{done ? 'SCAN COMPLETE' : 'LIDAR SCANNING'}</span>
          <span className="mono rounded-md bg-black/55 px-2 py-1 text-[11px] text-slate-300">88 Harbor Street</span>
        </div>
        <div className="absolute right-4 top-4 flex gap-2">
          <button className="btn-ghost !p-2.5" onClick={() => { setProgress(0); setRunning(true) }}><RotateCcw size={14} /></button>
          <button className="btn-ghost !p-2.5" disabled={done} onClick={() => setRunning(!running)}>{running ? <Pause size={14} /> : <Play size={14} />}</button>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-14">
          <div className="mb-3 flex gap-1.5 overflow-x-auto">
            {phases.map((p, i) => <span key={p} className={cn('whitespace-nowrap rounded-md px-2 py-1 text-[11px] font-medium', i < phaseIdx || done ? 'bg-emerald-400/15 text-emerald-300' : i === phaseIdx ? 'bg-accent text-white' : 'bg-white/5 text-slate-500')}>{i < phaseIdx || done ? '✓ ' : ''}{p}</span>)}
          </div>
          <div className="flex items-end justify-between"><div className="text-2xl font-semibold text-white">{seen.length} <span className="text-base font-normal text-slate-400">features measured</span></div><div className="mono text-xl text-white">{Math.round(progress)}%</div></div>
          <Progress value={progress} tone="teal" height={4} className="mt-2" />
        </div>
      </Card>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          {[[<Square key="r" size={15} />, 'Rooms', dets.filter((d) => d.kind === 'room' && progress >= d.at).length, 4], [<DoorOpen key="d" size={15} />, 'Doorways', dets.filter((d) => d.kind === 'door' && progress >= d.at).length, doors.length], [<Grid3x3 key="w" size={15} />, 'Windows', dets.filter((d) => d.kind === 'window' && progress >= d.at).length, dets.filter((d) => d.kind === 'window').length], [<Maximize key="f" size={15} />, 'Floor space', `${(totalArea * Math.min(1, progress / 95)).toFixed(1)} m²`, null]].map(([i, l, v, t]) => (
            <Card key={String(l)} className="p-4"><div className="flex items-center justify-between text-slate-500"><span className="label">{l as string}</span>{i}</div><div className="mt-2 text-2xl font-semibold text-white">{v as string}{t !== null && <span className="text-sm text-slate-500"> / {t as number}</span>}</div></Card>
          ))}
        </div>
        <Card className="p-5">
          <div className="label">Measurements</div>
          <div className="mt-3 max-h-[300px] space-y-1.5 overflow-y-auto">
            {seen.filter((d) => d.kind !== 'wall').slice().reverse().map((d) => (
              <motion.div key={d.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2 text-sm">
                <span className="flex items-center gap-2 text-slate-300"><span className="h-2 w-2 rounded-full" style={{ background: d.kind === 'room' ? ROOM_COLOR[d.id.replace('room-', '') as never] : d.kind === 'door' ? '#2dd4bf' : '#38bdf8' }} />{d.label}</span>
                <span className="mono text-slate-100">{d.value}</span>
              </motion.div>
            ))}
            {seen.length === 0 && <div className="py-6 text-center text-sm text-slate-500">Initialising scanner…</div>}
          </div>
        </Card>
        {done && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card glow className="p-5">
              <div className="flex items-center gap-2 text-emerald-300"><Check size={15} /> Destination twin ready</div>
              <p className="mt-2 text-sm text-slate-400">Narrowest doorway: <span className="font-semibold text-white">{narrowest.label} · {narrowest.value}</span>. 4 candidate furniture positions identified.</p>
              <div className="mt-4 flex gap-2"><button className="btn-primary flex-1" onClick={() => navigate('/destination/clearance')}>Check clearances <ArrowRight size={14} /></button><button className="btn-ghost" onClick={() => navigate('/destination/planner')}>3D planner</button></div>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  )
}
