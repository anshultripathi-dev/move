import { useMemo } from 'react'
import { DEST_HOME, SOURCE_HOME } from '../data/layouts'
import type { SceneItem } from '../components/3d/HomeScene'
import { useMove } from '../state/store'
import { destPlacement } from '../utils/placement'

export function useSourceItems(): SceneItem[] {
  const objects = useMove((s) => s.objects)
  return useMemo(() => objects.map((o) => ({ obj: o, p: o.src })), [objects])
}

export function useDestItems(): SceneItem[] {
  const objects = useMove((s) => s.objects)
  const placements = useMove((s) => s.placements)
  return useMemo(() => objects.map((o) => ({ obj: o, p: destPlacement(o, placements) })), [objects, placements])
}

export { SOURCE_HOME, DEST_HOME }
