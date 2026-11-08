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

export type JobSourceKind = 'board' | 'search'

export type JobStatus = 'new' | 'qualified' | 'rejected' | 'archived'

export interface NormalizedJob {
  source: JobSource
  sourceJobId: string
  companyName: string
  title: string
  description: string
  location?: string
  remote: boolean
  employmentType?: string
  seniority?: string
  applicationUrl: string
  postedAt?: string
  discoveredAt: string
  skills: string[]
  searchTerms: string[]
  sourceMetadata: Record<string, unknown>
  atsMetadata?: ApplicationMetadata
  status: JobStatus
  fingerprint: string
  /** Normalized company + title, used for cross-source duplicate detection. */
  companyTitleKey: string
  /** Hash of the normalized description, used for duplicate detection. */
  descriptionFingerprint: string
}

export interface RawJob {
  sourceJobId: string
  companyName: string
  title: string
  description: string
  location?: string
  remote: boolean
  employmentType?: string
  seniority?: string
  applicationUrl: string
  postedAt?: string
  skills: string[]
  sourceMetadata: Record<string, unknown>
}

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

export interface ApplicationMetadata {
  source: JobSource
  sourceJobId: string
  applicationUrl: string
  requiresResume?: boolean
  requiresCoverLetter?: boolean
  formFields?: AtsApplicationField[]
  questions?: string[]
  completeness: 'complete' | 'partial' | 'unknown'
}

export interface ATSAdapter {
  source: JobSource
  /** Discover jobs from a company board slug and normalize them. */
  discover(boardTarget: string): Promise<NormalizedJob[]>
  /** Fetch a single job by its source id (not required by V1 discovery). */
  fetchJob(id: string): Promise<NormalizedJob | null>
  normalizeJob(raw: RawJob): NormalizedJob
  getApplicationMetadata(job: NormalizedJob): ApplicationMetadata
}

export interface DiscoveryResult {
  source: JobSource
  boardTarget: string
  jobs: NormalizedJob[]
  error?: string
}
