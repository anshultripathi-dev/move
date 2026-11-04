import { useFrame } from '@react-three/fiber'
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type CSSProperties, type ReactNode } from 'react'
import * as THREE from 'three'

/**
 * DOM labels anchored to 3D points. The labels are rendered by React DOM *outside* the WebGL canvas
 * (positions are projected every frame), so they never fight the R3F reconciler on unmount.
 */
interface Entry { content: ReactNode; x: number; y: number; scale: number; visible: boolean; center: boolean; factor: number }

export class LabelRegistry {
  map = new Map<number, Entry>()
  private subs = new Set<() => void>()
  private pending = false
  version = 0
  set(id: number, e: Partial<Entry>) {
    const cur = this.map.get(id) ?? { content: null, x: 0, y: 0, scale: 1, visible: false, center: true, factor: 10 }
    this.map.set(id, { ...cur, ...e })
    if (e.content !== undefined) this.notify()
  }
  remove(id: number) { this.map.delete(id); this.notify() }
  private notify() {
    if (this.pending) return
    this.pending = true
    queueMicrotask(() => { this.pending = false; this.version++; this.subs.forEach((f) => f()) })
  }
  subscribe = (f: () => void) => { this.subs.add(f); return () => { this.subs.delete(f) } }
  getVersion = () => this.version
}

const Ctx = createContext<LabelRegistry | null>(null)
export const LabelProvider = Ctx.Provider

let uid = 1
const tmp = new THREE.Vector3()

export function Html({ position = [0, 0, 0], children, center = true, distanceFactor = 10 }: { position?: [number, number, number]; children?: ReactNode; center?: boolean; distanceFactor?: number; style?: CSSProperties; zIndexRange?: number[]; occlude?: unknown }) {
  const reg = useContext(Ctx)
  const ref = useRef<THREE.Group>(null)
  const id = useRef(0)
  if (!id.current) id.current = uid++
  useEffect(() => { const i = id.current; return () => reg?.remove(i) }, [reg])
  useEffect(() => { reg?.set(id.current, { content: children, center, factor: distanceFactor }) })
  useFrame(({ camera, size }) => {
    if (!reg || !ref.current) return
    ref.current.getWorldPosition(tmp)
    const dist = tmp.distanceTo(camera.position)
    tmp.project(camera)
    reg.set(id.current, {
      x: (tmp.x * 0.5 + 0.5) * size.width,
      y: (-tmp.y * 0.5 + 0.5) * size.height,
      visible: tmp.z < 1 && tmp.z > -1 && Math.abs(tmp.x) < 1.15 && Math.abs(tmp.y) < 1.15,
      scale: Math.min(1.5, Math.max(0.62, (distanceFactor * 1.5) / dist)),
    })
  })
  return <group ref={ref} position={position} />
}

export function LabelLayer({ registry }: { registry: LabelRegistry }) {
  useSyncExternalStore(registry.subscribe, registry.getVersion)
  const nodes = useRef(new Map<number, HTMLDivElement>())
  useEffect(() => {
    let raf = 0
    const loop = () => {
      registry.map.forEach((e, id) => {
        const el = nodes.current.get(id)
        if (!el) return
        if (!e.visible) { el.style.display = 'none'; return }
        el.style.display = 'block'
        el.style.transform = `translate(${e.x}px, ${e.y}px) translate(${e.center ? '-50%' : '0'}, ${e.center ? '-50%' : '0'}) scale(${e.scale})`
      })
      raf = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(raf)
  }, [registry])
  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
      {[...registry.map.entries()].map(([id, e]) => (
        <div key={id} ref={(el) => { if (el) nodes.current.set(id, el); else nodes.current.delete(id) }} className="absolute left-0 top-0" style={{ display: 'none', transformOrigin: e.center ? 'center' : 'top left', willChange: 'transform' }}>
          {e.content}
        </div>
      ))}
    </div>
  )
}
