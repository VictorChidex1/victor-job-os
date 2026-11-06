import {
  Briefcase,
  Building2,
  FileText,
  Files,
  LayoutDashboard,
  Mail,
  Users,
  type LucideIcon,
} from 'lucide-react'

export interface AdminNavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const adminNavItems: AdminNavItem[] = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Users', to: '/admin/users', icon: Users },
  { label: 'Opportunities', to: '/admin/opportunities', icon: Briefcase },
  { label: 'Applications', to: '/admin/applications', icon: FileText },
  { label: 'Outreach', to: '/admin/outreach', icon: Mail },
  { label: 'Companies', to: '/admin/companies', icon: Building2 },
  { label: 'Resumes', to: '/admin/resumes', icon: Files },
]

export const adminTopBarTitles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/users': 'Users',
  '/admin/opportunities': 'Opportunities',
  '/admin/applications': 'Applications',
  '/admin/outreach': 'Outreach',
  '/admin/companies': 'Companies',
  '/admin/resumes': 'Resumes',
}
