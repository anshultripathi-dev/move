import { motion } from 'framer-motion'
import { ArrowRight, Box, Cpu, Layers, Play, ScanLine, ShieldCheck, Truck } from 'lucide-react'
import { HomeScene, ScanSweep } from '../../components/3d/HomeScene'
import { Scene3D } from '../../components/3d/Scene3D'
import { navigate } from '../../hooks/useRoute'
import { useSourceItems, SOURCE_HOME } from '../../hooks/useScene'
import { useMove } from '../../state/store'

const STORY = ['Physical Home', 'AI Scanning', 'Digital Twin', 'Smart Planning', 'Smart Packing', 'Tracked Movement', 'Destination Twin', 'Reconciliation', 'Verified Move']

export default function Landing() {
  const items = useSourceItems()
  const loadDemo = useMove((s) => s.loadDemo)
  return (
    <div className="relative min-h-full overflow-x-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 [mask-image:radial-gradient(ellipse_at_70%_30%,black,transparent_70%)]" />
      <header className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-indigo-400 shadow-[0_8px_26px_-6px_rgba(109,139,255,0.9)]">
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none"><path d="M7 23V9l9 9 9-9v14" stroke="white" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </span>
          <span className="text-lg font-semibold tracking-[0.18em] text-white">MOVE</span>
        </div>
        <button onClick={() => { loadDemo(); navigate('/overview') }} className="btn-ghost">Load Demo Move</button>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-6 px-6 pb-10 pt-6 lg:grid-cols-[1fr_1.15fr] lg:pt-12">
        <div>
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mb-5 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-medium text-accent-soft">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-300" /> AI-powered digital twin &amp; relocation platform
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="h-display text-5xl leading-[1.02] sm:text-6xl lg:text-7xl">
            Your belongings.<br /><span className="bg-gradient-to-r from-accent-soft via-teal-300 to-accent-soft bg-clip-text text-transparent">Digitized.</span>
          </motion.h1>
          <motion.p initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }} className="mt-6 max-w-lg text-lg leading-relaxed text-slate-400">
            An AI-powered digital twin that plans, tracks and verifies your entire move.
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24 }} className="mt-9 flex flex-wrap gap-3">
            <button onClick={() => navigate('/new')} className="btn-primary !px-6 !py-3.5 text-[15px]">Start a Move <ArrowRight size={16} /></button>
            <button onClick={() => { loadDemo(); navigate('/overview') }} className="btn-ghost !px-6 !py-3.5 text-[15px]"><Play size={15} /> Explore Demo</button>
          </motion.div>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-12 grid max-w-md grid-cols-3 gap-6">
            {[['37', 'objects understood'], ['13', 'boxes tracked'], ['100%', 'reconciled']].map(([a, b]) => (
              <div key={b}><div className="text-3xl font-semibold text-white">{a}</div><div className="mt-1 text-xs text-slate-500">{b}</div></div>
            ))}
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2, duration: 0.8 }} className="relative h-[420px] sm:h-[520px] lg:h-[600px]">
          <div className="absolute inset-0 rounded-[32px] bg-gradient-to-br from-accent/10 via-transparent to-teal-400/10 blur-2xl" />
          <Scene3D className="!absolute inset-0" camera={[6.5, 8.5, 9.5]} autoRotate rotateSpeed={0.5} grid={false} controls minDistance={7} maxDistance={20}>
            <HomeScene home={SOURCE_HOME} items={items} wallOpacity={0.12} roomLabels={false}>
              <ScanSweep width={SOURCE_HOME.width} depth={SOURCE_HOME.depth} />
            </HomeScene>
          </Scene3D>
          <div className="pointer-events-none absolute bottom-4 left-4 right-4 flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-xs backdrop-blur-xl">
            <span className="flex items-center gap-2 text-teal-300"><ScanLine size={14} /> Live digital twin · 37 objects</span>
            <span className="text-slate-400">Drag to orbit</span>
          </div>
        </motion.div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-6 pb-10">
        <div className="card flex flex-wrap items-center justify-center gap-x-2 gap-y-3 p-5">
          {STORY.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <span className="rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-slate-200">{s}</span>
              {i < STORY.length - 1 && <ArrowRight size={13} className="text-slate-600" />}
            </div>
          ))}
        </div>
      </section>

      <section className="relative z-10 mx-auto grid max-w-7xl gap-4 px-6 pb-24 md:grid-cols-3">
        {[
          { i: <Cpu size={20} />, t: 'Understands what you own', d: 'Computer-vision scanning builds an object graph — dimensions, weight, fragility — each with a confidence score you can correct.' },
          { i: <Layers size={20} />, t: 'Plans in 3D', d: 'Digital twins of both homes. Test doorway clearances, preview furniture placement, and pack the truck before anything moves.' },
          { i: <ShieldCheck size={20} />, t: 'Verifies it arrived', d: 'QR-tracked boxes and state-based journey tracking, then automatic reconciliation of missing, misplaced and damaged items.' },
        ].map((f) => (
          <div key={f.t} className="card p-6">
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-soft">{f.i}</div>
            <div className="text-base font-semibold text-white">{f.t}</div>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{f.d}</p>
          </div>
        ))}
      </section>
      <div className="hidden"><Box /><Truck /></div>
    </div>
  )
}
