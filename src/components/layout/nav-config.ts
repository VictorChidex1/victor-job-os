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
      { label: 'Overview', to: '/app/dashboard', icon: LayoutDashboard, end: true },
      { label: 'Opportunities', to: '/app/opportunities', icon: Briefcase },
      { label: 'Outreach', to: '/app/outreach', icon: Send },
    ],
  },
  {
    label: 'Relationships',
    items: [
      { label: 'Companies', to: '/app/companies', icon: Building2 },
      { label: 'Projects', to: '/app/projects', icon: FolderKanban },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { label: 'Activity', to: '/app/activity', icon: Activity },
      { label: 'Automation', to: '/app/automation', icon: Bot },
    ],
  },
  {
    label: 'System',
    items: [
      { label: 'Profile', to: '/app/profile', icon: User },
      { label: 'Settings', to: '/app/settings', icon: Settings },
    ],
  },
]

export const topBarTitles: Record<string, string> = {
  '/app/dashboard': 'Overview',
  '/app/opportunities': 'Opportunities',
  '/app/outreach': 'Outreach',
  '/app/companies': 'Companies',
  '/app/projects': 'Projects',
  '/app/activity': 'Activity',
  '/app/automation': 'Automation',
  '/app/profile': 'Profile',
  '/app/settings': 'Settings',
}