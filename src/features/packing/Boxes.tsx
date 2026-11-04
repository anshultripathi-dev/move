import { ScanLine, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { fragTone, priTone } from '../../components/ObjectPanels'
import { QRCode } from '../../components/QRCode'
import { Badge, Card, PageHeader, Select, StatePill } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { BOX_STATES, ROOM_LABEL, ROOM_ORDER } from '../../models/types'
import { useMove } from '../../state/store'
import { boxStats, cn } from '../../utils/format'

export default function Boxes() {
  const boxes = useMove((s) => s.boxes)
  const objects = useMove((s) => s.objects)
  const [q, setQ] = useState('')
  const [room, setRoom] = useState('all')
  const [st, setSt] = useState('all')
  const list = useMemo(() => boxes.filter((b) => (room === 'all' || b.room === room) && (st === 'all' || b.state === st) && (!q || `${b.id} ${b.label} ${b.num} ${boxStats(b, objects).items.map((i) => i.name).join(' ')}`.toLowerCase().includes(q.toLowerCase()))), [boxes, objects, q, room, st])
  return (
    <div>
      <PageHeader eyebrow="Box management" title="Boxes" sub="Every box carries a QR label. Select a box to see its contents and tracking history." actions={<button className="btn-primary" onClick={() => navigate('/tracking/qr')}><ScanLine size={15} /> Scan a box</button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-[200px] flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input className="input !pl-9" placeholder="Search boxes or contents…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select className="w-40" value={room} onChange={setRoom} options={[{ value: 'all', label: 'All rooms' }, ...ROOM_ORDER.map((r) => ({ value: r, label: ROOM_LABEL[r] }))]} />
        <Select className="w-40" value={st} onChange={setSt} options={[{ value: 'all', label: 'All statuses' }, ...BOX_STATES.map((s) => ({ value: s, label: s.replace('_', ' ') }))]} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {list.map((b) => {
          const bs = boxStats(b, objects)
          return (
            <Card key={b.id} onClick={() => navigate(`/box/${b.id}`)} className="p-4">
              <div className="flex gap-4">
                <QRCode value={b.id} size={84} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2"><div className="text-lg font-semibold text-white">BOX #{String(b.num).padStart(3, '0')}</div></div>
                  <div className="truncate text-sm text-slate-300">{b.label}</div>
                  <div className="text-xs text-slate-500">{ROOM_LABEL[b.room]} · {bs.items.length} items</div>
                  <div className="mt-2"><StatePill state={b.state} /></div>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-3">
                <Badge tone={priTone[b.priority]}>{b.priority}</Badge><Badge tone={fragTone[bs.fragility]}>{bs.fragility}</Badge><Badge>{bs.weight.toFixed(1)} kg</Badge>
                {!b.scanned && <Badge tone="warn">Not scanned</Badge>}
              </div>
              <div className={cn('mt-2 text-xs text-slate-500')}>→ {ROOM_LABEL[b.destRoom]}</div>
            </Card>
          )
        })}
      </div>
      {list.length === 0 && <div className="py-16 text-center text-sm text-slate-500">No boxes match.</div>}
    </div>
  )
}
