import { Check, Download, FileText, Loader2, Printer } from 'lucide-react'
import { useState } from 'react'
import { Card, Empty } from '../../components/ui'
import { useMove } from '../../state/store'
import { fmtTime } from '../../utils/format'
import { WardrobeShot } from './WardrobeShot'

export function DamageReport() {
  const damage = useMove((s) => s.damage)
  const meta = useMove((s) => s.meta)
  const objects = useMove((s) => s.objects)
  const generate = useMove((s) => s.generateReport)
  const [busy, setBusy] = useState(false)
  if (!damage) return <Card><Empty title="No damage to report" sub="Reports are created from detected damage after arrival." /></Card>
  const o = objects.find((x) => x.id === damage.objectId)!
  const gen = () => { setBusy(true); setTimeout(() => { generate(); setBusy(false) }, 1400) }
  const ready = !!damage.reportId
  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
      <Card className="p-4 sm:p-8">
        <div className="mx-auto max-w-3xl rounded-xl bg-[#f8fafc] p-8 text-slate-800 shadow-2xl">
          <div className="flex items-start justify-between border-b border-slate-200 pb-5">
            <div><div className="flex items-center gap-2"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-500"><svg width="15" height="15" viewBox="0 0 32 32" fill="none"><path d="M7 23V9l9 9 9-9v14" stroke="white" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span><span className="font-semibold tracking-[0.18em] text-slate-900">MOVE</span></div><h2 className="mt-4 text-2xl font-semibold text-slate-900">Damage Report</h2></div>
            <div className="text-right text-xs text-slate-500"><div className="font-mono text-slate-800">{ready ? damage.reportId : 'DRAFT'}</div><div>{meta.id}</div><div>{fmtTime(damage.ts)}</div></div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Object</div><div className="font-medium">{o.name} <span className="font-mono text-xs text-slate-400">{o.id}</span></div></div>
            <div><div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Route</div><div className="font-medium">{meta.from.split(',')[0]} → {meta.to.split(',')[0]}</div></div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Before</div><div className="aspect-[6/7] overflow-hidden rounded-lg border border-slate-200"><WardrobeShot label="BEFORE · OCT 10" /></div></div>
            <div><div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">After</div><div className="aspect-[6/7] overflow-hidden rounded-lg border border-slate-200"><WardrobeShot label="AFTER · OCT 14" after /></div></div>
          </div>
          <table className="mt-5 w-full text-sm">
            <tbody className="divide-y divide-slate-200">
              {[['Detected damage', damage.type], ['Severity', damage.severity], ['Location', damage.location], ['AI confidence', `${damage.confidence}%`], ['Timestamp', fmtTime(damage.ts)], ['Condition change', `Good → ${o.condition}`], ['Est. repair', '$85 – $140 (surface refinish)']].map(([k, v]) => <tr key={k}><td className="py-2 text-slate-500">{k}</td><td className="py-2 text-right font-medium">{v}</td></tr>)}
            </tbody>
          </table>
          <p className="mt-5 text-[11px] leading-relaxed text-slate-400">Generated automatically by MOVE damage detection from timestamped before/after scans. Values are AI estimates and should be verified by the claims assessor.</p>
        </div>
      </Card>
      <div className="space-y-4">
        <Card className="p-5">
          <div className="label">Report</div>
          {ready ? (
            <div className="mt-3"><div className="flex items-center gap-2 text-emerald-300"><Check size={16} /> {damage.reportId} generated</div><div className="mt-4 flex flex-col gap-2"><button className="btn-ghost"><Download size={14} /> Download PDF (simulated)</button><button className="btn-ghost"><Printer size={14} /> Print</button></div></div>
          ) : (
            <div className="mt-3"><p className="text-sm text-slate-400">Compile the evidence, measurements and cost estimate into a claim-ready PDF.</p><button className="btn-primary mt-4 w-full !py-3" onClick={gen} disabled={busy}>{busy ? <><Loader2 size={15} className="animate-spin" /> Generating…</> : <><FileText size={15} /> Generate Report</>}</button></div>
          )}
        </Card>
      </div>
    </div>
  )
}
