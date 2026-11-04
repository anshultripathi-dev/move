import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, Camera, Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { QRCode } from '../../components/QRCode'
import { BoxTracker } from '../packing/BoxDetails'
import { Badge, Card, StatePill } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { useMove } from '../../state/store'
import { boxStats, cn, fmtTime } from '../../utils/format'
import { ROOM_LABEL } from '../../models/types'

export default function QRScanner() {
  const boxes = useMove((s) => s.boxes)
  const objects = useMove((s) => s.objects)
  const events = useMove((s) => s.events)
  const scanBox = useMove((s) => s.scanBox)
  const [phase, setPhase] = useState<'idle' | 'scanning' | 'done'>('idle')
  const [target, setTarget] = useState<string>('BOX-007')
  const [recent, setRecent] = useState<string[]>([])
  const view = boxes.filter((b) => ['BOX-007', 'BOX-004', 'BOX-010', 'BOX-008', 'BOX-012', 'BOX-003'].includes(b.id))
  const start = (id: string) => { setTarget(id); setPhase('scanning') }
  useEffect(() => {
    if (phase !== 'scanning') return
    const t = setTimeout(() => { setPhase('done'); setRecent((r) => [target, ...r.filter((x) => x !== target)].slice(0, 5)) }, 1500)
    return () => clearTimeout(t)
  }, [phase, target])
  const box = boxes.find((b) => b.id === target)!
  const bs = boxStats(box, objects)
  const hist = events.filter((e) => e.boxId === box.id).slice().reverse().slice(0, 7)

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Card className="overflow-hidden !rounded-3xl">
        <div className="relative aspect-[4/3] bg-gradient-to-b from-[#0c1018] to-[#06080c]">
          <div className="absolute inset-0 grid-bg opacity-30" />
          <div className="absolute inset-0 grid grid-cols-3 gap-3 p-6">
            {view.map((b, i) => (
              <button key={b.id} onClick={() => start(b.id)} disabled={phase === 'scanning'} className={cn('relative flex flex-col items-center justify-center rounded-xl border bg-[#2a2013]/70 p-2 transition hover:scale-[1.03]', target === b.id && phase !== 'idle' ? 'border-teal-300 shadow-[0_0_30px_-4px_#2dd4bf]' : 'border-amber-900/50')} style={{ transform: `rotate(${(i % 3 - 1) * 2.5}deg)` }}>
                <QRCode value={b.id} size={64} />
                <div className="mt-1.5 text-[11px] font-bold tracking-wider text-amber-100">BOX #{String(b.num).padStart(3, '0')}</div>
                <div className="text-[9px] text-amber-200/70">{b.label}</div>
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute inset-8 rounded-2xl">
            {['left-0 top-0 border-l-2 border-t-2', 'right-0 top-0 border-r-2 border-t-2', 'left-0 bottom-0 border-l-2 border-b-2', 'right-0 bottom-0 border-r-2 border-b-2'].map((c) => <span key={c} className={cn('absolute h-8 w-8', c, phase === 'done' ? 'border-emerald-300' : 'border-teal-300')} />)}
            {phase === 'scanning' && <motion.div className="absolute left-0 right-0 h-0.5 bg-teal-300 shadow-[0_0_14px_#2dd4bf]" initial={{ top: '0%' }} animate={{ top: ['0%', '100%', '0%'] }} transition={{ duration: 1.5 }} />}
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent p-5 pt-10">
            <div className="flex items-center gap-2 text-sm text-slate-300"><Camera size={15} /> {phase === 'idle' ? 'Tap a box label to scan' : phase === 'scanning' ? 'Decoding QR…' : `Decoded · ${box.id}`}</div>
            <button onClick={() => start('BOX-007')} className="btn-primary !py-2 text-xs">Simulate scan · Box #007</button>
          </div>
        </div>
        {recent.length > 0 && <div className="flex flex-wrap items-center gap-2 border-t border-white/[0.06] p-4"><span className="label">Recent</span>{recent.map((r) => <button key={r} onClick={() => start(r)} className="rounded-md bg-white/5 px-2 py-1 text-xs text-slate-300 hover:bg-white/10">{r.replace('BOX-', '#')}</button>)}</div>}
      </Card>

      <AnimatePresence mode="wait">
        {phase === 'done' ? (
          <motion.div key={box.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <Card glow className="p-6">
              <div className="flex items-start justify-between">
                <div><div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300"><Check size={13} /> QR verified</div><div className="mt-1 text-3xl font-semibold tracking-tight text-white">BOX #{String(box.num).padStart(3, '0')}</div><div className="text-sm text-slate-400">{box.label} · {ROOM_LABEL[box.room]}</div></div>
                <StatePill state={box.state} />
              </div>
              <div className="mt-5 grid gap-6 sm:grid-cols-[1fr_1fr]">
                <div><div className="label mb-3">Status</div><BoxTracker state={box.state} compact /></div>
                <div><div className="label mb-3">Contents · {bs.items.length}</div><div className="space-y-1">{bs.items.map((o) => <div key={o.id} className="flex items-center justify-between text-sm"><span className="text-slate-200">{o.name}</span>{o.missing === 'suspected' && <Badge tone="bad">Missing</Badge>}</div>)}</div><div className="mono mt-3 text-xs text-slate-500">{bs.weight.toFixed(1)} kg · → {ROOM_LABEL[box.destRoom]}</div></div>
              </div>
              <div className="mt-5 flex gap-2"><button className="btn-primary flex-1" onClick={() => navigate(`/box/${box.id}`)}>Box details <ArrowRight size={14} /></button><button className="btn-ghost" disabled={box.scanned} onClick={() => scanBox(box.id)}>{box.scanned ? 'Logged' : 'Log checkpoint'}</button></div>
            </Card>
            <Card className="p-5">
              <div className="label mb-3">Complete history</div>
              <div className="relative space-y-3 border-l border-white/10 pl-5">
                {hist.map((e) => <div key={e.id} className="relative"><span className="absolute -left-[26px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-bg bg-accent" /><div className="text-sm text-slate-200">{e.text}</div><div className="mono text-[11px] text-slate-500">{fmtTime(e.ts)} · {e.actor}</div></div>)}
              </div>
            </Card>
          </motion.div>
        ) : (
          <motion.div key="wait" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Card className="flex h-full min-h-[320px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 text-accent-soft"><Camera size={24} /></div>
              <div className="mt-4 text-base font-medium text-white">{phase === 'scanning' ? `Reading ${target}…` : 'Ready to scan'}</div>
              <p className="mt-1 max-w-xs text-sm text-slate-500">Point at any box label. MOVE shows its live status, contents and complete custody history.</p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
