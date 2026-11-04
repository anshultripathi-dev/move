import { useThree } from '@react-three/fiber'
import { useEffect } from 'react'

/** Invisible floor plane that turns pointer movement into home-space coordinates while an object is dragged. */
export function DragLayer({ active, width, depth, elev = 0, onMove, onEnd }: { active: boolean; width: number; depth: number; elev?: number; onMove: (x: number, z: number) => void; onEnd: () => void }) {
  const controls = useThree((s) => s.controls) as { enabled: boolean } | null
  useEffect(() => {
    if (controls) controls.enabled = !active
    if (!active) return
    const up = () => onEnd()
    window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointerup', up); if (controls) controls.enabled = true }
  }, [active, controls, onEnd])
  if (!active) return null
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[width / 2, elev + 0.01, depth / 2]} onPointerMove={(e) => { e.stopPropagation(); onMove(e.point.x + width / 2, e.point.z + depth / 2) }}>
      <planeGeometry args={[width * 3, depth * 3]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
