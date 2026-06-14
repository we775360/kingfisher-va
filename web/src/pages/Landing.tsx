import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Globe from 'react-globe.gl'
import { Download, Monitor, Zap, Shield, Globe as GlobeIcon, Users, Calendar, Trophy, Plane } from 'lucide-react'

const AIRPORT_COORDS: Record<string, { lat: number, lng: number }> = {
  'VABB': { lat: 19.0896, lng: 72.8656 },
  'VIDP': { lat: 28.5562, lng: 77.1000 },
  'VOMM': { lat: 12.9941, lng: 80.1709 },
  'VOBL': { lat: 13.1986, lng: 77.7066 },
  'VECC': { lat: 22.6547, lng: 88.4467 },
  'VAGO': { lat: 15.3800, lng: 73.8314 },
  'VHYD': { lat: 17.2403, lng: 78.4297 },
  'VIAR': { lat: 31.7096, lng: 74.7973 },
  'VAID': { lat: 22.7217, lng: 75.8011 },
  'VANP': { lat: 21.0922, lng: 79.0582 },
  'VAAH': { lat: 23.0772, lng: 72.6347 },
  'VILK': { lat: 26.7606, lng: 80.8893 },
  'VIGG': { lat: 26.1061, lng: 91.5859 },
  'VIPK': { lat: 26.8242, lng: 75.8122 },
  'VOCB': { lat: 11.0294, lng: 77.0434 },
  'VOKC': { lat: 10.1520, lng: 76.4019 },
  'VOTV': { lat: 8.4821, lng: 76.9200 },
  'VABJ': { lat: 23.2878, lng: 69.6701 },
  'VAJM': { lat: 22.4795, lng: 70.0116 },
  'VAPR': { lat: 21.6487, lng: 69.6572 },
  'VARK': { lat: 22.3092, lng: 70.7794 },
  'VASU': { lat: 21.1153, lng: 72.7423 },
  'VAVV': { lat: 22.3364, lng: 73.2264 },
  'VOVZ': { lat: 17.7211, lng: 83.2246 },
  'VEBS': { lat: 20.2444, lng: 85.8178 },
  'VAPO': { lat: 18.5822, lng: 73.9197 },
  'VIBP': { lat: 23.2875, lng: 77.3378 },
  'VISR': { lat: 33.9872, lng: 74.7741 },
  'VAAU': { lat: 19.8659, lng: 75.3980 },
  'VOPN': { lat: 18.5822, lng: 73.9197 },
  'OMDB': { lat: 25.2532, lng: 55.3657 },
  'OTHH': { lat: 25.2731, lng: 51.6081 },
  'EGLL': { lat: 51.4700, lng: -0.4543 },
  'KJFK': { lat: 40.6413, lng: -73.7781 },
  'WSSS': { lat: 1.3644, lng: 103.9915 },
  'VHHH': { lat: 22.3080, lng: 113.9185 },
}

const DISCORD = 'https://discord.gg/Y7hxzG76'
const API = typeof window !== 'undefined' && window.location.hostname === 'localhost'
  ? 'http://localhost:8000/api/v1'
  : 'https://kingfisher-api.onrender.com/api/v1'

export default function Landing() {
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [stats, setStats] = useState({ pilots: 0, routes: 0, flights: 0 })
  const [fleet, setFleet] = useState<any[]>([])
  const [routes, setRoutes] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [topPilots, setTopPilots] = useState<any[]>([])
  const [liveFlights, setLiveFlights] = useState<any[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    document.title = 'Kingfisher Virtual Airlines'
    const fetchData = () => {
      Promise.all([
        fetch(`${API}/public/stats`).then(r => r.json()).catch(() => ({})),
        fetch(`${API}/public/fleet`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/routes`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/events`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/pilots`).then(r => r.json()).catch(() => []),
        fetch(`${API}/public/live-flights`).then(r => r.json()).catch(() => []),
      ]).then(([s, f, r, e, p, l]) => {
        if (s && typeof s === 'object') setStats(s)
        if (Array.isArray(f)) setFleet(f.slice(0, 6))
        if (Array.isArray(r)) setRoutes(r.slice(0, 8))
        if (Array.isArray(e)) setEvents(e.slice(0, 3))
        if (Array.isArray(p)) setTopPilots(p.slice(0, 6))
        if (Array.isArray(l)) setLiveFlights(l)
        setLoaded(true)
      })
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const nav = [
    { label: 'About', id: 'about' },
    { label: 'Fleet', id: 'fleet' },
    { label: 'Live Map', id: 'live-map' },
    { label: 'ACARS', id: 'acars' },
    { label: 'Join', id: 'join' },
  ]

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const rankColor = (rank: string) => {
    if (rank === 'ATPL') return '#d4af37'
    if (rank === 'CPL') return '#8b5cf6'
    if (rank === 'PPL') return '#3b82f6'
    return '#6b7280'
  }

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif', color: '#111', background: '#fff' }}>

      {/* NAV */}
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 999,
        background: 'rgba(255,255,255,0.96)',
        borderBottom: '1px solid #e8e8e8',
        backdropFilter: 'blur(10px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <img src="/logo.png" alt="KFR" style={{ width: 36, height: 36, objectFit: 'contain' }} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#c0121e' }}>KINGFISHER VA</div>
              <div style={{ fontSize: 10, color: '#999', letterSpacing: 1 }}>OFFICIAL PORTAL · ICAO KFR</div>
            </div>
          </div>

          <nav style={{ display: 'flex', gap: 28, alignItems: 'center' }} className="desktop-nav">
            {nav.map(n => (
              <button key={n.id} onClick={() => go(n.id)}
                style={{ background: 'none', border: 'none', fontSize: 13, color: '#444', cursor: 'pointer', fontWeight: 500, padding: 0 }}
                onMouseEnter={e => (e.currentTarget.style.color = '#c0121e')}
                onMouseLeave={e => (e.currentTarget.style.color = '#444')}>
                {n.label}
              </button>
            ))}
          </nav>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={() => navigate('/login')}
              style={{ background: 'none', border: '1px solid #ddd', padding: '7px 16px', fontSize: 13, color: '#555', cursor: 'pointer', fontWeight: 500, borderRadius: 2 }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0121e'; e.currentTarget.style.color = '#c0121e' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = '#ddd'; e.currentTarget.style.color = '#555' }}>
              Login
            </button>
            <button onClick={() => navigate('/register')}
              style={{ background: '#c0121e', border: 'none', padding: '7px 18px', fontSize: 13, color: '#fff', cursor: 'pointer', fontWeight: 700, borderRadius: 2 }}
              onMouseEnter={e => (e.currentTarget.style.background = '#a01018')}
              onMouseLeave={e => (e.currentTarget.style.background = '#c0121e')}>
              Join Free
            </button>
            <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn"
              style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <div style={{ width: 20, height: 2, background: '#333', margin: '4px 0' }} />
              <div style={{ width: 20, height: 2, background: '#333', margin: '4px 0' }} />
              <div style={{ width: 20, height: 2, background: '#333', margin: '4px 0' }} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div style={{ borderTop: '1px solid #eee', background: '#fff', padding: '12px 20px' }}>
            {nav.map(n => (
              <button key={n.id} onClick={() => go(n.id)}
                style={{ display: 'block', width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: '10px 0', fontSize: 15, color: '#333', cursor: 'pointer', borderBottom: '1px solid #f5f5f5' }}>
                {n.label}
              </button>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={() => navigate('/login')} style={{ flex: 1, padding: 10, border: '1px solid #ddd', background: '#fff', fontSize: 13, cursor: 'pointer', borderRadius: 2 }}>Login</button>
              <button onClick={() => navigate('/register')} style={{ flex: 1, padding: 10, border: 'none', background: '#c0121e', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 2 }}>Join Free</button>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section style={{ paddingTop: 60, minHeight: '100vh', display: 'flex', alignItems: 'center', background: 'linear-gradient(135deg, #fff 0%, #fff5f5 60%, #ffe0e0 100%)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', fontSize: 280, fontWeight: 900, color: 'rgba(192,18,30,0.04)', lineHeight: 1, userSelect: 'none', pointerEvents: 'none', letterSpacing: -10 }}>KFR</div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '60px 20px', width: '100%' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 60, alignItems: 'center' }} className="hero-grid">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e5e5e5', padding: '5px 12px', marginBottom: 24, borderRadius: 2 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666', letterSpacing: 0.5, textTransform: 'uppercase' }}>Founded 2026 · Custom ACARS Live</span>
              </div>

              <h1 style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: -2, color: '#0a0a0a' }}>
                A Virtual Airline<br />
                <span style={{ color: '#c0121e' }}>Built for Pilots</span><br />
                <span style={{ color: '#555', fontWeight: 600, fontSize: '0.65em' }}>Who Love Flying.</span>
              </h1>

              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.75, margin: '0 0 28px', maxWidth: 500 }}>
                Kingfisher Virtual Airlines is a community VA based in India, running on MSFS, X-Plane and P3D.
                File PIREPs, earn virtual salary, and track every flight with our custom ACARS.
              </p>

              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 40 }}>
                <button onClick={() => navigate('/register')}
                  style={{ background: '#c0121e', color: '#fff', border: 'none', padding: '13px 28px', fontSize: 14, fontWeight: 700, cursor: 'pointer', borderRadius: 2, letterSpacing: 0.3 }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#a01018')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#c0121e')}>
                  Register — It's Free
                </button>
                <a href={DISCORD} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#5865F2', color: '#fff', border: 'none', padding: '13px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 2, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.044.031.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                  Discord
                </a>
                <button onClick={() => go('acars')}
                  style={{ background: '#fff', color: '#c0121e', border: '1px solid #c0121e', padding: '13px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 2 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#c0121e'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#c0121e' }}>
                  Download ACARS
                </button>
              </div>

              <div style={{ display: 'flex', gap: 32, paddingTop: 24, borderTop: '1px solid #e8e8e8' }}>
                {[
                  { v: loaded ? stats.pilots : '–', l: 'Registered Pilots', live: true },
                  { v: loaded ? stats.routes : '–', l: 'Active Routes', live: true },
                  { v: loaded ? stats.flights : '–', l: 'Flights Logged', live: true },
                ].map(s => (
                  <div key={s.l}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 26, fontWeight: 900, color: '#c0121e', lineHeight: 1 }}>{s.v}</span>
                      {s.live && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />}
                    </div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 3, textTransform: 'uppercase', letterSpacing: 0.5 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.1 }}
              style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }} className="hero-logo">
              <div style={{ position: 'absolute', width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(192,18,30,0.12), transparent 70%)', filter: 'blur(20px)' }} />
              <img src="/logo.png" alt="Kingfisher VA"
                style={{ width: 340, height: 340, objectFit: 'contain', position: 'relative', zIndex: 1, filter: 'drop-shadow(0 16px 48px rgba(192,18,30,0.25))' }} />
            </motion.div>
          </div>
        </div>
      </section>

      {/* LIVE MAP SECTION */}
      <section id="live-map" style={{ padding: '72px 20px', background: '#0a0a0a', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c0121e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Network Status</div>
            <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#fff', letterSpacing: -1, margin: 0 }}>Live Operational Map</h2>
            <p style={{ fontSize: 15, color: '#666', marginTop: 12, maxWidth: 600, margin: '12px auto 0' }}>
              Real-time telemetry from Kingfisher pilots currently airborne across our network. 
              Tracked via our custom ACARS technology.
            </p>
          </div>

          <div style={{ height: 600, background: '#050505', border: '1px solid #1a1a1a', borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
            {loaded && (
              <Globe
                width={typeof window !== 'undefined' ? (window.innerWidth > 1100 ? 1100 : window.innerWidth - 40) : 800}
                height={600}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                pointsData={liveFlights.map(f => ({
                  lat: f.lat,
                  lng: f.lng,
                  name: `${f.pilot.pilotId} - ${f.flightNumber}`,
                  label: `${f.flightNumber} (${f.aircraftType})`
                }))}
                pointColor={() => '#c0121e'}
                pointRadius={0.5}
                pointAltitude={0.02}
                labelsData={liveFlights.map(f => ({
                  lat: f.lat,
                  lng: f.lng,
                  text: `${f.flightNumber}\n${Math.round(f.alt)} FT`
                }))}
                labelColor={() => '#fff'}
                labelSize={0.8}
                labelDotRadius={0.3}
                arcsData={liveFlights.filter(f => f.phase !== 'PRE-FLIGHT').map(f => ({
                  startLat: f.lat - 0.1,
                  startLng: f.lng - 0.1,
                  endLat: f.lat,
                  endLng: f.lng,
                  color: ['rgba(192,18,30,0)', '#c0121e']
                }))}
                arcColor="color"
                arcStroke={0.5}
              />
            )}
            
            {/* Live Flight Overlay */}
            <div style={{ position: 'absolute', top: 20, right: 20, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {liveFlights.length === 0 ? (
                <div style={{ background: 'rgba(0,0,0,0.8)', padding: '15px 20px', border: '1px solid #c0121e44', backdropFilter: 'blur(10px)' }}>
                  <div style={{ color: '#fff', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#666' }} />
                    No Active Flights
                  </div>
                </div>
              ) : (
                liveFlights.slice(0, 5).map(f => (
                  <div key={f.id} style={{ background: 'rgba(0,0,0,0.8)', padding: '12px 18px', borderLeft: '3px solid #c0121e', backdropFilter: 'blur(10px)', minWidth: 200 }}>
                    <div style={{ color: '#c0121e', fontSize: 10, fontWeight: 800 }}>{f.flightNumber}</div>
                    <div style={{ color: '#fff', fontSize: 13, fontWeight: 700, margin: '2px 0' }}>{f.pilot.pilotId} · {f.pilot.firstName}</div>
                    <div style={{ color: '#666', fontSize: 10, textTransform: 'uppercase' }}>{f.phase} · {Math.round(f.alt)} FT · {Math.round(f.groundSpeed)} KTS</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ACARS DOWNLOAD SECTION */}
      <section id="acars" style={{ padding: '100px 20px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="two-col">
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c0121e', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 12 }}>Proprietary Technology</div>
              <h2 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, letterSpacing: -1, margin: '0 0 20px' }}>Kingfisher Custom ACARS</h2>
              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.8, marginBottom: 32 }}>
                Experience ultimate immersion with our bespoke flight tracking software. 
                Built specifically for Kingfisher Virtual Airlines, it connects your simulator 
                directly to our operations center.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
                <div style={{ display: 'flex', gap: 12 }}>
                   <div style={{ color: '#c0121e' }}><Zap size={20} /></div>
                   <div>
                     <div style={{ fontWeight: 700, fontSize: 14 }}>Instant Sync</div>
                     <div style={{ fontSize: 12, color: '#888' }}>Auto-dispatch from portal</div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                   <div style={{ color: '#c0121e' }}><Monitor size={20} /></div>
                   <div>
                     <div style={{ fontWeight: 700, fontSize: 14 }}>Live Telemetry</div>
                     <div style={{ fontSize: 12, color: '#888' }}>IAS, Mach, Pitch, Bank</div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                   <div style={{ color: '#c0121e' }}><Shield size={20} /></div>
                   <div>
                     <div style={{ fontWeight: 700, fontSize: 14 }}>Auto-Filing</div>
                     <div style={{ fontSize: 12, color: '#888' }}>Zero-click PIREP system</div>
                   </div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                   <div style={{ color: '#c0121e' }}><GlobeIcon size={20} /></div>
                   <div>
                     <div style={{ fontWeight: 700, fontSize: 14 }}>Global Map</div>
                     <div style={{ fontSize: 12, color: '#888' }}>Real-time route tracking</div>
                   </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <a href="#" style={{ background: '#0a0a0a', color: '#fff', textDecoration: 'none', padding: '16px 32px', borderRadius: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Download size={18} />
                  Download for Windows
                </a>
                <div style={{ padding: '16px 20px', border: '1px solid #eee', color: '#999', fontSize: 12, fontWeight: 500 }}>
                  Version 1.1.0 (Stable)
                </div>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ background: '#0a0a0a', padding: 10, borderRadius: 12, boxShadow: '0 30px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ background: '#111', height: 400, borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ height: 30, background: '#1a1a1a', display: 'flex', alignItems: 'center', px: 10, gap: 5, padding: '0 10px' }}>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5f56' }} />
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ffbd2e' }} />
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#27c93f' }} />
                  </div>
                  <div style={{ flex: 1, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', textAlign: 'center' }}>
                     <img src="/logo.png" style={{ width: 60, height: 60, opacity: 0.8, marginBottom: 20 }} />
                     <div style={{ color: '#c0121e', fontSize: 10, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3, marginBottom: 5 }}>ACARS CORE</div>
                     <div style={{ color: '#fff', fontSize: 18, fontWeight: 800, italic: 'italic' }}>MISSION CONTROL ONLINE</div>
                     <div style={{ marginTop: 20, width: '80%', height: 2, background: '#222', position: 'relative' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '65%', background: '#c0121e' }} />
                     </div>
                     <div style={{ color: '#444', fontSize: 10, marginTop: 10 }}>SYNCING WITH MSFS 2020...</div>
                  </div>
                </div>
              </div>
              <div style={{ position: 'absolute', -bottom: 20, -right: 20, background: '#c0121e', color: '#fff', padding: '15px 25px', fontWeight: 900, fontStyle: 'italic', boxShadow: '0 10px 30px rgba(192,18,30,0.3)' }}>
                VAMSYS TYPE EXPERIENCE
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" style={{ padding: '72px 20px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'start' }} className="two-col">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c0121e', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Who We Are</div>
            <h2 style={{ fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 800, margin: '0 0 20px', letterSpacing: -0.8, lineHeight: 1.2 }}>
              Built by a Pilot,<br />for Pilots.
            </h2>
            <div style={{ borderLeft: '4px solid #c0121e', paddingLeft: 18, marginBottom: 20 }}>
              <p style={{ fontSize: 14, color: '#444', lineHeight: 1.8, margin: 0 }}>
                Hi, I'm <strong style={{ color: '#c0121e' }}>Guneet Singh</strong> — 15 years old, from India, and the founder of Kingfisher Virtual Airlines.
                I started KFR because I wanted a proper VA — one with a real dashboard, real PIREP system, ranks, salary and bespoke technology.
                This is that VA. We're growing fast, and I'd love to have you onboard.
              </p>
              <p style={{ fontSize: 12, color: '#888', marginTop: 10, margin: '10px 0 0' }}>— Guneet Singh, CEO & Founder · KFR</p>
            </div>
            <p style={{ fontSize: 14, color: '#666', lineHeight: 1.8, marginBottom: 20 }}>
              Kingfisher VA runs a full pilot progression system. You start as a Student Pilot,
              log hours, get PIREPs approved, and work your way up — PPL, CPL, ATPL.
              Every approved flight earns you virtual salary at <strong>$500/hour</strong>.
            </p>
            <div style={{ display: 'flex', gap: 20 }}>
              <button onClick={() => navigate('/register')}
                style={{ background: '#c0121e', color: '#fff', border: 'none', padding: '11px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 2 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#a01018')}
                onMouseLeave={e => (e.currentTarget.style.background = '#c0121e')}>
                Join the VA
              </button>
              <a href={DISCORD} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#5865F2', fontSize: 13, fontWeight: 600, textDecoration: 'none', padding: '11px 0' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.044.031.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                Join Discord
              </a>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }}>
            <div style={{ background: '#0a0a0a', padding: 28 }}>
              <img src="/logo.png" alt="KFR" style={{ width: '100%', maxWidth: 220, margin: '0 auto', display: 'block', filter: 'drop-shadow(0 0 30px rgba(192,18,30,0.5))' }} />
              <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #222', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { label: 'ICAO', value: 'KFR' },
                  { label: 'Callsign', value: 'KINGFISHER' },
                  { label: 'Based In', value: 'India' },
                  { label: 'Founded', value: '2026' },
                  { label: 'Simulators', value: 'MSFS · XP · P3D' },
                  { label: 'Status', value: 'ACARS ACTIVE' },
                ].map(i => (
                  <div key={i.label}>
                    <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: 1 }}>{i.label}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginTop: 3 }}>{i.value}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 2, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              {[
                { icon: <Zap size={18} />, title: 'Rank System', desc: 'Student → PPL → CPL → ATPL' },
                { icon: <Zap size={18} />, title: '$500/hr Salary', desc: 'Earn on every approved flight' },
                { icon: <Zap size={18} />, title: 'PIREP System', desc: 'Auto-tracked via Custom ACARS' },
                { icon: <Zap size={18} />, title: 'Awards', desc: 'Earn badges as you progress' },
              ].map(f => (
                <div key={f.title} style={{ background: '#fafafa', border: '1px solid #eee', padding: '14px 16px' }}>
                  <div style={{ color: '#c0121e', marginBottom: 5 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div style={{ height: 1, background: '#eee' }} />

      {/* PARTNERSHIPS */}
      <section style={{ padding: '40px 20px', background: '#fff' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#999', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 32 }}>Official Partnerships & Networks</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center', gap: '40px 80px', opacity: 0.6 }}>
            {[
              { name: 'VATSIM', url: 'https://vatsim.net', logo: 'https://vatsim.net/vatsim-logo-color.svg' },
              { name: 'IVAO', url: 'https://ivao.aero', logo: 'https://www.ivao.aero/images/logo_ivao.png' },
              { name: 'IVAO India', url: 'https://in.ivao.aero', logo: 'https://www.ivao.aero/images/logo_ivao.png' },
              { name: 'SimBrief', url: 'https://www.simbrief.com', logo: 'https://www.simbrief.com/system/images/simbrief_logo_small.png' }
            ].map(p => (
              <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer" 
                style={{ display: 'block', transition: 'all 0.3s ease', filter: 'grayscale(100%)' }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'grayscale(0%)'; e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1.05)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = 'grayscale(100%)'; e.currentTarget.style.opacity = '0.6'; e.currentTarget.style.transform = 'scale(1)' }}>
                <img src={p.logo} alt={p.name} style={{ height: p.name === 'SimBrief' ? 24 : 32, width: 'auto', objectFit: 'contain' }} 
                  onError={e => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = `<span style="font-weight: 800; color: #333;">${p.name}</span>` }} />
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* FLEET */}
      <section id="fleet" style={{ padding: '72px 20px', background: '#fafafa' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c0121e', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Aircraft</div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Our Fleet</h2>
            </div>
            <button onClick={() => navigate('/flights')} style={{ background: 'none', border: 'none', color: '#c0121e', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              Book a Flight →
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
            {fleet.map((a, i) => (
              <motion.div key={a.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.05 }} viewport={{ once: true }}
                style={{ background: '#fff', border: '1px solid #e5e5e5', cursor: 'default' }}>
                <div style={{ background: 'linear-gradient(135deg, #0f0f0f, #1a0303)', padding: '24px 16px', textAlign: 'center', position: 'relative' }}>
                  <img src="/logo.png" alt="KFR" style={{ width: 44, height: 44, objectFit: 'contain', opacity: 0.75 }} />
                  <div style={{ position: 'absolute', top: 8, right: 8, background: '#c0121e', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px' }}>{a.type}</div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: 11, color: '#c0121e', fontFamily: 'monospace', fontWeight: 600, marginBottom: 10 }}>{a.registration}</div>
                  <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #f5f5f5', paddingTop: 10 }}>
                    <div><div style={{ fontSize: 15, fontWeight: 800 }}>{a.pax}</div><div style={{ fontSize: 10, color: '#aaa' }}>Seats</div></div>
                    <div><div style={{ fontSize: 15, fontWeight: 800 }}>{a.range}nm</div><div style={{ fontSize: 10, color: '#aaa' }}>Range</div></div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* JOIN CTA */}
      <section id="join" style={{ background: '#c0121e', padding: '72px 20px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
            <img src="/logo.png" alt="KFR" style={{ width: 70, height: 70, objectFit: 'contain', marginBottom: 20, filter: 'brightness(10)' }} />
            <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 46px)', fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: -1 }}>Ready to Start Flying?</h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 28, lineHeight: 1.7 }}>Join the most advanced virtual airline community in India.</p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => navigate('/register')} style={{ background: '#fff', color: '#c0121e', border: 'none', padding: '14px 36px', fontSize: 15, fontWeight: 800, cursor: 'pointer' }}>Register Free</button>
              <a href={DISCORD} target="_blank" rel="noopener noreferrer" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.35)', padding: '14px 28px', fontSize: 15, fontWeight: 600, textDecoration: 'none' }}>Discord</a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* FOOTER */}
      <footer style={{ background: '#0a0a0a', color: '#fff', padding: '48px 20px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 36 }} className="footer-grid">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <img src="/logo.png" alt="KFR" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                <div><div style={{ fontWeight: 800, fontSize: 13 }}>KINGFISHER VA</div><div style={{ fontSize: 10, color: '#d4af37' }}>VIRTUAL AIRLINE</div></div>
              </div>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.7, maxWidth: 240 }}>A virtual airline built by pilots, for pilots. Based in India. Flying worldwide. Founded 2026.</p>
            </div>
            <div>
               <div style={{ fontSize: 10, fontWeight: 700, color: '#555', textTransform: 'uppercase', marginBottom: 14 }}>Pages</div>
               <button onClick={() => go('about')} style={{ display: 'block', background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer', marginBottom: 9, padding: 0 }}>About</button>
               <button onClick={() => go('fleet')} style={{ display: 'block', background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer', marginBottom: 9, padding: 0 }}>Fleet</button>
               <button onClick={() => go('live-map')} style={{ display: 'block', background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer', marginBottom: 9, padding: 0 }}>Live Tracking</button>
            </div>
          </div>
          <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#333' }}>© 2026 Kingfisher Virtual Airlines · Not affiliated with Kingfisher Airlines Ltd.</div>
            <div style={{ fontSize: 12, color: '#333' }}>Built by <span style={{ color: '#d4af37', fontWeight: 600 }}>Guneet Singh</span> · Custom ACARS v1.1.0</div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hero-logo { order: -1; }
          .two-col { grid-template-columns: 1fr !important; gap: 32px !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}