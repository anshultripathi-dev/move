import { ContactShadows } from '@react-three/drei'
import { Scene3D } from './Scene3D'
import { ObjectModel } from './ObjectModel'
import type { MoveObject } from '../../models/types'

export function ObjectPreview({ obj, className, hideFeet, autoRotate = true }: { obj: Pick<MoveObject, 'kind' | 'dims' | 'color'>; className?: string; hideFeet?: boolean; autoRotate?: boolean }) {
  const max = Math.max(...obj.dims) / 100
  const s = 1.7 / max
  return (
    <Scene3D className={className} camera={[1.9, 1.5, 2.4]} target={[0, 0.45, 0]} light={1.5} autoRotate={autoRotate} rotateSpeed={1.2} grid={false} minDistance={1.5} maxDistance={7} fov={38}>
      <group scale={s} position={[0, 0, 0]}>
        <ObjectModel kind={obj.kind} dims={obj.dims} color={obj.color} hideFeet={hideFeet} />
      </group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]}>
        <circleGeometry args={[1.2, 48]} />
        <meshStandardMaterial color="#141b29" roughness={0.9} />
      </mesh>
      <ContactShadows position={[0, 0.002, 0]} opacity={0.5} scale={5} blur={2.4} far={2} />
    </Scene3D>
  )
}
