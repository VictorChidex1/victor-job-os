import type { Job } from '@/types/jobs'
import { buildSearchTokens } from '@/lib/searchTokens'
import type {
  Application,
  ApplicationOrigin,
  ApplicationOutcome,
  ApplicationStatus,
} from '@/types/applications'

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  'not-started',
  'preparing',
  'needs-review',
  'approved',
  'submitted',
  'assessment',
  'interview',
  'offer',
  'rejected',
  'withdrawn',
  'closed',
]

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  'not-started': 'Not started',
  preparing: 'Preparing',
  'needs-review': 'Needs review',
  approved: 'Approved',
  submitted: 'Submitted',
  assessment: 'Assessment',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  closed: 'Closed',
}

export const TERMINAL_APPLICATION_STATUSES: ApplicationStatus[] = [
  'rejected',
  'withdrawn',
  'closed',
]

/** Only these status changes are legal. */
export const APPLICATION_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus[]> = {
  'not-started': ['preparing', 'withdrawn', 'closed'],
  preparing: ['needs-review', 'withdrawn', 'closed'],
  'needs-review': ['preparing', 'approved', 'withdrawn', 'closed'],
  approved: ['submitted', 'withdrawn', 'closed'],
  submitted: ['assessment', 'interview', 'rejected', 'withdrawn', 'closed'],
  assessment: ['interview', 'rejected', 'withdrawn', 'closed'],
  interview: ['offer', 'rejected', 'withdrawn', 'closed'],
  offer: ['closed', 'rejected', 'withdrawn'],
  rejected: [],
  withdrawn: [],
  closed: [],
}

export function isAllowedApplicationTransition(from: string, to: string): boolean {
  const allowed = APPLICATION_TRANSITIONS[from as ApplicationStatus] ?? []
  return allowed.includes(to as ApplicationStatus)
}

export function assertApplicationTransition(
  from: ApplicationStatus,
  to: ApplicationStatus,
): void {
  if (!isAllowedApplicationTransition(from, to)) {
    throw new Error(`Cannot move an application from "${from}" to "${to}".`)
  }
}

export function isTerminalApplicationStatus(status: string): boolean {
  return TERMINAL_APPLICATION_STATUSES.includes(status as ApplicationStatus)
}

/**
 * Deterministic ID so a user can only have one application per job.
 * Re-clicking "Start application" resolves to the same document.
 */
export function applicationDocId(uid: string, jobId: string): string {
  const safeUid = uid.replace(/\//g, '_')
  const safeJobId = jobId.replace(/\//g, '_')
  return `${safeUid}__${safeJobId}`
}

export type ApplicationJobSource = Pick<
  Job,
  | 'id'
  | 'companyId'
  | 'companyName'
  | 'title'
  | 'source'
  | 'applicationUrl'
  | 'location'
  | 'remote'
>

export type ApplicationSeed = Pick<
  Application,
  | 'id'
  | 'userId'
  | 'jobId'
  | 'companyId'
  | 'companyName'
  | 'jobTitle'
  | 'jobSource'
  | 'applicationUrl'
  | 'location'
  | 'remote'
  | 'status'
  | 'origin'
  | 'searchTokens'
>

/** Snapshot the fields we need at creation time. */
export function buildApplicationSeed(
  uid: string,
  job: ApplicationJobSource,
  origin: ApplicationOrigin = 'opportunity',
): ApplicationSeed {
  const companyName = job.companyName ?? ''
  const jobTitle = job.title
  const location = job.location

  return {
    id: applicationDocId(uid, job.id),
    userId: uid,
    jobId: job.id,
    companyId: job.companyId ?? '',
    companyName,
    jobTitle,
    jobSource: job.source,
    applicationUrl: job.applicationUrl,
    location,
    remote: job.remote,
    status: 'not-started',
    origin,
    searchTokens: buildSearchTokens(companyName, jobTitle, location, job.source),
  }
}

export interface ApplicationStatusPatch {
  status: ApplicationStatus
  outcome?: ApplicationOutcome
  setApprovedAt: boolean
  setSubmittedAt: boolean
  setClosedAt: boolean
}

export function applicationStatusPatch(
  to: ApplicationStatus,
  outcome?: ApplicationOutcome,
): ApplicationStatusPatch {
  return {
    status: to,
    outcome,
    setApprovedAt: to === 'approved',
    setSubmittedAt: to === 'submitted',
    setClosedAt: isTerminalApplicationStatus(to),
  }
}

const OUTCOME_BY_TERMINAL_STATUS: Record<
  'rejected' | 'withdrawn' | 'closed',
  ApplicationOutcome
> = {
  rejected: 'rejected',
  withdrawn: 'withdrawn',
  closed: 'closed',
}

/**
 * Terminal statuses carry an outcome. A closed offer can be accepted,
 * declined, or simply closed.
 */
export function resolveApplicationOutcome(
  from: ApplicationStatus,
  to: ApplicationStatus,
  requested?: ApplicationOutcome,
): ApplicationOutcome | undefined {
  if (!isTerminalApplicationStatus(to)) {
    if (requested !== undefined) {
      throw new Error('An outcome can only be recorded for a terminal status.')
    }
    return undefined
  }

  if (to === 'closed' && from === 'offer') {
    const outcome = requested ?? 'closed'
    if (outcome !== 'accepted' && outcome !== 'declined' && outcome !== 'closed') {
      throw new Error('A closed offer must be accepted, declined, or closed.')
    }
    return outcome
  }

  const expected = OUTCOME_BY_TERMINAL_STATUS[to as 'rejected' | 'withdrawn' | 'closed']
  if (requested !== undefined && requested !== expected) {
    throw new Error(`Status "${to}" must use outcome "${expected}".`)
  }
  return expected
}
