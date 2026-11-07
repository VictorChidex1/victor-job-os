import { Link, useLocation } from 'react-router'
import { Activity, AlertTriangle, BrainCircuit, ScrollText } from 'lucide-react'
import { cn } from '@/lib/utils'

const tabs = [
  {
    to: '/admin/system',
    label: 'Health & Topology',
    icon: Activity,
    end: true,
  },
  {
    to: '/admin/system/ai-usage',
    label: 'AI Engine & Telemetry',
    icon: BrainCircuit,
  },
  {
    to: '/admin/system/errors',
    label: 'Errors & Anomalies',
    icon: AlertTriangle,
  },
  {
    to: '/admin/system/audit',
    label: 'Audit Trail',
    icon: ScrollText,
  },
]

export function AdminSystemTabs() {
  const { pathname } = useLocation()

  return (
    <nav
      className="flex w-fit flex-wrap items-center gap-1.5 rounded-2xl border border-border/80 bg-card/80 p-1.5 shadow-xs backdrop-blur-sm"
      aria-label="System sections"
    >
      {tabs.map((tab) => {
        const active = tab.end
          ? pathname === tab.to
          : pathname === tab.to || pathname.startsWith(`${tab.to}/`)
        const Icon = tab.icon

        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all',
              active
                ? 'bg-primary/10 text-primary font-bold shadow-2xs border border-primary/20'
                : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground border border-transparent',
            )}
          >
            <Icon className="size-3.5 shrink-0" />
            <span>{tab.label}</span>
            {tab.end && (
              <span className="flex size-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full size-2 bg-emerald-500" />
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
