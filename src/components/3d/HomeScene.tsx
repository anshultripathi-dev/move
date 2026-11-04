import { Line } from '@react-three/drei'
import { Html } from './Label3D'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { useMemo, useRef, useState, type ReactNode } from 'react'
import * as THREE from 'three'
import type { Home, Wall } from '../../data/layouts'
import type { MoveBox, MoveObject, Placement, RoomId } from '../../models/types'
import { ROOM_COLOR, ROOM_LABEL } from '../../models/types'
import { roomAt } from '../../utils/placement'
import { Carton, ObjectModel } from './ObjectModel'

const WALL_H = 2.5
const WALL_T = 0.1
const DOOR_H = 2.05

export interface SceneItem { obj: MoveObject; p: Placement; ghost?: boolean; hidden?: boolean }

export type ColorBy = 'none' | 'fragility' | 'state' | 'heat'

interface HomeSceneProps {
  home: Home
  items: SceneItem[]
  selectedId?: string | null
  onSelect?: (id: string | null) => void
  showLabels?: boolean
  showDims?: boolean
  showBoxes?: boolean
  showDest?: boolean
  showDoors?: boolean
  colorBy?: ColorBy
  stateHex?: Record<string, string>
  isolate?: RoomId | null
  wallOpacity?: number
  roomHeat?: Partial<Record<RoomId, number>>
  boxStacks?: { boxes: MoveBox[]; hideUnpacked?: boolean; highlightIds?: string[] }
  highlightIds?: string[]
  focusRoom?: RoomId | null
  roomLabels?: boolean
  onObjectDown?: (id: string) => void
  children?: ReactNode
}

const FRAG_HEX = { Low: '#34d399', Medium: '#fbbf24', High: '#f87171' }

function wallPieces(w: Wall, H: number) {
  const horizontal = w.a[1] === w.b[1]
  const len = horizontal ? Math.abs(w.b[0] - w.a[0]) : Math.abs(w.b[1] - w.a[1])
  const start = horizontal ? Math.min(w.a[0], w.b[0]) : Math.min(w.a[1], w.b[1])
  const fixed = horizontal ? w.a[1] : w.a[0]
  const ops = [...w.openings].sort((a, b) => a.at - b.at)
  const pieces: { u0: number; u1: number; y0: number; y1: number }[] = []
  let cursor = start
  for (const o of ops) {
    const o0 = o.at - o.width / 2, o1 = o.at + o.width / 2
    if (o0 > cursor) pieces.push({ u0: cursor, u1: o0, y0: 0, y1: H })
    const top = o.type === 'window' ? 2.1 : DOOR_H
    const sill = o.type === 'window' ? 0.9 : 0
    if (sill > 0) pieces.push({ u0: o0, u1: o1, y0: 0, y1: sill })
    pieces.push({ u0: o0, u1: o1, y0: top, y1: H })
    cursor = o1
  }
  if (start + len > cursor) pieces.push({ u0: cursor, u1: start + len, y0: 0, y1: H })
  return pieces.map((p) => ({
    pos: (horizontal ? [(p.u0 + p.u1) / 2, (p.y0 + p.y1) / 2, fixed] : [fixed, (p.y0 + p.y1) / 2, (p.u0 + p.u1) / 2]) as [number, number, number],
    size: (horizontal ? [p.u1 - p.u0, p.y1 - p.y0, WALL_T] : [WALL_T, p.y1 - p.y0, p.u1 - p.u0]) as [number, number, number],
  }))
}

function Walls({ home, opacity, isolate }: { home: Home; opacity: number; isolate?: RoomId | null }) {
  const iso = isolate ? home.rooms[isolate] : null
  return (
    <group>
      {home.walls.map((w, wi) => {
        const pcs = wallPieces(w, WALL_H)
        return (
          <group key={wi}>
            {pcs.map((p, i) => {
              if (iso) {
                const [x, , z] = p.pos
                if (x < iso.x0 - 0.2 || x > iso.x1 + 0.2 || z < iso.z0 - 0.2 || z > iso.z1 + 0.2) return null
              }
              return (
                <mesh key={i} position={p.pos} receiveShadow>
                  <boxGeometry args={p.size} />
                  <meshStandardMaterial color="#9fb0d0" transparent opacity={opacity} roughness={0.5} metalness={0.1} depthWrite={opacity > 0.6} />
                </mesh>
              )
            })}
          </group>
        )
      })}
    </group>
  )
}

function DoorFrames({ home, showLabels }: { home: Home; showLabels: boolean }) {
  return (
    <group>
      {home.walls.flatMap((w, wi) =>
        w.openings.filter((o) => o.type !== 'window').map((o, oi) => {
          const horizontal = w.a[1] === w.b[1]
          const fixed = horizontal ? w.a[1] : w.a[0]
          const pos: [number, number, number] = horizontal ? [o.at, DOOR_H / 2, fixed] : [fixed, DOOR_H / 2, o.at]
          const sz: [number, number, number] = horizontal ? [o.width + 0.06, DOOR_H + 0.03, WALL_T + 0.04] : [WALL_T + 0.04, DOOR_H + 0.03, o.width + 0.06]
          return (
            <group key={`${wi}-${oi}`} position={pos}>
              <lineSegments>
                <edgesGeometry args={[new THREE.BoxGeometry(...sz)]} />
                <lineBasicMaterial color="#6d8bff" />
              </lineSegments>
              {showLabels && (
                <Html center position={[0, DOOR_H / 2 + 0.2, 0]} distanceFactor={9} style={{ pointerEvents: 'none' }}>
                  <div className="whitespace-nowrap rounded-md border border-accent/40 bg-[#0b1020]/90 px-2 py-0.5 text-[10px] font-semibold text-accent-soft">
                    {o.label ?? 'Door'} · {Math.round(o.width * 100)} cm
                  </div>
                </Html>
              )}
            </group>
          )
        }),
      )}
    </group>
  )
}

function ObjectNode({ item, selected, hovered, onPick, onDown, onHover, showLabel, showDim, boxTag, destTag, tintHex, glowHex, home, highlight }: {
  item: SceneItem; selected: boolean; hovered: boolean; onPick?: () => void; onDown?: () => void; onHover: (h: boolean) => void; showLabel: boolean; showDim: boolean
  boxTag?: { text: string; color: string } | null; destTag?: { text: string; color: string } | null; tintHex?: string; glowHex?: string; home: Home; highlight?: boolean
}) {
  const { obj: o, p } = item
  const w = o.dims[0] / 100, d = o.dims[1] / 100, h = o.dims[2] / 100
  const group = useRef<THREE.Group>(null)
  const swap = Math.abs(Math.sin(p.rot)) > 0.7
  const emissive = selected ? '#6d8bff' : highlight ? '#2dd4bf' : hovered ? '#4a63c9' : glowHex ?? '#000000'
  const intensity = selected ? 0.55 : highlight ? 0.5 : hovered ? 0.35 : glowHex ? 0.45 : 0
  useFrame((_, dt) => {
    if (!group.current) return
    const target = p.elev
    group.current.position.y += (target - group.current.position.y) * Math.min(1, dt * 10)
    group.current.position.x += (p.x - group.current.position.x) * Math.min(1, dt * 10)
    group.current.position.z += (p.z - group.current.position.z) * Math.min(1, dt * 10)
  })
  if (item.hidden) return null
  const handle = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    onPick?.()
  }
  return (
    <group ref={group} position={[p.x, p.elev, p.z]} rotation={[0, p.rot, 0]}>
      <ObjectModel kind={o.kind} dims={o.dims} color={tintHex ?? o.color} emissive={emissive} intensity={intensity} opacity={item.ghost ? 0.35 : 1} />
      <mesh position={[0, h / 2, 0]} onClick={handle} onPointerDown={(e) => { if (onDown) { e.stopPropagation(); onDown() } }} onPointerOver={(e) => { e.stopPropagation(); onHover(true); document.body.style.cursor = onPick ? 'pointer' : 'auto' }} onPointerOut={() => { onHover(false); document.body.style.cursor = 'auto' }}>
        <boxGeometry args={[Math.max(w, 0.08), Math.max(h, 0.06), Math.max(d, 0.08)]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {(selected || highlight) && (
        <>
          <lineSegments position={[0, h / 2, 0]}>
            <edgesGeometry args={[new THREE.BoxGeometry(w + 0.04, h + 0.04, d + 0.04)]} />
            <lineBasicMaterial color={selected ? '#8ea4ff' : '#2dd4bf'} />
          </lineSegments>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006 - p.elev + 0.001, 0]}>
            <ringGeometry args={[Math.max(w, d) * 0.72, Math.max(w, d) * 0.78, 48]} />
            <meshBasicMaterial color={selected ? '#8ea4ff' : '#2dd4bf'} transparent opacity={0.8} />
          </mesh>
        </>
      )}
      {(showLabel || selected || hovered || showDim || boxTag || destTag) && (
        <Html position={[0, h + 0.14, 0]} center distanceFactor={9} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
          <div className="flex flex-col items-center gap-1" style={{ transform: swap ? 'none' : 'none' }}>
            {(showLabel || selected || hovered) && (
              <div className={`whitespace-nowrap rounded-md border px-2 py-0.5 text-[10px] font-medium shadow-lg ${selected ? 'border-accent bg-accent text-white' : 'border-white/15 bg-[#0b1020]/85 text-slate-100'}`}>{o.name}</div>
            )}
            {showDim && (
              <div className="mono whitespace-nowrap rounded-md bg-black/70 px-1.5 py-0.5 text-[9px] text-teal-300">
                {o.dims[0]}×{o.dims[1]}×{o.dims[2]} cm
              </div>
            )}
            {boxTag && <div className="whitespace-nowrap rounded-md px-1.5 py-0.5 text-[9px] font-bold text-black" style={{ background: boxTag.color }}>{boxTag.text}</div>}
            {destTag && <div className="whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[9px] font-semibold" style={{ borderColor: destTag.color, color: destTag.color, background: '#0b1020dd' }}>{destTag.text}</div>}
          </div>
        </Html>
      )}
    </group>
  )
}

function RoomFloors({ home, isolate, heat, showLabels, showDims, focus }: { home: Home; isolate?: RoomId | null; heat?: Partial<Record<RoomId, number>>; showLabels: boolean; showDims: boolean; focus?: RoomId | null }) {
  return (
    <group>
      {Object.values(home.rooms).map((r) => {
        const w = r.x1 - r.x0, d = r.z1 - r.z0
        const dim = isolate && isolate !== r.id
        const hv = heat?.[r.id]
        const color = hv !== undefined ? new THREE.Color().setHSL(0.35 - 0.35 * hv, 0.75, 0.35 + hv * 0.05).getStyle() : '#1a2230'
        return (
          <group key={r.id}>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(r.x0 + r.x1) / 2, 0.0, (r.z0 + r.z1) / 2]} receiveShadow>
              <planeGeometry args={[w - 0.02, d - 0.02]} />
              <meshStandardMaterial color={color} roughness={0.85} transparent opacity={dim ? 0.35 : 1} />
            </mesh>
            <mesh rotation={[-Math.PI / 2, 0, 0]} position={[(r.x0 + r.x1) / 2, 0.003, (r.z0 + r.z1) / 2]}>
              <planeGeometry args={[w - 0.02, d - 0.02]} />
              <meshBasicMaterial color={ROOM_COLOR[r.id]} transparent opacity={focus === r.id ? 0.16 : 0.06} depthWrite={false} />
            </mesh>
            {showLabels && !dim && (
              <Html position={[r.x0 + 0.1, 0.02, r.z0 + 0.1]} distanceFactor={11} style={{ pointerEvents: 'none' }} zIndexRange={[5, 0]}>
                <div className="flex items-center gap-1.5 whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: ROOM_COLOR[r.id] }}>
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: ROOM_COLOR[r.id] }} />
                  {ROOM_LABEL[r.id]}
                  {showDims && <span className="mono ml-1 normal-case tracking-normal text-slate-400">{w.toFixed(1)} × {d.toFixed(1)} m · {(w * d).toFixed(1)} m²</span>}
                </div>
              </Html>
            )}
          </group>
        )
      })}
    </group>
  )
}

function BoxStacks({ home, boxes, hideUnpacked, highlightIds }: { home: Home; boxes: MoveBox[]; hideUnpacked?: boolean; highlightIds?: string[] }) {
  const placed = useMemo(() => {
    const byRoom: Record<string, MoveBox[]> = {}
    boxes.forEach((b) => { if (!(hideUnpacked && b.state === 'UNPACKED')) (byRoom[b.destRoom] ??= []).push(b) })
    const out: { b: MoveBox; pos: [number, number, number] }[] = []
    Object.entries(byRoom).forEach(([room, list]) => {
      const r = home.rooms[room as RoomId]
      const anchor: Record<string, { x: number; z: number; axis: 'x' | 'z' }> = {
        living: { x: 4.35, z: 1.2, axis: 'z' }, kitchen: { x: 3.3, z: 3.0, axis: 'z' },
        study: { x: 0.55, z: 0.55, axis: 'x' }, bedroom: { x: 1.9, z: 0.5, axis: 'x' },
      }
      const an = anchor[room]
      list.forEach((b, i) => {
        const along = (i % 3) * 0.62, across = (Math.floor(i / 3) % 2) * 0.52, lvl = Math.floor(i / 6)
        const x = r.x0 + an.x + (an.axis === 'x' ? along : across)
        const z = r.z0 + an.z + (an.axis === 'z' ? along : across)
        out.push({ b, pos: [x, lvl * 0.4, z] })
      })
    })
    return out
  }, [boxes, home, hideUnpacked])
  return (
    <group>
      {placed.map(({ b, pos }) => (
        <group key={b.id} position={pos}>
          <Carton dims={[Math.min(b.dims[0], 60), Math.min(b.dims[1], 40), Math.min(b.dims[2], 50)]} color={b.color} emissive={highlightIds?.includes(b.id) ? '#2dd4bf' : '#000000'} intensity={highlightIds?.includes(b.id) ? 0.5 : 0} />
          <Html center position={[0, Math.min(b.dims[2], 50) / 100 + 0.12, 0]} distanceFactor={10} style={{ pointerEvents: 'none' }}>
            <div className="rounded bg-black/70 px-1 text-[9px] font-bold text-amber-200">#{String(b.num).padStart(3, '0')}</div>
          </Html>
        </group>
      ))}
    </group>
  )
}

export function HomeScene(props: HomeSceneProps) {
  const { home, items, selectedId, onSelect, showLabels = false, showDims = false, showBoxes = false, showDest = false, showDoors = false, colorBy = 'none', stateHex, isolate, wallOpacity = 0.16, roomHeat, boxStacks, highlightIds, focusRoom, roomLabels = true, onObjectDown, children } = props
  const [hover, setHover] = useState<string | null>(null)
  const ox = -home.width / 2, oz = -home.depth / 2
  const visible = isolate ? items.map((i) => ({ ...i, hidden: i.hidden || roomAt(home, i.p.x, i.p.z) !== isolate })) : items
  return (
    <group position={[ox, 0, oz]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[home.width / 2, -0.03, home.depth / 2]} receiveShadow>
        <planeGeometry args={[home.width + 1.2, home.depth + 1.2]} />
        <meshStandardMaterial color="#0c111b" roughness={1} />
      </mesh>
      <RoomFloors home={home} isolate={isolate} heat={roomHeat} showLabels={roomLabels} showDims={showDims} focus={focusRoom} />
      <Walls home={home} opacity={wallOpacity} isolate={isolate} />
      <DoorFrames home={home} showLabels={showDoors} />
      {home.fixtures.map((f, i) => {
        const r = home.rooms[f.room]
        if (isolate && isolate !== f.room) return null
        return (
          <mesh key={i} position={[r.x0 + f.rel[0], f.size[2] / 2, r.z0 + f.rel[1]]} castShadow receiveShadow rotation={[0, f.rot ?? 0, 0]}>
            <boxGeometry args={f.size} />
            <meshStandardMaterial color={f.color} roughness={0.7} />
          </mesh>
        )
      })}
      {visible.map((it) => {
        const o = it.obj
        const tint = colorBy === 'state' && stateHex ? stateHex[o.state] : undefined
        const glow = colorBy === 'fragility' ? FRAG_HEX[o.fragility] : colorBy === 'heat' ? new THREE.Color().setHSL(0.35 - 0.35 * Math.min(1, o.weight / 60), 0.8, 0.5).getStyle() : colorBy === 'state' && stateHex ? stateHex[o.state] : undefined
        const bx = showBoxes && o.boxId ? { text: o.boxId.replace('BOX-', 'BOX #'), color: '#e7c27d' } : null
        const dest = showDest ? { text: `→ ${ROOM_LABEL[o.destRoom]}`, color: ROOM_COLOR[o.destRoom] } : null
        return (
          <ObjectNode
            key={o.id}
            item={it}
            home={home}
            selected={selectedId === o.id}
            hovered={hover === o.id}
            highlight={highlightIds?.includes(o.id)}
            onPick={onSelect ? () => onSelect(o.id) : undefined}
            onDown={onObjectDown ? () => onObjectDown(o.id) : undefined}
            onHover={(h) => setHover(h ? o.id : hover === o.id ? null : hover)}
            showLabel={showLabels}
            showDim={showDims && (!!o.isFurniture || selectedId === o.id || hover === o.id)}
            boxTag={bx}
            destTag={dest}
            tintHex={tint && colorBy === 'state' ? undefined : undefined}
            glowHex={glow}
          />
        )
      })}
      {showDest &&
        visible.filter((i) => !i.hidden && i.obj.room !== i.obj.destRoom).map((i) => {
          const a = home.rooms[i.obj.room], b = home.rooms[i.obj.destRoom]
          return <Line key={i.obj.id} points={[[i.p.x, 0.3, i.p.z], [(b.x0 + b.x1) / 2, 0.3, (b.z0 + b.z1) / 2]]} color={ROOM_COLOR[i.obj.destRoom]} dashed dashSize={0.15} gapSize={0.1} lineWidth={1} />
        })}
      {boxStacks && <BoxStacks home={home} boxes={boxStacks.boxes} hideUnpacked={boxStacks.hideUnpacked} highlightIds={boxStacks.highlightIds} />}
      {children}
    </group>
  )
}

/** Horizontal scan plane sweeping up/down the building – used on hero & scanners. */
export function ScanSweep({ width, depth, active = true, color = '#2dd4bf' }: { width: number; depth: number; active?: boolean; color?: string }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame(({ clock }) => {
    if (!ref.current) return
    const t = (Math.sin(clock.elapsedTime * 0.9) + 1) / 2
    ref.current.position.y = 0.05 + t * 2.4
    ;(ref.current.material as THREE.MeshBasicMaterial).opacity = active ? 0.22 : 0
  })
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, 0, depth / 2]}>
      <planeGeometry args={[width, depth]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  )
}
