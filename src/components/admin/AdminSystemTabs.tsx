import { Link, useLocation } from 'react-router'
import { cn } from '@/lib/utils'

const tabs = [
  { to: '/admin/system', label: 'Health', end: true },
  { to: '/admin/system/ai-usage', label: 'AI usage' },
  { to: '/admin/system/errors', label: 'Errors' },
]

export function AdminSystemTabs() {
  const { pathname } = useLocation()

  return (
    <nav
      className="flex w-fit items-center gap-1 rounded-xl border border-slate-200 bg-white p-1"
      aria-label="System sections"
    >
      {tabs.map((tab) => {
        const active = tab.end
          ? pathname === tab.to
          : pathname === tab.to || pathname.startsWith(`${tab.to}/`)
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
              active
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900',
            )}
          >
            {tab.label}
          </Link>
        )
      })}
    </nav>
  )
}
