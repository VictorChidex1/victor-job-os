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
  newUsersThisWeek: number
  jobCount: number
  applicationCount: number
  outreachCount: number
  companyCount: number
  recentUsers: AdminUserSummary[]
}

export interface AdminUserProfile {
  headline: string
  summary: string
  experienceLevel: string
  skills: string[]
  technologies: string[]
  preferredRoles: string[]
  preferredLocations: string[]
  portfolioUrl?: string
  resumeUrl?: string
  updatedAt?: Timestamp
}

export interface AdminUserJob {
  id: string
  title: string
  companyName: string
  source: string
  status: string
  discoveredAt?: Timestamp
}

export interface AdminUserApplication {
  id: string
  jobTitle: string
  companyName: string
  status: string
  nextAction?: string
  updatedAt?: Timestamp
}

export interface AdminUserOutreach {
  id: string
  jobTitle?: string
  companyName: string
  status: string
  sentAt?: Timestamp
  updatedAt?: Timestamp
}

export interface AdminUserCompany {
  id: string
  name: string
  industry?: string
  researched: boolean
  jobCount: number
}

export interface AdminUserResume {
  id: string
  name: string
  resumeUrl: string
  isDefault: boolean
}

export interface AdminUserDetailCounts {
  opportunities: number
  applications: number
  outreach: number
  companies: number
  resumes: number
}

export interface AdminUserDetail {
  user: AdminUserSummary
  profile: AdminUserProfile | null
  counts: AdminUserDetailCounts
  opportunities: AdminUserJob[]
  applications: AdminUserApplication[]
  outreach: AdminUserOutreach[]
  companies: AdminUserCompany[]
  resumes: AdminUserResume[]
}

export interface AdminOpportunity {
  id: string
  userId: string
  title: string
  companyName: string
  source: string
  status: string
  location?: string
  remote: boolean
  discoveredAt?: Timestamp
  skills: string[]
  applicationUrl: string
}

export interface AdminOpportunityAnalysis {
  fitScore?: number
  summary: string
  matchedSkills: string[]
  missingSkills: string[]
  concerns: string[]
}

export interface AdminOpportunityCompany {
  name: string
  industry?: string
  description?: string
  researchSummary?: string
  website?: string
}

export interface AdminOpportunityDetail extends AdminOpportunity {
  description: string
  user: AdminUserSummary | null
  analysis: AdminOpportunityAnalysis | null
  company: AdminOpportunityCompany | null
}
