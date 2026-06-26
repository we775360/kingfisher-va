import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Polyline, useMap } from 'react-leaflet'
import { Navigation } from 'lucide-react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { useFlightStore } from '../stores/flightStore'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const planeIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/723/723955.png',
  iconSize: [32, 32],
  iconAnchor: [16, 16],
})

function RecenterMap({ position }: { position: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    if (position[0] !== 0 && position[0] !== 20.5937) {
      map.setView(position, map.getZoom())
    }
  }, [position, map])
  return null
}

export function MapViewComponent({ onSetTab }: { onSetTab?: (tab: string) => void }) {
  const { ofp, flightData, flightHistory } = useFlightStore()
  const [history, setHistory] = useState<[number, number][]>([])

  useEffect(() => {
    if (flightHistory.length > 0) setHistory(flightHistory)
  }, [flightHistory])

  const noMission = !ofp

  if (noMission) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-kf-black text-white space-y-6">
        <div className="w-24 h-24 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-800 shadow-2xl">
          <Navigation className="w-10 h-10 text-neutral-700" />
        </div>
        <div className="text-center space-y-2">
          <h3 className="text-2xl font-black italic uppercase tracking-tighter">No Mission Active</h3>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em]">Map systems offline until flight initialization.</p>
        </div>
        {onSetTab && (
          <button onClick={() => onSetTab('dashboard')}
            className="px-8 py-3 bg-kf-red hover:bg-kf-red-dark text-white text-[10px] font-black uppercase italic rounded-xl transition-all shadow-xl shadow-kf-red/20"
          >
            Return to Mission Control
          </button>
        )}
      </div>
    )
  }

  const pos: [number, number] = flightData && flightData.lat !== 0 ? [flightData.lat, flightData.lng] : [20.5937, 78.9629]

  return (
    <div className="flex-1 w-full bg-neutral-950 overflow-hidden relative shadow-2xl min-h-0">
      <MapContainer center={pos} zoom={5} style={{ height: '100%', width: '100%', minHeight: '400px' }} zoomControl={false}>
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
        {flightData && flightData.lat !== 0 && (
          <>
            <Marker position={pos} icon={planeIcon} />
            <Polyline positions={history} color="#D61C22" weight={3} opacity={0.8} />
            <RecenterMap position={pos} />
          </>
        )}
      </MapContainer>

      <div className="absolute top-8 left-8 z-[1000] space-y-4 pointer-events-none">
        <div className="bg-kf-black/80 backdrop-blur-2xl p-6 rounded-3xl border border-neutral-800/50 shadow-2xl pointer-events-auto">
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-kf-red/10 rounded-xl flex items-center justify-center border border-kf-red/20 shadow-lg shadow-kf-red/5">
                <Navigation className="w-5 h-5 text-kf-red" />
              </div>
              <div>
                <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest block mb-0.5">Live Telemetry</span>
                <span className="text-xl font-black italic tracking-tighter uppercase leading-none">
                  {ofp ? `${ofp.general.icao_airline}${ofp.general.flight_number}` : 'No Active Mission'}
                </span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-10 gap-y-4">
              <div>
                <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Latitude</span>
                <span className="text-sm font-mono font-bold">{flightData?.lat.toFixed(6) || '0.000000'}</span>
              </div>
              <div>
                <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Longitude</span>
                <span className="text-sm font-mono font-bold">{flightData?.lng.toFixed(6) || '0.000000'}</span>
              </div>
              <div>
                <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Ground Speed</span>
                <span className="text-sm font-mono font-bold">{Math.round(flightData?.gs || 0)} <span className="text-[10px] text-neutral-700">KTS</span></span>
              </div>
              <div>
                <span className="text-[8px] font-black text-neutral-600 uppercase tracking-widest block">Altitude</span>
                <span className="text-sm font-mono font-bold">{Math.round(flightData?.alt || 0).toLocaleString()} <span className="text-[10px] text-neutral-700">FT</span></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
