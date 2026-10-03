export type VerificationStatus = 'verified' | 'needs-verification'

export interface VerificationEntry {
  value: string
  status: VerificationStatus
}

export interface ProfessionalProfile {
  id: string
  fullName: string
  headline: string
  summary: string
  skills: VerificationEntry[]
  technologies: VerificationEntry[]
  preferredRoles: string[]
  preferredLocations: string[]
  remotePreference: boolean
  experienceLevel: string
  resumeUrl?: string
  portfolioUrl?: string
  email: string
  updatedAt: Date
}