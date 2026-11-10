import type { AtsApplicationField } from '../adapters/ats/types.js'

export type AutomationProviderId = 'mock' | 'playwright'
export type AutomationCapability = 'inspect' | 'fill' | 'screenshot' | 'submit'
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

export type AutomationStepName =
  | 'validate'
  | 'open-session'
  | 'inspect'
  | 'populate'
  | 'submit'
  | 'close-session'

export type AutomationStepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'

export interface AutomationStep {
  name: AutomationStepName
  status: AutomationStepStatus
  detail?: string
  startedAt?: string
  endedAt?: string
}

export interface AutomationSessionHandle {
  providerSessionId: string
  close(): Promise<void>
}

export interface AutomationSessionInput {
  userId: string
  applicationId: string
  applicationUrl: string
  allowedDomains: string[]
}

/**
 * A discovered form field plus server-side locator metadata.
 *
 * `key` is stable for a given form shape. It is the only field identifier the
 * client is allowed to send back to the fill function.
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

export interface AutomationResumeFile {
  buffer: Buffer
  fileName: string
  mimeType: string
}

export interface AutomationSubmissionResult {
  status: 'submitted' | 'manual-required' | 'failed'
  submittedAt?: string
  confirmationUrl?: string
  confirmationText?: string
  reason?: string
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

export interface AutomationScreenshot {
  buffer: Buffer
  contentType: 'image/webp'
  size: number
  width?: number
  height?: number
  pageUrl?: string
  pageTitle?: string
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

export interface ApplicationInspection {
  title?: string
  fields: AutomationFieldDescriptor[]
  questions: string[]
  manualActionReason?: string
}

export interface BrowserAutomationProvider {
  id: AutomationProviderId
  capabilities: ReadonlySet<AutomationCapability>
  createSession(input: AutomationSessionInput): Promise<AutomationSessionHandle>
  inspectApplication(
    handle: AutomationSessionHandle,
    input: AutomationSessionInput,
  ): Promise<ApplicationInspection>
  populateApprovedFields(
    handle: AutomationSessionHandle,
    input: AutomationSessionInput,
    approvedFields: ApprovedFieldValue[],
    fields: AutomationFieldDescriptor[],
  ): Promise<FieldPopulationResult[]>
  captureScreenshot(
    handle: AutomationSessionHandle,
  ): Promise<AutomationScreenshot | null>
  uploadResume(
    handle: AutomationSessionHandle,
    file: AutomationResumeFile | null,
  ): Promise<FieldPopulationResult[]>
  submitApplication(
    handle: AutomationSessionHandle,
  ): Promise<AutomationSubmissionResult>
  closeSession(handle: AutomationSessionHandle): Promise<void>
}
