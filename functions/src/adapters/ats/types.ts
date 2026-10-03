export type JobSource = 'greenhouse' | 'lever' | 'ashby'

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
  status: JobStatus
  fingerprint: string
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

export interface ApplicationMetadata {
  applicationUrl: string
  requiresResume?: boolean
  requiresCoverLetter?: boolean
  questions?: string[]
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
