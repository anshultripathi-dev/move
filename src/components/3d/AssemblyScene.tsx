import { Html } from './Label3D'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'

type V3 = [number, number, number]
interface Part { id: string; label: string; step: number; color: string; size: V3; at: V3; away: V3; bolts?: boolean }

const wood = '#9b7b5a', dark = '#6f573f'
export const ASSEMBLY_PARTS: Record<string, Part[]> = {
  'OBJ-019': [
    { id: 'legL', label: 'Left leg', step: 0, color: dark, size: [0.04, 0.71, 0.56], at: [-0.56, 0.355, 0], away: [-1.4, 0.355, 0] },
    { id: 'brace', label: 'Cross-brace', step: 0, color: '#7a6149', size: [1.08, 0.26, 0.02], at: [0, 0.55, -0.26], away: [0, 0.55, -1.2] },
    { id: 'bolts', label: 'Bolts ×4', step: 1, color: '#cbd5e1', size: [0.03, 0.05, 0.03], at: [0, 0.6, 0], away: [0, 1.6, 0.5], bolts: true },
    { id: 'legR', label: 'Right leg', step: 2, color: dark, size: [0.04, 0.71, 0.56], at: [0.56, 0.355, 0], away: [1.4, 0.355, 0] },
    { id: 'top', label: 'Tabletop', step: 3, color: wood, size: [1.2, 0.04, 0.6], at: [0, 0.73, 0], away: [0, 1.7, 0] },
  ],
  'OBJ-030': [
    { id: 'railL', label: 'Side rail L', step: 0, color: dark, size: [0.06, 0.2, 2.0], at: [-0.77, 0.2, 0.0], away: [-1.6, 0.2, 0] },
    { id: 'railR', label: 'Side rail R', step: 0, color: dark, size: [0.06, 0.2, 2.0], at: [0.77, 0.2, 0.0], away: [1.6, 0.2, 0] },
    { id: 'head', label: 'Headboard', step: 1, color: '#7c6f8f', size: [1.6, 0.95, 0.08], at: [0, 0.475, -1.0], away: [0, 0.475, -2.2] },
    { id: 'bolts', label: 'Bolts ×6', step: 1, color: '#cbd5e1', size: [0.03, 0.05, 0.03], at: [0, 0.4, -0.95], away: [0, 1.6, -1.2], bolts: true },
    { id: 'slats', label: 'Slats ×14', step: 2, color: '#c9a36b', size: [1.5, 0.03, 1.9], at: [0, 0.25, 0], away: [0, 1.4, 0] },
    { id: 'mat', label: 'Mattress', step: 3, color: '#e8e6ef', size: [1.52, 0.22, 1.92], at: [0, 0.38, 0], away: [0, 2.1, 0] },
  ],
  'OBJ-031': [
    { id: 'body', label: 'Carcass', step: 0, color: '#a68a6d', size: [1.0, 2.0, 0.55], at: [0, 1.0, 0], away: [0, 1.0, 0] },
    { id: 'shelves', label: 'Shelves ×4', step: 1, color: '#c3a98a', size: [0.94, 0.03, 0.5], at: [0, 1.2, 0.02], away: [-1.6, 1.2, 0.6] },
    { id: 'doors', label: 'Doors ×2', step: 2, color: '#b79a7b', size: [0.98, 1.92, 0.025], at: [0, 1.0, 0.29], away: [1.6, 1.0, 0.9] },
  ],
  'OBJ-026': [
    { id: 'upL', label: 'Upright L', step: 0, color: '#6b5a48', size: [0.025, 1.8, 0.3], at: [-0.39, 0.9, 0], away: [-1.2, 0.9, 0] },
    { id: 'upR', label: 'Upright R', step: 0, color: '#6b5a48', size: [0.025, 1.8, 0.3], at: [0.39, 0.9, 0], away: [1.2, 0.9, 0] },
    { id: 'shelves', label: 'Shelves ×5', step: 1, color: '#8a7560', size: [0.76, 0.025, 0.3], at: [0, 0.9, 0], away: [0, 2.0, 0.7] },
    { id: 'bracket', label: 'Wall bracket', step: 2, color: '#cbd5e1', size: [0.12, 0.05, 0.02], at: [0, 1.75, -0.16], away: [0, 2.2, -0.9] },
  ],
}

function PartMesh({ part, progress }: { part: Part; progress: number }) {
  const g = useRef<THREE.Group>(null)
  const attached = progress > part.step
  const next = progress === part.step
  const target = new THREE.Vector3(...(attached ? part.at : part.away))
  useFrame(({ clock }, dt) => {
    if (!g.current) return
    g.current.position.lerp(target, 1 - Math.exp(-dt * 4))
    if (next) g.current.position.y += Math.sin(clock.elapsedTime * 3) * 0.0025
  })
  const emissive = next ? '#6d8bff' : '#000000'
  return (
    <group ref={g} position={part.away}>
      {part.bolts ? (
        [-0.5, -0.17, 0.17, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 0, 0]} castShadow><cylinderGeometry args={[0.014, 0.014, 0.06, 12]} /><meshStandardMaterial color={part.color} metalness={0.8} roughness={0.3} emissive={emissive} emissiveIntensity={0.9} /></mesh>
        ))
      ) : (
        <mesh castShadow receiveShadow>
          <boxGeometry args={part.size} />
          <meshStandardMaterial color={part.color} roughness={0.7} emissive={emissive} emissiveIntensity={next ? 0.5 : 0} transparent={!attached} opacity={attached ? 1 : 0.82} />
        </mesh>
      )}
      {!attached && (
        <Html center distanceFactor={7} position={[0, part.size[1] / 2 + 0.12, 0]} style={{ pointerEvents: 'none' }}>
          <div className={`whitespace-nowrap rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${next ? 'border-accent bg-accent text-white' : 'border-white/15 bg-black/70 text-slate-300'}`}>{part.label}</div>
        </Html>
      )}
    </group>
  )
}

export function AssemblyScene({ objectId, progress }: { objectId: string; progress: number }) {
  const parts = ASSEMBLY_PARTS[objectId] ?? []
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow><circleGeometry args={[2.6, 64]} /><meshStandardMaterial color="#131a27" roughness={1} /></mesh>
      {parts.map((p) => <PartMesh key={p.id} part={p} progress={progress} />)}
    </group>
  )
}
