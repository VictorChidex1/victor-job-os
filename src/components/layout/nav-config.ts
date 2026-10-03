import {
  Activity,
  Bot,
  Briefcase,
  Building2,
  FolderKanban,
  LayoutDashboard,
  Send,
  Settings,
  User,
  type LucideIcon,
} from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    label: 'Main',
    items: [
      { label: 'Overview', to: '/', icon: LayoutDashboard, end: true },
      { label: 'Opportunities', to: '/opportunities', icon: Briefcase },
      { label: 'Outreach', to: '/outreach', icon: Send },
    ],
  },
  {
    label: 'Relationships',
    items: [
      { label: 'Companies', to: '/companies', icon: Building2 },
      { label: 'Projects', to: '/projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Activity', to: '/activity', icon: Activity },
      { label: 'Automation', to: '/automation', icon: Bot },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Profile', to: '/profile', icon: User },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]

export const topBarTitles: Record<string, string> = {
  '/': 'Overview',
  '/opportunities': 'Opportunities',
  '/outreach': 'Outreach',
  '/companies': 'Companies',
  '/projects': 'Projects',
  '/activity': 'Activity',
  '/automation': 'Automation',
  '/profile': 'Profile',
  '/settings': 'Settings',
}