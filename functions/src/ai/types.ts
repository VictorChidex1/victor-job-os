export type FitLevel = 'strong' | 'moderate' | 'weak'

export type Recommendation = 'pursue' | 'maybe' | 'skip'

export interface JobAnalysisInput {
  job: {
    title: string
    description: string
    location?: string
    remote: boolean
    skills: string[]
  }
  profile: {
    headline: string
    summary: string
    skills: string[]
    technologies: string[]
    preferredRoles: string[]
    remotePreference: boolean
    experienceLevel?: string
  }
}

export interface JobAnalysisOutput {
  fitScore: number
  technicalFit: FitLevel
  experienceFit: FitLevel
  remoteFit: FitLevel
  roleType: string
  stackMatch: string[]
  matchedSkills: string[]
  missingSkills: string[]
  concerns: string[]
  recommendation: Recommendation
  summary: string
}

export interface CompanyResearchInput {
  companyName: string
}

export interface CompanyResearchOutput {
  industry?: string
  description?: string
  website?: string
  product?: string
  roleContext?: string
  hiringSignals: string[]
  researchSummary?: string
  sourceUrls: string[]
}

export interface PortfolioMatchInput {
  job: {
    title: string
    description: string
    skills: string[]
  }
  projects: Array<{
    id: string
    title: string
    summary: string
    technologies: string[]
    relevanceTags: string[]
    problem?: string
    solution?: string
    outcomes?: string[]
    verifiedMetrics?: string[]
    url?: string
  }>
}

export interface PortfolioMatchOutput {
  projectIds: string[]
  reasons: Record<string, string>
}

export interface PitchInput {
  job: {
    title: string
    description: string
    location?: string
  }
  analysis?: {
    fitScore?: number
    roleType?: string
    matchedSkills: string[]
    missingSkills: string[]
    summary?: string
  }
  company?: {
    name: string
    industry?: string
    description?: string
    product?: string
    roleContext?: string
    hiringSignals: string[]
    researchSummary?: string
  }
  contact?: {
    name?: string
    role?: string
  }
  profile: {
    headline: string
    summary: string
    skills: string[]
    technologies: string[]
    preferredRoles: string[]
    experienceLevel?: string
  }
  projects: Array<{
    title: string
    summary: string
    technologies: string[]
    outcomes?: string[]
    verifiedMetrics?: string[]
    url?: string
  }>
}

export interface PitchOutput {
  subject: string
  body: string
}

export interface AIService {
  analyzeJob(input: JobAnalysisInput): Promise<JobAnalysisOutput>
  researchCompany(input: CompanyResearchInput): Promise<CompanyResearchOutput>
  matchPortfolio(input: PortfolioMatchInput): Promise<PortfolioMatchOutput>
  generatePitch(input: PitchInput): Promise<PitchOutput>
}
