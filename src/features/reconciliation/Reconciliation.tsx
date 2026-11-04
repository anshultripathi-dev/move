import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, ArrowRight, Check, Radar, Search, Truck } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Badge, Card, PageHeader, Progress, RouteTabs, StatePill } from '../../components/ui'
import { navigate, useRoute } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'
import { ROOM_COLOR, ROOM_LABEL, ROOM_ORDER, type MoveObject } from '../../models/types'
import { useMove } from '../../state/store'
import { cn } from '../../utils/format'
import { MissingItems } from './MissingItems'
import { MisplacedItems } from './MisplacedItems'
import { TraceModal } from './MissingItems'

export default function Reconciliation() {
  const { path } = useRoute()
  const { stats } = useStats()
  const phase = useMove((s) => s.phase)
  const setPhase = useMove((s) => s.setPhase)
  const sub = path.split('/')[2]
  const tabs = [
    { to: '/reconciliation', label: 'Reconciliation Center' },
    { to: '/reconciliation/missing', label: 'Missing', badge: stats.missing || undefined },
    { to: '/reconciliation/misplaced', label: 'Misplaced', badge: stats.misplaced || undefined },
  ]
  const meta = { undefined: ['Reconciliation center', 'Expected state versus arrived state — automatically compared, item by item.'], missing: ['Missing items', 'Items the arrival scan could not find, with the last place MOVE saw them.'], misplaced: ['Misplaced items', 'Objects that exist but turned up in an unexpected room.'] }[String(sub) as 'undefined']
  return (
    <div>
      <PageHeader eyebrow="Reconciliation" title={meta[0]} sub={meta[1]} tabs={<RouteTabs items={tabs} path={path} />} />
      {phase < 3 ? (
        <Card glow className="flex flex-wrap items-center justify-between gap-4 p-6">
          <div className="flex items-center gap-4"><span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent/15 text-accent-soft"><Truck size={22} /></span><div><div className="text-base font-semibold text-white">Waiting for the arrival scan</div><div className="text-sm text-slate-400">Reconciliation compares your digital twin to what is detected at the destination. The truck hasn&apos;t arrived yet.</div></div></div>
          <button className="btn-primary" onClick={() => setPhase(3)}>Simulate arrival <ArrowRight size={14} /></button>
        </Card>
      ) : sub === 'missing' ? <MissingItems /> : sub === 'misplaced' ? <MisplacedItems /> : <Center />}
    </div>
  )
}

type Row = { o: MoveObject; status: 'ok' | 'missing' | 'misplaced' | 'found'; detectedRoom: string | null }

function Center() {
  const { stats } = useStats()
  const objects = useMove((s) => s.objects)
  const reconRun = useMove((s) => s.reconRun)
  const run = useMove((s) => s.runReconciliation)
  const markFound = useMove((s) => s.markFound)
  const reportMissing = useMove((s) => s.reportMissing)
  const [prog, setProg] = useState(reconRun ? 100 : 0)
  const [running, setRunning] = useState(false)
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState<'all' | 'issues'>('all')
  const [trace, setTrace] = useState<MoveObject | null>(null)
  useEffect(() => {
    if (!running) return
    const t = setInterval(() => setProg((p) => { if (p >= 100) { clearInterval(t); setRunning(false); run(); return 100 } return Math.min(100, p + 2.5) }), 70)
    return () => clearInterval(t)
  }, [running, run])
  const done = reconRun && prog >= 100
  const rows: Row[] = useMemo(() => objects.map((o) => ({
    o,
    status: o.missing === 'suspected' || o.missing === 'reported' ? 'missing' : o.missing === 'found' ? 'found' : o.misplacedIn && !o.misplacedResolved ? 'misplaced' : 'ok',
    detectedRoom: o.missing === 'suspected' || o.missing === 'reported' ? null : o.misplacedIn && !o.misplacedResolved ? ROOM_LABEL[o.misplacedIn] : ROOM_LABEL[o.destRoom],
  })), [objects])
  const shownRows = rows.filter((r) => (filter === 'all' || r.status !== 'ok') && (!q || r.o.name.toLowerCase().includes(q.toLowerCase())))
  const scanned = Math.floor((prog / 100) * rows.length)
  const lamp = rows.find((r) => r.status === 'missing')
  const mis = rows.find((r) => r.status === 'misplaced')

  return (
    <div className="space-y-5">
      <div className="grid gap-5 xl:grid-cols-[1fr_auto_1fr]">
        <Card className="p-6">
          <div className="label">Expected state</div>
          <div className="mt-2 text-xs text-slate-500">Digital twin · {stats.items} objects</div>
          <div className="mt-3 text-6xl font-semibold tracking-tight text-white">{stats.items}</div>
          <div className="mt-4 grid grid-cols-4 gap-2">{ROOM_ORDER.map((r) => <div key={r} className="rounded-lg bg-white/[0.04] p-2 text-center"><div className="mono text-lg text-white">{objects.filter((o) => o.destRoom === r || (o.misplacedResolved === 'updated' && false)).length}</div><div className="text-[10px] text-slate-500">{ROOM_LABEL[r].split(' ')[0]}</div></div>)}</div>
        </Card>
        <div className="flex flex-col items-center justify-center gap-3 px-2">
          <div className={cn('flex h-14 w-14 items-center justify-center rounded-full border-2', done ? 'border-amber-400 text-amber-300' : running ? 'border-accent text-accent-soft' : 'border-white/15 text-slate-500')}><Radar size={22} className={running ? 'animate-spin' : ''} /></div>
          <button className="btn-primary" disabled={running} onClick={() => { setProg(0); setRunning(true) }}>{done ? 'Re-run' : running ? 'Comparing…' : 'Run reconciliation'}</button>
        </div>
        <Card className={cn('p-6', done && stats.detected < stats.items && 'ring-1 ring-amber-400/40')}>
          <div className="label">Arrived state</div>
          <div className="mt-2 text-xs text-slate-500">Arrival scan · {done || running ? `${scanned} compared` : 'not compared yet'}</div>
          <div className="mt-3 flex items-baseline gap-2"><span className={cn('text-6xl font-semibold tracking-tight', done && stats.detected < stats.items ? 'text-amber-300' : 'text-white')}>{done ? stats.detected : running ? Math.min(scanned, stats.detected) : stats.detected}</span><span className="text-slate-500">detected</span></div>
          <div className="mt-4 grid grid-cols-4 gap-2">{ROOM_ORDER.map((r) => <div key={r} className="rounded-lg bg-white/[0.04] p-2 text-center"><div className="mono text-lg text-white">{objects.filter((o) => !(o.missing === 'suspected' || o.missing === 'reported') && (o.misplacedIn && !o.misplacedResolved ? o.misplacedIn : o.destRoom) === r).length}</div><div className="text-[10px] text-slate-500">{ROOM_LABEL[r].split(' ')[0]}</div></div>)}</div>
        </Card>
      </div>
      {(running || (prog > 0 && prog < 100)) && <Card className="p-4"><div className="mb-2 flex justify-between text-xs text-slate-400"><span>Comparing digital twin to arrival scan…</span><span className="mono">{Math.round(prog)}%</span></div><Progress value={prog} tone="teal" /></Card>}

      <AnimatePresence>
        {done && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="grid gap-5 lg:grid-cols-2">
            {lamp && (
              <Card className="p-6 ring-1 ring-red-400/40">
                <div className="flex items-center gap-2 text-red-300"><AlertTriangle size={16} /><span className="label !text-red-300">Discrepancy · Missing</span></div>
                <div className="mt-3 text-2xl font-semibold text-white">{lamp.o.name} may be missing.</div>
                <div className="mt-1 text-sm text-slate-400">Last known location: <button className="font-semibold text-accent-soft hover:underline" onClick={() => navigate(`/box/${lamp.o.lastSeen?.boxId}`)}>{lamp.o.lastSeen?.boxId?.replace('BOX-', 'BOX #')}</button> · Study · last state Loaded</div>
                <div className="mt-5 flex flex-wrap gap-2">
                  <button className="btn-ghost" onClick={() => navigate(`/box/${lamp.o.lastSeen?.boxId}`)}><Search size={14} /> Search</button>
                  <button className="btn-ok" onClick={() => markFound(lamp.o.id)}><Check size={14} /> Mark Found</button>
                  <button className="btn-danger" onClick={() => reportMissing(lamp.o.id)}>{lamp.o.missing === 'reported' ? 'Reported' : 'Report Missing'}</button>
                  <button className="btn-quiet" onClick={() => setTrace(lamp.o)}>View History</button>
                </div>
              </Card>
            )}
            {mis && (
              <Card className="p-6 ring-1 ring-amber-400/30">
                <div className="flex items-center gap-2 text-amber-300"><AlertTriangle size={16} /><span className="label !text-amber-300">Discrepancy · Misplaced</span></div>
                <div className="mt-3 text-2xl font-semibold text-white">{mis.o.name} appears misplaced.</div>
                <div className="mt-1 text-sm text-slate-400">Expected <span className="text-white">{ROOM_LABEL[mis.o.destRoom]}</span> · detected <span className="text-white">{mis.detectedRoom}</span></div>
                <button className="btn-primary mt-5" onClick={() => navigate('/reconciliation/misplaced')}>Resolve <ArrowRight size={14} /></button>
              </Card>
            )}
            {!lamp && !mis && <Card className="p-6 lg:col-span-2"><div className="flex items-center gap-2 text-emerald-300"><Check size={16} /> 100% reconciled — nothing missing or misplaced.</div></Card>}
          </motion.div>
        )}
      </AnimatePresence>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-white/[0.06] p-4">
          <div className="label">Item-by-item comparison</div>
          <div className="relative ml-auto min-w-[200px]"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><input className="input !py-2 !pl-9" placeholder="Search items…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">{(['all', 'issues'] as const).map((f) => <button key={f} onClick={() => setFilter(f)} className={cn('rounded-md px-3 py-1.5 capitalize', filter === f ? 'bg-white/10 text-white' : 'text-slate-500')}>{f}</button>)}</div>
        </div>
        <div className="max-h-[420px] overflow-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead><tr className="text-left"><th className="label px-4 py-2.5 font-medium">Item</th><th className="label px-4 py-2.5 font-medium">Expected</th><th className="label px-4 py-2.5 font-medium">Detected</th><th className="label px-4 py-2.5 font-medium">Result</th></tr></thead>
            <tbody>
              {shownRows.map((r, i) => {
                const reveal = done || i < scanned
                const st = reveal ? r.status : 'ok'
                return (
                  <tr key={r.o.id} className="border-t border-white/[0.04]">
                    <td className="px-4 py-2 text-slate-100"><button onClick={() => navigate(`/object/${r.o.id}`)} className="hover:text-accent-soft">{r.o.name}</button></td>
                    <td className="px-4 py-2 text-slate-400"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ background: ROOM_COLOR[r.o.destRoom] }} />{ROOM_LABEL[r.o.destRoom]}</td>
                    <td className="px-4 py-2 text-slate-300">{!reveal ? <span className="text-slate-600">—</span> : r.detectedRoom ?? <span className="text-red-300">not detected</span>}</td>
                    <td className="px-4 py-2">{!reveal ? <span className="text-slate-600">pending</span> : st === 'ok' ? <Badge tone="ok">Matched</Badge> : st === 'found' ? <Badge tone="teal">Found</Badge> : st === 'missing' ? <Badge tone="bad">Missing</Badge> : <Badge tone="warn">Misplaced</Badge>}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
      {trace && <TraceModal obj={trace} onClose={() => setTrace(null)} />}
      <div className="hidden"><StatePill state="PACKED" /></div>
    </div>
  )
}
