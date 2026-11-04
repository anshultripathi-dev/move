import { AnimatePresence, motion } from 'framer-motion'
import { ArrowLeft, ArrowRight, Boxes, Check, Loader2, Package, Sofa } from 'lucide-react'
import { useState } from 'react'
import { navigate } from '../../hooks/useRoute'
import { useMove } from '../../state/store'
import { Select } from '../../components/ui'

export default function CreateMove() {
  const createMove = useMove((s) => s.createMove)
  const [form, setForm] = useState({ name: 'Linden Court → Harbor Street', from: '14 Linden Court, Apt 3B', to: '88 Harbor Street, Unit 12', date: '2026-10-14', type: 'Apartment → Apartment', size: '2 bedroom · 74 m²' })
  const [stage, setStage] = useState<'form' | 'creating' | 'done'>('form')
  const [step, setStep] = useState(0)
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))
  const steps = ['Creating move record', 'Provisioning digital twin workspace', 'Preparing scanning pipeline']
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setStage('creating')
    steps.forEach((_, i) => setTimeout(() => setStep(i + 1), 700 * (i + 1)))
    setTimeout(() => { createMove(form); setStage('done') }, 2300)
  }
  return (
    <div className="relative flex min-h-full items-center justify-center p-6">
      <div className="absolute inset-0 grid-bg opacity-30 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]" />
      <div className="relative w-full max-w-2xl">
        <button onClick={() => navigate('/')} className="btn-quiet mb-4"><ArrowLeft size={14} /> Back</button>
        <AnimatePresence mode="wait">
          {stage === 'form' && (
            <motion.form key="f" onSubmit={submit} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="card p-8">
              <div className="label text-accent-soft">New move</div>
              <h1 className="h-display mt-2 text-3xl">Create your move</h1>
              <p className="mt-2 text-sm text-slate-400">A few details and MOVE spins up your digital-twin workspace.</p>
              <div className="mt-7 grid gap-4 sm:grid-cols-2">
                <label className="sm:col-span-2"><span className="label">Move name</span><input className="input mt-1.5" required value={form.name} onChange={(e) => set('name', e.target.value)} /></label>
                <label><span className="label">Current location</span><input className="input mt-1.5" required value={form.from} onChange={(e) => set('from', e.target.value)} /></label>
                <label><span className="label">Destination</span><input className="input mt-1.5" required value={form.to} onChange={(e) => set('to', e.target.value)} /></label>
                <label><span className="label">Moving date</span><input type="date" className="input mt-1.5" required value={form.date} onChange={(e) => set('date', e.target.value)} /></label>
                <div><span className="label">Move type</span><Select className="mt-1.5" value={form.type} onChange={(v) => set('type', v)} options={['Apartment → Apartment', 'Apartment → House', 'House → House', 'House → Apartment'].map((v) => ({ value: v, label: v }))} /></div>
                <div className="sm:col-span-2"><span className="label">Estimated home size</span><Select className="mt-1.5" value={form.size} onChange={(v) => set('size', v)} options={['Studio · 38 m²', '1 bedroom · 52 m²', '2 bedroom · 74 m²', '3 bedroom · 110 m²', '4+ bedroom · 160 m²'].map((v) => ({ value: v, label: v }))} /></div>
              </div>
              <button className="btn-primary mt-8 w-full !py-3.5">Create move <ArrowRight size={16} /></button>
            </motion.form>
          )}
          {stage === 'creating' && (
            <motion.div key="c" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="card p-10">
              <Loader2 className="mx-auto animate-spin text-accent-soft" size={34} />
              <div className="mt-6 space-y-3">
                {steps.map((s, i) => (
                  <div key={s} className="flex items-center gap-3 text-sm">
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full ${step > i ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/5 text-slate-600'}`}>{step > i ? <Check size={12} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}</span>
                    <span className={step > i ? 'text-slate-200' : 'text-slate-500'}>{s}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {stage === 'done' && (
            <motion.div key="d" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="card p-8" >
              <div className="flex items-center gap-2 text-emerald-300"><Check size={16} /> Move created</div>
              <h1 className="h-display mt-3 text-4xl">MOVE #2841</h1>
              <div className="mt-1 text-slate-400">{form.type}</div>
              <div className="mt-7 grid grid-cols-3 gap-3">
                {[[<Package key="a" size={18} />, '37', 'Objects'], [<Boxes key="b" size={18} />, '13', 'Boxes'], [<Sofa key="c" size={18} />, '4', 'Furniture items']].map(([i, n, l]) => (
                  <div key={String(l)} className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4"><div className="text-accent-soft">{i}</div><div className="mt-3 text-3xl font-semibold text-white">{n}</div><div className="text-xs text-slate-500">{l as string}</div></div>
                ))}
              </div>
              <p className="mt-5 text-xs text-slate-500">Your demo workspace is pre-populated so you can explore the whole lifecycle immediately.</p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => navigate('/scan')} className="btn-primary flex-1 !py-3">Scan current home <ArrowRight size={15} /></button>
                <button onClick={() => navigate('/overview')} className="btn-ghost flex-1 !py-3">Go to dashboard</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
