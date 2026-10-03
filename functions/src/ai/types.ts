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
  technicalFit: 'strong' | 'moderate' | 'weak'
  experienceFit: 'strong' | 'moderate' | 'weak'
  stackMatch: string[]
  matchedSkills: string[]
  missingSkills: string[]
  concerns: string[]
  summary: string
}

export interface CompanyResearchInput {
  companyName: string
}

export interface CompanyResearchOutput {
  industry?: string
  description?: string
  website?: string
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
  }>
}

export interface PortfolioMatchOutput {
  projectIds: string[]
  reasons: Record<string, string>
}

export interface AIService {
  analyzeJob(input: JobAnalysisInput): Promise<JobAnalysisOutput>
  researchCompany(input: CompanyResearchInput): Promise<CompanyResearchOutput>
  matchPortfolio(input: PortfolioMatchInput): Promise<PortfolioMatchOutput>
}