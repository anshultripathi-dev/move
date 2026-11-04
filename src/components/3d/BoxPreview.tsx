import { ContactShadows } from '@react-three/drei'
import { Carton } from './ObjectModel'
import { Scene3D } from './Scene3D'
import type { MoveBox } from '../../models/types'

export function BoxPreview({ box, className }: { box: Pick<MoveBox, 'dims' | 'color'>; className?: string }) {
  const s = 1.3 / (Math.max(...box.dims) / 100)
  return (
    <Scene3D className={className} camera={[2.4, 1.8, 2.8]} target={[0, 0.3, 0]} autoRotate rotateSpeed={1.4} grid={false} fov={36} minDistance={1.5} maxDistance={6}>
      <group scale={s}><Carton dims={box.dims} color={box.color} /></group>
      <ContactShadows position={[0, 0.002, 0]} opacity={0.5} scale={4} blur={2.4} far={2} />
    </Scene3D>
  )
}
