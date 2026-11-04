import type { MoveBox, MoveEvent, MoveObject, DamageRecord } from '../models/types'
import { ROOM_LABEL, ROOM_ORDER } from '../models/types'
import { boxName } from './format'

export interface SearchHit {
  id: string
  group: 'Objects' | 'Boxes' | 'Rooms' | 'Events' | 'Damage' | 'Locations'
  title: string
  detail: string
  meta?: string[]
  route: string
}

interface Src { objects: MoveObject[]; boxes: MoveBox[]; events: MoveEvent[]; damage: DamageRecord | null }

export function searchAll(q: string, s: Src): SearchHit[] {
  const query = q.trim().toLowerCase()
  if (!query) return []
  const toks = query.split(/\s+/)
  const match = (text: string) => toks.every((t) => text.toLowerCase().includes(t))
  const hits: SearchHit[] = []
  s.objects.forEach((o) => {
    const text = `${o.name} ${o.id} ${o.category} ${ROOM_LABEL[o.room]} ${o.boxId ?? ''} ${o.kind}`
    if (match(text)) {
      hits.push({
        id: o.id, group: 'Objects', title: o.name, detail: `Object ID: ${o.id}`,
        meta: [`Box: ${o.boxId ? boxName(o.boxId).replace('BOX ', '') : 'Unboxed'}`, `Room: ${ROOM_LABEL[o.room]}`, `Status: ${o.state.replace('_', ' ')}`],
        route: `/object/${o.id}`,
      })
    }
  })
  s.boxes.forEach((b) => {
    const contents = s.objects.filter((o) => o.boxId === b.id).map((o) => o.name).join(' ')
    if (match(`${b.id} box ${b.num} ${b.label} ${b.tag} ${contents} ${ROOM_LABEL[b.room]}`)) {
      hits.push({ id: b.id, group: 'Boxes', title: boxName(b.id), detail: `${b.label} · ${ROOM_LABEL[b.room]}`, meta: [b.state.replace('_', ' '), `${s.objects.filter((o) => o.boxId === b.id).length} items`], route: `/box/${b.id}` })
    }
  })
  ROOM_ORDER.forEach((r) => {
    if (match(`${ROOM_LABEL[r]} room ${r}`)) hits.push({ id: r, group: 'Rooms', title: ROOM_LABEL[r], detail: `${s.objects.filter((o) => o.room === r).length} objects`, route: '/twin' })
  })
  s.events.slice().reverse().forEach((e) => {
    if (hits.filter((h) => h.group === 'Events').length < 4 && match(e.text)) hits.push({ id: e.id, group: 'Events', title: e.text, detail: new Date(e.ts).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }), route: e.boxId ? `/box/${e.boxId}` : e.objectId ? `/object/${e.objectId}` : '/timeline' })
  })
  if (s.damage && match(`damage scratch wardrobe ${s.damage.type} ${s.damage.location} dent`)) {
    hits.push({ id: s.damage.id, group: 'Damage', title: `${s.damage.type} · Wardrobe`, detail: `${s.damage.severity} severity · ${s.damage.location}`, route: '/damage' })
  }
  if (match('location where missing misplaced')) {
    s.objects.filter((o) => o.missing === 'suspected').forEach((o) => hits.push({ id: `l-${o.id}`, group: 'Locations', title: `${o.name} — last seen ${o.lastSeen?.boxId?.replace('BOX-', 'Box #') ?? '?'}`, detail: 'Missing item', route: '/reconciliation/missing' }))
  }
  return hits.slice(0, 40)
}
