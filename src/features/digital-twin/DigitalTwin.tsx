import { AnimatePresence, motion } from 'framer-motion'
import { Eye, Flame, Home, Layers, Maximize, Minus, Move3D, Plus, RotateCcw, Ruler, Tag, Tags, Boxes, Route, DoorOpen } from 'lucide-react'
import { useMemo, useRef, useState } from 'react'
import { HomeScene, type ColorBy } from '../../components/3d/HomeScene'
import { Scene3D, zoomBy } from '../../components/3d/Scene3D'
import { ObjectIntel } from '../../components/ObjectPanels'
import { Card, PageHeader, Toggle } from '../../components/ui'
import { useSourceItems, SOURCE_HOME } from '../../hooks/useScene'
import { ROOM_COLOR, ROOM_LABEL, ROOM_ORDER, type Category, type RoomId } from '../../models/types'
import { useMove } from '../../state/store'
import { cn, STATE_HEX } from '../../utils/format'
import { navigate } from '../../hooks/useRoute'

export default function DigitalTwin() {
  const items = useSourceItems()
  const objects = useMove((s) => s.objects)
  const selected = useMove((s) => s.selectedObject)
  const select = useMove((s) => s.selectObject)
  const [room, setRoom] = useState<RoomId | null>(null)
  const [cat, setCat] = useState<Category | null>(null)
  const [labels, setLabels] = useState(false)
  const [dims, setDims] = useState(false)
  const [boxes, setBoxes] = useState(false)
  const [dest, setDest] = useState(false)
  const [doors, setDoors] = useState(false)
  const [color, setColor] = useState<ColorBy>('none')
  const [reset, setReset] = useState(0)
  const ctl = useRef(null) as never as React.MutableRefObject<never>
  const cats = useMemo(() => [...new Set(objects.map((o) => o.category))], [objects])
  const highlight = cat ? objects.filter((o) => o.category === cat).map((o) => o.id) : undefined
  const heat = useMemo(() => {
    const m: Partial<Record<RoomId, number>> = {}
    const tot = ROOM_ORDER.map((r) => objects.filter((o) => o.room === r).reduce((a, o) => a + o.weight, 0))
    const mx = Math.max(...tot)
    ROOM_ORDER.forEach((r, i) => (m[r] = tot[i] / mx))
    return m
  }, [objects])
  const roomObjs = (r: RoomId) => objects.filter((o) => o.room === r)

  return (
    <div>
      <PageHeader eyebrow="Digital twin" title="Current Home" sub="A navigable 3D model of everything you own. Select any object to inspect its AI metadata." actions={<button onClick={() => navigate('/scan')} className="btn-ghost"><Move3D size={15} /> Re-scan home</button>} />
      <div className="grid gap-4 lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[230px_minmax(0,1fr)_340px]">
        <div className="space-y-4">
          <Card className="p-3">
            <div className="label px-2 pb-2 pt-1">Rooms</div>
            <button onClick={() => setRoom(null)} className={cn('flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm', !room ? 'bg-accent/15 text-white ring-1 ring-accent/30' : 'text-slate-400 hover:bg-white/5')}><span className="flex items-center gap-2"><Home size={14} /> Whole home</span><span className="mono text-xs">{objects.length}</span></button>
            {ROOM_ORDER.map((r) => (
              <button key={r} onClick={() => setRoom(room === r ? null : r)} className={cn('mt-0.5 flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-sm', room === r ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5')}>
                <span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full" style={{ background: ROOM_COLOR[r] }} />{ROOM_LABEL[r]}</span>
                <span className="mono text-xs">{roomObjs(r).length}</span>
              </button>
            ))}
          </Card>
          <Card className="p-3">
            <div className="label px-2 pb-2 pt-1">Categories</div>
            <div className="flex flex-wrap gap-1.5 px-1 pb-1">
              {cats.map((c) => (
                <button key={c} onClick={() => setCat(cat === c ? null : c)} className={cn('rounded-md border px-2 py-1 text-[11px]', cat === c ? 'border-teal-400/60 bg-teal-400/15 text-teal-200' : 'border-white/10 text-slate-400 hover:text-white')}>{c}</button>
              ))}
            </div>
          </Card>
          <Card className="hidden p-3 lg:block">
            <div className="label px-2 pb-2 pt-1">Colour by</div>
            {([['none', 'Natural'], ['state', 'Lifecycle state'], ['fragility', 'Fragility'], ['heat', 'Weight heatmap']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setColor(k)} className={cn('flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm', color === k ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5')}>
                <span className={cn('h-2.5 w-2.5 rounded-full border', color === k ? 'border-accent bg-accent' : 'border-white/30')} />{l}
              </button>
            ))}
          </Card>
        </div>

        <Card className="relative h-[560px] overflow-hidden lg:h-[calc(100vh-14rem)] lg:min-h-[560px]">
          <Scene3D className="!absolute inset-0" camera={[6.5, 12.5, 12.5]} resetKey={reset} onMiss={() => select(null)} controlsRef={ctl} minDistance={3} maxDistance={24}>
            <HomeScene home={SOURCE_HOME} items={items} selectedId={selected} onSelect={select} showLabels={labels} showDims={dims} showBoxes={boxes} showDest={dest} showDoors={doors} colorBy={color} stateHex={STATE_HEX} isolate={room} roomHeat={color === 'heat' ? heat : undefined} highlightIds={highlight} focusRoom={room} wallOpacity={room ? 0.1 : 0.14} />
          </Scene3D>
          <div className="absolute left-3 right-3 top-3 flex flex-wrap items-center gap-1.5">
            <Toggle on={labels} onChange={setLabels} label="Labels" />
            <Toggle on={dims} onChange={setDims} label="Dimensions" />
            <Toggle on={boxes} onChange={setBoxes} label="Boxes" />
            <Toggle on={dest} onChange={setDest} label="Destination" />
            <Toggle on={doors} onChange={setDoors} label="Doorways" />
            <Toggle on={color === 'heat'} onChange={(v) => setColor(v ? 'heat' : 'none')} label="Heatmap" />
          </div>
          <div className="absolute bottom-3 left-3 flex gap-1.5">
            <button className="btn-ghost !p-2.5" onClick={() => zoomBy(ctl, 0.8)} title="Zoom in"><Plus size={15} /></button>
            <button className="btn-ghost !p-2.5" onClick={() => zoomBy(ctl, 1.25)} title="Zoom out"><Minus size={15} /></button>
            <button className="btn-ghost" onClick={() => setReset((r) => r + 1)}><RotateCcw size={14} /> Reset</button>
          </div>
          <div className="pointer-events-none absolute bottom-3 right-3 rounded-lg bg-black/50 px-3 py-1.5 text-[11px] text-slate-400 backdrop-blur">Drag to orbit · scroll to zoom · right-drag to pan · click objects</div>
          {color === 'fragility' && <Legend items={[['Low', '#34d399'], ['Medium', '#fbbf24'], ['High', '#f87171']]} title="Fragility" />}
          {color === 'heat' && <Legend items={[['Light', '#34d399'], ['Medium', '#fbbf24'], ['Heavy', '#f87171']]} title="Weight" />}
          {color === 'state' && <Legend items={Object.entries(STATE_HEX).filter(([k]) => k !== 'CREATED' && k !== 'UNPACKED') as [string, string][]} title="State" />}
          {/* panel on smaller screens */}
          <AnimatePresence>
            {selected && (
              <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} className="absolute inset-x-3 bottom-14 z-10 h-[420px] max-h-[70%] overflow-hidden rounded-2xl border border-white/10 bg-[#0b0f16]/95 shadow-2xl backdrop-blur xl:hidden">
                <ObjectIntel id={selected} onClose={() => select(null)} />
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        <Card className="hidden h-[calc(100vh-14rem)] min-h-[560px] overflow-hidden xl:block">
          {selected ? (
            <ObjectIntel id={selected} onClose={() => select(null)} />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent-soft"><Layers size={24} /></div>
              <div className="text-sm font-medium text-white">Object Intelligence</div>
              <p className="text-xs leading-relaxed text-slate-500">Select any object in the 3D scene to see its dimensions, weight, fragility, box assignment and AI confidence scores.</p>
              <button onClick={() => select('OBJ-019')} className="btn-ghost mt-2 text-xs">Inspect Study Desk</button>
            </div>
          )}
        </Card>
      </div>
      <div className="hidden"><Eye /><Flame /><Maximize /><Ruler /><Tag /><Tags /><Boxes /><Route /><DoorOpen /></div>
    </div>
  )
}

function Legend({ items, title }: { items: [string, string][]; title: string }) {
  return (
    <div className="absolute right-3 top-14 rounded-xl border border-white/10 bg-black/55 p-3 backdrop-blur">
      <div className="label mb-1.5">{title}</div>
      {items.map(([l, c]) => <div key={l} className="flex items-center gap-2 text-[11px] text-slate-300"><span className="h-2 w-2 rounded-full" style={{ background: c }} />{l.replace('_', ' ')}</div>)}
    </div>
  )
}
