import type { AtsApplicationField } from '../adapters/ats/types.js'

export type AutomationProviderId = 'mock' | 'playwright'
export type AutomationCapability = 'inspect' | 'fill' | 'screenshot' | 'submit'
export type AutomationSessionStatus = 'active' | 'ended' | 'expired' | 'failed'
export type AutomationRunStatus =
  | 'queued'
  | 'running'
  | 'awaiting-manual-action'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type AutomationStepName =
  | 'validate'
  | 'open-session'
  | 'inspect'
  | 'populate'
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
  closeSession(handle: AutomationSessionHandle): Promise<void>
}
