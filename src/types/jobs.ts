import type { Timestamp } from 'firebase/firestore'

export type JobSource =
  | 'greenhouse'
  | 'lever'
  | 'ashby'
  | 'workable'
  | 'smartrecruiters'
  | 'hn'
  | 'remotive'
  | 'remoteok'
  | 'arbeitnow'
  | 'workday'
  | 'custom'

export type JobStatus = 'new' | 'qualified' | 'rejected' | 'archived'

export type AtsApplicationFieldType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'file'
  | 'checkbox'
  | 'unknown'

export interface AtsApplicationField {
  name: string
  required?: boolean
  type?: AtsApplicationFieldType
  options?: string[]
}

export interface AtsApplicationMetadata {
  source: JobSource
  sourceJobId: string
  applicationUrl: string
  requiresResume?: boolean
  requiresCoverLetter?: boolean
  formFields?: AtsApplicationField[]
  questions?: string[]
  completeness: 'complete' | 'partial' | 'unknown'
}

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
  atsMetadata?: AtsApplicationMetadata
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