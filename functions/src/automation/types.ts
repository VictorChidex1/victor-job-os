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

export interface ApplicationInspection {
  title?: string
  fields: AtsApplicationField[]
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
  closeSession(handle: AutomationSessionHandle): Promise<void>
}
