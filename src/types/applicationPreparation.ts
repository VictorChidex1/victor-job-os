import type { Timestamp } from 'firebase/firestore'

export type PreparationItemStatus =
  | 'empty'
  | 'draft'
  | 'needs-review'
  | 'approved'

export interface CoverLetterDraft {
  body: string
  /** Immutable copy of the AI-generated draft, kept for comparison and restore. */
  draftBody: string
  status: PreparationItemStatus
  aiProvider?: string
  model?: string
  promptVersion?: string
  updatedAt?: Timestamp
  approvedAt?: Timestamp
}

export interface ApplicationAnswerDraft {
  id: string
  question: string
  answer: string
  /** Immutable copy of the AI-generated answer, kept for comparison and restore. */
  draftAnswer: string
  status: PreparationItemStatus
  aiProvider?: string
  model?: string
  promptVersion?: string
  updatedAt?: Timestamp
  approvedAt?: Timestamp
}

export interface ApplicationPreparation {
  id: string
  userId: string
  applicationId: string
  coverLetter: CoverLetterDraft
  answers: ApplicationAnswerDraft[]
  /** Snapshot of the resume URL attached to this application. */
  resumeUrl: string
  resumeNotes: string
  resumeReviewed: boolean
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface ApplicationPreparationPatch {
  coverLetter?: CoverLetterDraft
  answers?: ApplicationAnswerDraft[]
  resumeUrl?: string
  resumeNotes?: string
  resumeReviewed?: boolean
}
