import { motion } from 'framer-motion'
import { Check, Circle } from 'lucide-react'
import { Card, CheckRow, PageHeader, Progress } from '../../components/ui'
import { useMove } from '../../state/store'
import { cn, fmtTime } from '../../utils/format'

const STAGES = [
  { s: '14 Days Before', d: 'Sep 30' }, { s: '7 Days Before', d: 'Oct 7' }, { s: '3 Days Before', d: 'Oct 11' },
  { s: 'Moving Day', d: 'Oct 14' }, { s: 'Arrival', d: 'Oct 14' }, { s: 'Post Move', d: 'Oct 15+' },
]

export default function Timeline() {
  const tasks = useMove((s) => s.tasks)
  const toggle = useMove((s) => s.toggleTask)
  const events = useMove((s) => s.events)
  const phase = useMove((s) => s.phase)
  const stat = STAGES.map((st) => { const t = tasks.filter((x) => x.stage === st.s); return { ...st, t, done: t.filter((x) => x.done).length } })
  const currentIdx = Math.max(0, stat.findIndex((x) => x.done < x.t.length))
  return (
    <div>
      <PageHeader eyebrow="Management" title="Move timeline" sub="Six stages from planning to post-move. Tasks are linked to what MOVE already knows — many tick themselves." />
      <div className="relative mb-6 overflow-x-auto"><div className="flex min-w-[820px] items-start">
        {stat.map((x, i) => {
          const complete = x.done === x.t.length
          return (
            <div key={x.s} className="flex flex-1 items-start">
              <div className="flex w-full flex-col items-center gap-2 text-center">
                <div className={cn('flex h-9 w-9 items-center justify-center rounded-full border-2', complete ? 'border-emerald-400 bg-emerald-400/15 text-emerald-300' : i === currentIdx ? 'border-accent bg-accent text-white shadow-glow' : 'border-white/10 text-slate-600')}>{complete ? <Check size={16} /> : <Circle size={8} fill="currentColor" />}</div>
                <div className={cn('text-xs font-medium', complete || i === currentIdx ? 'text-white' : 'text-slate-500')}>{x.s}</div><div className="mono text-[10px] text-slate-600">{x.d}</div>
              </div>
              {i < stat.length - 1 && <div className={cn('mt-[17px] h-0.5 w-full', complete ? 'bg-emerald-400/50' : 'bg-white/10')} />}
            </div>
          )
        })}
      </div></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {stat.map((x, i) => (
          <motion.div key={x.s} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={cn('h-full p-5', i === currentIdx && 'ring-1 ring-accent/50')}>
              <div className="flex items-center justify-between"><div><div className="text-base font-semibold text-white">{x.s}</div><div className="mono text-[11px] text-slate-500">{x.d}</div></div><span className="mono text-sm text-slate-400">{x.done}/{x.t.length}</span></div>
              <Progress className="mt-3" value={(x.done / x.t.length) * 100} tone={x.done === x.t.length ? 'ok' : 'accent'} height={4} />
              <div className="mt-3 space-y-0.5">{x.t.map((t) => <CheckRow key={t.id} done={t.done} label={t.label} onClick={() => toggle(t.id)} />)}</div>
            </Card>
          </motion.div>
        ))}
      </div>
      <Card className="mt-6 p-5">
        <div className="label">Event log · {events.length} events</div>
        <div className="mt-3 grid gap-x-8 gap-y-2.5 md:grid-cols-2">
          {events.slice(-12).reverse().map((e) => <div key={e.id} className="flex gap-3"><span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" /><div className="min-w-0"><div className="truncate text-sm text-slate-300">{e.text}</div><div className="mono text-[10px] text-slate-600">{fmtTime(e.ts)}</div></div></div>)}
        </div>
      </Card>
      <div className="hidden">{phase}</div>
    </div>
  )
}
