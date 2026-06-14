import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Globe from 'react-globe.gl'

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
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    document.title = 'Kingfisher Virtual Airlines'
    Promise.all([
      fetch(`${API}/public/stats`).then(r => r.json()).catch(() => ({})),
      fetch(`${API}/public/fleet`).then(r => r.json()).catch(() => []),
      fetch(`${API}/public/routes`).then(r => r.json()).catch(() => []),
      fetch(`${API}/public/events`).then(r => r.json()).catch(() => []),
      fetch(`${API}/public/pilots`).then(r => r.json()).catch(() => []),
    ]).then(([s, f, r, e, p]) => {
      if (s && typeof s === 'object') setStats(s)
      if (Array.isArray(f)) setFleet(f.slice(0, 6))
      if (Array.isArray(r)) setRoutes(r.slice(0, 8))
      if (Array.isArray(e)) setEvents(e.slice(0, 3))
      if (Array.isArray(p)) setTopPilots(p.slice(0, 6))
      setLoaded(true)
    })
  }, [])

  const nav = [
    { label: 'About', id: 'about' },
    { label: 'Fleet', id: 'fleet' },
    { label: 'Routes', id: 'routes' },
    { label: 'Pilots', id: 'pilots' },
    { label: 'Events', id: 'events' },
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
              <div style={{ fontSize: 10, color: '#999', letterSpacing: 1 }}>VIRTUAL AIRLINE · ICAO KFR</div>
            </div>
          </div>

          {/* Desktop nav */}
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

        {/* Mobile nav */}
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
                <span style={{ fontSize: 11, fontWeight: 600, color: '#666', letterSpacing: 0.5, textTransform: 'uppercase' }}>Beta 2026 · Open for Registration</span>
              </div>

              <h1 style={{ fontSize: 'clamp(32px, 5vw, 58px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', letterSpacing: -2, color: '#0a0a0a' }}>
                A Virtual Airline<br />
                <span style={{ color: '#c0121e' }}>Built for Pilots</span><br />
                <span style={{ color: '#555', fontWeight: 600, fontSize: '0.65em' }}>Who Love Flying.</span>
              </h1>

              <p style={{ fontSize: 16, color: '#666', lineHeight: 1.75, margin: '0 0 28px', maxWidth: 500 }}>
                Kingfisher Virtual Airlines is a community VA based in India, running on MSFS, X-Plane and P3D.
                File PIREPs, earn virtual salary, climb ranks from Student Pilot to ATPL.
                No ACARS needed to start flying.
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
                <button onClick={() => go('fleet')}
                  style={{ background: '#fff', color: '#c0121e', border: '1px solid #c0121e', padding: '13px 24px', fontSize: 14, fontWeight: 600, cursor: 'pointer', borderRadius: 2 }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#c0121e'; e.currentTarget.style.color = '#fff' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#c0121e' }}>
                  View Fleet
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

      {/* BETA STRIP */}
      <div style={{ background: '#c0121e', color: '#fff', textAlign: 'center', padding: '11px 20px', fontSize: 13 }}>
        <strong>Beta 2026</strong> — Manual PIREPs are live. ACARS auto-tracking, Discord bot and more are on the way.
        <button onClick={() => navigate('/register')}
          style={{ marginLeft: 14, background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', color: '#fff', padding: '3px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer', borderRadius: 2 }}>
          Get Started
        </button>
      </div>

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
                I started KFR because I wanted a proper VA — one with a real dashboard, real PIREP system, ranks, salary and eventually ACARS.
                This is that VA. We're early, we're growing, and I'd love to have you onboard.
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
                  { label: 'Founded', value: '2025' },
                  { label: 'Simulators', value: 'MSFS · XP · P3D' },
                  { label: 'Status', value: 'Beta 2026' },
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
                { icon: '✈', title: 'Rank System', desc: 'Student → PPL → CPL → ATPL' },
                { icon: '$', title: '$500/hr Salary', desc: 'Earn on every approved flight' },
                { icon: '📋', title: 'PIREP System', desc: 'Manual or via ACARS (soon)' },
                { icon: '🏆', title: 'Awards', desc: 'Earn badges as you progress' },
              ].map(f => (
                <div key={f.title} style={{ background: '#fafafa', border: '1px solid #eee', padding: '14px 16px' }}>
                  <div style={{ fontSize: 18, marginBottom: 5 }}>{f.icon}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>{f.title}</div>
                  <div style={{ fontSize: 12, color: '#888' }}>{f.desc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <div style={{ height: 1, background: '#eee' }} />

      {/* PARTNERSHIPS SECTION START */}
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
      {/* PARTNERSHIPS SECTION END */}

      {/* 3D ROUTE MAP SECTION START */}
      <section style={{ padding: '72px 20px', background: '#0a0a0a', position: 'relative', overflow: 'hidden' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', position: 'relative', zIndex: 10 }}>
          <div style={{ marginBottom: 40 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c0121e', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Global Operations</div>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, margin: 0, letterSpacing: -0.5, color: '#fff' }}>
              Our Interactive Route Network
            </h2>
            <p style={{ fontSize: 14, color: '#888', marginTop: 8, maxWidth: 600 }}>
              Explore our live network of routes connecting India to the world. Each arc represents a live route available in our database.
            </p>
          </div>

          <div style={{ height: 600, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', cursor: 'grab' }} className="globe-container">
            {loaded && (
              <Globe
                width={typeof window !== 'undefined' ? (window.innerWidth > 1100 ? 1100 : window.innerWidth - 40) : 800}
                height={600}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-dark.jpg"
                bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                arcsData={routes.filter(r => AIRPORT_COORDS[r.depIcao] && AIRPORT_COORDS[r.arrIcao]).map(r => ({
                  startLat: AIRPORT_COORDS[r.depIcao].lat,
                  startLng: AIRPORT_COORDS[r.depIcao].lng,
                  endLat: AIRPORT_COORDS[r.arrIcao].lat,
                  endLng: AIRPORT_COORDS[r.arrIcao].lng,
                  color: ['#c0121e', '#8b0000'],
                  name: `${r.flightNumber}: ${r.depIcao} → ${r.arrIcao}`
                }))}
                arcColor="color"
                arcDashLength={0.4}
                arcDashGap={2}
                arcDashAnimateTime={2000}
                arcStroke={0.5}
                pointsData={Object.keys(AIRPORT_COORDS).map(key => ({
                  lat: AIRPORT_COORDS[key].lat,
                  lng: AIRPORT_COORDS[key].lng,
                  name: key
                }))}
                pointColor={() => '#c0121e'}
                pointRadius={0.25}
                pointAltitude={0.01}
                labelsData={Object.keys(AIRPORT_COORDS).filter(key => routes.some(r => r.depIcao === key || r.arrIcao === key)).map(key => ({
                  lat: AIRPORT_COORDS[key].lat,
                  lng: AIRPORT_COORDS[key].lng,
                  text: key
                }))}
                labelColor={() => 'rgba(255, 255, 255, 0.8)'}
                labelSize={0.5}
                labelDotRadius={0.2}
                labelResolution={2}
              />
            )}
          </div>
          
          <div style={{ display: 'flex', gap: 24, marginTop: 24 }}>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: 20, borderLeft: '3px solid #c0121e' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{routes.length}</div>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Total Active Routes</div>
            </div>
            <div style={{ flex: 1, background: 'rgba(255,255,255,0.03)', padding: 20, borderLeft: '3px solid #8b0000' }}>
              <div style={{ fontSize: 24, fontWeight: 900, color: '#fff' }}>{Object.keys(AIRPORT_COORDS).length}</div>
              <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 1, marginTop: 4 }}>Connected Hubs</div>
            </div>
          </div>
        </div>
      </section>
      {/* 3D ROUTE MAP SECTION END */}

      <div style={{ height: 1, background: '#eee' }} />

      {/* FLEET */}
      <section id="fleet" style={{ padding: '72px 20px', background: '#fafafa' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c0121e', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Aircraft</div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
                Our Fleet
                {fleet.length > 0 && <span style={{ fontSize: 16, color: '#888', fontWeight: 400, marginLeft: 8 }}>({fleet.length} aircraft)</span>}
              </h2>
            </div>
            <button onClick={() => navigate('/flights')} style={{ background: 'none', border: 'none', color: '#c0121e', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              Book a Flight →
            </button>
          </div>

          {fleet.length === 0 && loaded ? (
            <div style={{ background: '#fff', border: '1px solid #e5e5e5', padding: '48px 20px', textAlign: 'center' }}>
              <img src="/logo.png" alt="KFR" style={{ width: 48, height: 48, objectFit: 'contain', opacity: 0.3, marginBottom: 12 }} />
              <div style={{ fontSize: 14, color: '#888', marginBottom: 6 }}>No aircraft in fleet yet.</div>
              <div style={{ fontSize: 12, color: '#bbb' }}>Admin can add aircraft from the admin panel.</div>
            </div>
          ) : fleet.length === 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
              {['Loading...', 'Loading...', 'Loading...'].map((_, i) => (
                <div key={i} style={{ background: '#fff', border: '1px solid #eee', padding: 20, opacity: 0.4 }}>
                  <div style={{ background: '#f0f0f0', height: 80, marginBottom: 12 }} />
                  <div style={{ background: '#f0f0f0', height: 12, width: '60%', marginBottom: 8 }} />
                  <div style={{ background: '#f0f0f0', height: 10, width: '40%' }} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
              {fleet.map((a, i) => (
                <motion.div key={a.id}
                  initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.05 }} viewport={{ once: true }}
                  style={{ background: '#fff', border: '1px solid #e5e5e5', cursor: 'default', transition: 'border-color 0.2s, box-shadow 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#c0121e'; e.currentTarget.style.boxShadow = '0 2px 12px rgba(192,18,30,0.08)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e5e5'; e.currentTarget.style.boxShadow = 'none' }}>
                  <div style={{ background: 'linear-gradient(135deg, #0f0f0f, #1a0303)', padding: '24px 16px', textAlign: 'center', position: 'relative' }}>
                    <img src="/logo.png" alt="KFR" style={{ width: 44, height: 44, objectFit: 'contain', opacity: 0.75 }} />
                    <div style={{ position: 'absolute', top: 8, right: 8, background: '#c0121e', color: '#fff', fontSize: 9, fontWeight: 700, padding: '2px 7px', letterSpacing: 0.5 }}>
                      {a.type || 'KFR'}
                    </div>
                  </div>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{a.name}</div>
                    <div style={{ fontSize: 11, color: '#c0121e', fontFamily: 'monospace', fontWeight: 600, marginBottom: 10 }}>{a.registration}</div>
                    <div style={{ display: 'flex', gap: 16, borderTop: '1px solid #f5f5f5', paddingTop: 10 }}>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{a.pax}</div>
                        <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>Seats</div>
                      </div>
                      <div>
                        <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{a.range}<span style={{ fontSize: 11, fontWeight: 400, color: '#aaa' }}> nm</span></div>
                        <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>Range</div>
                      </div>
                      {a.hub && (
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{a.hub}</div>
                          <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: 0.5 }}>Hub</div>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ROUTES */}
      <section id="routes" style={{ padding: '72px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c0121e', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Network</div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>
                Active Routes
                {routes.length > 0 && <span style={{ fontSize: 16, color: '#888', fontWeight: 400, marginLeft: 8 }}>({routes.length} shown)</span>}
              </h2>
            </div>
            <button onClick={() => navigate('/routes')} style={{ background: 'none', border: 'none', color: '#c0121e', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              Full Route Map →
            </button>
          </div>

          {routes.length === 0 && loaded ? (
            <div style={{ border: '1px solid #eee', padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 6 }}>No routes added yet.</div>
              <div style={{ fontSize: 12, color: '#bbb' }}>The admin can add routes from the admin panel.</div>
            </div>
          ) : (
            <div style={{ border: '1px solid #e5e5e5', background: '#fff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr 90px 90px 110px', padding: '9px 18px', background: '#f8f8f8', borderBottom: '2px solid #e5e5e5' }}>
                {['Flight', 'From', 'To', 'Dist', 'Time', 'Pay'].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#999', letterSpacing: 1, textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>
              {routes.map((r, i) => (
                <motion.div key={r.id}
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }} viewport={{ once: true }}
                  onClick={() => navigate('/register')}
                  style={{ display: 'grid', gridTemplateColumns: '90px 1fr 1fr 90px 90px 110px', padding: '13px 18px', borderBottom: i < routes.length - 1 ? '1px solid #f5f5f5' : 'none', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#c0121e', fontFamily: 'monospace' }}>{r.flightNumber}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{r.depIcao}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{r.depName}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{r.arrIcao}</div>
                    <div style={{ fontSize: 11, color: '#999', marginTop: 1 }}>{r.arrName}</div>
                  </div>
                  <div style={{ fontSize: 13, color: '#555', paddingTop: 2 }}>{r.distance} nm</div>
                  <div style={{ fontSize: 13, color: '#555', paddingTop: 2 }}>{Math.floor(r.duration / 60)}h {r.duration % 60}m</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981', paddingTop: 2 }}>${((r.duration / 60) * 500).toFixed(0)}</div>
                </motion.div>
              ))}
              <div style={{ padding: '12px 18px', borderTop: '1px solid #f5f5f5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#aaa' }}>Click any route to book after registering</div>
                <button onClick={() => navigate('/register')}
                  style={{ background: '#c0121e', color: '#fff', border: 'none', padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', borderRadius: 2 }}>
                  Register to Book
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MAP */}
      <section style={{ background: '#0a0a0a', padding: '72px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ marginBottom: 28 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#c0121e', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Live Tracking</div>
            <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, margin: '0 0 6px', letterSpacing: -0.5, color: '#fff' }}>Flight Map</h2>
            <p style={{ fontSize: 13, color: '#555', margin: 0 }}>Live flight tracking activates when our ACARS client launches.</p>
          </div>
          <div style={{ position: 'relative', background: '#111', border: '1px solid #1e1e1e', height: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, opacity: 0.06, backgroundImage: 'linear-gradient(#c0121e 1px, transparent 1px), linear-gradient(90deg, #c0121e 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
            {[{ t: '30%', l: '67%' }, { t: '52%', l: '71%' }, { t: '38%', l: '64%' }, { t: '60%', l: '69%' }].map((p, i) => (
              <div key={i} style={{ position: 'absolute', top: p.t, left: p.l, width: 8, height: 8, borderRadius: '50%', background: '#c0121e', boxShadow: '0 0 10px rgba(192,18,30,0.7)' }} />
            ))}
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <img src="/logo.png" alt="KFR" style={{ width: 48, height: 48, objectFit: 'contain', opacity: 0.3, marginBottom: 10, display: 'block', margin: '0 auto 10px' }} />
              <div style={{ color: '#555', fontSize: 14 }}>Live map — coming with ACARS</div>
              <div style={{ color: '#333', fontSize: 12, marginTop: 4 }}>Estimated 2026</div>
            </div>
          </div>
        </div>
      </section>

      {/* PILOTS */}
      <section id="pilots" style={{ padding: '72px 20px', background: '#fafafa' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c0121e', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Our Crew</div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Pilot Rankings</h2>
            </div>
            <button onClick={() => navigate('/roster')} style={{ background: 'none', border: 'none', color: '#c0121e', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              Full Roster →
            </button>
          </div>

          {topPilots.length === 0 && loaded ? (
            <div style={{ background: '#fff', border: '1px solid #eee', padding: '48px 20px', textAlign: 'center' }}>
              <img src="/logo.png" alt="KFR" style={{ width: 44, height: 44, objectFit: 'contain', opacity: 0.25, marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
              <div style={{ fontSize: 14, color: '#888', marginBottom: 6 }}>No pilots yet — be the first.</div>
              <button onClick={() => navigate('/register')}
                style={{ marginTop: 12, background: '#c0121e', color: '#fff', border: 'none', padding: '9px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer', borderRadius: 2 }}>
                Register Now
              </button>
            </div>
          ) : (
            <div style={{ border: '1px solid #e5e5e5', background: '#fff' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px 100px 100px', padding: '9px 18px', background: '#f8f8f8', borderBottom: '2px solid #e5e5e5' }}>
                {['#', 'Pilot', 'Rank', 'Hours', 'Flights'].map(h => (
                  <div key={h} style={{ fontSize: 10, fontWeight: 700, color: '#999', letterSpacing: 1, textTransform: 'uppercase' }}>{h}</div>
                ))}
              </div>
              {topPilots.map((p, i) => (
                <motion.div key={p.id}
                  initial={{ opacity: 0 }} whileInView={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }} viewport={{ once: true }}
                  style={{ display: 'grid', gridTemplateColumns: '48px 1fr 120px 100px 100px', padding: '13px 18px', borderBottom: i < topPilots.length - 1 ? '1px solid #f5f5f5' : 'none', alignItems: 'center', cursor: 'pointer', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#fafafa')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <div style={{ fontSize: i < 3 ? 16 : 13, fontWeight: 800, color: i === 0 ? '#d4af37' : i === 1 ? '#888' : i === 2 ? '#c0121e' : '#ddd' }}>
                    {i === 0 ? '#1' : i === 1 ? '#2' : i === 2 ? '#3' : `#${i + 1}`}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, background: '#c0121e', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>
                      {p.firstName?.[0]}{p.lastName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{p.firstName} {p.lastName}</div>
                      <div style={{ fontSize: 11, color: '#c0121e', fontFamily: 'monospace', fontWeight: 600 }}>{p.pilotId}</div>
                    </div>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: rankColor(p.rank), background: `${rankColor(p.rank)}18`, padding: '3px 8px' }}>
                      {p.rank}
                    </span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{p.totalHours?.toFixed(1)}<span style={{ fontSize: 11, color: '#aaa', fontWeight: 400 }}> hrs</span></div>
                  <div style={{ fontSize: 13, color: '#555' }}>{p.totalFlights}</div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* EVENTS */}
      <section id="events" style={{ padding: '72px 20px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#c0121e', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Community</div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 34px)', fontWeight: 800, margin: 0, letterSpacing: -0.5 }}>Upcoming Events</h2>
            </div>
            <button onClick={() => navigate('/events')} style={{ background: 'none', border: 'none', color: '#c0121e', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}>
              All Events →
            </button>
          </div>

          {events.length === 0 && loaded ? (
            <div style={{ border: '1px solid #eee', padding: '40px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, color: '#888', marginBottom: 6 }}>No upcoming events right now.</div>
              <a href={DISCORD} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-block', marginTop: 12, background: '#5865F2', color: '#fff', padding: '9px 20px', fontSize: 13, fontWeight: 600, textDecoration: 'none', borderRadius: 2 }}>
                Join Discord for Updates
              </a>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {events.map((ev, i) => (
                <motion.div key={ev.id}
                  initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }} viewport={{ once: true }}
                  onClick={() => navigate('/events')}
                  style={{ background: '#fafafa', border: '1px solid #e5e5e5', padding: '22px', cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = '#c0121e')}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = '#e5e5e5')}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#c0121e', background: '#fff3f3', border: '1px solid #fcc', padding: '3px 8px', letterSpacing: 0.5 }}>
                      {new Date(ev.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                    <div style={{ fontSize: 11, color: '#888' }}>
                      {ev.attendees?.length || 0}/{ev.slots} joined
                    </div>
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, marginBottom: 5, lineHeight: 1.2 }}>{ev.title}</div>
                  <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>{ev.depIcao} → {ev.arrIcao} · {ev.network}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>+${ev.earnings} bonus</div>
                    <div style={{ width: 80, height: 3, background: '#eee' }}>
                      <div style={{ width: `${((ev.attendees?.length || 0) / ev.slots) * 100}%`, height: '100%', background: '#c0121e', transition: 'width 0.3s' }} />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* JOIN CTA */}
      <section id="join" style={{ background: '#c0121e', padding: '72px 20px' }}>
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}>
            <img src="/logo.png" alt="KFR" style={{ width: 70, height: 70, objectFit: 'contain', marginBottom: 20, filter: 'brightness(10)' }} />
            <h2 style={{ fontSize: 'clamp(26px, 4.5vw, 46px)', fontWeight: 900, color: '#fff', margin: '0 0 14px', letterSpacing: -1 }}>
              Ready to Start Flying?
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.8)', marginBottom: 28, lineHeight: 1.7, maxWidth: 500, margin: '0 auto 28px' }}>
              Registration is free. No ACARS needed to begin — file PIREPs manually and earn $500/hr virtual salary from your first flight.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => navigate('/register')}
                style={{ background: '#fff', color: '#c0121e', border: 'none', padding: '14px 36px', fontSize: 15, fontWeight: 800, cursor: 'pointer', letterSpacing: 0.3 }}
                onMouseEnter={e => (e.currentTarget.style.background = '#f5f5f5')}
                onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>
                Register Free
              </button>
              <a href={DISCORD} target="_blank" rel="noopener noreferrer"
                style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.35)', padding: '14px 28px', fontSize: 15, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 7 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.044.031.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                Discord
              </a>
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
                <div>
                  <div style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>KINGFISHER VA</div>
                  <div style={{ fontSize: 10, color: '#d4af37', letterSpacing: 1.5 }}>VIRTUAL AIRLINE</div>
                </div>
              </div>
              <p style={{ fontSize: 12, color: '#555', lineHeight: 1.7, marginBottom: 14, maxWidth: 240 }}>
                A virtual airline built by pilots, for pilots. Based in India. Flying worldwide. Beta 2026.
              </p>
              <a href={DISCORD} target="_blank" rel="noopener noreferrer"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#5865F2', color: '#fff', padding: '7px 14px', fontSize: 12, fontWeight: 600, textDecoration: 'none', borderRadius: 2 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.044.031.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/></svg>
                Discord
              </a>
            </div>
            {[
              { title: 'Pages', links: [{ l: 'About', a: () => window.scrollTo({ top: 0, behavior: 'smooth' }) }, { l: 'Fleet', a: () => go('fleet') }, { l: 'Routes', a: () => go('routes') }, { l: 'Events', a: () => go('events') }, { l: 'Pilot Rankings', a: () => go('pilots') }] },
              { title: 'Pilot Portal', links: [{ l: 'Login', a: () => navigate('/login') }, { l: 'Register', a: () => navigate('/register') }, { l: 'Dashboard', a: () => navigate('/dashboard') }, { l: 'Logbook', a: () => navigate('/logbook') }, { l: 'My Wallet', a: () => navigate('/wallet') }] },
              { title: 'Community', links: [{ l: 'Discord', a: () => window.open(DISCORD, '_blank') }, { l: 'Roster', a: () => navigate('/roster') }, { l: 'VATSIM / IVAO', a: () => navigate('/atc') }, { l: 'Events', a: () => navigate('/events') }, { l: 'Awards', a: () => navigate('/awards') }] },
            ].map(col => (
              <div key={col.title}>
                <div style={{ fontSize: 10, fontWeight: 700, color: '#555', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>{col.title}</div>
                {col.links.map(l => (
                  <button key={l.l} onClick={l.a}
                    style={{ display: 'block', background: 'none', border: 'none', color: '#666', fontSize: 13, cursor: 'pointer', marginBottom: 9, padding: 0, textAlign: 'left' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#c0121e')}
                    onMouseLeave={e => (e.currentTarget.style.color = '#666')}>
                    {l.l}
                  </button>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ fontSize: 12, color: '#333' }}>© 2025–2026 Kingfisher Virtual Airlines · ICAO KFR · Not affiliated with Kingfisher Airlines Ltd.</div>
            <div style={{ fontSize: 12, color: '#333' }}>Built by <span style={{ color: '#d4af37', fontWeight: 600 }}>Guneet Singh</span> · Beta v1.0</div>
          </div>
        </div>
      </footer>

      <style>{`
        @media (max-width: 768px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .hero-grid { grid-template-columns: 1fr !important; gap: 32px !important; }
          .hero-logo { order: -1; }
          .hero-logo img { width: 200px !important; height: 200px !important; }
          .two-col { grid-template-columns: 1fr !important; gap: 32px !important; }
          .footer-grid { grid-template-columns: 1fr 1fr !important; gap: 24px !important; }
          .footer-grid > div:first-child { grid-column: 1 / -1; }
        }
        @media (max-width: 520px) {
          .footer-grid { grid-template-columns: 1fr !important; }
        }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  )
}