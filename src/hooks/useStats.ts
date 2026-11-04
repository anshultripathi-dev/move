import { useMemo } from 'react'
import { useMove } from '../state/store'
import { computeExceptions, computeStats } from '../state/selectors'

export function useStats() {
  const objects = useMove((s) => s.objects)
  const boxes = useMove((s) => s.boxes)
  const docs = useMove((s) => s.docs)
  const damage = useMove((s) => s.damage)
  const assembly = useMove((s) => s.assembly)
  const phase = useMove((s) => s.phase)
  const reconRun = useMove((s) => s.reconRun)
  const vehicle = useMove((s) => s.vehicle)
  return useMemo(() => {
    const src = { objects, boxes, docs, damage, assembly, phase, reconRun, vehicle }
    return { stats: computeStats(src), exceptions: computeExceptions(src) }
  }, [objects, boxes, docs, damage, assembly, phase, reconRun, vehicle])
}
