import type { Category, Fragility, Kind, Priority } from '../../models/types'

export interface Prior { name: string; kind: Kind; category: Category; dims: [number, number, number]; kg: number; frag: Fragility; pri: Priority; color: string }

/** COCO class → MOVE object prior. A detector returns class + box + score only; size, weight and fragility are priors, so their confidence is deliberately low. */
export const COCO_MAP: Record<string, Prior> = {
  couch: { name: 'Sofa', kind: 'sofa', category: 'Furniture', dims: [200, 90, 85], kg: 55, frag: 'Medium', pri: 'Important', color: '#52628f' },
  chair: { name: 'Chair', kind: 'chair', category: 'Seating', dims: [50, 50, 90], kg: 6, frag: 'Low', pri: 'Standard', color: '#262b36' },
  bed: { name: 'Bed', kind: 'bed', category: 'Furniture', dims: [160, 200, 90], kg: 50, frag: 'Medium', pri: 'Important', color: '#7c6f8f' },
  'dining table': { name: 'Table', kind: 'desk', category: 'Furniture', dims: [140, 80, 75], kg: 30, frag: 'Medium', pri: 'Important', color: '#8b6b4a' },
  tv: { name: 'Television', kind: 'tv', category: 'Electronics', dims: [110, 25, 70], kg: 12, frag: 'High', pri: 'Important', color: '#0b0d12' },
  laptop: { name: 'Laptop', kind: 'small', category: 'Electronics', dims: [33, 24, 3], kg: 1.8, frag: 'High', pri: 'Essential', color: '#94a3b8' },
  keyboard: { name: 'Keyboard', kind: 'small', category: 'Electronics', dims: [45, 15, 3], kg: 0.8, frag: 'Medium', pri: 'Standard', color: '#1f2937' },
  mouse: { name: 'Mouse', kind: 'small', category: 'Electronics', dims: [12, 7, 4], kg: 0.1, frag: 'Low', pri: 'Standard', color: '#475569' },
  remote: { name: 'Remote Control', kind: 'small', category: 'Electronics', dims: [18, 5, 3], kg: 0.1, frag: 'Low', pri: 'Standard', color: '#111827' },
  'cell phone': { name: 'Phone', kind: 'small', category: 'Electronics', dims: [15, 7, 1], kg: 0.2, frag: 'High', pri: 'Essential', color: '#1f2937' },
  'potted plant': { name: 'Plant', kind: 'plant', category: 'Decor', dims: [40, 40, 90], kg: 5, frag: 'Medium', pri: 'Standard', color: '#3f8f5b' },
  vase: { name: 'Vase', kind: 'vase', category: 'Decor', dims: [20, 20, 40], kg: 2, frag: 'High', pri: 'Standard', color: '#e8dccb' },
  book: { name: 'Books', kind: 'books', category: 'Books & Docs', dims: [25, 18, 15], kg: 3, frag: 'Low', pri: 'Standard', color: '#a3563c' },
  clock: { name: 'Clock', kind: 'small', category: 'Decor', dims: [30, 5, 30], kg: 1, frag: 'High', pri: 'Standard', color: '#e2e8f0' },
  microwave: { name: 'Microwave', kind: 'appliance', category: 'Appliances', dims: [45, 35, 28], kg: 12, frag: 'Medium', pri: 'Standard', color: '#334155' },
  oven: { name: 'Oven', kind: 'appliance', category: 'Appliances', dims: [60, 60, 60], kg: 30, frag: 'Medium', pri: 'Standard', color: '#334155' },
  toaster: { name: 'Toaster', kind: 'small', category: 'Appliances', dims: [30, 18, 20], kg: 2, frag: 'Low', pri: 'Standard', color: '#b45309' },
  refrigerator: { name: 'Refrigerator', kind: 'appliance', category: 'Appliances', dims: [70, 70, 180], kg: 70, frag: 'Medium', pri: 'Important', color: '#cbd5e1' },
  bottle: { name: 'Bottle', kind: 'vase', category: 'Kitchen', dims: [8, 8, 25], kg: 0.6, frag: 'High', pri: 'Standard', color: '#a5d8ee' },
  cup: { name: 'Cup', kind: 'small', category: 'Kitchen', dims: [9, 9, 10], kg: 0.3, frag: 'High', pri: 'Standard', color: '#f3f4f6' },
  'wine glass': { name: 'Wine Glass', kind: 'small', category: 'Kitchen', dims: [8, 8, 20], kg: 0.2, frag: 'High', pri: 'Standard', color: '#a5d8ee' },
  bowl: { name: 'Bowl', kind: 'small', category: 'Kitchen', dims: [18, 18, 8], kg: 0.5, frag: 'High', pri: 'Standard', color: '#f3f4f6' },
  backpack: { name: 'Backpack', kind: 'bag', category: 'Personal', dims: [32, 20, 45], kg: 3, frag: 'Low', pri: 'Standard', color: '#475569' },
  handbag: { name: 'Handbag', kind: 'bag', category: 'Personal', dims: [35, 12, 28], kg: 1, frag: 'Low', pri: 'Standard', color: '#64748b' },
  suitcase: { name: 'Suitcase', kind: 'bag', category: 'Personal', dims: [55, 25, 75], kg: 8, frag: 'Low', pri: 'Standard', color: '#475569' },
  umbrella: { name: 'Umbrella', kind: 'small', category: 'Personal', dims: [10, 10, 90], kg: 0.5, frag: 'Low', pri: 'Standard', color: '#1f2937' },
  'teddy bear': { name: 'Soft Toy', kind: 'bag', category: 'Decor', dims: [25, 20, 30], kg: 0.5, frag: 'Low', pri: 'Standard', color: '#a16207' },
}
