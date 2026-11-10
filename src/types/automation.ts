import type { Timestamp } from 'firebase/firestore'
import type { AtsApplicationField } from './jobs'

export type AutomationProviderId = 'mock' | 'playwright' | 'cloud-run'
export type AutomationSessionStatus = 'active' | 'ended' | 'expired' | 'failed'
export type AutomationRunStatus =
  | 'queued'
  | 'running'
  | 'awaiting-manual-action'
  | 'awaiting-verification'
  | 'verified'
  | 'submitting'
  | 'submitted'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type AutomationStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'

export interface AutomationStep {
  name: string
  status: AutomationStepStatus
  detail?: string
  startedAt?: string
  endedAt?: string
}

/**
 * A discovered form field plus the stable key used by the fill function.
 * Locator metadata is kept server-side and echoed for diagnostics.
 */
export interface AutomationFieldDescriptor extends AtsApplicationField {
  key: string
  inputType?: string
  tagName?: string
  id?: string
  htmlName?: string
  placeholder?: string
  ariaLabel?: string
}

export type AutomationFieldSource =
  | 'application'
  | 'profile'
  | 'preparation'
  | 'none'

export type AutomationFieldConfidence = 'high' | 'medium' | 'manual'

export interface AutomationFieldProposal {
  fieldKey: string
  label: string
  type?: AtsApplicationField['type']
  inputType?: string
  required?: boolean
  options?: string[]
  proposedValue?: string | boolean
  proposedSource: AutomationFieldSource
  confidence: AutomationFieldConfidence
  note?: string
}

export interface ApprovedFieldValue {
  fieldKey: string
  value: string | boolean
}

export type FieldPopulationStatus =
  | 'filled'
  | 'skipped'
  | 'failed'
  | 'manual-required'

export interface FieldPopulationResult {
  fieldKey: string
  label: string
  status: FieldPopulationStatus
  valuePreview?: string
  reason?: string
}

export interface AutomationPopulation {
  approvedFields: ApprovedFieldValue[]
  results: FieldPopulationResult[]
  startedAt?: string
  endedAt?: string
}

export type AutomationLogLevel = 'info' | 'warn' | 'error'

export interface AutomationLogEntry {
  sequence: number
  level: AutomationLogLevel
  step: string
  message: string
  detail?: string
  createdAt: string
}

export interface AutomationRunLog {
  id: string
  userId: string
  applicationId: string
  runId: string
  sessionId?: string
  provider: AutomationProviderId
  entries: AutomationLogEntry[]
  truncated: boolean
  expiresAt?: Timestamp
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export type AutomationSubmissionStatus =
  | 'submitting'
  | 'submitted'
  | 'manual-required'
  | 'failed'

export interface AutomationSubmission {
  status: AutomationSubmissionStatus
  requestedAt: string
  submittedAt?: string
  confirmationUrl?: string
  confirmationText?: string
  error?: string
  reason?: string
  resumeUrl?: string
}

export type AutomationVerificationStatus = 'pending' | 'verified'

export interface AutomationVerificationChecklist {
  openedApplication: boolean
  reviewedPopulatedFields: boolean
  handledManualFields: boolean
  confirmsInformationIsAccurate: boolean
}

export interface AutomationVerification {
  status: AutomationVerificationStatus
  requestedAt: string
  verifiedAt?: string
  verifiedBy?: string
  notes?: string
  checklist?: AutomationVerificationChecklist
  applicationStatus?: string
  applicationUpdatedAt?: string
}

export type AutomationArtifactKind = 'screenshot' | 'error'

export interface AutomationArtifact {
  id: string
  kind: AutomationArtifactKind
  label: string
  storagePath: string
  contentType: 'image/webp'
  size: number
  width?: number
  height?: number
  pageUrl?: string
  pageTitle?: string
  createdAt: string
}

export interface AutomationRunArtifacts {
  id: string
  userId: string
  applicationId: string
  runId: string
  sessionId?: string
  artifacts: AutomationArtifact[]
  expiresAt?: Timestamp
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export interface ApplicationInspection {
  title?: string
  fields: AutomationFieldDescriptor[]
  questions: string[]
  manualActionReason?: string
}

export interface AutomationSession {
  id: string
  userId: string
  applicationId: string
  provider: AutomationProviderId
  status: AutomationSessionStatus
  allowedDomains: string[]
  startedAt?: Timestamp
  expiresAt?: Timestamp
  endedAt?: Timestamp
  failureReason?: string
}

export interface AutomationRun {
  id: string
  userId: string
  applicationId: string
  applicationTitle: string
  companyName: string
  sessionId: string
  provider: AutomationProviderId
  status: AutomationRunStatus
  currentStep: string
  steps: AutomationStep[]
  inspection?: ApplicationInspection
  fieldProposals?: AutomationFieldProposal[]
  population?: AutomationPopulation
  verification?: AutomationVerification
  submission?: AutomationSubmission
  manualActionReason?: string
  error?: string
  startedAt?: Timestamp
  endedAt?: Timestamp
  createdAt?: Timestamp
  updatedAt?: Timestamp
}

export const AUTOMATION_RUN_LABELS: Record<AutomationRunStatus, string> = {
  queued: 'Queued',
  running: 'Running',
  'awaiting-manual-action': 'Manual action required',
  'awaiting-verification': 'Verification required',
  verified: 'Verified — submission pending',
  submitting: 'Submitting',
  submitted: 'Submitted',
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
}
