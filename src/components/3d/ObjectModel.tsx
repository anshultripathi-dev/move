import { RoundedBox } from '@react-three/drei'
import { createContext, useContext, type ReactNode } from 'react'
import * as THREE from 'three'
import type { Kind } from '../../models/types'

interface Ctx { emissive: string; intensity: number; opacity: number; tint?: string }
const MatCtx = createContext<Ctx>({ emissive: '#000000', intensity: 0, opacity: 1 })

export function shade(hex: string, amt: number) {
  const c = new THREE.Color(hex)
  c.offsetHSL(0, 0, amt)
  return `#${c.getHexString()}`
}

function M({ c, r = 0.65, m = 0.04, glow }: { c: string; r?: number; m?: number; glow?: string }) {
  const x = useContext(MatCtx)
  return (
    <meshStandardMaterial
      color={x.tint ?? c}
      roughness={r}
      metalness={m}
      emissive={glow ?? x.emissive}
      emissiveIntensity={glow ? 1.1 : x.intensity}
      transparent={x.opacity < 1}
      opacity={x.opacity}
    />
  )
}

type V3 = [number, number, number]
function Bx({ s, p, c, r, m, glow, round = 0.012 }: { s: V3; p: V3; c: string; r?: number; m?: number; glow?: string; round?: number }) {
  return (
    <RoundedBox args={s} position={p} radius={Math.min(round, Math.min(...s) / 2.2)} smoothness={2} castShadow receiveShadow>
      <M c={c} r={r} m={m} glow={glow} />
    </RoundedBox>
  )
}
function Cy({ r, h, p, c, rt, glow, seg = 20, rough, metal }: { r: number; h: number; p: V3; c: string; rt?: number; glow?: string; seg?: number; rough?: number; metal?: number }) {
  return (
    <mesh position={p} castShadow>
      <cylinderGeometry args={[rt ?? r, r, h, seg]} />
      <M c={c} glow={glow} r={rough} m={metal} />
    </mesh>
  )
}
function Sp({ r, p, c, sy = 1 }: { r: number; p: V3; c: string; sy?: number }) {
  return (
    <mesh position={p} scale={[1, sy, 1]} castShadow>
      <sphereGeometry args={[r, 16, 12]} />
      <M c={c} r={0.9} />
    </mesh>
  )
}

interface ModelProps {
  kind: Kind
  dims: [number, number, number] // cm
  color: string
  hideFeet?: boolean
}

/** Procedural models. Origin = bottom centre; front faces +Z. */
export function Model({ kind, dims, color, hideFeet }: ModelProps) {
  const w = dims[0] / 100, d = dims[1] / 100, h = dims[2] / 100
  const dark = shade(color, -0.12), light = shade(color, 0.08)
  switch (kind) {
    case 'sofa': {
      const f = hideFeet ? 0 : 0.07
      const ar = w * 0.09
      return (
        <group position={[0, hideFeet ? 0 : 0, 0]}>
          <Bx s={[w, 0.22, d]} p={[0, f + 0.11, 0]} c={color} round={0.05} />
          <Bx s={[w - ar * 2, h - f - 0.2, d * 0.26]} p={[0, f + 0.2 + (h - f - 0.2) / 2, -d / 2 + d * 0.13]} c={dark} round={0.06} />
          {[-1, 1].map((sx) => <Bx key={sx} s={[ar, h * 0.62 - f, d]} p={[sx * (w / 2 - ar / 2), f + (h * 0.62 - f) / 2, 0]} c={color} round={0.05} />)}
          {[-1, 0, 1].map((i) => <Bx key={i} s={[(w - ar * 2) / 3 - 0.012, 0.12, d * 0.66]} p={[i * ((w - ar * 2) / 3), f + 0.22 + 0.06, d * 0.12]} c={light} round={0.04} />)}
          {!hideFeet && [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => <Cy key={i} r={0.03} h={f} p={[a * (w / 2 - 0.08), f / 2, b * (d / 2 - 0.08)]} c="#2b2218" />)}
        </group>
      )
    }
    case 'desk':
      return (
        <group>
          <Bx s={[w, 0.04, d]} p={[0, h - 0.02, 0]} c={color} round={0.01} />
          {[-1, 1].map((sx) => <Bx key={sx} s={[0.04, h - 0.04, d - 0.06]} p={[sx * (w / 2 - 0.05), (h - 0.04) / 2, 0]} c={dark} />)}
          <Bx s={[w - 0.12, h * 0.4, 0.02]} p={[0, h * 0.7, -d / 2 + 0.05]} c={dark} />
          <Bx s={[0.32, 0.16, d - 0.1]} p={[w / 2 - 0.26, h - 0.12, 0]} c={shade(color, -0.05)} />
        </group>
      )
    case 'chair':
      return (
        <group>
          <Bx s={[w * 0.8, 0.07, d * 0.8]} p={[0, h * 0.45, 0]} c={color} round={0.03} />
          <Bx s={[w * 0.75, h * 0.42, 0.06]} p={[0, h * 0.72, -d * 0.38]} c={dark} round={0.03} />
          <Cy r={0.03} h={h * 0.4} p={[0, h * 0.22, 0]} c="#444b57" metal={0.7} />
          {[0, 1, 2, 3, 4].map((i) => <Bx key={i} s={[w * 0.46, 0.025, 0.04]} p={[Math.cos((i / 5) * Math.PI * 2) * w * 0.22, 0.03, Math.sin((i / 5) * Math.PI * 2) * w * 0.22]} c="#444b57" m={0.6} />)}
        </group>
      )
    case 'tv':
      return (
        <group>
          <Bx s={[w * 0.4, 0.015, d]} p={[0, 0.0075, 0]} c="#1b1f29" />
          <Bx s={[0.05, h * 0.18, 0.04]} p={[0, h * 0.1, 0]} c="#1b1f29" />
          <Bx s={[w, h * 0.78, 0.03]} p={[0, h * 0.2 + h * 0.39, 0]} c="#0a0c10" r={0.3} m={0.5} />
          <mesh position={[0, h * 0.2 + h * 0.39, 0.0165]}><planeGeometry args={[w * 0.96, h * 0.74]} /><M c="#0e2038" glow="#1d4ed8" /></mesh>
        </group>
      )
    case 'monitor':
      return (
        <group>
          <Bx s={[w, h * 0.68, 0.025]} p={[0, h * 0.32 + h * 0.34, 0]} c="#0a0c10" r={0.3} />
          <mesh position={[0, h * 0.32 + h * 0.34, 0.014]}><planeGeometry args={[w * 0.95, h * 0.62]} /><M c="#102a4a" glow="#2563eb" /></mesh>
          <Bx s={[0.04, h * 0.32, 0.03]} p={[0, h * 0.16, -0.02]} c="#2b303b" />
          <Bx s={[w * 0.4, 0.015, d * 0.8]} p={[0, 0.0075, 0]} c="#2b303b" />
        </group>
      )
    case 'floorlamp':
      return (
        <group>
          <Cy r={w * 0.4} h={0.025} p={[0, 0.0125, 0]} c="#2b2f38" metal={0.6} />
          <Cy r={0.012} h={h * 0.8} p={[0, h * 0.4, 0]} c="#9aa1ad" metal={0.8} />
          <Cy r={w * 0.48} rt={w * 0.3} h={h * 0.22} p={[0, h * 0.89, 0]} c={color} glow="#f59e0b" />
        </group>
      )
    case 'tablelamp':
      return (
        <group>
          <Cy r={w * 0.28} h={h * 0.08} p={[0, h * 0.04, 0]} c="#cbd5e1" metal={0.5} />
          <Cy r={0.008} h={h * 0.5} p={[0, h * 0.3, 0]} c="#cbd5e1" metal={0.6} />
          <Cy r={w * 0.48} rt={w * 0.26} h={h * 0.32} p={[0, h * 0.78, 0]} c={color} glow="#fbbf24" />
        </group>
      )
    case 'shelf': {
      const rows = 5
      return (
        <group>
          {[-1, 1].map((sx) => <Bx key={sx} s={[0.025, h, d]} p={[sx * (w / 2 - 0.0125), h / 2, 0]} c={color} />)}
          <Bx s={[w, h, 0.01]} p={[0, h / 2, -d / 2 + 0.005]} c={dark} />
          {Array.from({ length: rows + 1 }).map((_, i) => <Bx key={i} s={[w, 0.025, d]} p={[0, 0.0125 + (i * (h - 0.025)) / rows, 0]} c={color} />)}
          {Array.from({ length: rows }).map((_, i) =>
            [0, 1, 2, 3].map((j) => <Bx key={`${i}${j}`} s={[0.06 + ((i + j) % 3) * 0.015, (h / rows) * 0.62, d * 0.7]} p={[-w / 2 + 0.12 + j * 0.15, 0.025 + (i * (h - 0.025)) / rows + (h / rows) * 0.33, 0]} c={['#a3563c', '#3f6a8a', '#d6b25e', '#5b7a52'][(i + j) % 4]} />),
          )}
        </group>
      )
    }
    case 'bed':
      return (
        <group>
          <Bx s={[w, 0.2, d]} p={[0, 0.2, 0]} c={dark} round={0.02} />
          <Bx s={[w - 0.04, 0.22, d - 0.08]} p={[0, 0.41, 0.02]} c="#e8e6ef" round={0.05} />
          <Bx s={[w, h, 0.08]} p={[0, h / 2, -d / 2 + 0.04]} c={color} round={0.03} />
          <Bx s={[w, 0.45, 0.06]} p={[0, 0.225, d / 2 - 0.03]} c={dark} />
          <Bx s={[w - 0.04, 0.12, d * 0.55]} p={[0, 0.58, d * 0.2]} c={color} round={0.05} />
        </group>
      )
    case 'wardrobe':
      return (
        <group>
          <Bx s={[w, h, d]} p={[0, h / 2, 0]} c={color} round={0.012} />
          {[-1, 1].map((sx) => <Bx key={sx} s={[w / 2 - 0.012, h - 0.05, 0.015]} p={[sx * (w / 4), h / 2, d / 2 + 0.005]} c={shade(color, 0.04)} />)}
          {[-1, 1].map((sx) => <Bx key={`h${sx}`} s={[0.012, 0.22, 0.02]} p={[sx * 0.04, h * 0.5, d / 2 + 0.025]} c="#d1d5db" m={0.8} />)}
          <Bx s={[w - 0.02, 0.06, d - 0.02]} p={[0, 0.03, 0]} c={dark} />
        </group>
      )
    case 'appliance':
      return (
        <group>
          <Bx s={[w, h, d]} p={[0, h / 2, 0]} c={color} m={0.5} r={0.4} />
          <Bx s={[w * 0.68, h * 0.78, 0.01]} p={[-w * 0.1, h / 2, d / 2 + 0.003]} c="#0b1220" r={0.2} m={0.5} />
          <Bx s={[w * 0.16, h * 0.7, 0.012]} p={[w * 0.36, h / 2, d / 2 + 0.003]} c="#1e293b" />
        </group>
      )
    case 'rug':
      return (
        <group>
          <Bx s={[w, 0.02, d]} p={[0, 0.011, 0]} c={color} round={0.008} r={1} />
          <Bx s={[w - 0.2, 0.022, d - 0.2]} p={[0, 0.012, 0]} c={shade(color, 0.07)} round={0.008} r={1} />
        </group>
      )
    case 'plant':
      return (
        <group>
          <Cy r={w * 0.28} rt={w * 0.22} h={h * 0.26} p={[0, h * 0.13, 0]} c="#b9774a" />
          {[[0, 0.5, 0, 0.17], [0.07, 0.7, 0.03, 0.14], [-0.07, 0.62, -0.04, 0.15], [0.03, 0.88, -0.02, 0.12], [-0.04, 0.8, 0.06, 0.12]].map(([x, y, z, r], i) => <Sp key={i} r={w * (r as number) * 1.5} p={[(x as number) * w * 2, h * (y as number), (z as number) * w * 2]} c={shade(color, (i % 3) * 0.04)} sy={1.15} />)}
        </group>
      )
    case 'vase':
      return (
        <group>
          <Cy r={w * 0.3} rt={w * 0.36} h={h * 0.4} p={[0, h * 0.2, 0]} c={color} rough={0.3} />
          <Sp r={w * 0.4} p={[0, h * 0.4, 0]} c={color} sy={1.1} />
          <Cy r={w * 0.14} rt={w * 0.2} h={h * 0.3} p={[0, h * 0.78, 0]} c={color} rough={0.3} />
        </group>
      )
    case 'frames':
      return (
        <group>
          {[[-0.22, 0.95, -0.03], [0, 1, 0.01], [0.2, 0.8, 0.04]].map(([dx, sc, rz], i) => (
            <group key={i} position={[(dx as number) * w, 0, i * 0.012]} rotation={[-0.12, 0, rz as number]}>
              <Bx s={[w * 0.5 * (sc as number), h * (sc as number) * 0.92, 0.02]} p={[0, h * (sc as number) * 0.46, 0]} c={color} />
              <Bx s={[w * 0.4 * (sc as number), h * (sc as number) * 0.76, 0.006]} p={[0, h * (sc as number) * 0.46, 0.012]} c={['#3b6fb0', '#c75c4a', '#4f9e82'][i]} />
            </group>
          ))}
        </group>
      )
    case 'bag':
      return <RoundedBox args={[w, h, d]} radius={Math.min(w, h, d) * 0.28} smoothness={4} position={[0, h / 2, 0]} castShadow><M c={color} r={1} /></RoundedBox>
    case 'books':
      return (
        <group>
          {[0, 1, 2, 3, 4].map((i) => <Bx key={i} s={[w * 0.17, h * (0.8 + (i % 3) * 0.1), d]} p={[-w * 0.4 + i * w * 0.2, (h * (0.8 + (i % 3) * 0.1)) / 2, 0]} c={['#a3563c', '#3f6a8a', '#d6b25e', '#5b7a52', '#7a4f8a'][i]} />)}
        </group>
      )
    case 'pan':
      return (
        <group>
          <Cy r={Math.min(w, d) * 0.4} h={h} p={[0, h / 2, 0]} c={color} metal={0.6} rough={0.35} seg={28} />
          <Bx s={[w * 0.38, h * 0.4, 0.025]} p={[Math.min(w, d) * 0.4 + w * 0.17, h * 0.6, 0]} c="#272b33" />
        </group>
      )
    case 'cable':
      return (
        <group>
          <mesh position={[0, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.04, 0.008, 8, 20]} /><M c="#1f2937" /></mesh>
          <mesh position={[0.07, 0.01, 0]} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.04, 0.008, 8, 20]} /><M c="#1f2937" /></mesh>
        </group>
      )
    default:
      return <Bx s={[w, h, d]} p={[0, h / 2, 0]} c={color} round={Math.min(w, d, h) * 0.18} />
  }
}

export function ObjectModel({ kind, dims, color, emissive = '#000000', intensity = 0, opacity = 1, tint, hideFeet }: ModelProps & { emissive?: string; intensity?: number; opacity?: number; tint?: string }) {
  return (
    <MatCtx.Provider value={{ emissive, intensity, opacity, tint }}>
      <Model kind={kind} dims={dims} color={color} hideFeet={hideFeet} />
    </MatCtx.Provider>
  )
}

/** Cardboard carton with tape stripe. dims in cm. */
export function Carton({ dims, color, emissive = '#000000', intensity = 0, label }: { dims: [number, number, number]; color: string; emissive?: string; intensity?: number; label?: ReactNode }) {
  const w = dims[0] / 100, d = dims[1] / 100, h = dims[2] / 100
  return (
    <MatCtx.Provider value={{ emissive, intensity, opacity: 1 }}>
      <group>
        <Bx s={[w, h, d]} p={[0, h / 2, 0]} c={color} r={0.9} round={0.006} />
        <Bx s={[w * 0.12, 0.004, d + 0.002]} p={[0, h + 0.001, 0]} c="#e7d3a8" r={0.6} round={0} />
        <Bx s={[w * 0.12, h + 0.002, 0.004]} p={[0, h / 2, d / 2 + 0.001]} c="#e7d3a8" r={0.6} round={0} />
        <mesh position={[w * 0.25, h * 0.45, d / 2 + 0.003]}><planeGeometry args={[Math.min(0.1, w * 0.3), Math.min(0.1, h * 0.5)]} /><meshStandardMaterial color="#f8fafc" roughness={0.7} /></mesh>
        {label}
      </group>
    </MatCtx.Provider>
  )
}
