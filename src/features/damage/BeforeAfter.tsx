import { useRef, useState } from 'react'
import { MoveHorizontal } from 'lucide-react'
import { WardrobeShot } from './WardrobeShot'

export function BeforeAfter({ beforeLabel, afterLabel, className = '', annotate = true }: { beforeLabel: string; afterLabel: string; className?: string; annotate?: boolean }) {
  const [x, setX] = useState(52)
  const ref = useRef<HTMLDivElement>(null)
  const move = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect()
    setX(Math.max(2, Math.min(98, ((clientX - r.left) / r.width) * 100)))
  }
  return (
    <div
      ref={ref}
      className={`relative cursor-ew-resize select-none overflow-hidden rounded-2xl border border-white/10 ${className}`}
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); move(e.clientX) }}
      onPointerMove={(e) => { if (e.buttons) move(e.clientX) }}
    >
      <div className="absolute inset-0"><WardrobeShot label={afterLabel} after annotate={annotate} /></div>
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - x}% 0 0)` }}><WardrobeShot label={beforeLabel} /></div>
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-white shadow-[0_0_14px_rgba(255,255,255,0.8)]" style={{ left: `${x}%` }}>
        <span className="absolute left-1/2 top-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-slate-900 shadow-xl"><MoveHorizontal size={16} /></span>
      </div>
      <span className="pointer-events-none absolute left-3 top-3 rounded-md bg-emerald-500/90 px-2 py-1 text-[10px] font-bold tracking-wider text-black">BEFORE · GOOD</span>
      <span className="pointer-events-none absolute right-3 top-3 rounded-md bg-red-400/95 px-2 py-1 text-[10px] font-bold tracking-wider text-black">AFTER · DAMAGE</span>
    </div>
  )
}
