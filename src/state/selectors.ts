import type { MoveBox, MoveObject, DocTask, DamageRecord, AssemblyPlan } from '../models/types'
import { OBJ_STATES, BOX_STATES } from '../models/types'

type Src = {
  objects: MoveObject[]
  boxes: MoveBox[]
  docs: DocTask[]
  damage: DamageRecord | null
  assembly: AssemblyPlan[]
  phase: number
  reconRun: boolean
  vehicle: number
}

export const objIdx = (o: MoveObject) => OBJ_STATES.indexOf(o.state)
export const boxIdx = (b: MoveBox) => BOX_STATES.indexOf(b.state)
export const atLeast = (o: MoveObject, s: (typeof OBJ_STATES)[number]) => objIdx(o) >= OBJ_STATES.indexOf(s)
export const boxAtLeast = (b: MoveBox, s: (typeof BOX_STATES)[number]) => boxIdx(b) >= BOX_STATES.indexOf(s)

export const bbVolume = (o: MoveObject) => (o.dims[0] * o.dims[1] * o.dims[2]) / 1e6
export const shipVolume = (o: MoveObject) => bbVolume(o) * (o.packFactor ?? 1)
export const boxVolume = (b: MoveBox) => (b.dims[0] * b.dims[1] * b.dims[2]) / 1e6

export const VEHICLES = [
  { cap: 5, name: 'Cargo Van', price: 120, dims: [2.0, 1.55, 1.6] as [number, number, number], crew: 2 },
  { cap: 8, name: 'Box Truck S', price: 185, dims: [2.4, 1.75, 1.9] as [number, number, number], crew: 2 },
  { cap: 14, name: 'Box Truck M', price: 310, dims: [3.3, 2.0, 2.15] as [number, number, number], crew: 3 },
]
export const PACK_EFFICIENCY = 0.7

export function computeStats(s: Src) {
  const { objects, boxes } = s
  const items = objects.length
  const packed = objects.filter((o) => atLeast(o, 'PACKED')).length
  const scannedOnly = objects.filter((o) => !atLeast(o, 'PACKED')).length
  const furniture = objects.filter((o) => o.isFurniture)
  const fragile = objects.filter((o) => o.fragility === 'High')
  const loaded = objects.filter((o) => atLeast(o, 'LOADED')).length
  const boxesLoaded = boxes.filter((b) => boxAtLeast(b, 'LOADED')).length
  const boxesArrived = boxes.filter((b) => boxAtLeast(b, 'ARRIVED')).length
  const boxesUnpacked = boxes.filter((b) => b.state === 'UNPACKED').length
  const furnitureLoaded = furniture.filter((o) => atLeast(o, 'LOADED')).length
  const furnitureArrived = furniture.filter((o) => atLeast(o, 'ARRIVED')).length
  const fragileLoaded = fragile.filter((o) => atLeast(o, 'LOADED')).length
  const volume = objects.filter((o) => !o.boxId).reduce((a, o) => a + shipVolume(o), 0) + boxes.reduce((a, b) => a + boxVolume(b), 0)
  const weight = objects.reduce((a, o) => a + o.weight, 0)
  const missing = objects.filter((o) => o.missing === 'suspected' || o.missing === 'reported')
  const misplaced = objects.filter((o) => o.misplacedIn && !o.misplacedResolved)
  const damageOpen = s.damage && s.damage.status !== 'reported' ? 1 : 0
  const damageCount = s.damage ? 1 : 0
  const detected = s.phase >= 3 ? items - missing.length : s.phase >= 2 ? items : items
  const lowConf = objects.filter((o) => !o.confirmed && Math.min(o.conf.detect, o.conf.dims, o.conf.fragility) < 75)

  // readiness
  const inventory = 100
  const packing = s.phase >= 1 ? 100 : Math.round(((packed + 0.25 * scannedOnly) / items) * 100)
  const destination = 100
  const vehicleCap = s.vehicle
  const usable = vehicleCap * PACK_EFFICIENCY
  const vehicleScore = volume <= usable ? 100 : Math.round((usable / volume) * 100)
  const documentation = s.docs.reduce((a, d) => a + (d.done ? d.weight : 0), 0)
  const readiness = Math.round(inventory * 0.1 + packing * 0.32 + destination * 0.1 + vehicleScore * 0.1 + documentation * 0.38)

  const reconciled = objects.filter((o) => (o.missing === null || o.missing === 'found') && !(o.misplacedIn && !o.misplacedResolved)).length
  const accounted = objects.filter((o) => o.missing !== 'suspected' && o.missing !== 'reported').length
  const assemblyDone = s.assembly.filter((a) => a.progress >= a.steps.length).length
  const unscannedBoxes = boxes.filter((b) => !b.scanned)

  const remaining: string[] = []
  if (scannedOnly > 0 && s.phase === 0) remaining.push(`Pack ${scannedOnly} remaining item${scannedOnly > 1 ? 's' : ''}`)
  if (unscannedBoxes.length > 0) remaining.push(`Scan ${unscannedBoxes.map((b) => `Box #${String(b.num).padStart(3, '0')}`).join(' & ')}`)
  const docsLeft = s.docs.filter((d) => !d.done).length
  if (docsLeft > 0) remaining.push(`Complete ${docsLeft} document task${docsLeft > 1 ? 's' : ''}`)

  return {
    items, packed, scannedOnly, loaded, boxCount: boxes.length, tracked: boxes.length, boxesLoaded, boxesArrived, boxesUnpacked,
    furnitureTotal: furniture.length, furnitureLoaded, furnitureArrived, fragileTotal: fragile.length, fragileLoaded,
    volume, weight, missing: missing.length, missingItems: missing, misplaced: misplaced.length, misplacedItems: misplaced,
    damageCount, damageOpen, detected, lowConf, accounted, reconciled, assemblyDone,
    readiness, breakdown: { inventory, packing, destination, vehicle: vehicleScore, documentation },
    remaining, usable, utilization: Math.round((volume / usable) * 100), unscannedBoxes,
  }
}
export type Stats = ReturnType<typeof computeStats>

export interface MoveException {
  id: string
  level: 'red' | 'orange' | 'yellow' | 'blue'
  title: string
  detail: string
  route: string
  objectId?: string
}

export function computeExceptions(s: Src): MoveException[] {
  const st = computeStats(s)
  const out: MoveException[] = []
  st.missingItems.forEach((o) =>
    out.push({ id: `x-miss-${o.id}`, level: 'red', title: `${o.name} ${o.missing === 'reported' ? 'reported missing' : 'missing'}`, detail: `Last seen in ${o.lastSeen?.boxId?.replace('BOX-', 'Box #') ?? 'unknown'} · ${o.lastSeen?.state ?? ''}`, route: '/reconciliation/missing', objectId: o.id }),
  )
  if (s.damage && s.damage.status !== 'reported') {
    const o = s.objects.find((x) => x.id === s.damage!.objectId)
    out.push({ id: 'x-dmg', level: 'orange', title: `${o?.name ?? 'Item'} scratch detected`, detail: `${s.damage.severity} severity · ${s.damage.location} · ${s.damage.confidence}%`, route: '/damage', objectId: s.damage.objectId })
  }
  st.misplacedItems.forEach((o) =>
    out.push({ id: `x-mis-${o.id}`, level: 'yellow', title: `${o.name} in the wrong room`, detail: `Expected ${o.destRoom}, detected ${o.misplacedIn}`, route: '/reconciliation/misplaced', objectId: o.id }),
  )
  st.unscannedBoxes.forEach((b) =>
    out.push({ id: `x-scan-${b.id}`, level: 'yellow', title: `Box #${String(b.num).padStart(3, '0')} not scanned`, detail: `${b.label} has no QR checkpoint yet`, route: `/box/${b.id}` }),
  )
  if (s.phase >= 3) {
    s.assembly.filter((a) => a.progress < a.steps.length).slice(0, 1).forEach((a) => {
      const o = s.objects.find((x) => x.id === a.objectId)
      out.push({ id: `x-asm-${a.objectId}`, level: 'yellow', title: `${o?.name.replace('Study ', '')} assembly incomplete`.replace('Desk assembly', 'Desk assembly'), detail: `${a.progress} of ${a.steps.length} steps done`, route: '/reassembly', objectId: a.objectId })
    })
  }
  st.lowConf.forEach((o) =>
    out.push({ id: `x-low-${o.id}`, level: 'blue', title: `Verify ${o.name}`, detail: `AI confidence ${Math.min(o.conf.detect, o.conf.dims, o.conf.fragility)}% — verification recommended`, route: `/object/${o.id}`, objectId: o.id }),
  )
  return out
}
