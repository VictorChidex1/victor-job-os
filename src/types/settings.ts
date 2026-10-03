export type AiProvider = 'gemini' | 'openai'

export type JobSourceId = 'greenhouse' | 'lever' | 'ashby' | 'workday' | 'custom'

export interface JobSourceConfig {
  id: string
  source: JobSourceId
  enabled: boolean
  searchTerms: string[]
  lastRunAt?: Date
}

export interface OpportunitySettings {
  preferredRoles: string[]
  preferredTechnologies: string[]
  preferredLocations: string[]
  remotePreference: boolean
  minFitScore: number
  employmentTypes: string[]
  excludedRoles: string[]
  excludedCompanies: string[]
  dailyTarget: number
}

export interface OutreachSettings {
  requireApprovalBeforeSending: boolean
  maxFollowUps: number
  followUpIntervalDays: number
}

export interface AISettings {
  provider: AiProvider
  defaultModel: string
}

export interface JobOsSettings {
  id: string
  opportunity: OpportunitySettings
  outreach: OutreachSettings
  ai: AISettings
  sources: JobSourceConfig[]
  updatedAt: Date
}