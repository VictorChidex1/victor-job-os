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

export interface AdminApplication {
  id: string
  userId: string
  jobId: string
  companyId: string
  companyName: string
  jobTitle: string
  jobSource: string
  status: string
  outcome?: string
  origin: string
  location?: string
  remote: boolean
  nextAction?: string
  nextActionAt?: Timestamp
  notes?: string
  resumeVariantName?: string
  resumeUrl?: string
  contactId?: string
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface AdminApplicationEvent {
  id: string
  type: string
  fromStatus?: string
  toStatus?: string
  note?: string
  createdAt?: Timestamp
}

export interface AdminApplicationDetail extends AdminApplication {
  applicationUrl: string
  approvedAt?: Timestamp
  submittedAt?: Timestamp
  submittedManually?: boolean
  closedAt?: Timestamp
  user: AdminUserSummary | null
  events: AdminApplicationEvent[]
}

export interface AdminOutreach {
  id: string
  userId: string
  jobId: string
  companyId: string
  companyName?: string
  jobTitle?: string
  contactName?: string
  contactEmail?: string
  subject: string
  status: string
  followUpCount: number
  sentAt?: Timestamp
  updatedAt?: Timestamp
  createdAt?: Timestamp
}

export interface AdminFollowUp {
  id: string
  sequence: number
  status: string
  scheduledFor?: Timestamp
  draftSubject?: string
  draftBody?: string
  approvedAt?: Timestamp
  sentAt?: Timestamp
  createdAt?: Timestamp
}

export interface AdminOutreachDetail extends AdminOutreach {
  body: string
  draftSubject: string
  draftBody: string
  aiProvider?: string
  model?: string
  promptVersion?: string
  approvedAt?: Timestamp
  scheduledAt?: Timestamp
  replyAt?: Timestamp
  closedAt?: Timestamp
  closedReason?: string
  sentManually?: boolean
  lastFollowUpAt?: Timestamp
  user: AdminUserSummary | null
  followUps: AdminFollowUp[]
}

export interface AdminCompany {
  id: string
  userId: string
  name: string
  industry?: string
  location?: string
  researched: boolean
  jobCount: number
  updatedAt?: Timestamp
}

export interface AdminCompanyOpportunity {
  id: string
  title: string
  status: string
  source: string
  discoveredAt?: Timestamp
}

export interface AdminCompanyApplication {
  id: string
  jobTitle: string
  status: string
  updatedAt?: Timestamp
}

export interface AdminCompanyOutreach {
  id: string
  jobTitle?: string
  subject: string
  status: string
  updatedAt?: Timestamp
}

export interface AdminCompanyContact {
  id: string
  name?: string
  email?: string
  role?: string
  verified: boolean
  confidence?: string
}

export interface AdminCompanyDetail extends AdminCompany {
  website?: string
  description?: string
  product?: string
  roleContext?: string
  hiringSignals: string[]
  researchSummary?: string
  sourceUrls: string[]
  lastSeenAt?: Timestamp
  lastResearchedAt?: Timestamp
  createdAt?: Timestamp
  user: AdminUserSummary | null
  opportunities: AdminCompanyOpportunity[]
  applications: AdminCompanyApplication[]
  outreach: AdminCompanyOutreach[]
  contacts: AdminCompanyContact[]
}

export interface AdminResume {
  id: string
  userId: string
  name: string
  targetRoles: string[]
  technologies: string[]
  isDefault: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface AdminResumeDetail extends AdminResume {
  resumeUrl: string
  notes: string
  user: AdminUserSummary | null
}
