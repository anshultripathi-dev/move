import { PageHeader, RouteTabs } from '../../components/ui'
import { useRoute } from '../../hooks/useRoute'
import ARPreview from './ARPreview'
import Clearance from './Clearance'
import DestPlanner from './DestPlanner'
import DestScanner from './DestScanner'

export default function Destination() {
  const { path } = useRoute()
  const tabs = [
    { to: '/destination', label: 'Scanner' },
    { to: '/destination/planner', label: '3D Planner' },
    { to: '/destination/clearance', label: 'Clearance Checker' },
    { to: '/destination/ar', label: 'AR Preview' },
  ]
  const sub = path.split('/')[2]
  const meta = {
    undefined: { t: 'Destination scanner', s: 'Scan the new home to capture rooms, doorway widths, walls, windows and free floor space.' },
    planner: { t: 'Destination 3D planner', s: 'Place and rotate furniture in the new home before the truck arrives.' },
    clearance: { t: 'Furniture clearance checker', s: 'Will it fit through the door? MOVE tests every orientation against measured doorways.' },
    ar: { t: 'AR placement preview', s: 'Preview a piece in the new room with fit, clearance and a recommended position.' },
  }[String(sub) as 'undefined']
  return (
    <div>
      <PageHeader eyebrow="Destination" title={meta.t} sub={meta.s} tabs={<RouteTabs items={tabs} path={path} />} />
      {sub === 'planner' ? <DestPlanner /> : sub === 'clearance' ? <Clearance /> : sub === 'ar' ? <ARPreview /> : <DestScanner />}
    </div>
  )
}
