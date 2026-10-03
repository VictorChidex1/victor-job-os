import type { Timestamp } from 'firebase/firestore'

export type OutreachStatus =
  | 'draft'
  | 'needs-review'
  | 'approved'
  | 'scheduled'
  | 'sent'
  | 'replied'
  | 'follow-up-due'
  | 'closed'

export interface Outreach {
  id: string
  jobId: string
  companyId: string
  contactId?: string
  subject: string
  body: string
  status: OutreachStatus
  sentAt?: Timestamp
  approvedAt?: Timestamp
  scheduledAt?: Timestamp
  replyAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Contact {
  id: string
  companyId: string
  name?: string
  email?: string
  role?: string
  sourceUrl?: string
  confidence?: 'high' | 'medium' | 'low'
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface FollowUp {
  id: string
  outreachId: string
  scheduledFor: Timestamp
  sequence: number
  status: 'pending' | 'sent' | 'cancelled'
  draft?: string
  createdAt: Timestamp
}