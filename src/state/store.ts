import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  DOC_TASKS, MOVE_META, SEED_ASSEMBLY, SEED_DAMAGE, TIMELINE_TASKS, boxId, objId, seedBoxes, seedEvents, seedObjects,
} from '../data/seed'
import type {
  AssemblyPlan, BoxState, DamageRecord, DocTask, EventKind, MoveBox, MoveEvent, MoveMeta, MoveObject,
  Notice, ObjState, Placement, TimelineTask,
} from '../models/types'
import { BOX_STATES, OBJ_STATES, ROOM_LABEL } from '../models/types'
import { SOURCE_HOME } from '../data/layouts'
import { computeStats } from './selectors'

const MOVE_DAY = new Date('2026-10-14T08:00:00').getTime()
const iso = (ms: number) => new Date(ms).toISOString()
const LATE_BOXES = [boxId(8), boxId(11)]
const BED = objId(30)
const LAMP = objId(22)
const DOCS = objId(28)
const WARDROBE = objId(31)

const boxLabel = (id: string) => id.replace('BOX-', 'Box #')
const seedStates = () => Object.fromEntries(seedObjects().map((o) => [o.id, o.state])) as Record<string, ObjState>
const seedBoxStates = () => Object.fromEntries(seedBoxes().map((b) => [b.id, b])) as Record<string, MoveBox>

/** Derive object/box states for a lifecycle phase (0 PACKING … 4 COMPLETE). */
function computePhase(objects: MoveObject[], boxes: MoveBox[], p: number) {
  const base = seedStates()
  const baseBoxes = seedBoxStates()
  const nb = boxes.map((b) => {
    let state: BoxState = baseBoxes[b.id]?.state ?? 'PACKED'
    let scanned = baseBoxes[b.id]?.scanned ?? true
    if (p === 1) { state = LATE_BOXES.includes(b.id) ? 'PACKED' : 'LOADED'; scanned = !LATE_BOXES.includes(b.id) ? true : b.id !== boxId(8) }
    if (p === 2) { state = 'IN_TRANSIT'; scanned = true }
    if (p === 3) { state = 'ARRIVED'; scanned = true }
    if (p >= 4) { state = 'UNPACKED'; scanned = true }
    return { ...b, state, scanned }
  })
  const boxMap = Object.fromEntries(nb.map((b) => [b.id, b]))
  const no = objects.map((o) => {
    const x: MoveObject = { ...o, missing: null, misplacedIn: null, misplacedResolved: null, lastSeen: undefined }
    if (x.id === WARDROBE) x.condition = 'Good'
    if (p === 0) { x.state = base[o.id] ?? o.state; return x }
    if (p === 1) {
      if (o.boxId) x.state = boxMap[o.boxId]?.state === 'LOADED' ? 'LOADED' : 'PACKED'
      else x.state = o.id === BED ? 'PACKED' : 'LOADED'
      return x
    }
    if (p === 2) { x.state = 'IN_TRANSIT'; return x }
    if (p === 3) {
      x.state = 'ARRIVED'
      if (o.id === LAMP) { x.state = 'IN_TRANSIT'; x.missing = 'suspected'; x.lastSeen = { boxId: boxId(7), state: 'LOADED', room: 'study' } }
      if (o.id === DOCS) { x.misplacedIn = 'bedroom' }
      if (o.id === WARDROBE) x.condition = 'Fair'
      return x
    }
    x.state = o.boxId ? 'UNPACKED' : 'PLACED'
    if (o.id === LAMP) { x.missing = 'found'; x.lastSeen = { boxId: boxId(7), state: 'LOADED', room: 'study' } }
    if (o.id === DOCS) { x.misplacedIn = 'bedroom'; x.misplacedResolved = 'moved' }
    if (o.id === WARDROBE) x.condition = 'Fair'
    return x
  })
  return { objects: no, boxes: nb }
}

let evSeq = 1000
function phaseEvents(objects: MoveObject[], boxes: MoveBox[], p: number): MoveEvent[] {
  const out: MoveEvent[] = []
  let t = MOVE_DAY
  const push = (kind: EventKind, text: string, phase: number, extra: Partial<MoveEvent> = {}, gap = 4) => {
    t += gap * 60000
    out.push({ id: `EV-${++evSeq}`, ts: iso(t), kind, text, phase, actor: extra.actor ?? 'MOVE', ...extra })
  }
  if (p >= 1) {
    push('system', 'Movers checked in — Move Day started', 1, { actor: 'Mover crew' }, 0)
    boxes.forEach((b) => {
      if (LATE_BOXES.includes(b.id)) return
      push('load', `${boxLabel(b.id)} loaded onto truck · QR scanned`, 1, { boxId: b.id, actor: 'Mover crew' })
    })
    objects.filter((o) => !o.boxId && o.id !== BED).forEach((o) => push('load', `${o.name} loaded & strapped`, 1, { objectId: o.id, actor: 'Mover crew' }))
    objects.filter((o) => o.boxId && !LATE_BOXES.includes(o.boxId)).forEach((o) => out.push({ id: `EV-${++evSeq}`, ts: iso(t), kind: 'load', text: `${o.name} loaded in ${boxLabel(o.boxId!)}`, objectId: o.id, boxId: o.boxId!, phase: 1, actor: 'Mover crew' }))
  }
  if (p >= 2) {
    t += 60 * 60000
    push('load', `${boxLabel(boxId(8))} scanned & loaded`, 2, { boxId: boxId(8), actor: 'Mover crew' })
    push('load', `${boxLabel(boxId(11))} scanned & loaded (essentials)`, 2, { boxId: boxId(11), actor: 'Mover crew' })
    push('load', 'Bed Frame & Mattress loaded last', 2, { objectId: BED, actor: 'Mover crew' })
    push('transit', 'Truck departed Linden Court · ETA 11:40', 2, { actor: 'Fleet', }, 10)
    boxes.forEach((b) => push('transit', `${boxLabel(b.id)} in transit`, 2, { boxId: b.id, actor: 'Fleet' }, 0))
  }
  if (p >= 3) {
    t += 70 * 60000
    push('arrive', 'Truck arrived at Harbor Street', 3, { actor: 'Fleet' }, 0)
    boxes.forEach((b) => push('arrive', `${boxLabel(b.id)} arrived · QR scanned`, 3, { boxId: b.id, actor: 'Arrival scan' }, 1))
    push('missing', 'Desk Lamp not detected at destination — last seen in Box #007', 3, { objectId: LAMP, boxId: boxId(7), actor: 'Reconciliation AI' }, 6)
    push('misplaced', 'Documents Folder detected in Bedroom — expected Study', 3, { objectId: DOCS, actor: 'Reconciliation AI' }, 1)
    push('damage', 'New scratch detected on Wardrobe (right panel) · 92% confidence', 3, { objectId: WARDROBE, actor: 'Damage AI' }, 2)
  }
  if (p >= 4) {
    t += 90 * 60000
    objects.filter((o) => o.boxId).forEach((o) => push('unpack', `${o.name} unpacked`, 4, { objectId: o.id, boxId: o.boxId! }, 0.5))
    objects.filter((o) => !o.boxId).forEach((o) => push('place', `${o.name} placed in ${ROOM_LABEL[o.destRoom]}`, 4, { objectId: o.id }, 0.5))
    push('found', 'Desk Lamp found — wedged inside Box #007 packing paper', 4, { objectId: LAMP, boxId: boxId(7), actor: 'You' }, 3)
    push('system', 'Move reconciliation 100% — all items accounted for', 4, { actor: 'MOVE' }, 1)
  }
  return out
}

function phaseNotices(p: number): Notice[] {
  const n: Notice[] = []
  const add = (id: string, ts: string, title: string, body: string, tone: Notice['tone'], route?: string) =>
    n.push({ id, ts, title, body, tone, route, read: false })
  add('n-ready', '2026-10-12T19:20:00', 'Move readiness increased to 72%', 'Packing reached 84% — 3 actions remaining.', 'info', '/readiness')
  add('n-qr', '2026-10-12T17:02:00', 'QR labels generated', '13 of 13 boxes are now trackable.', 'ok', '/boxes')
  add('n-low', '2026-10-11T12:30:00', 'Verification recommended', 'Floor Lamp fragility confidence is 61%.', 'warn', '/inventory')
  if (p >= 1) {
    add('n-load7', '2026-10-14T08:36:00', 'Box #007 loaded.', 'Electronics box scanned onto the truck.', 'ok', '/box/BOX-007')
    add('n-b8', '2026-10-14T09:02:00', 'Box #008 not scanned', 'Books box has no loading scan yet.', 'warn', '/exceptions')
  }
  if (p >= 2) add('n-transit', '2026-10-14T10:40:00', 'Truck departed', 'All 13 boxes and 4 furniture items are in transit. ETA 11:40.', 'info', '/tracking/live')
  if (p >= 3) {
    add('n-arr', '2026-10-14T12:55:00', 'All boxes have arrived.', '13 of 13 boxes scanned at destination.', 'ok', '/tracking/arrival')
    add('n-lamp', '2026-10-14T13:02:00', 'Desk lamp not detected at destination.', 'Last seen in Box #007. Open Reconciliation.', 'bad', '/reconciliation')
    add('n-dmg', '2026-10-14T13:08:00', 'New damage detected on wardrobe.', 'Scratch · Medium severity · 92% confidence.', 'warn', '/damage')
  }
  if (p >= 4) add('n-done', '2026-10-14T17:30:00', 'Move readiness increased to 100%', 'Every item is accounted for. Your final digital twin is ready.', 'ok', '/complete')
  return n
}

export interface MoveState {
  hasMove: boolean
  meta: MoveMeta
  phase: number
  objects: MoveObject[]
  boxes: MoveBox[]
  events: MoveEvent[]
  notices: Notice[]
  docs: DocTask[]
  tasks: TimelineTask[]
  damage: DamageRecord | null
  assembly: AssemblyPlan[]
  reconRun: boolean
  placements: Record<string, Placement>
  vehicle: number
  selectedObject: string | null

  loadDemo: () => void
  addDetected: (items: Omit<MoveObject, 'id' | 'src' | 'state' | 'boxId' | 'condition' | 'confirmed' | 'missing' | 'misplacedIn' | 'misplacedResolved' | 'destRoom' | 'packFactor'>[]) => string[]
  createMove: (m: Partial<MoveMeta>) => void
  setPhase: (p: number) => void
  selectObject: (id: string | null) => void
  updateObject: (id: string, patch: Partial<MoveObject>, note?: string) => void
  confirmObject: (id: string) => void
  toggleFragile: (id: string) => void
  packObject: (id: string) => void
  setObjectState: (id: string, s: ObjState) => void
  assignBox: (objectId: string, boxId: string | null) => void
  scanBox: (id: string) => void
  loadBox: (id: string) => void
  loadFurniture: (id: string) => void
  runReconciliation: () => void
  markFound: (id: string) => void
  reportMissing: (id: string) => void
  resolveMisplaced: (id: string, a: 'moved' | 'ignored' | 'updated') => void
  acknowledgeDamage: () => void
  generateReport: () => void
  setAssemblyProgress: (objectId: string, n: number) => void
  toggleDoc: (id: string) => void
  toggleTask: (id: string) => void
  setPlacement: (id: string, p: Placement) => void
  resetPlacements: () => void
  setVehicle: (v: number) => void
  readNotice: (id: string) => void
  readAll: () => void
  resolveAll: () => void
  log: (kind: EventKind, text: string, extra?: Partial<MoveEvent>) => void
}

function freshState() {
  const objects = seedObjects()
  const boxes = seedBoxes()
  return {
    meta: MOVE_META,
    phase: 0,
    objects,
    boxes,
    events: seedEvents(objects, boxes),
    notices: phaseNotices(0),
    docs: DOC_TASKS.map((d) => ({ ...d })),
    tasks: TIMELINE_TASKS.map((t) => ({ ...t })),
    damage: null as DamageRecord | null,
    assembly: SEED_ASSEMBLY.map((a) => ({ ...a, progress: 0 })),
    reconRun: false,
    placements: {} as Record<string, Placement>,
    vehicle: 8,
    selectedObject: null as string | null,
  }
}

let manualClock = 0
const nowIso = (phase: number) => {
  manualClock += 3
  const base = phase === 0 ? new Date('2026-10-12T20:00:00').getTime() : MOVE_DAY + 6 * 3600000
  return iso(base + manualClock * 60000)
}

export const useMove = create<MoveState>()(
  persist(
    (set, get) => {
      const log: MoveState['log'] = (kind, text, extra = {}) =>
        set((s) => ({ events: [...s.events, { id: `EV-${++evSeq}`, ts: nowIso(s.phase), kind, text, phase: s.phase, actor: 'You', ...extra }] }))

      const patchObj = (id: string, patch: Partial<MoveObject>) =>
        set((s) => ({ objects: s.objects.map((o) => (o.id === id ? { ...o, ...patch } : o)) }))

      const rederiveBoxes = () =>
        set((s) => {
          if (s.phase !== 0) return {}
          return {
            boxes: s.boxes.map((b) => {
              const items = s.objects.filter((o) => o.boxId === b.id)
              const allPacked = items.length > 0 && items.every((o) => OBJ_STATES.indexOf(o.state) >= OBJ_STATES.indexOf('PACKED'))
              return { ...b, state: (allPacked ? 'PACKED' : 'CREATED') as BoxState }
            }),
          }
        })

      return {
        hasMove: false,
        ...freshState(),

        loadDemo: () => set({ hasMove: true, ...freshState() }),
        addDetected: (list) => {
          const cur = get().objects
          let n = Math.max(...cur.map((o) => parseInt(o.id.replace('OBJ-', ''), 10))) + 1
          const added: MoveObject[] = list.map((d, i) => {
            const r = SOURCE_HOME.rooms[d.room]
            const inRoom = cur.filter((o) => o.room === d.room && o.source).length + i
            return {
              ...d,
              id: objId(n++),
              destRoom: d.room,
              state: 'SCANNED',
              boxId: null,
              condition: 'Good',
              confirmed: false,
              missing: null,
              misplacedIn: null,
              misplacedResolved: null,
              packFactor: 1,
              src: { x: Math.min(r.x1 - 0.5, r.x0 + 0.8 + (inRoom % 4) * 0.7), z: Math.min(r.z1 - 0.5, r.z0 + 1.2 + Math.floor(inRoom / 4) * 0.7), rot: 0, elev: 0 },
            }
          })
          set((s) => ({ objects: [...s.objects, ...added] }))
          added.forEach((o) => log('scan', `${o.name} detected from photo by on-device model (${o.conf.detect}% confidence)`, { objectId: o.id, actor: 'COCO-SSD' }))
          return added.map((o) => o.id)
        },
        createMove: (m) => set({ hasMove: true, ...freshState(), meta: { ...MOVE_META, ...m, id: 'MOVE #2841' } }),

        setPhase: (p) =>
          set((s) => {
            const r = computePhase(s.objects, s.boxes, p)
            const base = seedEvents(seedObjects(), seedBoxes())
            const prevRead = new Set(s.notices.filter((n) => n.read).map((n) => n.id))
            const notices = phaseNotices(p).map((n) => ({ ...n, read: prevRead.has(n.id) })).sort((a, b) => b.ts.localeCompare(a.ts))
            return {
              phase: p,
              ...r,
              events: [...base, ...phaseEvents(r.objects, r.boxes, p)],
              notices,
              reconRun: p >= 4,
              damage: p >= 3 ? { ...SEED_DAMAGE, status: p >= 4 ? 'reported' : 'open', reportId: p >= 4 ? 'RPT-2841-01' : undefined } as DamageRecord : null,
              assembly: s.assembly.map((a) => ({ ...a, progress: p >= 4 ? a.steps.length : 0 })),
              tasks: s.tasks.map((t, i) => ({ ...t, done: p >= 4 ? true : p >= 1 ? i < 9 || (p >= 3 && i < 14) || (p >= 2 && i < 12) || t.done : t.done && i < 7 })),
              docs: s.docs.map((d, i) => ({ ...d, done: p >= 1 ? true : i < 2 })),
            }
          }),

        selectObject: (id) => set({ selectedObject: id }),
        log,

        updateObject: (id, patch, note) => {
          patchObj(id, { ...patch, confirmed: true })
          log('edit', note ?? `${get().objects.find((o) => o.id === id)?.name} corrected manually`, { objectId: id })
        },
        confirmObject: (id) => {
          const o = get().objects.find((x) => x.id === id)
          if (!o) return
          patchObj(id, { confirmed: true, state: o.state === 'SCANNED' ? 'VERIFIED' : o.state, conf: { detect: Math.max(o.conf.detect, 97), dims: Math.max(o.conf.dims, 96), fragility: Math.max(o.conf.fragility, 96) } })
          log('verify', `${o.name} AI data confirmed by you`, { objectId: id })
        },
        toggleFragile: (id) => {
          const o = get().objects.find((x) => x.id === id)
          if (!o) return
          const f = o.fragility === 'High' ? 'Medium' : 'High'
          patchObj(id, { fragility: f, confirmed: true })
          log('edit', `${o.name} fragility set to ${f}`, { objectId: id })
        },
        packObject: (id) => {
          const o = get().objects.find((x) => x.id === id)
          if (!o || OBJ_STATES.indexOf(o.state) >= OBJ_STATES.indexOf('PACKED')) return
          patchObj(id, { state: 'PACKED' })
          log('pack', o.boxId ? `${o.name} packed into ${boxLabel(o.boxId)}` : `${o.name} wrapped & prepared`, { objectId: id, boxId: o.boxId ?? undefined })
          rederiveBoxes()
          const st = computeStats(get())
          set((s) => ({ notices: [{ id: `n-${Date.now()}`, ts: nowIso(0), title: `Move readiness increased to ${st.readiness}%`, body: `${o.name} packed.`, tone: 'info', route: '/readiness', read: false } as Notice, ...s.notices].slice(0, 30) }))
        },
        setObjectState: (id, st) => {
          patchObj(id, { state: st })
          log('edit', `${get().objects.find((o) => o.id === id)?.name} state set to ${st}`, { objectId: id })
          rederiveBoxes()
        },
        assignBox: (objectId, bId) => {
          const o = get().objects.find((x) => x.id === objectId)
          if (!o) return
          patchObj(objectId, { boxId: bId })
          log('box', bId ? `${o.name} assigned to ${boxLabel(bId)}` : `${o.name} removed from its box`, { objectId, boxId: bId ?? undefined })
          rederiveBoxes()
        },
        scanBox: (id) => {
          set((s) => ({ boxes: s.boxes.map((b) => (b.id === id ? { ...b, scanned: true } : b)) }))
          log('system', `${boxLabel(id)} QR scanned`, { boxId: id })
        },
        loadBox: (id) => {
          set((s) => ({
            boxes: s.boxes.map((b) => (b.id === id ? { ...b, state: 'LOADED', scanned: true } : b)),
            objects: s.objects.map((o) => (o.boxId === id ? { ...o, state: 'LOADED' } : o)),
            notices: [{ id: `n-${Date.now()}-${id}`, ts: nowIso(s.phase), title: `${boxLabel(id)} loaded.`, body: 'QR scan confirmed at the truck ramp.', tone: 'ok' as const, route: `/box/${id}`, read: false }, ...s.notices].slice(0, 30),
          }))
          log('load', `${boxLabel(id)} loaded onto truck · QR scanned`, { boxId: id, actor: 'Mover crew' })
        },
        loadFurniture: (id) => {
          patchObj(id, { state: 'LOADED' })
          log('load', `${get().objects.find((o) => o.id === id)?.name} loaded & strapped`, { objectId: id, actor: 'Mover crew' })
        },

        runReconciliation: () => {
          set({ reconRun: true })
          log('system', 'Reconciliation run — expected 37 · detected 36', { actor: 'Reconciliation AI' })
        },
        markFound: (id) => {
          const o = get().objects.find((x) => x.id === id)
          if (!o) return
          patchObj(id, { missing: 'found', state: 'ARRIVED' })
          log('found', `${o.name} marked as found`, { objectId: id })
        },
        reportMissing: (id) => {
          const o = get().objects.find((x) => x.id === id)
          if (!o) return
          patchObj(id, { missing: 'reported' })
          log('missing', `${o.name} reported missing — claim opened`, { objectId: id })
        },
        resolveMisplaced: (id, a) => {
          const o = get().objects.find((x) => x.id === id)
          if (!o) return
          patchObj(id, { misplacedResolved: a, destRoom: a === 'updated' && o.misplacedIn ? o.misplacedIn : o.destRoom })
          log('misplaced', `${o.name}: ${a === 'moved' ? 'moved to correct room' : a === 'ignored' ? 'misplacement ignored' : 'destination updated'}`, { objectId: id })
        },
        acknowledgeDamage: () => {
          set((s) => (s.damage ? { damage: { ...s.damage, status: 'acknowledged' } } : {}))
          log('damage', 'Wardrobe scratch acknowledged', { objectId: WARDROBE })
        },
        generateReport: () => {
          set((s) => (s.damage ? { damage: { ...s.damage, status: 'reported', reportId: 'RPT-2841-01' } } : {}))
          log('damage', 'Damage report RPT-2841-01 generated', { objectId: WARDROBE })
        },
        setAssemblyProgress: (objectId, n) => {
          set((s) => ({ assembly: s.assembly.map((a) => (a.objectId === objectId ? { ...a, progress: Math.max(0, Math.min(a.steps.length, n)) } : a)) }))
          const a = get().assembly.find((x) => x.objectId === objectId)
          if (a && a.progress === a.steps.length) log('assembly', `${get().objects.find((o) => o.id === objectId)?.name} reassembly complete`, { objectId })
        },
        toggleDoc: (id) => {
          set((s) => ({ docs: s.docs.map((d) => (d.id === id ? { ...d, done: !d.done } : d)) }))
          const st = computeStats(get())
          set((s) => ({ notices: [{ id: `n-${Date.now()}`, ts: nowIso(s.phase), title: `Move readiness increased to ${st.readiness}%`, body: 'Documentation updated.', tone: 'info' as const, route: '/readiness', read: false }, ...s.notices].slice(0, 30) }))
        },
        toggleTask: (id) => set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, done: !t.done } : t)) })),
        setPlacement: (id, p) => set((s) => ({ placements: { ...s.placements, [id]: p } })),
        resetPlacements: () => set({ placements: {} }),
        setVehicle: (v) => set({ vehicle: v }),
        readNotice: (id) => set((s) => ({ notices: s.notices.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        readAll: () => set((s) => ({ notices: s.notices.map((n) => ({ ...n, read: true })) })),

        resolveAll: () => {
          get().setPhase(4)
        },
      }
    },
    {
      name: 'move-app-v2',
      version: 3,
      partialize: (s) => ({
        hasMove: s.hasMove, meta: s.meta, phase: s.phase, objects: s.objects, boxes: s.boxes, events: s.events,
        notices: s.notices, docs: s.docs, tasks: s.tasks, damage: s.damage, assembly: s.assembly, reconRun: s.reconRun,
        placements: s.placements, vehicle: s.vehicle,
      }),
    },
  ),
)

export { BOX_STATES }
