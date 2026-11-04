import { AnimatePresence, motion } from 'framer-motion'
import { ArrowUp, Database, Sparkles } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PageHeader } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { useMove } from '../../state/store'
import { ask, type Answer } from '../../utils/assistant'
import { cn } from '../../utils/format'

const SUGGEST = ['Where is my HDMI cable?', "What haven't I packed?", 'Will my sofa fit?', 'What is missing?', 'Which box contains my electronics?', 'How ready am I?', 'Which items are fragile?', 'Where should my desk go?']

type Msg = { id: number; role: 'user' | 'ai'; text: string; answer?: Answer; typing?: boolean }

function md(s: string): ReactNode[] {
  return s.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((p, i) => p.startsWith('**') ? <b key={i} className="font-semibold text-white">{p.slice(2, -2)}</b> : p.startsWith('*') ? <i key={i}>{p.slice(1, -1)}</i> : <span key={i}>{p}</span>)
}

export default function Assistant() {
  const state = useMove()
  const [msgs, setMsgs] = useState<Msg[]>([{ id: 0, role: 'ai', text: "Hi — I'm the MOVE assistant. I read your digital twin, boxes and tracking history directly, so ask me about **your** move.", answer: { text: '', sources: [] } }])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const end = useRef<HTMLDivElement>(null)
  const seq = useRef(1)
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }) }, [msgs])

  const send = (text: string) => {
    const t = text.trim()
    if (!t || busy) return
    setInput('')
    setBusy(true)
    const uid = seq.current++, aid = seq.current++
    setMsgs((m) => [...m, { id: uid, role: 'user', text: t }, { id: aid, role: 'ai', text: '', typing: true }])
    setTimeout(() => {
      const a = ask(t, { objects: state.objects, boxes: state.boxes, events: state.events, docs: state.docs, damage: state.damage, phase: state.phase, assembly: state.assembly, reconRun: state.reconRun, vehicle: state.vehicle })
      const words = a.text.split(' ')
      let i = 0
      const iv = setInterval(() => {
        i += 3
        const done = i >= words.length
        setMsgs((m) => m.map((x) => (x.id === aid ? { ...x, typing: false, text: words.slice(0, i).join(' '), answer: done ? a : undefined } : x)))
        if (done) { clearInterval(iv); setBusy(false) }
      }, 40)
    }, 650)
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-9rem)] min-h-[520px] max-w-3xl flex-col">
      <PageHeader eyebrow="AI" title="MOVE Assistant" sub="Grounded in your move database — not a generic chatbot." />
      <div className="card flex min-h-0 flex-1 flex-col overflow-hidden !rounded-3xl">
        <div className="flex-1 space-y-5 overflow-y-auto p-5 sm:p-6">
          {msgs.map((m) => (
            <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('flex gap-3', m.role === 'user' && 'flex-row-reverse')}>
              <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold', m.role === 'ai' ? 'bg-gradient-to-br from-accent to-teal-400 text-white' : 'bg-white/10 text-slate-300')}>{m.role === 'ai' ? <Sparkles size={15} /> : 'AS'}</div>
              <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-[14.5px] leading-relaxed', m.role === 'ai' ? 'border border-white/[0.07] bg-white/[0.04] text-slate-300' : 'bg-accent text-white')}>
                {m.typing ? <span className="flex gap-1 py-1">{[0, 1, 2].map((d) => <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-slate-400" animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1, delay: d * 0.15 }} />)}</span> : md(m.text)}
                {m.answer?.bullets && <ul className="mt-2.5 space-y-1.5">{m.answer.bullets.map((b) => <li key={b} className="flex gap-2 text-[13.5px]">{m.answer!.sources[0] === 'MOVE database' ? <button onClick={() => send(b)} className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-left text-accent-soft hover:bg-white/10">{b}</button> : <><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent-soft" /><span>{b}</span></>}</li>)}</ul>}
                {m.answer?.links && m.answer.links.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{m.answer.links.map((l) => <button key={l.to} onClick={() => navigate(l.to)} className="rounded-lg bg-accent/20 px-2.5 py-1 text-xs font-medium text-accent-soft hover:bg-accent/35">{l.label} →</button>)}</div>}
                {m.answer && m.answer.sources.length > 0 && m.role === 'ai' && m.id !== 0 && <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-white/[0.06] pt-2.5 text-[10.5px] text-slate-500"><Database size={11} />{m.answer.sources.map((s) => <span key={s} className="rounded bg-white/5 px-1.5 py-0.5">{s}</span>)}</div>}
              </div>
            </motion.div>
          ))}
          <div ref={end} />
        </div>
        <div className="border-t border-white/[0.06] p-4">
          <AnimatePresence>{msgs.length < 3 && <motion.div exit={{ opacity: 0, height: 0 }} className="mb-3 flex flex-wrap gap-2">{SUGGEST.map((s) => <button key={s} onClick={() => send(s)} className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-300 transition hover:border-accent/50 hover:bg-accent/15 hover:text-white">{s}</button>)}</motion.div>}</AnimatePresence>
          <form onSubmit={(e) => { e.preventDefault(); send(input) }} className="flex gap-2">
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your objects, boxes, fit, readiness…" className="input !rounded-2xl !py-3" />
            <button className="btn-primary !rounded-2xl !px-4" disabled={busy || !input.trim()}><ArrowUp size={17} /></button>
          </form>
        </div>
      </div>
    </div>
  )
}
