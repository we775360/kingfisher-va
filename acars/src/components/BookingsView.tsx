import { useEffect, useState } from 'react'
import { Briefcase, ExternalLink, Navigation, RefreshCw } from 'lucide-react'
import { useFlightStore } from '../stores/flightStore'
import { getMyBookings } from '../lib/api'

export function BookingsView() {
  const { handleSimBriefFetch, sbUsername } = useFlightStore()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    getMyBookings().then((data) => {
      setBookings(data.filter((b: any) => b.status === 'UPCOMING'))
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDispatch = (b: any) => {
    const dep = b.route?.depIcao || b.depIcao
    const arr = b.route?.arrIcao || b.arrIcao
    const type = b.aircraft?.icao || 'A320'
    const flt = (b.route?.flightNumber || b.flightNumber || '').replace(/\D/g, '')
    window.open(`https://www.simbrief.com/system/dispatch.php?type=generate&orig=${dep}&dest=${arr}&fltnum=${flt}&type=${type}&airline=KFR&auto=1`, '_blank')
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black italic uppercase tracking-tight">Tasks</h2>
          <p className="text-xs text-neutral-500 font-bold tracking-wider mt-1">Pending operational assignments</p>
        </div>
        <button onClick={load} className="p-3 glass rounded-xl hover:bg-neutral-800 transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-24 glass rounded-2xl animate-pulse" />)}
        </div>
      ) : bookings.length === 0 ? (
        <div className="glass rounded-3xl py-20 text-center">
          <Briefcase className="w-10 h-10 text-neutral-700 mx-auto mb-4" />
          <p className="text-sm font-bold text-neutral-500 tracking-wider">No upcoming assignments</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((b: any) => (
            <div key={b.id} className="glass rounded-2xl p-6 flex items-center justify-between hover:border-kf-red/30 transition-all group">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-black italic tracking-tight">{b.route?.depIcao || b.depIcao}</div>
                    <div className="text-[9px] font-bold text-neutral-500 tracking-wider">{(b.route?.depName || '').split(' ')[0]}</div>
                  </div>
                  <Navigation className="w-4 h-4 text-neutral-700 rotate-90" />
                  <div className="text-center">
                    <div className="text-2xl font-black italic tracking-tight">{b.route?.arrIcao || b.arrIcao}</div>
                    <div className="text-[9px] font-bold text-neutral-500 tracking-wider">{(b.route?.arrName || '').split(' ')[0]}</div>
                  </div>
                </div>
                <div className="w-px h-10 bg-neutral-800" />
                <div>
                  <div className="text-[10px] font-black text-kf-red tracking-wider">{b.route?.flightNumber || b.flightNumber}</div>
                  <div className="text-sm font-bold italic">{b.aircraft?.name || 'Aircraft'}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDispatch(b)}
                  className="p-3 glass rounded-xl hover:bg-neutral-800 transition-colors"
                  title="Dispatch in SimBrief"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
                <button onClick={() => {
                  const user = prompt('SimBrief Username:', sbUsername)
                  if (user) handleSimBriefFetch(user)
                }}
                  className="p-3 bg-kf-red hover:bg-red-700 rounded-xl transition-colors"
                  title="Link Mission"
                >
                  <Briefcase className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
