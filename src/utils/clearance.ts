import type { MoveObject } from '../models/types'

export interface Orientation {
  id: string
  label: string
  /** horizontal cross-section the object presents to the doorway (cm) */
  horiz: number
  /** vertical cross-section (cm) */
  vert: number
  detached: number
  rotation: string
}
export interface ClearanceResult {
  doorWidth: number
  doorHeight: number
  direct: Orientation & { margin: number; ok: boolean }
  options: (Orientation & { margin: number; ok: boolean })[]
  best: (Orientation & { margin: number; ok: boolean }) | null
}

const SAFETY = 2 // cm kept free for hands / frame

/** Evaluates how an object (w × d × h cm) can travel through a doorway. */
export function analyzeClearance(o: Pick<MoveObject, 'dims' | 'detachCm' | 'detachNote'>, doorWidth: number, doorHeight = 205): ClearanceResult {
  const [w, d, h] = o.dims
  const detach = o.detachCm ?? 0
  const small = Math.min(w, d) // the object travels along its longest horizontal axis
  const mk = (id: string, label: string, horiz: number, vert: number, detached: number, rotation: string) => {
    const margin = doorWidth - horiz
    return { id, label, horiz, vert, detached, rotation, margin, ok: margin >= SAFETY && vert <= doorHeight - SAFETY }
  }
  const upright = mk('upright', 'Carried upright (as placed)', small, h, 0, 'None')
  const side = mk('side', 'Rotate 90° · on its side', h, small, 0, 'Rotate 90°')
  const sideDetached = detach > 0 ? mk('side-detached', `Rotate 90° · ${o.detachNote ?? 'detach parts'}`, h - detach, small, detach, `Rotate 90° + detach ${detach} cm`) : null
  const options = [upright, side, ...(sideDetached ? [sideDetached] : [])]
  const ok = options.filter((x) => x.ok)
  const sorted = ok.sort((a, b) => a.detached - b.detached || b.margin - a.margin)
  return { doorWidth, doorHeight, direct: upright, options, best: sorted[0] ?? null }
}
