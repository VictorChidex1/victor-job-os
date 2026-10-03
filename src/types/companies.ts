import type { Timestamp } from 'firebase/firestore'

export interface Company {
  id: string
  name: string
  website?: string
  industry?: string
  description?: string
  researchSummary?: string
  sourceUrls: string[]
  lastResearchedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}