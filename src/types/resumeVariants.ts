import type { Timestamp } from 'firebase/firestore'

export interface ResumeVariant {
  id: string
  userId: string
  name: string
  resumeUrl: string
  targetRoles: string[]
  technologies: string[]
  notes: string
  isDefault: boolean

  /** Bounded tokens for admin keyword search. Notes are intentionally excluded. */
  searchTokens?: string[]
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface ResumeVariantInput {
  name: string
  resumeUrl: string
  targetRoles: string[]
  technologies: string[]
  notes: string
  isDefault: boolean
}
