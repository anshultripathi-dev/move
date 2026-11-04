import { useEffect, type ReactNode } from 'react'
import { Empty } from './components/ui'
import Assistant from './features/assistant/Assistant'
import Complete from './features/complete/Complete'
import Damage from './features/damage/Damage'
import Dashboard from './features/dashboard/Dashboard'
import Destination from './features/destination/Destination'
import DigitalTwin from './features/digital-twin/DigitalTwin'
import Inventory from './features/inventory/Inventory'
import ObjectDetails from './features/inventory/ObjectDetails'
import Exceptions from './features/management/Exceptions'
import Readiness from './features/management/Readiness'
import Timeline from './features/management/Timeline'
import CreateMove from './features/onboarding/CreateMove'
import Landing from './features/onboarding/Landing'
import Scan from './features/onboarding/Scan'
import PhotoDetect from './features/detect/PhotoDetect'
import BoxDetails from './features/packing/BoxDetails'
import Boxes from './features/packing/Boxes'
import SmartPacking from './features/packing/SmartPacking'
import Planning from './features/planning/Planning'
import Reassembly from './features/reassembly/Reassembly'
import Reconciliation from './features/reconciliation/Reconciliation'
import Tracking from './features/tracking/Tracking'
import { navigate, useRoute } from './hooks/useRoute'
import { Shell } from './layouts/Shell'
import { useMove } from './state/store'

function resolve(path: string): ReactNode {
  const seg = path.split('/').filter(Boolean)
  const [a, b] = seg
  switch (a) {
    case 'overview': return <Dashboard />
    case 'scan': return <Scan />
    case 'detect': return <PhotoDetect />
    case 'twin': return <DigitalTwin />
    case 'inventory': return <Inventory />
    case 'object': return <ObjectDetails id={b ?? ''} />
    case 'destination': return <Destination />
    case 'planning': return <Planning />
    case 'packing': return <SmartPacking />
    case 'boxes': return <Boxes />
    case 'box': return <BoxDetails id={b ?? ''} />
    case 'tracking': return <Tracking />
    case 'reconciliation': return <Reconciliation />
    case 'damage': return <Damage />
    case 'reassembly': return <Reassembly />
    case 'timeline': return <Timeline />
    case 'readiness': return <Readiness />
    case 'exceptions': return <Exceptions />
    case 'assistant': return <Assistant />
    case 'complete': return <Complete />
    default: return <Empty title="Screen not found" action={<button className="btn-primary" onClick={() => navigate('/overview')}>Go to overview</button>} />
  }
}

export default function App() {
  const { path } = useRoute()
  const hasMove = useMove((s) => s.hasMove)
  useEffect(() => { window.scrollTo(0, 0) }, [path])
  if (path === '/' || path === '') return <Landing />
  if (path === '/new') return <CreateMove />
  if (!hasMove) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div className="card max-w-md p-8 text-center">
          <h1 className="h-display text-2xl">No move loaded</h1>
          <p className="mt-2 text-sm text-slate-400">Load the demo move to explore the full MOVE lifecycle.</p>
          <div className="mt-6 flex justify-center gap-2">
            <button className="btn-primary" onClick={() => useMove.getState().loadDemo()}>Load Demo Move</button>
            <button className="btn-ghost" onClick={() => navigate('/new')}>Create move</button>
          </div>
        </div>
      </div>
    )
  }
  return <Shell path={path}>{resolve(path)}</Shell>
}
