import { Html } from './Label3D'
import { useFrame } from '@react-three/fiber'
import { useRef } from 'react'
import * as THREE from 'three'
import type { MoveObject } from '../../models/types'
import { ObjectModel } from './ObjectModel'

export type ClearStage = 'idle' | 'approach' | 'blocked' | 'solving' | 'rotate' | 'pass' | 'done'

interface Props {
  obj: MoveObject
  doorWidth: number // cm
  doorHeight: number
  stage: ClearStage
  rotated: boolean // final orientation is rolled onto its side
  detach: boolean
  ok: boolean // stage outcome colouring
  crossSection: { horiz: number; vert: number }
}

const damp = (a: number, b: number, k: number, dt: number) => a + (b - a) * (1 - Math.exp(-k * dt))

export function ClearanceScene({ obj, doorWidth, doorHeight, stage, rotated, detach, ok, crossSection }: Props) {
  const mover = useRef<THREE.Group>(null)
  const roller = useRef<THREE.Group>(null)
  const W = doorWidth / 100, H = doorHeight / 100
  const w = obj.dims[0] / 100, d = obj.dims[1] / 100, h = obj.dims[2] / 100
  const state = useRef({ z: 4.2, roll: 0 })
  const colorBad = '#f87171', colorOk = '#34d399'
  const frameColor = stage === 'blocked' ? colorBad : stage === 'pass' || stage === 'done' ? colorOk : '#6d8bff'
  const halfLen = Math.max(w, d) / 2

  useFrame(({ clock }, dt) => {
    const s = state.current
    let tz = 4.2, tr = 0
    if (stage === 'approach') tz = halfLen + 0.04
    if (stage === 'blocked') { tz = halfLen + 0.04 - Math.max(0, Math.sin(clock.elapsedTime * 9)) * 0.06 }
    if (stage === 'solving') tz = halfLen + 1.1
    if (stage === 'rotate') { tz = halfLen + 1.1; tr = rotated ? Math.PI / 2 : 0 }
    if (stage === 'pass') { tz = -(halfLen + 1.2); tr = rotated ? Math.PI / 2 : 0 }
    if (stage === 'done') { tz = -(halfLen + 1.0); tr = rotated ? Math.PI / 2 : 0 }
    s.z = damp(s.z, tz, stage === 'blocked' ? 14 : 2.6, dt)
    s.roll = damp(s.roll, tr, 3, dt)
    if (mover.current) mover.current.position.z = s.z
    if (roller.current) {
      roller.current.rotation.z = s.roll
      const rollFrac = s.roll / (Math.PI / 2)
      roller.current.position.y = THREE.MathUtils.lerp(h / 2, Math.min(d, w) / 2 + (detach ? 0 : 0.0), rollFrac)
    }
  })

  const wallMat = <meshStandardMaterial color="#8da2c8" transparent opacity={0.35} roughness={0.6} />
  const sideLen = 3.2
  return (
    <group>
      {/* floors */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.005, 0]} receiveShadow><planeGeometry args={[10, 12]} /><meshStandardMaterial color="#121926" roughness={1} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 3.2]}><planeGeometry args={[6.4, 5]} /><meshBasicMaterial color="#6d8bff" transparent opacity={0.05} /></mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -3.2]}><planeGeometry args={[6.4, 5]} /><meshBasicMaterial color="#2dd4bf" transparent opacity={0.05} /></mesh>
      {/* wall with doorway */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (W / 2 + sideLen / 2), 1.3, 0]} castShadow>
          <boxGeometry args={[sideLen, 2.6, 0.12]} />{wallMat}
        </mesh>
      ))}
      <mesh position={[0, (H + 2.6) / 2, 0]}><boxGeometry args={[W, 2.6 - H, 0.12]} />{wallMat}</mesh>
      {/* frame */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[sx * (W / 2 + 0.02), H / 2, 0]}>
          <boxGeometry args={[0.05, H, 0.16]} /><meshStandardMaterial color={frameColor} emissive={frameColor} emissiveIntensity={0.9} />
        </mesh>
      ))}
      <mesh position={[0, H + 0.02, 0]}><boxGeometry args={[W + 0.1, 0.05, 0.16]} /><meshStandardMaterial color={frameColor} emissive={frameColor} emissiveIntensity={0.9} /></mesh>
      {/* aperture glow */}
      <mesh position={[0, H / 2, 0]}><planeGeometry args={[W, H]} /><meshBasicMaterial color={frameColor} transparent opacity={stage === 'blocked' || stage === 'done' || stage === 'pass' ? 0.12 : 0.05} side={THREE.DoubleSide} depthWrite={false} /></mesh>
      {/* cross-section outline at the doorway plane */}
      {stage !== 'idle' && (
        <lineSegments position={[0, Math.max(crossSection.vert, 0) / 200 + 0.01, 0.0]}>
          <edgesGeometry args={[new THREE.PlaneGeometry(crossSection.horiz / 100, crossSection.vert / 100)]} />
          <lineBasicMaterial color={crossSection.horiz <= doorWidth - 2 ? colorOk : colorBad} />
        </lineSegments>
      )}
      <Html position={[0, H + 0.35, 0]} center distanceFactor={9} style={{ pointerEvents: 'none' }}>
        <div className="whitespace-nowrap rounded-lg border border-white/20 bg-black/75 px-3 py-1.5 text-xs font-semibold text-white">Doorway · {doorWidth} cm</div>
      </Html>
      <Html position={[0, 0.05, 3.2]} center distanceFactor={11} style={{ pointerEvents: 'none' }}><div className="label whitespace-nowrap">Hallway</div></Html>
      <Html position={[0, 0.05, -3.2]} center distanceFactor={11} style={{ pointerEvents: 'none' }}><div className="label whitespace-nowrap !text-teal-300">Living room</div></Html>
      {/* the object: yaw 90° so its long side travels along z */}
      <group ref={mover} position={[0, 0, 4.2]}>
        <group ref={roller} position={[0, h / 2, 0]}>
          <group rotation={[0, w >= d ? Math.PI / 2 : 0, 0]} position={[0, -h / 2, 0]}>
            <ObjectModel kind={obj.kind} dims={obj.dims} color={obj.color} hideFeet={detach} emissive={stage === 'blocked' ? '#f87171' : stage === 'done' || stage === 'pass' ? '#34d399' : '#000000'} intensity={stage === 'blocked' ? 0.35 : stage === 'done' || stage === 'pass' ? 0.2 : 0} />
          </group>
        </group>
      </group>
      <Html position={[0, 0.0, 0]} style={{ pointerEvents: 'none' }}><div /></Html>
      {ok && null}
    </group>
  )
}
