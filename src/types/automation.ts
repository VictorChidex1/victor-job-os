import type { Timestamp } from 'firebase/firestore'
import type { AtsApplicationField } from './jobs'

export type AutomationProviderId = 'mock' | 'playwright'
export type AutomationSessionStatus = 'active' | 'ended' | 'expired' | 'failed'
export type AutomationRunStatus =
  | 'queued'
  | 'running'
  | 'awaiting-manual-action'
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

export interface ApplicationInspection {
  title?: string
  fields: AtsApplicationField[]
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
  completed: 'Completed',
  failed: 'Failed',
  cancelled: 'Cancelled',
}
