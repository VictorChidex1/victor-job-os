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
  userId: string
  jobId: string
  companyId: string
  contactId?: string
  contactName?: string
  contactEmail?: string
  jobTitle?: string
  companyName?: string
  /** Editable message. */
  subject: string
  body: string
  /** Immutable original AI draft, kept so edits never lose the source. */
  draftSubject: string
  draftBody: string
  status: OutreachStatus
  aiProvider?: string
  model?: string
  promptVersion?: string
  sentManually?: boolean
  sentAt?: Timestamp
  approvedAt?: Timestamp
  scheduledAt?: Timestamp
  replyAt?: Timestamp
  closedAt?: Timestamp
  closedReason?: 'rejected' | 'archived' | 'completed'
  followUpCount?: number
  lastFollowUpAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface Contact {
  id: string
  userId: string
  companyId: string
  companyName?: string
  name?: string
  email?: string
  role?: string
  sourceUrl?: string
  confidence?: 'high' | 'medium' | 'low'
  verified?: boolean
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface FollowUp {
  id: string
  userId: string
  outreachId: string
  scheduledFor: Timestamp
  sequence: number
  status: 'pending' | 'sent' | 'cancelled'
  draftSubject?: string
  draftBody?: string
  approvedAt?: Timestamp
  sentAt?: Timestamp
  createdAt: Timestamp
}
