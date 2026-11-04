import type { MoveObject, ObjState, BoxState } from '../models/types'

export const fmtTime = (iso: string) => {
  const d = new Date(iso)
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
}
export const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
export const dimsText = (d: [number, number, number]) => `${d[0]} × ${d[1]} × ${d[2]} cm`
export const vol = (o: MoveObject) => (o.dims[0] * o.dims[1] * o.dims[2]) / 1e6
export const boxNum = (id: string) => `#${id.replace('BOX-', '')}`
export const boxName = (id: string) => `BOX ${boxNum(id)}`
export const minConf = (o: MoveObject) => Math.min(o.conf.detect, o.conf.dims, o.conf.fragility)
export const needsVerify = (o: MoveObject) => !o.confirmed && minConf(o) < 75
export const stateLabel = (s: ObjState | BoxState) => s.replace('_', ' ')
export const cn = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')
export const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100))

export const STATE_TONE: Record<string, string> = {
  SCANNED: 'text-slate-300 bg-slate-500/15 border-slate-500/30',
  CREATED: 'text-slate-300 bg-slate-500/15 border-slate-500/30',
  VERIFIED: 'text-sky-300 bg-sky-500/15 border-sky-500/30',
  PACKED: 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30',
  LOADED: 'text-violet-300 bg-violet-500/15 border-violet-500/30',
  IN_TRANSIT: 'text-amber-300 bg-amber-500/15 border-amber-500/30',
  ARRIVED: 'text-teal-300 bg-teal-500/15 border-teal-500/30',
  PLACED: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
  UNPACKED: 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30',
}
export const STATE_HEX: Record<string, string> = {
  SCANNED: '#94a3b8', CREATED: '#94a3b8', VERIFIED: '#38bdf8', PACKED: '#818cf8', LOADED: '#a78bfa',
  IN_TRANSIT: '#fbbf24', ARRIVED: '#2dd4bf', PLACED: '#34d399', UNPACKED: '#34d399',
}

import type { MoveBox as _MB, MoveObject as _MO } from '../models/types'
export const boxContents = (b: _MB, objects: _MO[]) => objects.filter((o) => o.boxId === b.id)
export const boxStats = (b: _MB, objects: _MO[]) => {
  const items = boxContents(b, objects)
  const fr = items.some((o) => o.fragility === 'High') ? 'High' : items.some((o) => o.fragility === 'Medium') ? 'Medium' : 'Low'
  return { items, weight: items.reduce((a, o) => a + o.weight, 0), volume: (b.dims[0] * b.dims[1] * b.dims[2]) / 1e6, fragility: fr as 'Low' | 'Medium' | 'High' }
}
