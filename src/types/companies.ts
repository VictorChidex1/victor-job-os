import type { Timestamp } from 'firebase/firestore'

export interface Company {
  id: string
  userId?: string
  name: string
  website?: string
  industry?: string
  description?: string
  product?: string
  roleContext?: string
  hiringSignals: string[]
  researchSummary?: string
  sourceUrls: string[]
  location?: string
  jobCount?: number
  researched?: boolean
  lastSeenAt?: Timestamp
  lastResearchedAt?: Timestamp
  createdAt?: Timestamp
  updatedAt?: Timestamp
}
