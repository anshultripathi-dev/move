import { Html } from './Label3D'
import { useFrame } from '@react-three/fiber'
import { useRef, useState } from 'react'
import * as THREE from 'three'
import type { Placed } from '../../utils/loadplan'

function Cargo({ p, state }: { p: Placed; state: 'loaded' | 'pending' | 'overflow' }) {
  const g = useRef<THREE.Group>(null)
  const [hover, setHover] = useState(false)
  const k = useRef(0)
  useFrame((_, dt) => {
    k.current = Math.min(1, k.current + dt * 2.5)
    if (g.current) g.current.scale.setScalar(0.001 + k.current * 0.999)
  })
  const color = state === 'overflow' ? '#f87171' : p.step.fragile ? '#e7b27a' : p.step.color
  const wire = state === 'pending'
  return (
    <group ref={g} position={p.pos} onPointerOver={(e) => { e.stopPropagation(); setHover(true) }} onPointerOut={() => setHover(false)}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={p.size} />
        <meshStandardMaterial color={color} roughness={0.8} transparent={wire || state === 'overflow'} opacity={wire ? 0.08 : state === 'overflow' ? 0.85 : 1} emissive={hover ? '#6d8bff' : state === 'overflow' ? '#7f1d1d' : '#000000'} emissiveIntensity={hover ? 0.6 : 0.4} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(...p.size)]} />
        <lineBasicMaterial color={wire ? '#6d8bff' : p.step.essential ? '#fbbf24' : p.step.fragile ? '#f87171' : '#000000'} transparent opacity={wire ? 0.7 : 0.6} />
      </lineSegments>
      {(hover || state === 'overflow') && (
        <Html center distanceFactor={7} position={[0, p.size[1] / 2 + 0.12, 0]} style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded-md border border-white/15 bg-black/80 px-2 py-1 text-[10px] text-white">#{p.step.step} {p.step.label}{state === 'overflow' ? ' · no room' : ''}</div>
        </Html>
      )}
    </group>
  )
}

export function TruckScene({ bay, placed, loaded }: { bay: [number, number, number]; placed: Placed[]; loaded?: Set<string> }) {
  const [L, W, H] = bay
  return (
    <group position={[-L / 2, 0, -W / 2]}>
      {/* road */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[L / 2, -0.28, W / 2]} receiveShadow><planeGeometry args={[18, 8]} /><meshStandardMaterial color="#0e131d" roughness={1} /></mesh>
      {/* bay floor */}
      <mesh position={[L / 2, -0.03, W / 2]} receiveShadow><boxGeometry args={[L + 0.1, 0.06, W + 0.1]} /><meshStandardMaterial color="#2a3345" roughness={0.7} /></mesh>
      {/* chassis + wheels */}
      <mesh position={[L / 2, -0.16, W / 2]}><boxGeometry args={[L + 1.8, 0.16, W * 0.85]} /><meshStandardMaterial color="#161b26" /></mesh>
      {[[0.5, 0], [0.5, W], [L - 0.5, 0], [L - 0.5, W]].map(([x, z], i) => (
        <mesh key={i} position={[x, -0.15, z]} rotation={[Math.PI / 2, 0, 0]} castShadow><cylinderGeometry args={[0.32, 0.32, 0.22, 24]} /><meshStandardMaterial color="#0b0d12" roughness={0.8} /></mesh>
      ))}
      {/* cab */}
      <group position={[-0.9, 0, W / 2]}>
        <mesh position={[0, 0.55, 0]} castShadow><boxGeometry args={[1.7, 1.1, W]} /><meshStandardMaterial color="#6d8bff" roughness={0.4} metalness={0.3} /></mesh>
        <mesh position={[-0.2, 1.25, 0]}><boxGeometry args={[1.2, 0.5, W - 0.1]} /><meshStandardMaterial color="#6d8bff" roughness={0.4} metalness={0.3} /></mesh>
        <mesh position={[-0.82, 1.3, 0]}><boxGeometry args={[0.04, 0.38, W - 0.25]} /><meshStandardMaterial color="#9bd1ff" roughness={0.1} metalness={0.6} /></mesh>
      </group>
      {/* walls: back (front of bay), far side glass, roof frame */}
      <mesh position={[0.02, H / 2, W / 2]}><boxGeometry args={[0.04, H, W]} /><meshStandardMaterial color="#a8b8d8" transparent opacity={0.28} /></mesh>
      <mesh position={[L / 2, H / 2, W]}><boxGeometry args={[L, H, 0.04]} /><meshStandardMaterial color="#a8b8d8" transparent opacity={0.12} /></mesh>
      <lineSegments position={[L / 2, H / 2, W / 2]}><edgesGeometry args={[new THREE.BoxGeometry(L, H, W)]} /><lineBasicMaterial color="#8ea4ff" /></lineSegments>
      {placed.map((p) => (
        <Cargo key={p.step.id} p={p} state={!p.fits ? 'overflow' : loaded && !loaded.has(p.step.id) ? 'pending' : 'loaded'} />
      ))}
    </group>
  )
}
