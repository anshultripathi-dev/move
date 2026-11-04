import { PageHeader, RouteTabs } from '../../components/ui'
import { useRoute } from '../../hooks/useRoute'
import Arrival from './Arrival'
import Loading from './Loading'
import LiveTracking from './LiveTracking'
import MoveDay from './MoveDay'
import QRScanner from './QRScanner'

export default function Tracking() {
  const { path } = useRoute()
  const sub = path.split('/')[2]
  const tabs = [
    { to: '/tracking', label: 'Live Journey' },
    { to: '/tracking/qr', label: 'QR Scanner' },
    { to: '/tracking/loading', label: 'Loading' },
    { to: '/tracking/moveday', label: 'Move Day' },
    { to: '/tracking/arrival', label: 'Arrival' },
  ]
  const meta: Record<string, [string, string]> = {
    undefined: ['Live move tracking', 'State-based journey tracking — no GPS required. Every object and box moves through the same lifecycle.'],
    qr: ['QR tracking', 'Scan a box label to see where it is, where it has been and what it holds.'],
    loading: ['Loading dashboard', 'Know exactly what is on the truck, what is left, and in which order it should go.'],
    moveday: ['Move Day control center', 'Crew, vehicle, cargo and exceptions in one live view.'],
    arrival: ['Arrival dashboard', 'What arrived, what did not, and what needs your attention.'],
  }
  const [t, s] = meta[String(sub)] ?? meta.undefined
  return (
    <div>
      <PageHeader eyebrow="Tracking" title={t} sub={s} tabs={<RouteTabs items={tabs} path={path} />} />
      {sub === 'qr' ? <QRScanner /> : sub === 'loading' ? <Loading /> : sub === 'moveday' ? <MoveDay /> : sub === 'arrival' ? <Arrival /> : <LiveTracking />}
    </div>
  )
}
