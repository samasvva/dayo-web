import { useLocation, useNavigate } from 'react-router-dom'

const navItems = [
  { path: '/', label: 'Home', icon: HomeIcon },
  { path: '/habits', label: 'Habits', icon: HabitsIcon },
  { path: '/tasks', label: 'Tasks', icon: TasksIcon },
  { path: '/analytics', label: 'Analytics', icon: AnalyticsIcon },
]

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function HabitsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/>
      <rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/>
      <rect x="3" y="14" width="7" height="7"/>
    </svg>
  )
}
function TasksIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="8" y1="6" x2="21" y2="6"/>
      <line x1="8" y1="12" x2="21" y2="12"/>
      <line x1="8" y1="18" x2="21" y2="18"/>
      <polyline points="3 6 4 7 6 5" strokeWidth={active ? "2.5" : "2"}/>
      <polyline points="3 12 4 13 6 11" strokeWidth={active ? "2.5" : "2"}/>
      <polyline points="3 18 4 19 6 17" strokeWidth={active ? "2.5" : "2"}/>
    </svg>
  )
}
function AnalyticsIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  )
}

export default function Layout({ children }) {
  const location = useLocation()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-screen-lg mx-auto">
      <div className="flex-1 overflow-auto pb-20">
        {children}
      </div>
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-gray-100 flex z-50">
        <div className="max-w-screen-lg mx-auto flex w-full">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path
            return (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`flex-1 flex flex-col items-center gap-1 py-3 transition-colors ${
                  active ? 'text-personA' : 'text-text2'
                }`}
              >
                <Icon active={active} />
                <span className="text-xs font-medium">{label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
