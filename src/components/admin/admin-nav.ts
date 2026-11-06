import { LayoutDashboard, Users, type LucideIcon } from 'lucide-react'

export interface AdminNavItem {
  label: string
  to: string
  icon: LucideIcon
  end?: boolean
}

export const adminNavItems: AdminNavItem[] = [
  { label: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
  { label: 'Users', to: '/admin/users', icon: Users },
]

export const adminTopBarTitles: Record<string, string> = {
  '/admin': 'Overview',
  '/admin/users': 'Users',
}
