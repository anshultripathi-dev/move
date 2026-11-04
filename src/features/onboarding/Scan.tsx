import { useFrame, useThree } from '@react-three/fiber'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Check, Pause, Play, RotateCcw, ScanLine } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import * as THREE from 'three'
import { HomeScene, type SceneItem } from '../../components/3d/HomeScene'
import { Scene3D } from '../../components/3d/Scene3D'
import { Card, Conf, PageHeader, Progress } from '../../components/ui'
import { SOURCE_HOME } from '../../data/layouts'
import { navigate } from '../../hooks/useRoute'
import { ROOM_COLOR, ROOM_LABEL, ROOM_ORDER, type MoveObject, type RoomId } from '../../models/types'
import { useMove } from '../../state/store'
import { cn } from '../../utils/format'

type Rect = { x: number; y: number; w: number; h: number; vis: boolean }

const OX = SOURCE_HOME.width / 2
const OZ = SOURCE_HOME.depth / 2
const sc = (x: number, y: number, z: number) => new THREE.Vector3(x - OX, y, z - OZ)

const STOPS: Record<RoomId, { pos: THREE.Vector3; look: THREE.Vector3 }> = {
  living: { pos: sc(4.75, 1.75, 4.25), look: sc(2.2, 0.55, 1.2) },
  kitchen: { pos: sc(8.85, 1.8, 4.2), look: sc(6.8, 0.7, 1.0) },
  study: { pos: sc(0.35, 1.8, 4.75), look: sc(2.0, 0.55, 7.2) },
  bedroom: { pos: sc(8.85, 1.8, 4.75), look: sc(6.2, 0.45, 6.9) },
}

function CameraRig({ room, running }: { room: RoomId; running: boolean }) {
  const { camera } = useThree()
  const look = useRef(STOPS.living.look.clone())
  useFrame(({ clock }) => {
    const s = STOPS[room]
    const t = clock.elapsedTime
    const sway = running ? 0.03 : 0.0
    const goal = s.pos.clone().add(new THREE.Vector3(Math.sin(t * 0.7) * sway * 3, Math.sin(t * 1.1) * sway, Math.cos(t * 0.5) * sway * 2))
    camera.position.lerp(goal, 0.035)
    look.current.lerp(s.look, 0.04)
    camera.lookAt(look.current)
  })
  return null
}

function Projector({ items, rects }: { items: SceneItem[]; rects: MutableRefObject<Map<string, Rect>> }) {
  const { camera, size } = useThree()
  useFrame(() => {
    const v = new THREE.Vector3()
    camera.updateMatrixWorld()
    items.forEach(({ obj: o, p }) => {
      const hw = o.dims[0] / 200, hd = o.dims[1] / 200, h = o.dims[2] / 100
      const c = Math.cos(p.rot), s = Math.sin(p.rot)
      let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9
      let vis = true
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0, h]) {
        const lx = sx * hw, lz = sz * hd
        v.set(p.x - OX + lx * c + lz * s, p.elev + y, p.z - OZ - lx * s + lz * c)
        const cam = v.clone().applyMatrix4(camera.matrixWorldInverse)
        if (cam.z > -0.2) vis = false
        v.project(camera)
        const px = (v.x * 0.5 + 0.5) * size.width, py = (-v.y * 0.5 + 0.5) * size.height
        minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py)
      }
      if (maxX < 0 || minX > size.width || maxY < 0 || minY > size.height) vis = false
      rects.current.set(o.id, { x: minX, y: minY, w: Math.max(maxX - minX, 18), h: Math.max(maxY - minY, 18), vis })
    })
  })
  return null
}

function Overlay({ rects, shown, objects }: { rects: MutableRefObject<Map<string, Rect>>; shown: Set<string>; objects: MoveObject[] }) {
  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  useEffect(() => {
    let raf = 0
    const loop = () => {
      objects.forEach((o) => {
        const el = refs.current[o.id]
        const r = rects.current.get(o.id)
        if (!el) return
        if (!r || !r.vis || !shown.has(o.id)) { el.style.opacity = '0'; return }
        el.style.opacity = '1'
        el.style.transform = `translate(${r.x}px, ${r.y}px)`
        el.style.width = `${r.w}px`
        el.style.height = `${r.h}px`
      })
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [objects, shown, rects])
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {objects.map((o) => {
        const m = Math.min(o.conf.detect, 99)
        const col = m >= 90 ? '#2dd4bf' : m >= 80 ? '#fbbf24' : '#f87171'
        return (
          <div key={o.id} ref={(el) => { refs.current[o.id] = el }} className="absolute left-0 top-0 opacity-0 transition-opacity duration-300" style={{ border: `1.5px solid ${col}`, boxShadow: `0 0 12px ${col}55`, borderRadius: 4 }}>
            <span className="absolute -top-5 left-[-1.5px] whitespace-nowrap rounded-sm px-1.5 py-[1px] text-[10px] font-semibold text-black" style={{ background: col }}>{o.name.replace(/ \d+"/, '')} — {o.conf.detect}%</span>
            {['-top-[3px] -left-[3px]', '-top-[3px] -right-[3px]', '-bottom-[3px] -left-[3px]', '-bottom-[3px] -right-[3px]'].map((c) => <span key={c} className={`absolute h-1.5 w-1.5 bg-white ${c}`} />)}
          </div>
        )
      })}
    </div>
  )
}

export default function Scan() {
  const objects = useMove((s) => s.objects)
  const [progress, setProgress] = useState(0)
  const [running, setRunning] = useState(true)
  const rects = useRef(new Map<string, Rect>())
  const items = useMemo<SceneItem[]>(() => objects.map((o) => ({ obj: o, p: o.src })), [objects])
  const byRoom = useMemo(() => Object.fromEntries(ROOM_ORDER.map((r) => [r, objects.filter((o) => o.room === r)])) as Record<RoomId, MoveObject[]>, [objects])

  useEffect(() => {
    if (!running || progress >= 100) return
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 0.55)), 90)
    return () => clearInterval(t)
  }, [running, progress])

  const roomIdx = Math.min(3, Math.floor(progress / 25))
  const room = ROOM_ORDER[roomIdx]
  const shown = useMemo(() => {
    const s = new Set<string>()
    ROOM_ORDER.forEach((r, i) => {
      const list = byRoom[r]
      const lp = progress >= (i + 1) * 25 ? 1 : progress < i * 25 ? 0 : (progress - i * 25) / 25
      list.slice(0, Math.ceil(Math.min(1, lp * 1.25) * list.length)).forEach((o) => s.add(o.id))
    })
    return s
  }, [progress, byRoom])
  const done = progress >= 100
  const detected = done ? objects.length : shown.size
  const log = objects.filter((o) => shown.has(o.id)).slice(-9).reverse()
  const camObjects = byRoom[room]

  return (
    <div>
      <PageHeader eyebrow="Step 1 · AI home scanning" title="Scan your current home" sub="Walk through each room. MOVE's vision models detect objects, estimate their size, weight and fragility, and attach a confidence score to every property." actions={
        <>
          <button className="btn-ghost" onClick={() => navigate('/detect')}><ScanLine size={14} /> Detect from photo (live model)</button>
          <button className="btn-ghost" onClick={() => { setProgress(0); setRunning(true) }}><RotateCcw size={14} /> Restart</button>
          <button className="btn-ghost" onClick={() => setRunning(!running)} disabled={done}>{running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> Resume</>}</button>
        </>
      } />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <Card className="relative overflow-hidden !rounded-3xl">
          <div className="relative aspect-[16/10] min-h-[380px] w-full bg-black">
            <Scene3D className="!absolute inset-0" controls={false} grid={false} camera={[3, 1.7, 3]} shadows={false} fov={62} light={1.8}>
              <HomeScene home={SOURCE_HOME} items={items} wallOpacity={0.55} roomLabels={false} />
              <CameraRig room={room} running={running && !done} />
              <Projector items={items} rects={rects} />
            </Scene3D>
            <Overlay rects={rects} shown={shown} objects={camObjects} />
            {/* camera chrome */}
            <div className="pointer-events-none absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.65))]" />
            <div className="pointer-events-none absolute inset-0 opacity-[0.07] [background:repeating-linear-gradient(0deg,#fff_0,#fff_1px,transparent_1px,transparent_3px)]" />
            {!done && running && <div className="scan-line pointer-events-none absolute left-0 right-0 h-24 animate-scan" />}
            <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-3 text-[11px] font-semibold tracking-wider text-white">
              <span className="flex items-center gap-1.5 rounded-md bg-black/55 px-2 py-1"><span className={cn('h-2 w-2 rounded-full bg-red-500', running && !done && 'animate-pulse')} /> {done ? 'SCAN COMPLETE' : running ? 'LIVE · SCANNING' : 'PAUSED'}</span>
              <span className="rounded-md bg-black/55 px-2 py-1" style={{ color: ROOM_COLOR[room] }}>{ROOM_LABEL[room].toUpperCase()}</span>
            </div>
            <div className="pointer-events-none absolute right-4 top-4 rounded-md bg-black/55 px-2 py-1 font-mono text-[11px] text-teal-300">4K · 30fps · LiDAR ✓ · SLAM ✓</div>
            <div className="pointer-events-none absolute left-1/2 top-1/2 h-8 w-8 -translate-x-1/2 -translate-y-1/2 opacity-50">
              <span className="absolute left-1/2 top-0 h-2 w-px bg-white" /><span className="absolute bottom-0 left-1/2 h-2 w-px bg-white" /><span className="absolute left-0 top-1/2 h-px w-2 bg-white" /><span className="absolute right-0 top-1/2 h-px w-2 bg-white" />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-5 pt-12">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-3xl font-semibold tracking-tight text-white">AI detected <span className="text-teal-300">{detected}</span> objects</div>
                  <div className="mt-1 text-xs text-slate-400">{done ? '4 rooms mapped · 37 objects · dimensions & fragility estimated' : `Analysing ${ROOM_LABEL[room]}…`}</div>
                </div>
                <div className="mono text-2xl font-semibold text-white">{Math.round(progress)}%</div>
              </div>
              <Progress value={progress} tone="teal" height={4} className="mt-3" />
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="label">Rooms</div>
            <div className="mt-3 space-y-2">
              {ROOM_ORDER.map((r, i) => {
                const st = progress >= (i + 1) * 25 ? 'done' : i === roomIdx && !done ? 'active' : 'wait'
                return (
                  <div key={r} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3 py-2.5">
                    <span className={cn('flex h-6 w-6 items-center justify-center rounded-full', st === 'done' ? 'bg-emerald-400/20 text-emerald-300' : st === 'active' ? 'bg-accent text-white' : 'bg-white/5 text-slate-600')}>{st === 'done' ? <Check size={13} /> : st === 'active' ? <ScanLine size={13} className="animate-pulse" /> : i + 1}</span>
                    <span className="flex-1 text-sm text-slate-200">{ROOM_LABEL[r]}</span>
                    <span className="mono text-xs text-slate-500">{byRoom[r].filter((o) => shown.has(o.id)).length}/{byRoom[r].length}</span>
                  </div>
                )
              })}
            </div>
          </Card>
          <Card className="p-5">
            <div className="label">Detection stream</div>
            <div className="mt-3 space-y-2.5">
              <AnimatePresence initial={false}>
                {log.map((o) => (
                  <motion.div key={o.id} layout initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                    <span className="w-28 truncate text-sm text-slate-200">{o.name}</span>
                    <div className="flex-1"><Conf value={o.conf.detect} compact /></div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {log.length === 0 && <div className="text-sm text-slate-500">Waiting for first frame…</div>}
            </div>
          </Card>
          <AnimatePresence>
            {done && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <Card glow className="p-5">
                  <div className="text-base font-semibold text-white">Scan complete</div>
                  <p className="mt-1 text-sm text-slate-400">37 objects across 4 rooms are now part of your digital twin. 2 have low-confidence estimates flagged for review.</p>
                  <div className="mt-4 flex gap-2"><button onClick={() => navigate('/inventory')} className="btn-primary flex-1">Review AI inventory <ArrowRight size={14} /></button><button onClick={() => navigate('/twin')} className="btn-ghost">3D twin</button></div>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
