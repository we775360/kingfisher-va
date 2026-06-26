import { Plane, Activity, Briefcase, MapIcon, Settings, LogOut, Headphones, FileText } from 'lucide-react'
import { cn } from '../lib/utils'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
  onLogout: () => void
}

const NAV_ITEMS = [
  { id: 'dashboard', icon: <Activity className="w-5 h-5" />, label: 'Live' },
  { id: 'bookings', icon: <Briefcase className="w-5 h-5" />, label: 'Tasks' },
  { id: 'efb', icon: <FileText className="w-5 h-5" />, label: 'EFB' },
  { id: 'map', icon: <MapIcon className="w-5 h-5" />, label: 'Map' },
  { id: 'audio', icon: <Headphones className="w-5 h-5" />, label: 'Audio' },
  { id: 'settings', icon: <Settings className="w-5 h-5" />, label: 'Data' },
]

export function Sidebar({ activeTab, onTabChange, onLogout }: SidebarProps) {
  return (
    <div className="w-[68px] bg-[#0d0d0d] border-r border-neutral-800/40 flex flex-col items-center py-6 gap-6 z-30 shrink-0">
      <div className="p-2.5 bg-gradient-to-br from-kf-red to-red-800 rounded-xl shadow-lg shadow-kf-red/20">
        <Plane className="w-5 h-5" strokeWidth={2.5} />
      </div>

      <nav className="flex-1 flex flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              "flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all relative group",
              activeTab === item.id
                ? 'text-kf-red bg-kf-red/10'
                : 'text-neutral-600 hover:text-neutral-300 hover:bg-neutral-900'
            )}
          >
            {item.icon}
            <span className="text-[7px] font-black uppercase tracking-[0.2em]">{item.label}</span>
            {activeTab === item.id && (
              <div className="absolute -left-[1px] top-1/2 -translate-y-1/2 w-0.5 h-6 bg-kf-red rounded-r-full shadow-[0_0_8px_rgba(192,18,30,0.5)]" />
            )}
          </button>
        ))}
      </nav>

      <button onClick={onLogout}
        className="p-2.5 rounded-xl text-neutral-700 hover:text-kf-red hover:bg-kf-red/5 transition-all"
      >
        <LogOut className="w-5 h-5" />
      </button>
    </div>
  )
}
