import { ArrowRight, Check } from 'lucide-react'
import { Badge, Card, Dot, PageHeader } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'

const GROUPS = [
  { k: 'red', t: 'Critical', tone: 'bad' as const, desc: 'Needs action now' },
  { k: 'orange', t: 'Damage', tone: 'orange' as const, desc: 'Needs a report or review' },
  { k: 'yellow', t: 'Attention', tone: 'warn' as const, desc: 'Incomplete or out of place' },
  { k: 'blue', t: 'Verification', tone: 'accent' as const, desc: 'Low-confidence AI data' },
] as const

export default function Exceptions() {
  const { exceptions } = useStats()
  return (
    <div>
      <PageHeader eyebrow="Management" title="Move exceptions" sub="Everything that needs your attention, ranked by severity — in one place." actions={<Badge tone={exceptions.some((e) => e.level === 'red') ? 'bad' : exceptions.length ? 'warn' : 'ok'} className="!px-3 !py-1.5 text-xs">{exceptions.length} open</Badge>} />
      {exceptions.length === 0 && <Card className="p-12 text-center"><div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300"><Check size={22} /></div><div className="text-lg font-medium text-white">No open exceptions</div><div className="text-sm text-slate-500">Everything is accounted for.</div></Card>}
      <div className="space-y-6">
        {GROUPS.map((g) => {
          const list = exceptions.filter((e) => e.level === g.k)
          if (!list.length) return null
          return (
            <div key={g.k}>
              <div className="mb-2 flex items-center gap-2"><Dot tone={g.k === 'red' ? 'red' : g.k === 'orange' ? 'orange' : g.k === 'yellow' ? 'yellow' : 'blue'} /><span className="text-sm font-semibold text-white">{g.t}</span><span className="text-xs text-slate-500">· {g.desc}</span></div>
              <div className="space-y-2">
                {list.map((x) => (
                  <Card key={x.id} onClick={() => navigate(x.route)} className="flex items-center gap-4 p-4">
                    <Dot tone={g.k === 'red' ? 'red' : g.k === 'orange' ? 'orange' : g.k === 'yellow' ? 'yellow' : 'blue'} />
                    <div className="min-w-0 flex-1"><div className="text-[15px] font-medium text-white">{x.title}</div><div className="text-sm text-slate-500">{x.detail}</div></div>
                    <Badge tone={g.tone}>{g.t}</Badge><ArrowRight size={16} className="text-slate-600" />
                  </Card>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
