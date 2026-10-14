import type { Timestamp } from 'firebase/firestore'

export type JobSource = 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'custom'

export type JobStatus = 'new' | 'qualified' | 'rejected' | 'archived'

export interface Job {
  id: string
  userId?: string
  source: JobSource
  sourceJobId: string
  companyId: string
  companyName: string
  title: string
  description: string
  location?: string
  remote: boolean
  employmentType?: string
  seniority?: string
  applicationUrl: string
  postedAt?: Timestamp
  discoveredAt: Timestamp
  skills: string[]
  searchTerms: string[]
  status: JobStatus
  fingerprint: string
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface JobAnalysis {
  id: string
  jobId: string
  fitScore?: number
  technicalFit: string
  experienceFit: string
  remoteFit: string
  roleType: string
  stackMatch: string[]
  matchedSkills: string[]
  missingSkills: string[]
  concerns: string[]
  recommendation: string
  summary: string
  analyzedAt: Timestamp
  aiProvider: string
  model: string
  matchedProjectIds?: string[]
  projectMatchReasons?: Record<string, string>
}