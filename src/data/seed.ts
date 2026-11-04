import type {
  AssemblyPlan, Category, DamageRecord, DocTask, Fragility, Kind, MoveBox, MoveEvent, MoveMeta,
  MoveObject, ObjState, Priority, RoomId, TimelineTask,
} from '../models/types'

type Spec = {
  n: number; name: string; kind: Kind; cat: Category; room: RoomId
  dims: [number, number, number]; kg: number; frag: Fragility; pri: Priority
  box: number | null; st: ObjState; at: [number, number]; rot?: number; elev?: number
  conf?: [number, number, number]; color: string
  furn?: boolean; pf?: number; dest?: RoomId; detach?: [number, string]
}

const PI = Math.PI
const S: Spec[] = [
  // Living room
  { n: 1, name: 'Sofa', kind: 'sofa', cat: 'Furniture', room: 'living', dims: [210, 90, 85], kg: 62, frag: 'Medium', pri: 'Important', box: null, st: 'PACKED', at: [2.4, 3.75], rot: PI, conf: [96, 91, 83], color: '#52628f', furn: true, pf: 0.85, detach: [8, 'Remove feet (4 screws)'] },
  { n: 2, name: 'Television 55"', kind: 'tv', cat: 'Electronics', room: 'living', dims: [123, 25, 75], kg: 14, frag: 'High', pri: 'Important', box: 12, st: 'PACKED', at: [2.4, 0.45], conf: [99, 94, 97], color: '#0b0d12' },
  { n: 3, name: 'Floor Lamp', kind: 'floorlamp', cat: 'Lighting', room: 'living', dims: [35, 35, 150], kg: 4, frag: 'Medium', pri: 'Standard', box: null, st: 'SCANNED', at: [4.5, 3.9], conf: [88, 79, 61], color: '#d9c7a0', pf: 0.6 },
  { n: 4, name: 'Soundbar', kind: 'small', cat: 'Electronics', room: 'living', dims: [90, 10, 8], kg: 3, frag: 'Medium', pri: 'Standard', box: 4, st: 'PACKED', at: [2.4, 0.85], conf: [93, 90, 78], color: '#1b1f29' },
  { n: 5, name: 'Game Console', kind: 'small', cat: 'Electronics', room: 'living', dims: [30, 25, 8], kg: 3.2, frag: 'Medium', pri: 'Standard', box: 4, st: 'PACKED', at: [3.55, 0.55], conf: [95, 88, 80], color: '#e5e7eb' },
  { n: 6, name: 'Wi-Fi Router', kind: 'small', cat: 'Electronics', room: 'living', dims: [25, 18, 5], kg: 0.8, frag: 'Low', pri: 'Essential', box: 4, st: 'PACKED', at: [0.6, 0.4], conf: [91, 85, 90], color: '#111827' },
  { n: 7, name: 'Ceramic Vase', kind: 'vase', cat: 'Decor', room: 'living', dims: [30, 30, 60], kg: 4, frag: 'High', pri: 'Standard', box: 10, st: 'PACKED', at: [4.5, 0.5], conf: [92, 84, 96], color: '#e8dccb' },
  { n: 8, name: 'Framed Art Set', kind: 'frames', cat: 'Decor', room: 'living', dims: [60, 6, 80], kg: 5.5, frag: 'High', pri: 'Standard', box: 10, st: 'PACKED', at: [1.1, 0.2], conf: [90, 87, 93], color: '#c8a46b' },
  { n: 9, name: 'Area Rug', kind: 'rug', cat: 'Decor', room: 'living', dims: [200, 140, 2], kg: 9, frag: 'Low', pri: 'Standard', box: null, st: 'VERIFIED', at: [2.4, 2.45], conf: [97, 92, 88], color: '#6b4f6e', pf: 0.03 },
  { n: 10, name: 'Indoor Plant', kind: 'plant', cat: 'Decor', room: 'living', dims: [40, 40, 110], kg: 6, frag: 'Medium', pri: 'Standard', box: null, st: 'VERIFIED', at: [0.5, 3.9], conf: [94, 82, 84], color: '#3f8f5b' },
  // Kitchen
  { n: 11, name: 'Cookware Set', kind: 'pan', cat: 'Kitchen', room: 'kitchen', dims: [40, 30, 25], kg: 7.5, frag: 'Low', pri: 'Important', box: 1, st: 'PACKED', at: [6.0, 0.3], elev: 0.9, conf: [93, 86, 91], color: '#9aa3b2' },
  { n: 12, name: 'Cast Iron Pan', kind: 'pan', cat: 'Kitchen', room: 'kitchen', dims: [38, 28, 8], kg: 3.2, frag: 'Low', pri: 'Standard', box: 1, st: 'PACKED', at: [6.7, 0.3], elev: 0.9, conf: [95, 89, 94], color: '#1f2329' },
  { n: 13, name: 'Dinner Plate Set', kind: 'small', cat: 'Kitchen', room: 'kitchen', dims: [28, 28, 22], kg: 6, frag: 'High', pri: 'Important', box: 2, st: 'PACKED', at: [6.6, 2.8], elev: 0.75, conf: [90, 82, 95], color: '#f3f4f6' },
  { n: 14, name: 'Glassware Set', kind: 'small', cat: 'Kitchen', room: 'kitchen', dims: [30, 20, 26], kg: 4.5, frag: 'High', pri: 'Important', box: 2, st: 'PACKED', at: [7.4, 2.8], elev: 0.75, conf: [88, 80, 97], color: '#a5d8ee' },
  { n: 15, name: 'Kettle', kind: 'small', cat: 'Appliances', room: 'kitchen', dims: [22, 18, 24], kg: 1.4, frag: 'Medium', pri: 'Standard', box: 3, st: 'PACKED', at: [7.3, 0.3], elev: 0.9, conf: [95, 90, 82], color: '#cbd5e1' },
  { n: 16, name: 'Toaster', kind: 'small', cat: 'Appliances', room: 'kitchen', dims: [30, 18, 20], kg: 2.2, frag: 'Low', pri: 'Standard', box: 3, st: 'PACKED', at: [7.9, 0.3], elev: 0.9, conf: [94, 88, 85], color: '#b45309' },
  { n: 17, name: 'Coffee Maker', kind: 'small', cat: 'Appliances', room: 'kitchen', dims: [28, 22, 36], kg: 3.8, frag: 'Medium', pri: 'Important', box: 3, st: 'PACKED', at: [8.45, 0.3], elev: 0.9, conf: [92, 87, 80], color: '#1f2937' },
  { n: 18, name: 'Microwave', kind: 'appliance', cat: 'Appliances', room: 'kitchen', dims: [45, 35, 28], kg: 12, frag: 'Medium', pri: 'Standard', box: null, st: 'VERIFIED', at: [5.55, 0.32], elev: 0.9, conf: [97, 91, 86], color: '#334155' },
  // Study
  { n: 19, name: 'Study Desk', kind: 'desk', cat: 'Furniture', room: 'study', dims: [120, 60, 75], kg: 28, frag: 'Medium', pri: 'Important', box: null, st: 'PACKED', at: [1.5, 7.65], rot: PI, conf: [94, 90, 76], color: '#8b6b4a', furn: true, pf: 0.45, detach: [0, 'Legs fold flat'] },
  { n: 20, name: 'Office Chair', kind: 'chair', cat: 'Seating', room: 'study', dims: [60, 60, 100], kg: 11, frag: 'Low', pri: 'Standard', box: null, st: 'VERIFIED', at: [1.5, 6.85], conf: [97, 85, 90], color: '#262b36', pf: 0.7 },
  { n: 21, name: 'Monitor 27"', kind: 'monitor', cat: 'Electronics', room: 'study', dims: [61, 20, 45], kg: 6.5, frag: 'High', pri: 'Essential', box: 13, st: 'PACKED', at: [1.5, 7.62], rot: PI, elev: 0.75, conf: [98, 93, 96], color: '#0b0d12' },
  { n: 22, name: 'Desk Lamp', kind: 'tablelamp', cat: 'Lighting', room: 'study', dims: [22, 22, 40], kg: 1.3, frag: 'Medium', pri: 'Important', box: 7, st: 'PACKED', at: [0.98, 7.6], elev: 0.75, conf: [89, 81, 77], color: '#e2e8f0' },
  { n: 23, name: 'HDMI Cable', kind: 'cable', cat: 'Electronics', room: 'study', dims: [30, 5, 3], kg: 0.2, frag: 'Low', pri: 'Essential', box: 7, st: 'PACKED', at: [1.98, 7.55], elev: 0.75, conf: [82, 78, 88], color: '#0f172a' },
  { n: 24, name: 'USB Hub', kind: 'small', cat: 'Electronics', room: 'study', dims: [12, 5, 3], kg: 0.15, frag: 'Low', pri: 'Essential', box: 7, st: 'PACKED', at: [1.86, 7.4], elev: 0.75, conf: [86, 79, 85], color: '#475569' },
  { n: 25, name: 'Laptop Charger', kind: 'small', cat: 'Electronics', room: 'study', dims: [14, 7, 3], kg: 0.4, frag: 'Low', pri: 'Essential', box: 7, st: 'PACKED', at: [2.04, 7.38], elev: 0.75, conf: [90, 78, 88], color: '#e5e7eb' },
  { n: 26, name: 'Bookshelf', kind: 'shelf', cat: 'Storage', room: 'study', dims: [80, 30, 180], kg: 22, frag: 'Low', pri: 'Important', box: null, st: 'VERIFIED', at: [3.62, 6.2], rot: -PI / 2, conf: [95, 88, 90], color: '#6b5a48', pf: 0.4 },
  { n: 27, name: 'Book Collection', kind: 'books', cat: 'Books & Docs', room: 'study', dims: [40, 25, 30], kg: 14, frag: 'Low', pri: 'Standard', box: 8, st: 'SCANNED', at: [3.6, 6.2], rot: -PI / 2, elev: 0.9, conf: [91, 76, 84], color: '#a3563c' },
  { n: 28, name: 'Documents Folder', kind: 'small', cat: 'Books & Docs', room: 'study', dims: [32, 25, 8], kg: 1.2, frag: 'Low', pri: 'Essential', box: 9, st: 'PACKED', at: [0.98, 7.3], elev: 0.75, conf: [85, 80, 92], color: '#e2d6b5' },
  { n: 29, name: 'Stationery Set', kind: 'small', cat: 'Books & Docs', room: 'study', dims: [25, 18, 10], kg: 1, frag: 'Low', pri: 'Standard', box: 9, st: 'PACKED', at: [1.95, 7.2], elev: 0.75, conf: [87, 78, 90], color: '#38bdf8' },
  // Bedroom
  { n: 30, name: 'Bed Frame & Mattress', kind: 'bed', cat: 'Furniture', room: 'bedroom', dims: [160, 205, 95], kg: 54, frag: 'Medium', pri: 'Important', box: null, st: 'PACKED', at: [6.4, 6.85], rot: PI, conf: [95, 86, 80], color: '#7c6f8f', furn: true, pf: 0.2, detach: [30, 'Detach headboard (6 bolts)'] },
  { n: 31, name: 'Wardrobe', kind: 'wardrobe', cat: 'Furniture', room: 'bedroom', dims: [100, 55, 200], kg: 48, frag: 'Medium', pri: 'Important', box: null, st: 'PACKED', at: [8.68, 6.0], rot: -PI / 2, conf: [96, 92, 78], color: '#a68a6d', furn: true, pf: 0.5, detach: [0, 'Doors lift off'] },
  { n: 32, name: 'Bedding Set', kind: 'bag', cat: 'Bedding', room: 'bedroom', dims: [60, 40, 25], kg: 4.5, frag: 'Low', pri: 'Standard', box: 5, st: 'PACKED', at: [6.4, 6.55], rot: PI, elev: 0.5, conf: [90, 78, 92], color: '#cbd5e1' },
  { n: 33, name: 'Pillow Set', kind: 'bag', cat: 'Bedding', room: 'bedroom', dims: [70, 45, 20], kg: 2.5, frag: 'Low', pri: 'Standard', box: 5, st: 'PACKED', at: [6.4, 7.5], rot: PI, elev: 0.5, conf: [92, 80, 93], color: '#f1f5f9' },
  { n: 34, name: 'Winter Clothing', kind: 'bag', cat: 'Clothing', room: 'bedroom', dims: [50, 40, 40], kg: 8, frag: 'Low', pri: 'Standard', box: 6, st: 'PACKED', at: [8.0, 5.1], conf: [86, 78, 94], color: '#475569' },
  { n: 35, name: 'Everyday Clothing', kind: 'bag', cat: 'Clothing', room: 'bedroom', dims: [50, 40, 40], kg: 9, frag: 'Low', pri: 'Important', box: 6, st: 'PACKED', at: [8.0, 5.75], conf: [87, 79, 94], color: '#64748b' },
  { n: 36, name: 'Bedside Lamp', kind: 'tablelamp', cat: 'Lighting', room: 'bedroom', dims: [20, 20, 35], kg: 1, frag: 'Medium', pri: 'Standard', box: 11, st: 'PACKED', at: [5.05, 7.7], elev: 0.5, conf: [91, 83, 79], color: '#f5e6c8' },
  { n: 37, name: 'Toiletry Kit', kind: 'small', cat: 'Personal', room: 'bedroom', dims: [28, 15, 15], kg: 1.8, frag: 'Medium', pri: 'Essential', box: 11, st: 'VERIFIED', at: [5.2, 7.5], elev: 0.5, conf: [84, 68, 82], color: '#0f766e' },
]

const pad = (n: number, w = 3) => String(n).padStart(w, '0')
export const objId = (n: number) => `OBJ-${pad(n)}`
export const boxId = (n: number) => `BOX-${pad(n)}`

export function seedObjects(): MoveObject[] {
  return S.map((s) => ({
    id: objId(s.n),
    name: s.name,
    kind: s.kind,
    category: s.cat,
    room: s.room,
    destRoom: s.dest ?? s.room,
    dims: s.dims,
    weight: s.kg,
    fragility: s.frag,
    priority: s.pri,
    state: s.st,
    boxId: s.box ? boxId(s.box) : null,
    condition: 'Good',
    conf: { detect: s.conf?.[0] ?? 92, dims: s.conf?.[1] ?? 85, fragility: s.conf?.[2] ?? 85 },
    color: s.color,
    src: { x: s.at[0], z: s.at[1], rot: s.rot ?? 0, elev: s.elev ?? 0 },
    isFurniture: s.furn,
    packFactor: s.pf ?? 1,
    detachCm: s.detach?.[0],
    detachNote: s.detach?.[1],
    confirmed: false,
    missing: null,
    misplacedIn: null,
    misplacedResolved: null,
    lastSeen: undefined,
  }))
}

const BOXES: { n: number; label: string; room: RoomId; dims: [number, number, number]; pri: Priority; color: string; tag: string }[] = [
  { n: 1, label: 'Cookware', room: 'kitchen', dims: [50, 40, 30], pri: 'Important', color: '#c9a36b', tag: 'Kitchen' },
  { n: 2, label: 'Dinnerware', room: 'kitchen', dims: [45, 35, 35], pri: 'Important', color: '#c9a36b', tag: 'Fragile' },
  { n: 3, label: 'Small Appliances', room: 'kitchen', dims: [50, 40, 40], pri: 'Standard', color: '#c9a36b', tag: 'Kitchen' },
  { n: 4, label: 'Media & Network', room: 'living', dims: [50, 40, 30], pri: 'Essential', color: '#b99363', tag: 'Electronics' },
  { n: 5, label: 'Linens & Bedding', room: 'bedroom', dims: [60, 45, 40], pri: 'Standard', color: '#bfa070', tag: 'Bedroom' },
  { n: 6, label: 'Clothing', room: 'bedroom', dims: [60, 45, 45], pri: 'Important', color: '#bfa070', tag: 'Bedroom' },
  { n: 7, label: 'Electronics', room: 'study', dims: [40, 30, 25], pri: 'Essential', color: '#b99363', tag: 'Electronics' },
  { n: 8, label: 'Books', room: 'study', dims: [45, 35, 30], pri: 'Standard', color: '#c9a36b', tag: 'Study' },
  { n: 9, label: 'Documents & Stationery', room: 'study', dims: [40, 30, 25], pri: 'Essential', color: '#b99363', tag: 'Study' },
  { n: 10, label: 'Fragile Decor', room: 'living', dims: [65, 25, 90], pri: 'Standard', color: '#d4b07a', tag: 'Fragile' },
  { n: 11, label: 'Night Essentials', room: 'bedroom', dims: [40, 30, 30], pri: 'Essential', color: '#bfa070', tag: 'Essentials' },
  { n: 12, label: 'TV Carton', room: 'living', dims: [135, 35, 85], pri: 'Important', color: '#d4b07a', tag: 'Fragile' },
  { n: 13, label: 'Monitor Carton', room: 'study', dims: [70, 25, 55], pri: 'Essential', color: '#d4b07a', tag: 'Fragile' },
]

export function seedBoxes(): MoveBox[] {
  const packedLater = new Set([8, 11])
  return BOXES.map((b) => ({
    id: boxId(b.n),
    num: b.n,
    label: b.label,
    room: b.room,
    destRoom: b.room,
    state: packedLater.has(b.n) ? 'CREATED' : 'PACKED',
    priority: b.pri,
    dims: b.dims,
    scanned: !packedLater.has(b.n),
    color: b.color,
    tag: b.tag,
  }))
}

export const MOVE_META: MoveMeta = {
  id: 'MOVE #2841',
  name: 'Linden Court → Harbor Street',
  from: '14 Linden Court, Apt 3B',
  to: '88 Harbor Street, Unit 12',
  date: '2026-10-14',
  type: 'Apartment → Apartment',
  size: '2 bedroom · 74 m²',
}

export const DOC_TASKS: DocTask[] = [
  { id: 'd1', label: 'Mover contract signed', done: true, weight: 20 },
  { id: 'd2', label: 'Inventory report shared with movers', done: true, weight: 20 },
  { id: 'd3', label: 'Transit insurance certificate', done: false, weight: 20 },
  { id: 'd4', label: 'Utilities transferred to new address', done: false, weight: 20 },
  { id: 'd5', label: 'Building elevator reservation (destination)', done: false, weight: 20 },
]

export const TIMELINE_TASKS: TimelineTask[] = [
  { id: 't1', stage: '14 Days Before', label: 'Scan every room with MOVE', done: true },
  { id: 't2', stage: '14 Days Before', label: 'Review & confirm AI inventory', done: true },
  { id: 't3', stage: '14 Days Before', label: 'Scan destination & verify doorways', done: true },
  { id: 't4', stage: '7 Days Before', label: 'Choose vehicle & book movers', done: true },
  { id: 't5', stage: '7 Days Before', label: 'Generate Smart Packing boxes', done: true },
  { id: 't6', stage: '7 Days Before', label: 'Print & attach QR labels', done: true },
  { id: 't7', stage: '3 Days Before', label: 'Pack non-essential rooms', done: true },
  { id: 't8', stage: '3 Days Before', label: 'Disassemble furniture (desk, bed, wardrobe)', done: false },
  { id: 't9', stage: '3 Days Before', label: 'Pack essentials box (Night Essentials)', done: false },
  { id: 't10', stage: 'Moving Day', label: 'Scan every box onto the truck', done: false },
  { id: 't11', stage: 'Moving Day', label: 'Confirm loading order with movers', done: false },
  { id: 't12', stage: 'Moving Day', label: 'Final walkthrough of empty home', done: false },
  { id: 't13', stage: 'Arrival', label: 'Scan boxes off the truck', done: false },
  { id: 't14', stage: 'Arrival', label: 'Run reconciliation vs. expected inventory', done: false },
  { id: 't15', stage: 'Arrival', label: 'Inspect furniture for damage', done: false },
  { id: 't16', stage: 'Post Move', label: 'Reassemble furniture', done: false },
  { id: 't17', stage: 'Post Move', label: 'Resolve exceptions & file damage report', done: false },
  { id: 't18', stage: 'Post Move', label: 'Archive final digital twin', done: false },
]

export const SEED_DAMAGE: Omit<DamageRecord, 'status'> = {
  id: 'DMG-0001',
  objectId: objId(31),
  type: 'Scratch',
  severity: 'Medium',
  location: 'Right side panel',
  confidence: 92,
  ts: '2026-10-14T15:42:00',
}

export const SEED_ASSEMBLY: AssemblyPlan[] = [
  {
    objectId: objId(19),
    parts: [{ label: 'Screws', qty: 6 }, { label: 'Bolts', qty: 4 }, { label: 'Legs', qty: 2 }, { label: 'Tabletop', qty: 1 }],
    steps: [
      { title: 'Attach left leg', detail: 'Align the left leg bracket with the pre-drilled holes and fasten with 3 screws.', tool: 'Phillips #2' },
      { title: 'Insert bolts', detail: 'Thread 4 bolts through the cross-brace into the leg frame. Hand-tight only.', tool: 'Hex key 5 mm' },
      { title: 'Attach right leg', detail: 'Mirror step 1 on the right side using the remaining 3 screws.', tool: 'Phillips #2' },
      { title: 'Attach tabletop', detail: 'Lower the tabletop onto the frame with two people, then tighten all bolts fully.', tool: 'Hex key 5 mm' },
    ],
    progress: 0,
  },
  {
    objectId: objId(30),
    parts: [{ label: 'Side rails', qty: 2 }, { label: 'Headboard', qty: 1 }, { label: 'Slats', qty: 14 }, { label: 'Bolts', qty: 6 }],
    steps: [
      { title: 'Lay out side rails', detail: 'Place both rails parallel with the connector plates facing inward.', tool: 'None' },
      { title: 'Bolt on headboard', detail: 'Fasten the headboard to the rails using 6 bolts at the labelled points.', tool: 'Hex key 6 mm' },
      { title: 'Seat the slats', detail: 'Click 14 slats into the rail grooves, evenly spaced.', tool: 'Rubber mallet' },
      { title: 'Place mattress', detail: 'Lift the mattress onto the slats and align with the headboard.', tool: 'Two people' },
    ],
    progress: 0,
  },
  {
    objectId: objId(31),
    parts: [{ label: 'Side panels', qty: 2 }, { label: 'Doors', qty: 2 }, { label: 'Shelves', qty: 4 }, { label: 'Cam locks', qty: 12 }],
    steps: [
      { title: 'Stand the carcass', detail: 'Join side panels and top with cam locks on the floor, then tilt upright against the wall.', tool: 'Screwdriver' },
      { title: 'Slide in shelves', detail: 'Insert 4 shelves on the marked pins.', tool: 'None' },
      { title: 'Hang the doors', detail: 'Lift each door onto its hinge pins and adjust the alignment.', tool: 'Phillips #2' },
    ],
    progress: 0,
  },
  {
    objectId: objId(26),
    parts: [{ label: 'Uprights', qty: 2 }, { label: 'Shelves', qty: 5 }, { label: 'Dowels', qty: 10 }],
    steps: [
      { title: 'Stand the uprights', detail: 'Place the two uprights parallel on the floor.', tool: 'None' },
      { title: 'Insert shelves', detail: 'Press the dowels into each shelf and seat them between uprights.', tool: 'Rubber mallet' },
      { title: 'Secure to wall', detail: 'Fit the anti-tip bracket to the wall.', tool: 'Drill 6 mm' },
    ],
    progress: 0,
  },
]

const iso = (d: string, mins: number) => new Date(new Date(d).getTime() + mins * 60000).toISOString()

/** Pre-move history (phase 0) generated from the seed so every card has a trail. */
export function seedEvents(objects: MoveObject[], boxes: MoveBox[]): MoveEvent[] {
  const ev: MoveEvent[] = []
  let k = 0
  const push = (e: Omit<MoveEvent, 'id' | 'phase'>) => ev.push({ ...e, id: `EV-${pad(++k, 4)}`, phase: 0 })
  objects.forEach((o, i) => {
    push({ ts: iso('2026-10-02T10:00:00', i * 2), kind: 'scan', objectId: o.id, actor: 'AI Scan', text: `${o.name} detected in ${o.room === 'living' ? 'Living Room' : o.room[0].toUpperCase() + o.room.slice(1)} (${o.conf.detect}% confidence)` })
  })
  objects.forEach((o, i) => {
    if (o.state !== 'SCANNED') push({ ts: iso('2026-10-03T18:00:00', i), kind: 'verify', objectId: o.id, actor: 'You', text: `${o.name} verified — dimensions & fragility confirmed` })
  })
  boxes.forEach((b, i) => {
    push({ ts: iso('2026-10-06T09:00:00', i * 3), kind: 'box', boxId: b.id, actor: 'Smart Packing', text: `Box ${b.id.replace('BOX-', '#')} created — ${b.label} · QR label generated` })
  })
  objects.forEach((o, i) => {
    if (o.state === 'PACKED') {
      push({ ts: iso('2026-10-10T16:00:00', i * 4), kind: 'pack', objectId: o.id, boxId: o.boxId ?? undefined, actor: 'You', text: o.boxId ? `${o.name} packed into ${o.boxId.replace('BOX-', 'Box #')}` : `${o.name} wrapped & prepared for transport` })
    }
  })
  return ev.sort((a, b) => a.ts.localeCompare(b.ts))
}

export const ROOM_BLURB: Record<RoomId, string> = {
  living: 'Open living space with entry and media wall.',
  kitchen: 'Galley counter and dining zone.',
  study: 'Compact study with desk and shelving.',
  bedroom: 'Primary bedroom with built-in nightstand.',
}
