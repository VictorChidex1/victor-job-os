import type { Timestamp } from 'firebase/firestore'
import type { AtsApplicationMetadata, JobSource } from './jobs'

/**
 * Lifecycle of one job application.
 *
 * A job can move into an application, but an application is a separate record
 * so the opportunity can stay in the discovery pipeline.
 */
export type ApplicationStatus =
  | 'not-started'
  | 'preparing'
  | 'needs-review'
  | 'approved'
  | 'submitted'
  | 'assessment'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'closed'

export type ApplicationOutcome =
  | 'accepted'
  | 'declined'
  | 'rejected'
  | 'withdrawn'
  | 'closed'

export type ApplicationOrigin = 'opportunity' | 'manual'

export type ApplicationEventType = 'created' | 'status-changed'

export interface Application {
  id: string
  userId: string
  jobId: string

  /** Snapshot of the job, kept so the application survives job deletion. */
  companyId: string
  companyName: string
  jobTitle: string
  jobSource: JobSource
  applicationUrl: string
  atsMetadata?: AtsApplicationMetadata
  location?: string
  remote: boolean

  status: ApplicationStatus
  outcome?: ApplicationOutcome
  origin: ApplicationOrigin

  /** Populated by later V2 steps (resume variants, contacts, preparation). */
  resumeVariantId?: string
  resumeVariantName?: string
  /** Snapshot of the resume URL attached while preparing this application. */
  resumeUrl?: string
  contactId?: string

  nextAction?: string
  nextActionAt?: Timestamp
  notes?: string

  /** Bounded tokens for admin keyword search. Never contains freeform notes. */
  searchTokens?: string[]

  approvedAt?: Timestamp
  submittedAt?: Timestamp
  submittedManually?: boolean
  closedAt?: Timestamp
  createdAt: Timestamp
  updatedAt: Timestamp
}

export interface ApplicationEvent {
  id: string
  userId: string
  applicationId: string
  type: ApplicationEventType
  fromStatus?: ApplicationStatus
  toStatus?: ApplicationStatus
  note?: string
  createdAt: Timestamp
}

/** Fields the application detail workspace can edit without changing status. */
export type ApplicationDetailsPatch = Partial<
  Pick<
    Application,
    | 'notes'
    | 'nextAction'
    | 'nextActionAt'
    | 'resumeVariantId'
    | 'resumeVariantName'
    | 'resumeUrl'
    | 'contactId'
  >
>
