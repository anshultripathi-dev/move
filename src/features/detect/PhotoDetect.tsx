import { ArrowRight, Check, Cpu, ImagePlus, Loader2, RefreshCcw, ScanSearch, TriangleAlert } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Badge, Card, Conf, PageHeader, Select, VerifyHint } from '../../components/ui'
import { navigate } from '../../hooks/useRoute'
import { ROOM_LABEL, ROOM_ORDER, type RoomId } from '../../models/types'
import { useMove } from '../../state/store'
import { cn } from '../../utils/format'
import { COCO_MAP } from './cocoMap'

type Det = { cls: string; score: number; bbox: [number, number, number, number] }
type Model = { detect: (img: HTMLImageElement, max?: number, minScore?: number) => Promise<{ class: string; score: number; bbox: [number, number, number, number] }[]> }

export default function PhotoDetect() {
  const addDetected = useMove((s) => s.addDetected)
  const [status, setStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [err, setErr] = useState('')
  const [backend, setBackend] = useState('')
  const model = useRef<Model | null>(null)
  const img = useRef<HTMLImageElement>(null)
  const [url, setUrl] = useState<string | null>(null)
  const [dets, setDets] = useState<Det[]>([])
  const [running, setRunning] = useState(false)
  const [ms, setMs] = useState<number | null>(null)
  const [thr, setThr] = useState(0.4)
  const [room, setRoom] = useState<RoomId>('living')
  const [picked, setPicked] = useState<Set<number>>(new Set())
  const [added, setAdded] = useState<number | null>(null)
  const [size, setSize] = useState({ w: 1, h: 1 })

  const loadModel = useCallback(async () => {
    if (model.current || status === 'loading') return
    setStatus('loading'); setErr('')
    try {
      const tf = await import('@tensorflow/tfjs')
      await tf.ready()
      setBackend(tf.getBackend())
      const coco = await import('@tensorflow-models/coco-ssd')
      model.current = (await coco.load({ base: 'lite_mobilenet_v2' })) as unknown as Model
      setStatus('ready')
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e)); setStatus('error')
    }
  }, [status])
  useEffect(() => { void loadModel() }, [])  // eslint-disable-line react-hooks/exhaustive-deps

  const run = useCallback(async () => {
    if (!model.current || !img.current) return
    setRunning(true)
    const t0 = performance.now()
    const out = await model.current.detect(img.current, 40, 0.15)
    setMs(Math.round(performance.now() - t0))
    const list = out.map((o) => ({ cls: o.class, score: o.score, bbox: o.bbox }))
    setDets(list)
    setPicked(new Set(list.map((d, i) => (d.score >= thr && COCO_MAP[d.cls] ? i : -1)).filter((i) => i >= 0)))
    setRunning(false)
  }, [thr])

  useEffect(() => { if (status === 'ready' && url && img.current?.complete) void run() }, [status, url]) // eslint-disable-line react-hooks/exhaustive-deps

  const onFile = (f?: File | null) => {
    if (!f || !f.type.startsWith('image/')) return
    if (url) URL.revokeObjectURL(url)
    setUrl(URL.createObjectURL(f)); setDets([]); setAdded(null); setMs(null)
  }
  const visible = useMemo(() => dets.map((d, i) => ({ d, i })).filter(({ d }) => d.score >= thr), [dets, thr])
  const mapped = visible.filter(({ d }) => COCO_MAP[d.cls])
  const toggle = (i: number) => setPicked((p) => { const n = new Set(p); n.has(i) ? n.delete(i) : n.add(i); return n })
  const add = () => {
    const chosen = mapped.filter(({ i }) => picked.has(i))
    const items = chosen.map(({ d }) => {
      const p = COCO_MAP[d.cls]
      return {
        name: p.name, kind: p.kind, category: p.category, room, dims: p.dims, weight: p.kg, fragility: p.frag, priority: p.pri, color: p.color,
        isFurniture: p.category === 'Furniture', source: 'photo-model' as const,
        conf: { detect: Math.round(d.score * 100), dims: 55, fragility: 60 },
      }
    })
    addDetected(items)
    setAdded(items.length)
  }

  return (
    <div>
      <PageHeader eyebrow="Live model · on-device" title="Detect objects from a photo" sub="A real deep-learning detector (SSD with a MobileNet backbone, trained on COCO) runs in your browser via TensorFlow.js. Detected items become new objects in your inventory." actions={<button className="btn-ghost" onClick={() => navigate('/scan')}>Guided demo scan</button>} />
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="p-4">
          {!url ? (
            <label onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files[0]) }} className="flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-white/15 bg-white/[0.02] text-center transition hover:border-accent/50 hover:bg-accent/5">
              <ImagePlus size={34} className="text-accent-soft" />
              <div className="text-base font-medium text-white">Drop a room photo, or click to upload</div>
              <div className="max-w-xs text-xs text-slate-500">Living rooms, kitchens, desks, bedrooms. The image never leaves your device.</div>
              <input id="photo-input" type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
            </label>
          ) : (
            <div>
              <div className="relative overflow-hidden rounded-2xl bg-black">
                <img ref={img} src={url} alt="uploaded room" className="block w-full" onLoad={(e) => { const t = e.currentTarget; setSize({ w: t.naturalWidth, h: t.naturalHeight }); if (status === 'ready') void run() }} />
                {visible.map(({ d, i }) => {
                  const ok = !!COCO_MAP[d.cls]
                  const col = !ok ? '#64748b' : d.score >= 0.75 ? '#2dd4bf' : d.score >= 0.5 ? '#fbbf24' : '#f87171'
                  return (
                    <button key={i} onClick={() => ok && toggle(i)} className="absolute" style={{ left: `${(d.bbox[0] / size.w) * 100}%`, top: `${(d.bbox[1] / size.h) * 100}%`, width: `${(d.bbox[2] / size.w) * 100}%`, height: `${(d.bbox[3] / size.h) * 100}%`, border: `2px ${picked.has(i) ? 'solid' : 'dashed'} ${col}`, background: picked.has(i) ? col + '22' : 'transparent' }}>
                      <span className="absolute -top-5 left-[-2px] whitespace-nowrap px-1.5 text-[10px] font-semibold text-black" style={{ background: col }}>{d.cls} {Math.round(d.score * 100)}%</span>
                    </button>
                  )
                })}
                {running && <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm text-white"><Loader2 className="mr-2 animate-spin" size={18} /> Running inference…</div>}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label className="btn-ghost cursor-pointer"><ImagePlus size={14} /> Change photo<input type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} /></label>
                <button className="btn-ghost" onClick={() => void run()} disabled={status !== 'ready' || running}><RefreshCcw size={14} /> Re-run</button>
                <div className="ml-auto flex items-center gap-2 text-xs text-slate-400">Min confidence <input type="range" min={0.15} max={0.9} step={0.05} value={thr} onChange={(e) => setThr(+e.target.value)} className="accent-[#6d8bff]" /><span className="mono w-9 text-white">{Math.round(thr * 100)}%</span></div>
              </div>
            </div>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="p-5">
            <div className="flex items-center justify-between"><div className="label flex items-center gap-1.5"><Cpu size={13} /> Model</div>
              {status === 'ready' ? <Badge tone="ok">Ready · {backend}</Badge> : status === 'loading' ? <Badge tone="warn"><Loader2 size={11} className="animate-spin" /> Downloading weights…</Badge> : status === 'error' ? <Badge tone="bad">Failed</Badge> : <Badge>Idle</Badge>}</div>
            <div className="mt-2 text-sm text-slate-300">COCO-SSD · <span className="mono text-xs">lite_mobilenet_v2</span></div>
            <div className="mt-1 text-xs leading-relaxed text-slate-500">Convolutional backbone + single-shot detection heads, 80 COCO classes. Weights are fetched once from a public CDN, then cached by the browser.</div>
            {ms !== null && <div className="mono mt-3 text-xs text-slate-400">Inference {ms} ms · {dets.length} raw boxes · {visible.length} above threshold</div>}
            {status === 'error' && <div className="mt-3 flex gap-2 rounded-lg bg-red-400/10 p-3 text-xs text-red-200"><TriangleAlert size={14} className="mt-0.5 shrink-0" /><div>Couldn&apos;t load the model (it needs internet the first time). {err}<button className="mt-2 block text-accent-soft underline" onClick={() => void loadModel()}>Retry</button></div></div>}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between"><div className="label">Detections → inventory</div><span className="mono text-xs text-slate-500">{picked.size} selected</span></div>
            {mapped.length === 0 && <div className="py-8 text-center text-sm text-slate-500">{url ? (running ? 'Analysing…' : 'No household objects above the threshold.') : 'Upload a photo to begin.'}</div>}
            <div className="mt-3 max-h-[300px] space-y-1.5 overflow-y-auto pr-1">
              {mapped.map(({ d, i }) => {
                const p = COCO_MAP[d.cls]
                return (
                  <button key={i} onClick={() => toggle(i)} className={cn('flex w-full items-center gap-3 rounded-xl border px-3 py-2 text-left', picked.has(i) ? 'border-accent/50 bg-accent/10' : 'border-white/[0.06] bg-white/[0.02]')}>
                    <span className={cn('flex h-5 w-5 shrink-0 items-center justify-center rounded-md border', picked.has(i) ? 'border-accent bg-accent text-white' : 'border-white/20')}>{picked.has(i) && <Check size={12} />}</span>
                    <span className="min-w-0 flex-1"><span className="block text-sm text-white">{p.name} <span className="text-[11px] text-slate-500">({d.cls})</span></span><span className="mono block text-[11px] text-slate-500">prior {p.dims.join('×')} cm · {p.kg} kg · {p.frag}</span></span>
                    <span className="w-24"><Conf value={Math.round(d.score * 100)} compact /></span>
                  </button>
                )
              })}
            </div>
            {mapped.length > 0 && <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-400/10 p-3 text-xs text-amber-200"><VerifyHint /><span className="text-slate-400">— the model only gives class, box and score. Size, weight and fragility are class priors (confidence 55–60%), so new items are flagged for verification.</span></div>}
            <div className="mt-4 flex items-center gap-2">
              <Select className="flex-1" value={room} onChange={(v) => setRoom(v as RoomId)} options={ROOM_ORDER.map((r) => ({ value: r, label: `Add to ${ROOM_LABEL[r]}` }))} />
              <button className="btn-primary" onClick={add} disabled={picked.size === 0}><ScanSearch size={14} /> Add {picked.size || ''}</button>
            </div>
            {added !== null && (
              <div className="mt-3 flex items-center justify-between rounded-lg bg-emerald-400/10 p-3 text-sm text-emerald-300"><span className="flex items-center gap-2"><Check size={14} /> {added} object{added === 1 ? '' : 's'} added as SCANNED</span><button className="flex items-center gap-1 text-xs text-white underline" onClick={() => navigate('/inventory')}>Inventory <ArrowRight size={12} /></button></div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
