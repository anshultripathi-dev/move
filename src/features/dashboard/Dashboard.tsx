import { ArrowRight, Boxes, Check, Clock, Maximize2, Package, ShieldAlert, Sofa, Truck, Weight, Zap } from 'lucide-react'
import { HomeScene } from '../../components/3d/HomeScene'
import { Scene3D } from '../../components/3d/Scene3D'
import { Badge, Card, Dot, LinkRow, PageHeader, Progress, Ring, Stat, StatePill } from '../../components/ui'
import { useSourceItems, SOURCE_HOME } from '../../hooks/useScene'
import { navigate } from '../../hooks/useRoute'
import { useStats } from '../../hooks/useStats'
import { useMove } from '../../state/store'
import { VEHICLES } from '../../state/selectors'
import { fmtTime, cn, STATE_HEX } from '../../utils/format'
import { PHASE_LABEL } from '../../layouts/Shell'

const STORY = ['Scan', 'Inventory', 'Twin', 'Destination', 'Plan', 'Pack', 'Track', 'Arrive', 'Reconcile', 'Verified']
const STORY_AT = [0, 0, 0, 0, 0, 1, 2, 3, 4, 4] // phase at which each step is complete

const levelDot = { red: 'red', orange: 'orange', yellow: 'yellow', blue: 'blue' } as const

export default function Dashboard() {
  const { stats, exceptions } = useStats()
  const meta = useMove((s) => s.meta)
  const phase = useMove((s) => s.phase)
  const events = useMove((s) => s.events)
  const objects = useMove((s) => s.objects)
  const items = useSourceItems()
  const veh = VEHICLES.find((v) => v.cap >= 8) ?? VEHICLES[1]
  const recent = events.slice(-6).reverse()
  const critical = objects.filter((o) => o.priority === 'Essential').slice(0, 5)
  const story = STORY.map((s, i) => ({ s, done: phase >= STORY_AT[i] }))
  const current = story.findIndex((x) => !x.done)

  return (
    <div>
      <PageHeader
        eyebrow={`${meta.id} · ${PHASE_LABEL[phase]}`}
        title="Command Center"
        sub={`${meta.from} → ${meta.to} · ${new Date(meta.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
        actions={
          <>
            <button onClick={() => navigate('/tracking/moveday')} className="btn-ghost"><Truck size={15} /> Move Day</button>
            <button onClick={() => navigate('/twin')} className="btn-primary">Open Digital Twin <ArrowRight size={15} /></button>
          </>
        }
      />

      {/* lifecycle ribbon */}
      <Card className="mb-5 overflow-x-auto p-4">
        <div className="flex min-w-[720px] items-center">
          {story.map((x, i) => (
            <div key={x.s} className="flex flex-1 items-center">
              <div className="flex flex-col items-center gap-1.5">
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-full border text-[11px] font-semibold', x.done ? 'border-emerald-400/50 bg-emerald-400/15 text-emerald-300' : i === current ? 'border-accent bg-accent text-white shadow-glow' : 'border-white/10 text-slate-600')}>
                  {x.done ? <Check size={13} /> : i + 1}
                </div>
                <span className={cn('text-[11px]', x.done ? 'text-slate-300' : i === current ? 'text-white' : 'text-slate-600')}>{x.s}</span>
              </div>
              {i < story.length - 1 && <div className={cn('mx-2 mb-5 h-px flex-1', x.done ? 'bg-emerald-400/40' : 'bg-white/10')} />}
            </div>
          ))}
        </div>
      </Card>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[230px_1fr]">
            <Card className="flex flex-col items-center justify-center p-6" onClick={() => navigate('/readiness')}>
              <div className="label mb-4">Move readiness</div>
              <Ring value={stats.readiness} size={170} />
              <div className="mt-4 text-center text-xs text-slate-500">{stats.remaining.length} action{stats.remaining.length === 1 ? '' : 's'} remaining</div>
              <LinkRow to="/readiness">Breakdown</LinkRow>
            </Card>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label="Items" value={stats.items} sub="in digital twin" icon={<Package size={15} />} onClick={() => navigate('/inventory')} />
              <Stat label="Packed" value={<>{stats.packed}<span className="text-lg text-slate-500"> / {stats.items}</span></>} tone="accent" sub={<Progress value={(stats.packed / stats.items) * 100} />} />
              <Stat label="Boxes" value={stats.boxCount} sub={`${stats.boxesLoaded} loaded`} icon={<Boxes size={15} />} onClick={() => navigate('/boxes')} />
              <Stat label="Tracked" value={<>{stats.tracked}<span className="text-lg text-slate-500"> / {stats.boxCount}</span></>} tone="ok" sub="QR labels live" />
              <Stat label="Missing" value={stats.missing} tone={stats.missing ? 'bad' : 'ok'} sub={stats.missing ? 'Needs attention' : 'None detected'} onClick={() => navigate('/reconciliation/missing')} />
              <Stat label="Damage" value={stats.damageCount} tone={stats.damageCount ? 'warn' : 'ok'} sub={stats.damageCount ? '1 scratch · medium' : 'None detected'} icon={<ShieldAlert size={15} />} onClick={() => navigate('/damage')} />
              <Stat label="Est. volume" value={<>{stats.volume.toFixed(1)}<span className="text-lg text-slate-500"> m³</span></>} sub={`${Math.round(stats.weight)} kg total`} icon={<Weight size={15} />} onClick={() => navigate('/planning')} />
              <Stat label="Vehicle" value={<>{veh.cap}<span className="text-lg text-slate-500"> m³</span></>} tone="accent" sub={`${stats.utilization}% utilised · recommended`} icon={<Truck size={15} />} onClick={() => navigate('/planning/vehicle')} />
            </div>
          </div>

          <Card className="relative overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-4">
              <div>
                <div className="label">Digital twin</div>
                <div className="mt-1 text-sm font-medium text-white">Current home · coloured by lifecycle state</div>
              </div>
              <button onClick={() => navigate('/twin')} className="btn-ghost !px-2.5 !py-1.5 text-xs"><Maximize2 size={13} /> Open</button>
            </div>
            <div className="relative h-[360px]">
              <Scene3D className="!absolute inset-0" camera={[6.4, 8.8, 9.2]} autoRotate rotateSpeed={0.35} minDistance={6} maxDistance={20}>
                <HomeScene home={SOURCE_HOME} items={items} colorBy="state" stateHex={STATE_HEX} wallOpacity={0.12} onSelect={(id) => id && navigate(`/object/${id}`)} />
              </Scene3D>
              <div className="pointer-events-none absolute bottom-3 left-4 flex flex-wrap gap-1.5">
                {['SCANNED', 'VERIFIED', 'PACKED', 'LOADED', 'IN_TRANSIT', 'ARRIVED'].map((s) => (
                  <span key={s} className="flex items-center gap-1 rounded-md bg-black/50 px-1.5 py-0.5 text-[10px] text-slate-300 backdrop-blur"><span className="h-1.5 w-1.5 rounded-full" style={{ background: STATE_HEX[s] }} />{s.replace('_', ' ')}</span>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center justify-between"><div className="label">Next actions</div><Zap size={14} className="text-accent-soft" /></div>
            <div className="mt-3 space-y-2">
              {(stats.remaining.length ? stats.remaining : ['All preparation actions complete']).map((a, i) => (
                <button key={a} onClick={() => navigate(i === 0 && stats.remaining.length ? '/packing' : '/readiness')} className="flex w-full items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-3.5 py-3 text-left text-sm text-slate-200 hover:bg-white/[0.06]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-[11px] font-semibold text-accent-soft">{i + 1}</span>
                  <span className="flex-1">{a}</span>
                  <ArrowRight size={14} className="text-slate-600" />
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between"><div className="label">Exceptions</div><LinkRow to="/exceptions">All {exceptions.length}</LinkRow></div>
            <div className="mt-3 space-y-1">
              {exceptions.slice(0, 4).map((x) => (
                <button key={x.id} onClick={() => navigate(x.route)} className="flex w-full items-start gap-3 rounded-lg px-2 py-2 text-left hover:bg-white/[0.04]">
                  <span className="mt-1.5"><Dot tone={levelDot[x.level]} /></span>
                  <span className="min-w-0"><span className="block text-sm text-slate-100">{x.title}</span><span className="block truncate text-xs text-slate-500">{x.detail}</span></span>
                </button>
              ))}
              {exceptions.length === 0 && <div className="py-4 text-center text-sm text-slate-500">No open exceptions.</div>}
            </div>
          </Card>

          <Card className="p-5">
            <div className="label">Critical items</div>
            <div className="mt-3 space-y-1.5">
              {critical.map((o) => (
                <button key={o.id} onClick={() => navigate(`/object/${o.id}`)} className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-white/[0.04]">
                  <span className="truncate text-sm text-slate-200">{o.name}</span>
                  <StatePill state={o.state} />
                </button>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <div className="flex items-center justify-between"><div className="label">Recent activity</div><LinkRow to="/timeline">Timeline</LinkRow></div>
          <div className="mt-3 space-y-3">
            {recent.map((e) => (
              <div key={e.id} className="flex gap-3">
                <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                <div className="min-w-0 flex-1"><div className="truncate text-sm text-slate-200">{e.text}</div><div className="mono text-[11px] text-slate-500">{fmtTime(e.ts)} · {e.actor}</div></div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between"><div className="label">Move timeline</div><Clock size={14} className="text-slate-500" /></div>
          <MiniTimeline />
        </Card>
      </div>
      <div className="hidden"><Sofa /><Badge>x</Badge></div>
    </div>
  )
}

function MiniTimeline() {
  const tasks = useMove((s) => s.tasks)
  const stages = ['14 Days Before', '7 Days Before', '3 Days Before', 'Moving Day', 'Arrival', 'Post Move']
  return (
    <div className="mt-4 space-y-3">
      {stages.map((st) => {
        const t = tasks.filter((x) => x.stage === st)
        const done = t.filter((x) => x.done).length
        return (
          <div key={st}>
            <div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-300">{st}</span><span className="mono text-slate-500">{done}/{t.length}</span></div>
            <Progress value={(done / t.length) * 100} tone={done === t.length ? 'ok' : 'accent'} height={5} />
          </div>
        )
      })}
    </div>
  )
}
