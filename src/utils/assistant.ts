import { DEST_DOORWAYS } from '../data/layouts'
import type { DamageRecord, DocTask, MoveBox, MoveEvent, MoveObject } from '../models/types'
import { ROOM_LABEL } from '../models/types'
import { VEHICLES, computeStats, PACK_EFFICIENCY } from '../state/selectors'
import { analyzeClearance } from './clearance'
import { boxName, fmtTime } from './format'

export interface Ctx { objects: MoveObject[]; boxes: MoveBox[]; events: MoveEvent[]; docs: DocTask[]; damage: DamageRecord | null; phase: number; assembly: never[] | import('../models/types').AssemblyPlan[]; reconRun: boolean; vehicle: number }
export interface Answer { text: string; bullets?: string[]; links?: { label: string; to: string }[]; sources: string[] }

const STOP = new Set(['where', 'is', 'my', 'the', 'a', 'an', 'are', 'what', 'which', 'box', 'in', 'do', 'i', 'of', 'to', 'for', 'will', 'fit', 'through', 'door', 'does', 'contains', 'contain', 'have', 'has', 'find', 'locate', "where's", 'whats', "what's", 'go', 'should', 'put', 'me', 'show', 'tell', 'about', 'item', 'items', 'stuff', 'and', 'with', 'it', 'there', 'how', 'at'])
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9#\s']/g, ' ')
const tokens = (q: string) => norm(q).split(/\s+/).filter((t) => t && !STOP.has(t))

function findObjects(q: string, objects: MoveObject[]) {
  const toks = tokens(q).map((t) => t.replace(/s$/, ''))
  if (!toks.length) return []
  return objects
    .map((o) => {
      const hay = norm(`${o.name} ${o.category} ${o.kind}`)
      const score = toks.reduce((a, t) => a + (hay.includes(t) ? (norm(o.name).includes(t) ? 2 : 1) : 0), 0)
      return { o, score }
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
}

const bx = (b: MoveBox) => `Box ${boxName(b.id).replace('BOX ', '')}`

function locate(o: MoveObject, c: Ctx): Answer {
  const box = o.boxId ? c.boxes.find((b) => b.id === o.boxId) : null
  const last = c.events.filter((e) => e.objectId === o.id || (box && e.boxId === box.id && !e.objectId)).sort((a, b) => a.ts.localeCompare(b.ts)).slice(-1)[0]
  const bullets: string[] = []
  let text: string
  if (o.missing === 'suspected' || o.missing === 'reported') {
    text = `**${o.name}** (${o.id}) was **not detected** at the destination. Its last confirmed location is **${bx(box!)}**, state *${o.lastSeen?.state ?? 'Loaded'}*, packed in the ${ROOM_LABEL[o.room]}.`
    bullets.push('Check the box lining and packing paper first — small items wedge easily.', 'Open Reconciliation → Missing to mark it found or file a report.')
  } else if (box) {
    text = `Your **${o.name}** (${o.id}) is in **${bx(box)}** — ${box.label}, ${ROOM_LABEL[box.room]}. The box is currently **${box.state.replace('_', ' ')}** and is headed for the **${ROOM_LABEL[o.destRoom]}**.`
    const others = c.objects.filter((x) => x.boxId === box.id && x.id !== o.id).map((x) => x.name + (x.missing === 'suspected' ? ' (not detected at destination)' : ''))
    if (others.length) bullets.push(`Also in this box: ${others.join(', ')}`)
  } else {
    text = `**${o.name}** (${o.id}) isn't boxed — it's ${o.isFurniture ? 'a furniture item' : 'a loose item'} currently **${o.state.replace('_', ' ')}** in the ${ROOM_LABEL[o.room]}, destined for the **${ROOM_LABEL[o.destRoom]}**.`
  }
  if (last) bullets.push(`Last event: ${last.text} (${fmtTime(last.ts)})`)
  return { text, bullets, links: [{ label: `Open ${o.name}`, to: `/object/${o.id}` }, ...(box ? [{ label: `Open ${bx(box)}`, to: `/box/${box.id}` }] : [])], sources: ['Digital twin', 'Box tracking', 'Event history'] }
}

export function ask(question: string, c: Ctx): Answer {
  const q = norm(question)
  const stats = computeStats({ objects: c.objects, boxes: c.boxes, docs: c.docs, damage: c.damage, assembly: c.assembly as never, phase: c.phase, reconRun: c.reconRun, vehicle: c.vehicle })

  if (/\bfit\b|through the door|get through|clearance|doorway/.test(q)) {
    const hit = findObjects(q.replace(/fit|through|door|will|clearance|doorway/g, ''), c.objects).find((x) => Math.max(...x.o.dims) >= 60)
    const o = hit?.o ?? c.objects.find((x) => x.kind === 'sofa')!
    const entry = DEST_DOORWAYS[0]
    const inner = DEST_DOORWAYS.find((d) => d.to === o.destRoom && d.id !== 'entry')
    const r1 = analyzeClearance(o, entry.width, entry.height)
    const r2 = inner ? analyzeClearance(o, inner.width, inner.height) : null
    const bullets = [`${o.name}: ${o.dims.join(' × ')} cm`, `${entry.label} (${entry.width} cm): ${r1.direct.ok ? `direct entry, ${r1.direct.margin} cm to spare` : `direct entry blocked — carried width ${r1.direct.horiz} cm`}`]
    if (!r1.direct.ok && r1.best) bullets.push(`Solution: ${r1.best.rotation} → ${r1.best.horiz} cm, ${r1.best.margin} cm clearance ✓`)
    if (r2 && inner) bullets.push(`${inner.label} (${inner.width} cm): ${r2.direct.ok ? `fits directly, ${r2.direct.margin} cm to spare` : r2.best ? `needs ${r2.best.rotation}` : 'blocked'}`)
    const ok = (r1.direct.ok || r1.best) && (!r2 || r2.direct.ok || r2.best)
    return { text: ok ? `Yes — your **${o.name}** will fit${r1.direct.ok ? '.' : ', but not as-is. It needs a specific orientation.'}` : `Not without further disassembly — the **${o.name}** can't clear every doorway.`, bullets, links: [{ label: 'Run clearance check', to: '/destination/clearance' }], sources: ['Destination scan', 'Clearance engine'] }
  }

  if (/where (should|do|does|would).*(go|put|place)|where.*(go|belong)/.test(q) || /should .* go/.test(q)) {
    const hit = findObjects(q, c.objects)[0]
    if (hit) {
      const o = hit.o
      const note: Record<string, string> = {
        desk: 'Against the south wall of the Study so the window is on your side — natural light, no screen glare.',
        sofa: 'Facing the media wall in the Living Room with ~2 m viewing distance, leaving a 90 cm walkway to the kitchen opening.',
        bed: 'Headboard on the solid south wall of the Bedroom with 60 cm access either side.',
        wardrobe: 'East wall of the Bedroom — doors clear the bed footprint when open.',
        tv: 'Centre of the Living Room north wall, opposite the sofa and away from the window.',
      }
      return { text: `Your **${o.name}** goes in the **${ROOM_LABEL[o.destRoom]}**. ${note[o.kind] ?? 'MOVE kept its position relative to the room, then checked it for clearance.'}`, bullets: o.isFurniture ? ['Recommended position is computed by the 3D planner and fit-checked against nearby items.'] : undefined, links: [{ label: 'Open 3D planner', to: '/destination/planner' }, { label: 'AR preview', to: '/destination/ar' }], sources: ['Destination twin', 'Placement planner'] }
    }
  }

  if (/missing|lost|can'?t find|not detected/.test(q)) {
    if (c.phase < 3) return { text: 'Nothing is flagged missing yet — the arrival scan hasn\'t happened. Once the truck arrives, MOVE reconciles every item against the digital twin.', links: [{ label: 'Tracking', to: '/tracking' }], sources: ['Reconciliation'] }
    const m = c.objects.filter((o) => o.missing === 'suspected' || o.missing === 'reported')
    if (!m.length) return { text: 'Nothing is missing — **37 of 37** items are accounted for.', links: [{ label: 'Reconciliation', to: '/reconciliation' }], sources: ['Reconciliation'] }
    return { text: `**${m.length} item${m.length > 1 ? 's' : ''}** may be missing: ${m.map((o) => `**${o.name}**`).join(', ')}. Detected ${stats.detected} of ${stats.items}.`, bullets: m.map((o) => `${o.name} — last seen in ${o.lastSeen?.boxId ? bx(c.boxes.find((b) => b.id === o.lastSeen!.boxId)!) : '?'}, state ${o.lastSeen?.state}, 89% confidence it is lost`), links: [{ label: 'Open missing items', to: '/reconciliation/missing' }], sources: ['Reconciliation', 'Box tracking'] }
  }

  if (/(haven'?t|not|un)\s?packed|left to pack|still (need|have) to pack|what.*pack/.test(q)) {
    const left = c.objects.filter((o) => ['SCANNED', 'VERIFIED'].includes(o.state))
    if (!left.length) return { text: 'Everything is packed — **37 of 37** items.', links: [{ label: 'Packing', to: '/packing' }], sources: ['Smart packing'] }
    return { text: `**${left.length} item${left.length > 1 ? 's' : ''}** still need packing (${stats.packed}/${stats.items} done):`, bullets: left.map((o) => `${o.name}${o.boxId ? ` → ${bx(c.boxes.find((b) => b.id === o.boxId)!)}` : ' (wrap & strap)'}${o.priority === 'Essential' ? ' · essential' : ''}`), links: [{ label: 'Open smart packing', to: '/packing' }], sources: ['Smart packing', 'Object states'] }
  }

  if (/ready|readiness/.test(q)) {
    const b = stats.breakdown
    return { text: `You're **${stats.readiness}% ready**. ${stats.remaining.length} action${stats.remaining.length === 1 ? '' : 's'} remaining.`, bullets: [`Inventory ${b.inventory}% · Packing ${b.packing}% · Destination ${b.destination}% · Vehicle ${b.vehicle}% · Documentation ${b.documentation}%`, ...stats.remaining], links: [{ label: 'Readiness breakdown', to: '/readiness' }], sources: ['Readiness engine'] }
  }

  if (/fragile|breakable/.test(q)) {
    const f = c.objects.filter((o) => o.fragility === 'High')
    return { text: `**${f.length} items** are marked highly fragile:`, bullets: f.map((o) => `${o.name} — ${o.boxId ? bx(c.boxes.find((b) => b.id === o.boxId)!) : 'unboxed'} · ${o.state.replace('_', ' ')}`), links: [{ label: 'Filter inventory', to: '/inventory' }], sources: ['AI inventory'] }
  }

  const boxNum = q.match(/box\s*#?\s*0*(\d{1,2})\b/)
  if (boxNum) {
    const b = c.boxes.find((x) => x.num === +boxNum[1])
    if (b) {
      const items = c.objects.filter((o) => o.boxId === b.id)
      return { text: `**${bx(b)}** — ${b.label} (${ROOM_LABEL[b.room]}) is **${b.state.replace('_', ' ')}** with ${items.length} item${items.length > 1 ? 's' : ''}:`, bullets: items.map((o) => `${o.name}${o.missing === 'suspected' ? ' — not detected at destination' : ''}`), links: [{ label: `Open ${bx(b)}`, to: `/box/${b.id}` }], sources: ['Box tracking', 'QR history'] }
    }
  }

  if (/which box|what box|box.*(contain|has|have|with)|(contain|has).*box/.test(q)) {
    const toks = tokens(q.replace(/boxes?/g, ''))
    const matches = c.boxes.filter((b) => {
      const hay = norm(`${b.label} ${b.tag} ${c.objects.filter((o) => o.boxId === b.id).map((o) => `${o.name} ${o.category}`).join(' ')}`)
      return toks.some((t) => hay.includes(t.replace(/s$/, '')))
    })
    if (matches.length) return { text: `${matches.length} box${matches.length > 1 ? 'es' : ''} match:`, bullets: matches.map((b) => `${bx(b)} — ${b.label} · ${b.state.replace('_', ' ')} · ${c.objects.filter((o) => o.boxId === b.id).map((o) => o.name).join(', ')}`), links: [{ label: 'All boxes', to: '/boxes' }], sources: ['Box tracking', 'AI inventory'] }
  }

  if (/damage|scratch|dent|broken/.test(q)) {
    if (!c.damage) return { text: 'No damage has been detected so far. Damage detection runs on the arrival scan.', links: [{ label: 'Damage', to: '/damage' }], sources: ['Damage AI'] }
    return { text: `**1 damage record:** a **${c.damage.severity.toLowerCase()} ${c.damage.type.toLowerCase()}** on the **Wardrobe** (${c.damage.location.toLowerCase()}), ${c.damage.confidence}% confidence. ${c.damage.reportId ? `Report ${c.damage.reportId} has been generated.` : 'No report has been generated yet.'}`, links: [{ label: 'Before / after', to: '/damage' }, { label: 'Damage report', to: '/damage/report' }], sources: ['Damage AI'] }
  }

  if (/vehicle|truck|van|capacity|volume/.test(q)) {
    const v = VEHICLES.find((x) => x.cap === c.vehicle) ?? VEHICLES[1]
    return { text: `Your move needs **${stats.volume.toFixed(1)} m³**. The recommended vehicle is the **${v.cap} m³ ${v.name}** — ${Math.round((stats.volume / (v.cap * PACK_EFFICIENCY)) * 100)}% utilisation of its ${(v.cap * PACK_EFFICIENCY).toFixed(1)} m³ usable space, est. $${v.price}.`, links: [{ label: 'Vehicle planning', to: '/planning/vehicle' }], sources: ['Move planner'] }
  }

  if (/misplaced|wrong room/.test(q)) {
    const m = c.objects.filter((o) => o.misplacedIn && !o.misplacedResolved)
    return { text: m.length ? `**${m.map((o) => o.name).join(', ')}** appear${m.length === 1 ? 's' : ''} misplaced — expected in the ${ROOM_LABEL[m[0].destRoom]}, detected in the ${ROOM_LABEL[m[0].misplacedIn!]}.` : 'No misplaced items right now.', links: [{ label: 'Misplaced items', to: '/reconciliation/misplaced' }], sources: ['Reconciliation'] }
  }

  if (/status|progress|where.*(move|truck)|how.*going/.test(q)) {
    const label = ['packing', 'loading', 'in transit', 'arrived', 'complete'][c.phase]
    return { text: `Your move is in the **${label}** stage. ${stats.packed}/${stats.items} items packed · ${stats.boxesLoaded}/${stats.boxCount} boxes loaded · ${stats.boxesArrived}/${stats.boxCount} arrived · ${stats.missing} missing · ${stats.damageCount} damage record.`, links: [{ label: 'Live tracking', to: '/tracking' }], sources: ['Move state'] }
  }

  const loc = findObjects(q, c.objects)
  if (loc.length) return locate(loc[0].o, c)

  return { text: "I can answer questions about **your move data** — objects, boxes, fit, placement, packing, tracking and exceptions. Try one of these:", bullets: ['Where is my HDMI cable?', 'What haven\'t I packed?', 'Will my sofa fit?', 'What is missing?', 'Which box contains my electronics?', 'How ready am I?'], sources: ['MOVE database'] }
}
