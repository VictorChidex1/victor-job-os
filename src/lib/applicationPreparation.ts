import type { ApplicationStatus } from '@/types/applications'
import type {
  ApplicationAnswerDraft,
  ApplicationPreparation,
  CoverLetterDraft,
  PreparationItemStatus,
} from '@/types/applicationPreparation'

export const PREPARATION_STATUS_LABELS: Record<PreparationItemStatus, string> = {
  empty: 'Not started',
  draft: 'Draft',
  'needs-review': 'Needs review',
  approved: 'Approved',
}

export const PREPARATION_STATUS_ORDER: PreparationItemStatus[] = [
  'empty',
  'draft',
  'needs-review',
  'approved',
]

export const DEFAULT_APPLICATION_QUESTIONS = [
  'Why are you interested in this role and company?',
  'Which project best demonstrates your fit for this role?',
  'What would you prioritize in your first 90 days?',
  'Tell us about a technical challenge you solved and what you learned.',
] as const

const PREPARATION_SEPARATOR = '__prep__'

function safeSegment(value: string): string {
  return value.replace(/\//g, '_')
}

/**
 * Preparation documents are separate from applications so the pipeline list
 * stays lightweight. The uid prefix prevents cross-user document collisions.
 */
export function preparationDocId(uid: string, applicationId: string): string {
  return `${safeSegment(uid)}${PREPARATION_SEPARATOR}${safeSegment(applicationId)}`
}

export function createEmptyCoverLetter(): CoverLetterDraft {
  return {
    body: '',
    draftBody: '',
    status: 'empty',
  }
}

export function createEmptyPreparation(
  uid: string,
  applicationId: string,
): ApplicationPreparation {
  return {
    id: preparationDocId(uid, applicationId),
    userId: uid,
    applicationId,
    coverLetter: createEmptyCoverLetter(),
    answers: [],
    resumeNotes: '',
    resumeReviewed: false,
  }
}

export function createAnswerId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `answer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyAnswer(question = ''): ApplicationAnswerDraft {
  return {
    id: createAnswerId(),
    question,
    answer: '',
    draftAnswer: '',
    status: 'empty',
  }
}

/**
 * Once an application is approved, the preparation is locked. Submission and
 * later stages stay read-only so the record matches what was approved.
 */
export function isPreparationReadOnly(status: ApplicationStatus): boolean {
  return !(
    status === 'not-started' ||
    status === 'preparing' ||
    status === 'needs-review'
  )
}

export function preparationPendingItems(
  preparation: ApplicationPreparation,
): string[] {
  const pending: string[] = []

  if (
    preparation.coverLetter.body.trim() &&
    preparation.coverLetter.status !== 'approved'
  ) {
    pending.push('Cover letter')
  }

  for (const answer of preparation.answers) {
    if (answer.answer.trim() && answer.status !== 'approved') {
      pending.push(answer.question.trim() || 'Application answer')
    }
  }

  return pending
}

export function preparationReadyForApproval(
  preparation: ApplicationPreparation,
): boolean {
  return preparationPendingItems(preparation).length === 0
}

export function preparationApprovedAnswerCount(
  preparation: ApplicationPreparation,
): number {
  return preparation.answers.filter(
    (answer) => answer.answer.trim() && answer.status === 'approved',
  ).length
}

export function preparationAnswerCount(
  preparation: ApplicationPreparation,
): number {
  return preparation.answers.filter((answer) => answer.answer.trim()).length
}
