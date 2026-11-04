import type { MoveBox, MoveObject } from '../models/types'
import { ROOM_LABEL } from '../models/types'
import { shipVolume } from '../state/selectors'

export interface LoadStep {
  step: number
  kind: 'furniture' | 'box' | 'loose'
  id: string
  label: string
  reason: string
  weight: number
  volume: number
  dims: [number, number, number] // stowed cm
  color: string
  fragile: boolean
  essential: boolean
}

export const boxWeight = (b: MoveBox, objects: MoveObject[]) => objects.filter((o) => o.boxId === b.id).reduce((a, o) => a + o.weight, 0)
export const boxFragile = (b: MoveBox, objects: MoveObject[]) => objects.some((o) => o.boxId === b.id && o.fragility === 'High')

/** Dimensions of an item as it is stowed in the truck: smallest side scaled by its flat-pack factor, laid lowest-first. */
export function stowDims(o: MoveObject): [number, number, number] {
  const s = [...o.dims].sort((a, b) => b - a)
  const f = o.packFactor ?? 1
  if (o.isFurniture || (o.packFactor ?? 1) < 1) {
    if (o.kind === 'rug') return [200, 20, 20]
    if (o.kind === 'sofa') return [s[0], s[1], Math.round(s[2] * f)]
    return [s[0], s[1], Math.max(8, Math.round(s[2] * f))]
  }
  return o.dims
}

/** Heavy and bulky first, fragile & essentials last (last-in, first-out), bed last because it is needed first. */
export function buildLoadingOrder(objects: MoveObject[], boxes: MoveBox[]): LoadStep[] {
  const steps: Omit<LoadStep, 'step'>[] = []
  const furn = objects.filter((o) => !o.boxId).sort((a, b) => b.weight - a.weight)
  const bed = furn.find((o) => o.kind === 'bed')
  const mk = (o: MoveObject, reason: string): Omit<LoadStep, 'step'> => ({ kind: o.isFurniture ? 'furniture' : 'loose', id: o.id, label: o.name, reason, weight: o.weight, volume: shipVolume(o), dims: stowDims(o), color: o.color, fragile: o.fragility === 'High', essential: o.priority === 'Essential' })
  furn.filter((o) => o !== bed && o.weight >= 20).forEach((o) => steps.push(mk(o, 'Heavy furniture forms the stable base layer against the cab wall')))
  const bw = (b: MoveBox) => boxWeight(b, objects)
  const mkBox = (b: MoveBox, reason: string): Omit<LoadStep, 'step'> => ({ kind: 'box', id: b.id, label: `Box #${String(b.num).padStart(3, '0')} · ${b.label}`, reason, weight: bw(b), volume: (b.dims[0] * b.dims[1] * b.dims[2]) / 1e6, dims: b.dims, color: b.color, fragile: boxFragile(b, objects), essential: b.priority === 'Essential' })
  const plain = boxes.filter((b) => !boxFragile(b, objects) && b.priority !== 'Essential').sort((a, b) => bw(b) - bw(a))
  plain.filter((b) => bw(b) >= 8).forEach((b) => steps.push(mkBox(b, 'Heavy box — load low to keep the centre of gravity down')))
  furn.filter((o) => o !== bed && o.weight < 20).forEach((o) => steps.push(mk(o, 'Light loose item — fills gaps around the furniture base')))
  plain.filter((b) => bw(b) < 8).forEach((b) => steps.push(mkBox(b, 'Light box — stacked on top of heavy boxes')))
  boxes.filter((b) => boxFragile(b, objects)).forEach((b) => steps.push(mkBox(b, 'Fragile — loaded late, top layer, nothing stacked on it')))
  boxes.filter((b) => !boxFragile(b, objects) && b.priority === 'Essential').forEach((b) => steps.push(mkBox(b, 'Essentials — loaded last so they are unloaded first')))
  if (bed) steps.push(mk(bed, 'Bed is needed first at the new home — loaded last, unloaded first'))
  return steps.map((s, i) => ({ ...s, step: i + 1 }))
}

export interface Placed { step: LoadStep; pos: [number, number, number]; size: [number, number, number]; fits: boolean }

/** Greedy height-map packing of the load plan into a cargo bay (metres). */
export function packTruck(steps: LoadStep[], bay: [number, number, number]): Placed[] {
  const R = 0.1
  const nx = Math.floor(bay[0] / R), nz = Math.floor(bay[1] / R)
  const hm = new Float32Array(nx * nz)
  const out: Placed[] = []
  let overflowX = bay[0] + 0.6
  const area = (st: LoadStep) => st.dims[0] * st.dims[1]
  const placeOrder = [...steps].sort((p, q) => area(q) - area(p) || p.step - q.step)
  for (const st of placeOrder) {
    // lay furniture on its largest face: footprint a×b, height c
    const dims = [...st.dims].map((v) => v / 100)
    const [a, b, c] = st.kind === 'box' && Math.max(...dims) < 1.0 ? dims : [...dims].sort((p, q) => q - p)
    let best: { x: number; z: number; y: number; w: number; d: number } | null = null
    let bestScore = Infinity
    for (const [w, d] of [[a, b], [b, a]] as [number, number][]) {
      const cw = Math.ceil(w / R), cd = Math.ceil(d / R)
      if (cw > nx || cd > nz) continue
      for (let x = 0; x + cw <= nx; x++) {
        for (let z = 0; z + cd <= nz; z++) {
          let top = 0
          for (let i = x; i < x + cw; i++) for (let j = z; j < z + cd; j++) top = Math.max(top, hm[i * nz + j])
          if (top + c > bay[2]) continue
          const score = top * 100 + x * 10 + z
          if (score < bestScore) { bestScore = score; best = { x, z, y: top, w, d } }
        }
      }
    }
    const bp = best as { x: number; z: number; y: number; w: number; d: number } | null
    if (bp) {
      const cw = Math.ceil(bp.w / R), cd = Math.ceil(bp.d / R)
      for (let i = bp.x; i < bp.x + cw; i++) for (let j = bp.z; j < bp.z + cd; j++) hm[i * nz + j] = bp.y + c
      out.push({ step: st, pos: [bp.x * R + bp.w / 2, bp.y + c / 2, bp.z * R + bp.d / 2], size: [bp.w, c, bp.d], fits: true })
    } else {
      out.push({ step: st, pos: [overflowX + a / 2, c / 2, bay[1] / 2], size: [a, c, b], fits: false })
      overflowX += a + 0.1
    }
  }
  return out
}

export const roomOf = (o: MoveObject) => ROOM_LABEL[o.room]
