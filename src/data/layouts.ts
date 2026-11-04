import type { RoomId } from '../models/types'

export interface Opening { type: 'door' | 'window' | 'arch'; at: number; width: number; label?: string }
export interface Wall { a: [number, number]; b: [number, number]; openings: Opening[] }
export interface RoomRect { id: RoomId; x0: number; z0: number; x1: number; z1: number }
export interface Fixture {
  room: RoomId
  rel: [number, number] // centre relative to room origin (m)
  size: [number, number, number] // w d h metres
  color: string
  name: string
  rot?: number
}
export interface Home {
  id: 'source' | 'destination'
  name: string
  address: string
  rooms: Record<RoomId, RoomRect>
  walls: Wall[]
  fixtures: Fixture[]
  width: number
  depth: number
}

const fixtures: Fixture[] = [
  { room: 'kitchen', rel: [2, 0.3], size: [3.6, 0.6, 0.9], color: '#2a3342', name: 'Counter' },
  { room: 'kitchen', rel: [2, 2.8], size: [1.4, 0.8, 0.75], color: '#3a2f27', name: 'Dining table' },
  { room: 'bedroom', rel: [1.3, 3.2], size: [0.4, 0.4, 0.5], color: '#3a2f27', name: 'Nightstand' },
]

export const SOURCE_HOME: Home = {
  id: 'source',
  name: 'Current Home',
  address: '14 Linden Court, Apt 3B',
  width: 9,
  depth: 8,
  rooms: {
    living: { id: 'living', x0: 0, z0: 0, x1: 5, z1: 4.5 },
    kitchen: { id: 'kitchen', x0: 5, z0: 0, x1: 9, z1: 4.5 },
    study: { id: 'study', x0: 0, z0: 4.5, x1: 3.8, z1: 8 },
    bedroom: { id: 'bedroom', x0: 3.8, z0: 4.5, x1: 9, z1: 8 },
  },
  walls: [
    { a: [0, 0], b: [9, 0], openings: [{ type: 'door', at: 2.5, width: 0.9, label: 'Entry door' }, { type: 'window', at: 7, width: 1.6 }] },
    { a: [0, 8], b: [9, 8], openings: [{ type: 'window', at: 1.9, width: 1.4 }, { type: 'window', at: 6.4, width: 1.8 }] },
    { a: [0, 0], b: [0, 8], openings: [{ type: 'window', at: 2.2, width: 1.8 }, { type: 'window', at: 6.2, width: 1.2 }] },
    { a: [9, 0], b: [9, 8], openings: [{ type: 'window', at: 2.2, width: 1.4 }] },
    { a: [5, 0], b: [5, 4.5], openings: [{ type: 'arch', at: 2.6, width: 1.3, label: 'Kitchen opening' }] },
    { a: [0, 4.5], b: [9, 4.5], openings: [{ type: 'door', at: 1.8, width: 0.8, label: 'Study door' }, { type: 'door', at: 4.4, width: 0.85, label: 'Bedroom door' }] },
    { a: [3.8, 4.5], b: [3.8, 8], openings: [{ type: 'door', at: 6.0, width: 0.8, label: 'Study–Bedroom door' }] },
  ],
  fixtures,
}

export const DEST_HOME: Home = {
  id: 'destination',
  name: 'New Home',
  address: '88 Harbor Street, Unit 12',
  width: 8.8,
  depth: 7.8,
  rooms: {
    living: { id: 'living', x0: 0, z0: 0, x1: 4.9, z1: 4.3 },
    kitchen: { id: 'kitchen', x0: 4.9, z0: 0, x1: 8.8, z1: 4.3 },
    study: { id: 'study', x0: 0, z0: 4.3, x1: 3.8, z1: 7.8 },
    bedroom: { id: 'bedroom', x0: 3.8, z0: 4.3, x1: 8.8, z1: 7.8 },
  },
  walls: [
    { a: [0, 0], b: [8.8, 0], openings: [{ type: 'door', at: 1.0, width: 0.82, label: 'Entry door' }, { type: 'window', at: 6.8, width: 1.6 }] },
    { a: [0, 7.8], b: [8.8, 7.8], openings: [{ type: 'window', at: 1.9, width: 1.4 }, { type: 'window', at: 6.2, width: 1.8 }] },
    { a: [0, 0], b: [0, 7.8], openings: [{ type: 'window', at: 2.4, width: 1.8 }, { type: 'window', at: 6.0, width: 1.2 }] },
    { a: [8.8, 0], b: [8.8, 7.8], openings: [{ type: 'window', at: 2.2, width: 1.4 }] },
    { a: [4.9, 0], b: [4.9, 4.3], openings: [{ type: 'arch', at: 2.6, width: 0.9, label: 'Kitchen opening' }] },
    { a: [0, 4.3], b: [8.8, 4.3], openings: [{ type: 'door', at: 1.7, width: 0.72, label: 'Study door' }, { type: 'door', at: 4.5, width: 0.76, label: 'Bedroom door' }] },
    { a: [3.8, 4.3], b: [3.8, 7.8], openings: [{ type: 'door', at: 6.0, width: 0.72, label: 'Study–Bedroom door' }] },
  ],
  fixtures,
}

/** Doorways at the destination, in cm, used by the clearance checker. */
export const DEST_DOORWAYS = [
  { id: 'entry', label: 'Entry door', width: 82, height: 205, to: 'living' as RoomId },
  { id: 'study', label: 'Study door', width: 72, height: 203, to: 'study' as RoomId },
  { id: 'bedroom', label: 'Bedroom door', width: 76, height: 203, to: 'bedroom' as RoomId },
  { id: 'kitchen', label: 'Kitchen opening', width: 90, height: 210, to: 'kitchen' as RoomId },
]

export function roomOrigin(home: Home, room: RoomId): [number, number] {
  const r = home.rooms[room]
  return [r.x0, r.z0]
}

export const roomCenter = (home: Home, room: RoomId): [number, number] => {
  const r = home.rooms[room]
  return [(r.x0 + r.x1) / 2, (r.z0 + r.z1) / 2]
}

export const roomArea = (home: Home, room: RoomId) => {
  const r = home.rooms[room]
  return (r.x1 - r.x0) * (r.z1 - r.z0)
}
