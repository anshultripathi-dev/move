export type ObjState =
  | 'SCANNED' | 'VERIFIED' | 'PACKED' | 'LOADED' | 'IN_TRANSIT' | 'ARRIVED' | 'PLACED' | 'UNPACKED'
export type BoxState = 'CREATED' | 'PACKED' | 'LOADED' | 'IN_TRANSIT' | 'ARRIVED' | 'UNPACKED'

export const OBJ_STATES: ObjState[] = ['SCANNED', 'VERIFIED', 'PACKED', 'LOADED', 'IN_TRANSIT', 'ARRIVED', 'PLACED', 'UNPACKED']
export const BOX_STATES: BoxState[] = ['CREATED', 'PACKED', 'LOADED', 'IN_TRANSIT', 'ARRIVED', 'UNPACKED']

export type RoomId = 'living' | 'kitchen' | 'study' | 'bedroom'
export type Fragility = 'Low' | 'Medium' | 'High'
export type Priority = 'Essential' | 'Important' | 'Standard'
export type Condition = 'Excellent' | 'Good' | 'Fair' | 'Damaged'

export type Kind =
  | 'sofa' | 'desk' | 'chair' | 'tv' | 'floorlamp' | 'tablelamp' | 'monitor' | 'shelf' | 'bed'
  | 'wardrobe' | 'appliance' | 'rug' | 'plant' | 'vase' | 'frames' | 'small' | 'bag' | 'books' | 'pan' | 'cable'

export type Category =
  | 'Furniture' | 'Seating' | 'Storage' | 'Electronics' | 'Kitchen' | 'Appliances' | 'Lighting'
  | 'Decor' | 'Bedding' | 'Clothing' | 'Books & Docs' | 'Personal'

export interface Placement { x: number; z: number; rot: number; elev: number }

export interface MoveObject {
  id: string // OBJ-001
  name: string
  kind: Kind
  category: Category
  room: RoomId
  destRoom: RoomId
  dims: [number, number, number] // w d h in cm
  weight: number // kg
  fragility: Fragility
  priority: Priority
  state: ObjState
  boxId: string | null
  condition: Condition
  conf: { detect: number; dims: number; fragility: number }
  color: string
  src: Placement // current home (global metres)
  isFurniture?: boolean
  packFactor?: number // shipping volume factor after disassembly / flat-pack
  detachCm?: number // removable height (feet / headboard) for clearance
  detachNote?: string
  confirmed?: boolean
  missing?: 'suspected' | 'reported' | 'found' | null
  misplacedIn?: RoomId | null
  misplacedResolved?: 'moved' | 'ignored' | 'updated' | null
  lastSeen?: { boxId: string | null; state: ObjState; room: RoomId }
  notes?: string
  source?: 'photo-model'
}

export interface MoveBox {
  id: string // BOX-007
  num: number
  label: string
  room: RoomId
  destRoom: RoomId
  state: BoxState
  priority: Priority
  dims: [number, number, number]
  scanned: boolean
  color: string
  tag: string
}

export type EventKind =
  | 'scan' | 'verify' | 'pack' | 'box' | 'load' | 'transit' | 'arrive' | 'place' | 'unpack'
  | 'missing' | 'found' | 'damage' | 'misplaced' | 'assembly' | 'system' | 'doc' | 'edit'

export interface MoveEvent {
  id: string
  ts: string // ISO
  kind: EventKind
  text: string
  objectId?: string
  boxId?: string
  phase: number
  actor: string
}

export interface Notice {
  id: string
  ts: string
  title: string
  body: string
  tone: 'info' | 'ok' | 'warn' | 'bad'
  route?: string
  read: boolean
}

export interface DocTask { id: string; label: string; done: boolean; weight: number }
export interface TimelineTask { id: string; stage: string; label: string; done: boolean }

export interface DamageRecord {
  id: string
  objectId: string
  type: string
  severity: 'Low' | 'Medium' | 'High'
  location: string
  confidence: number
  ts: string
  status: 'open' | 'acknowledged' | 'reported'
  reportId?: string
}

export interface AssemblyPlan {
  objectId: string
  parts: { label: string; qty: number }[]
  steps: { title: string; detail: string; tool: string }[]
  progress: number // completed steps
}

export interface MoveMeta {
  id: string // MOVE #2841
  name: string
  from: string
  to: string
  date: string
  type: string
  size: string
}

export const PHASES = ['PACKING', 'LOADING', 'IN_TRANSIT', 'ARRIVED', 'COMPLETE'] as const
export type Phase = (typeof PHASES)[number]

export const ROOM_LABEL: Record<RoomId, string> = {
  living: 'Living Room', kitchen: 'Kitchen', study: 'Study', bedroom: 'Bedroom',
}
export const ROOM_ORDER: RoomId[] = ['living', 'kitchen', 'study', 'bedroom']
export const ROOM_COLOR: Record<RoomId, string> = {
  living: '#6d8bff', kitchen: '#fbbf24', study: '#2dd4bf', bedroom: '#c084fc',
}
