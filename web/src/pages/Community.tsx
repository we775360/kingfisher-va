import { Link } from 'react-router-dom'
import {
  MessageCircle, Send, Mail, Globe,
  Users, Radio, ExternalLink, Heart
} from 'lucide-react'
import { useThemeStore } from '../store/theme.store'

export default function Community() {
  const { isDark } = useThemeStore()

  const t = {
    bg: isDark ? '#0f0f0f' : '#f0f2f5',
    card: isDark ? '#141414' : '#ffffff',
    border: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)',
    text: isDark ? '#ffffff' : '#0a0a0a',
    textSub: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    textMuted: isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.3)',
    navActive: isDark ? 'rgba(192,18,30,0.15)' : 'rgba(192,18,30,0.08)',
  }

  const channels = [
    { name: '#general', desc: 'General chat and discussion', members: '1,200+' },
    { name: '#pirep-reports', desc: 'Share your flight reports and screenshots', members: '800+' },
    { name: '#flight-planning', desc: 'Get help with routes, weather, and flight planning', members: '600+' },
    { name: '#group-flights', desc: 'Coordinate and join group flights', members: '500+' },
    { name: '#atc-events', desc: 'VATSIM and IVAO event coordination', members: '400+' },
    { name: '#liveries', desc: 'Share and download Kingfisher VA liveries', members: '300+' },
  ]

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: t.bg, color: t.text }}>

      <div className="sticky top-0 z-30 px-4 sm:px-6 py-4"
        style={{
          background: isDark ? 'rgba(15,15,15,0.92)' : 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${t.border}`,
        }}>
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/dashboard" className="text-sm transition-colors duration-200" style={{ color: t.textSub, textDecoration: 'none' }}>
            &larr; Dashboard
          </Link>
          <div className="w-px h-4 shrink-0" style={{ background: t.border }} />
          <div className="flex items-center gap-2 min-w-0">
            <MessageCircle size={16} className="shrink-0" style={{ color: '#c0121e' }} />
            <span className="font-bold text-base truncate" style={{ color: t.text }}>Community</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        <div className="rounded-2xl overflow-hidden relative"
          style={{ background: 'linear-gradient(135deg, #8b0000 0%, #c0121e 60%, #8b0000 100%)' }}>
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)',
              backgroundSize: '30px 30px'
            }} />
          <div className="relative z-10 px-6 sm:px-8 py-8 sm:py-10 text-center">
            <div className="text-4xl mb-4">👑</div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Join the Kingfisher VA Community</h2>
            <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.7)' }}>
              Connect with 1,000+ virtual pilots, share your flights, get help, and fly together.
              Our primary community hub is Discord.
            </p>
            <a href="https://discord.gg/kingfisherva"
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 sm:px-8 py-3.5 rounded-xl text-sm font-bold transition-all duration-200 hover:scale-[1.05]"
              style={{ background: '#5865F2', color: 'white', textDecoration: 'none', boxShadow: '0 0 20px rgba(88,101,242,0.4)' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.044.031.055a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Join Discord Server
            </a>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden transition-all duration-200 hover:scale-[1.02]"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 px-5 py-4"
            style={{ borderBottom: `1px solid ${t.border}` }}>
            <MessageCircle size={15} style={{ color: '#5865F2' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Discord Channels</span>
          </div>
          <div className="divide-y" style={{ borderColor: t.border }}>
            {channels.map((ch) => (
              <div key={ch.name}
                className="flex items-center justify-between px-4 sm:px-5 py-3.5 transition-colors duration-200"
                style={{ cursor: 'default' }}
                onMouseEnter={e => e.currentTarget.style.background = t.navActive}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <div className="min-w-0">
                  <div className="text-sm font-semibold font-mono truncate" style={{ color: '#5865F2' }}>{ch.name}</div>
                  <div className="text-xs mt-0.5 truncate" style={{ color: t.textSub }}>{ch.desc}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <Users size={12} style={{ color: t.textMuted }} />
                  <span className="text-xs" style={{ color: t.textMuted }}>{ch.members}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: Send,
              label: 'Discord',
              value: 'discord.gg/kingfisherva',
              desc: 'Primary community hub',
              color: '#5865F2',
              href: 'https://discord.gg/kingfisherva',
            },
            {
              icon: Mail,
              label: 'Email',
              value: 'staff@kingfisherva.com',
              desc: 'For formal enquiries',
              color: '#c0121e',
              href: 'mailto:staff@kingfisherva.com',
            },
            {
              icon: Globe,
              label: 'Website',
              value: 'kingfisherva.com',
              desc: 'Public information',
              color: '#10b981',
              href: '#',
            },
          ].map((contact) => (
            <a key={contact.label}
              href={contact.href}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02]"
              style={{ background: t.card, border: `1px solid ${t.border}`, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = `${contact.color}40`}
              onMouseLeave={e => e.currentTarget.style.borderColor = t.border}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${contact.color}18` }}>
                <contact.icon size={18} style={{ color: contact.color }} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-bold mb-0.5 truncate" style={{ color: t.text }}>{contact.label}</div>
                <div className="text-xs font-mono mb-1 truncate" style={{ color: contact.color }}>{contact.value}</div>
                <div className="text-xs truncate" style={{ color: t.textMuted }}>{contact.desc}</div>
              </div>
              <ExternalLink size={14} style={{ color: t.textMuted, marginTop: 'auto' }} />
            </a>
          ))}
        </div>

        <div className="p-5 rounded-2xl transition-all duration-200 hover:scale-[1.02]"
          style={{ background: t.card, border: `1px solid ${t.border}` }}>
          <div className="flex items-center gap-2.5 mb-4">
            <Heart size={15} style={{ color: '#c0121e' }} />
            <span className="text-sm font-semibold" style={{ color: t.text }}>Community Guidelines</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Be respectful to all pilots regardless of experience level',
              'No real-world politics or controversial topics',
              'Keep PIREP reports honest — cheating results in a ban',
              'Share your passion for aviation and help others grow',
              'Follow VATSIM/IVAO code of conduct when online',
              'Have fun and enjoy the virtual skies!',
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: 'rgba(192,18,30,0.1)' }}>
                  <span style={{ color: '#c0121e', fontSize: '10px', fontWeight: 'bold' }}>{i + 1}</span>
                </div>
                <span className="text-sm" style={{ color: t.textSub }}>{rule}</span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
