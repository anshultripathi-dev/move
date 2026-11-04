import { DEST_HOME, SOURCE_HOME, type Home } from '../data/layouts'
import type { MoveObject, Placement, RoomId } from '../models/types'

const DST_REL_OVERRIDE: Record<string, { x?: number; z?: number }> = {
  'OBJ-031': { x: 4.67 },
}

export function roomAt(home: Home, x: number, z: number): RoomId | null {
  for (const r of Object.values(home.rooms)) if (x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1) return r.id
  return null
}

/** Where an object is planned to live at the destination (global destination metres). */
export function destPlacement(o: MoveObject, overrides: Record<string, Placement>): Placement {
  if (overrides[o.id]) return overrides[o.id]
  const so = SOURCE_HOME.rooms[o.room]
  const dr = DEST_HOME.rooms[o.destRoom]
  const ov = DST_REL_OVERRIDE[o.id]
  const relX = ov?.x ?? o.src.x - so.x0
  const relZ = ov?.z ?? o.src.z - so.z0
  // items travelling to a different room keep their relative offset
  return { x: dr.x0 + relX, z: dr.z0 + relZ, rot: o.src.rot, elev: o.src.elev }
}

export interface Footprint { cx: number; cz: number; hw: number; hd: number }
/** Axis-aligned footprint (metres) taking 90° rotations into account. */
export function footprint(o: MoveObject, p: Placement): Footprint {
  const swap = Math.abs(Math.sin(p.rot)) > 0.7
  const w = (swap ? o.dims[1] : o.dims[0]) / 200
  const d = (swap ? o.dims[0] : o.dims[1]) / 200
  return { cx: p.x, cz: p.z, hw: w, hd: d }
}

export function fitReport(o: MoveObject, p: Placement, home: Home, others: { obj: MoveObject; p: Placement }[]) {
  const room = roomAt(home, p.x, p.z)
  const f = footprint(o, p)
  let wall = Infinity
  let obstacle = Infinity
  let inside = !!room
  if (room) {
    const r = home.rooms[room]
    wall = Math.min(f.cx - f.hw - r.x0, r.x1 - (f.cx + f.hw), f.cz - f.hd - r.z0, r.z1 - (f.cz + f.hd))
    if (wall < 0) inside = false
  }
  let overlap = false
  for (const q of others) {
    if (q.obj.id === o.id || q.p.elev > 0.2 || q.obj.kind === 'rug' || q.obj.kind === 'frames') continue
    if (o.kind === 'rug') continue
    const g = footprint(q.obj, q.p)
    const dx = Math.abs(f.cx - g.cx) - (f.hw + g.hw)
    const dz = Math.abs(f.cz - g.cz) - (f.hd + g.hd)
    const gap = Math.max(dx, dz)
    if (gap < 0) overlap = true
    else obstacle = Math.min(obstacle, gap)
  }
  const clearance = Math.min(wall, obstacle)
  const ok = inside && !overlap
  return { room, inside, overlap, wall, obstacle, clearance: Number.isFinite(clearance) ? clearance : 0, ok }
}
