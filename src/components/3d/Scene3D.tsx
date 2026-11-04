import { Canvas } from '@react-three/fiber'
import { LabelLayer, LabelProvider, LabelRegistry } from './Label3D'
import { OrbitControls } from '@react-three/drei'
import { Suspense, useEffect, useMemo, useRef, type MutableRefObject, type ReactNode } from 'react'
import type { OrbitControls as OrbitImpl } from 'three-stdlib'

interface Props {
  children: ReactNode
  className?: string
  camera?: [number, number, number]
  target?: [number, number, number]
  fov?: number
  resetKey?: number
  autoRotate?: boolean
  rotateSpeed?: number
  controls?: boolean
  grid?: boolean
  shadows?: boolean
  maxDistance?: number
  minDistance?: number
  onMiss?: () => void
  light?: number
  controlsRef?: MutableRefObject<OrbitImpl | null>
}

/** Shared R3F canvas: lighting, orbit controls, reset support, graceful suspense. */
export function Scene3D({ children, className, camera = [7, 8.5, 10.5], target = [0, 0.6, 0], fov = 42, resetKey = 0, autoRotate, rotateSpeed = 0.6, controls = true, grid = true, shadows = true, maxDistance = 30, minDistance = 2, onMiss, light = 1, controlsRef }: Props) {
  const own = useRef<OrbitImpl | null>(null)
  const ref = controlsRef ?? own
  const registry = useMemo(() => new LabelRegistry(), [])
  useEffect(() => {
    ref.current?.reset()
  }, [resetKey])
  return (
    <div className={className} style={{ position: 'relative', width: '100%', height: '100%' }}>
    <Canvas
      style={{ width: '100%', height: '100%' }}
      shadows={shadows}
      dpr={[1, 1.75]}
      camera={{ position: camera, fov, near: 0.1, far: 100 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      onPointerMissed={onMiss}
    >
      <ambientLight intensity={0.55 * light} />
      <hemisphereLight args={['#bcd0ff', '#1a1f2b', 0.55 * light]} />
      <directionalLight position={[6, 11, 5]} intensity={1.15 * light} castShadow={shadows} shadow-mapSize={[2048, 2048]} shadow-camera-left={-12} shadow-camera-right={12} shadow-camera-top={12} shadow-camera-bottom={-12} shadow-bias={-0.0005} />
      <pointLight position={[-6, 4, -4]} intensity={0.35 * light} color="#6d8bff" />
      {grid && <gridHelper args={[40, 40, '#1b2433', '#111826']} position={[0, -0.012, 0]} />}
      <LabelProvider value={registry}><Suspense fallback={null}>{children}</Suspense></LabelProvider>
      {controls && (
        <OrbitControls
          ref={ref as never}
          makeDefault
          target={target}
          enableDamping
          dampingFactor={0.08}
          maxPolarAngle={Math.PI / 2.02}
          minDistance={minDistance}
          maxDistance={maxDistance}
          autoRotate={autoRotate}
          autoRotateSpeed={rotateSpeed}
        />
      )}
    </Canvas>
    <LabelLayer registry={registry} />
    </div>
  )
}

export function zoomBy(ref: MutableRefObject<OrbitImpl | null>, factor: number) {
  const c = ref.current
  if (!c) return
  c.object.position.sub(c.target).multiplyScalar(factor).add(c.target)
  c.update()
}
