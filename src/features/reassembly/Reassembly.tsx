import { Check, ChevronLeft, ChevronRight, Hammer, History, Wrench } from 'lucide-react'
import { useState } from 'react'
import { AssemblyScene } from '../../components/3d/AssemblyScene'
import { Scene3D } from '../../components/3d/Scene3D'
import { Badge, Card, PageHeader, Progress } from '../../components/ui'
import { useMove } from '../../state/store'
import { cn } from '../../utils/format'

export default function Reassembly() {
  const assembly = useMove((s) => s.assembly)
  const objects = useMove((s) => s.objects)
  const setProgress = useMove((s) => s.setAssemblyProgress)
  const phase = useMove((s) => s.phase)
  const [id, setId] = useState('OBJ-019')
  const plan = assembly.find((a) => a.objectId === id)!
  const obj = objects.find((o) => o.id === id)!
  const total = plan.steps.length
  const done = plan.progress >= total
  const current = Math.min(plan.progress, total - 1)
  const items = assembly.map((a) => ({ a, o: objects.find((x) => x.id === a.objectId)! }))
  return (
    <div>
      <PageHeader eyebrow="Furniture reassembly" title="Assembly memory" sub="MOVE recorded how each piece came apart. Follow the reverse steps in 3D, with the exact hardware count." />
      <div className="mb-4 flex flex-wrap gap-2">
        {items.map(({ a, o }) => (
          <button key={a.objectId} onClick={() => setId(a.objectId)} className={cn('flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition', id === a.objectId ? 'border-accent bg-accent/20 text-white' : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07]')}>
            {o.name.replace(' Frame & Mattress', '').replace('Study ', '')}
            {a.progress >= a.steps.length ? <Check size={13} className="text-emerald-400" /> : <span className="mono text-[11px] text-slate-500">{a.progress}/{a.steps.length}</span>}
          </button>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="relative h-[520px] overflow-hidden !rounded-3xl">
          <Scene3D className="!absolute inset-0" camera={[2.8, 2.4, 3.4]} target={[0, 0.7, 0]} autoRotate={false} grid={false} minDistance={2} maxDistance={9} fov={40}>
            <AssemblyScene objectId={id} progress={plan.progress} />
          </Scene3D>
          <div className="pointer-events-none absolute left-4 top-4 rounded-lg bg-black/55 px-3 py-2 backdrop-blur"><div className="label">3D assembly</div><div className="text-sm font-semibold text-white">{obj.name}</div></div>
          <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-black/55 p-3 backdrop-blur">
            <button className="btn-ghost" disabled={plan.progress === 0} onClick={() => setProgress(id, plan.progress - 1)}><ChevronLeft size={15} /> Undo</button>
            <div className="flex-1 text-center text-xs text-slate-300">{done ? 'Assembly complete' : `Step ${plan.progress + 1} of ${total}: ${plan.steps[current].title}`}</div>
            <button className="btn-primary" disabled={done} onClick={() => setProgress(id, plan.progress + 1)}>Complete step <ChevronRight size={15} /></button>
          </div>
        </Card>
        <div className="space-y-5">
          <Card className="p-6">
            <div className="flex items-center justify-between"><div className="label">{obj.name} · hardware</div><Badge tone={done ? 'ok' : phase >= 3 ? 'warn' : 'slate'}>{done ? 'Assembled' : phase >= 3 ? 'Incomplete' : 'Disassembled'}</Badge></div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {plan.parts.map((p) => <div key={p.label} className="rounded-xl bg-white/[0.04] p-3 text-center"><div className="text-2xl font-semibold text-white">{p.qty}</div><div className="text-[11px] text-slate-500">{p.label}</div></div>)}
            </div>
            <div className="mt-4 flex items-center gap-2 rounded-lg bg-accent/10 p-3 text-xs text-slate-300"><History size={14} className="shrink-0 text-accent-soft" /> Disassembled Oct 12, 19:42 · hardware bag sealed and attached to Box #{obj.id === 'OBJ-019' ? '009' : '005'}.</div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between"><div className="label">Step-by-step</div><span className="mono text-xs text-slate-500">{plan.progress}/{total}</span></div>
            <Progress className="mt-3" value={(plan.progress / total) * 100} tone={done ? 'ok' : 'accent'} />
            <div className="mt-4 space-y-2">
              {plan.steps.map((s, i) => {
                const d = i < plan.progress, c = i === plan.progress
                return (
                  <button key={s.title} onClick={() => setProgress(id, d ? i : i + 1)} className={cn('flex w-full items-start gap-3 rounded-xl border p-3 text-left transition', c ? 'border-accent/50 bg-accent/10' : d ? 'border-emerald-400/20 bg-emerald-400/[0.04]' : 'border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]')}>
                    <span className={cn('mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold', d ? 'bg-emerald-400/20 text-emerald-300' : c ? 'bg-accent text-white' : 'bg-white/10 text-slate-400')}>{d ? <Check size={13} /> : i + 1}</span>
                    <span className="flex-1"><span className="block text-sm font-medium text-white">Step {i + 1} · {s.title}</span><span className="block text-xs leading-relaxed text-slate-400">{s.detail}</span><span className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-slate-500"><Wrench size={11} />{s.tool}</span></span>
                  </button>
                )
              })}
            </div>
            {done && <div className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-300"><Hammer size={15} /> {obj.name} fully reassembled — exception cleared.</div>}
          </Card>
        </div>
      </div>
    </div>
  )
}
