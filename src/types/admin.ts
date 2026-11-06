import type { Timestamp } from 'firebase/firestore'
import type { UserRole } from '@/types/users'

export interface AdminUserSummary {
  id: string
  email: string | null
  displayName: string | null
  role: UserRole
  createdAt?: Timestamp
}

export interface AdminOverview {
  userCount: number
  jobCount: number
  applicationCount: number
  outreachCount: number
  companyCount: number
  recentUsers: AdminUserSummary[]
}
