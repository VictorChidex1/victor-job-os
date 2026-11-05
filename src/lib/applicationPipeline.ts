import type { Application, ApplicationStatus } from '@/types/applications'
import {
  APPLICATION_STATUS_LABELS,
  isTerminalApplicationStatus,
} from '@/lib/applications'

export const ACTIVE_APPLICATION_STAGES: ApplicationStatus[] = [
  'not-started',
  'preparing',
  'needs-review',
  'approved',
  'submitted',
  'assessment',
  'interview',
  'offer',
]

export const CLOSED_APPLICATION_STAGES: ApplicationStatus[] = [
  'rejected',
  'withdrawn',
  'closed',
]

export interface ApplicationColumn {
  id: string
  label: string
  statuses: ApplicationStatus[]
  applications: Application[]
  count: number
}

type Dateish = { toDate?: () => Date } | null | undefined

export function toApplicationDate(value: Dateish): Date | null {
  return value?.toDate?.() ?? null
}

export function formatApplicationDate(value: Dateish): string {
  const date = toApplicationDate(value)
  return date
    ? date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—'
}

export function isApplicationOverdue(value: Dateish, now = new Date()): boolean {
  const date = toApplicationDate(value)
  return date ? date.getTime() < now.getTime() : false
}

function updatedMillis(application: Application): number {
  return toApplicationDate(application.updatedAt)?.getTime() ?? 0
}

export function filterApplications(
  applications: Application[],
  query: string,
): Application[] {
  const term = query.trim().toLowerCase()
  if (!term) {
    return applications
  }
  return applications.filter((application) =>
    [application.jobTitle, application.companyName, application.location]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(term)),
  )
}

export function groupApplications(applications: Application[]): ApplicationColumn[] {
  const columns: ApplicationColumn[] = ACTIVE_APPLICATION_STAGES.map((status) => ({
    id: status,
    label: APPLICATION_STATUS_LABELS[status],
    statuses: [status],
    applications: applications
      .filter((application) => application.status === status)
      .sort((a, b) => updatedMillis(b) - updatedMillis(a)),
    count: 0,
  }))

  for (const column of columns) {
    column.count = column.applications.length
  }

  const closed = applications
    .filter((application) => isTerminalApplicationStatus(application.status))
    .sort((a, b) => updatedMillis(b) - updatedMillis(a))

  columns.push({
    id: 'closed',
    label: 'Closed',
    statuses: CLOSED_APPLICATION_STAGES,
    applications: closed,
    count: closed.length,
  })

  return columns
}

export interface ApplicationSummary {
  total: number
  active: number
  submitted: number
  interviewing: number
  offers: number
  closed: number
  nextActionsDue: number
}

export function applicationSummary(
  applications: Application[],
  now = new Date(),
): ApplicationSummary {
  const active = applications.filter(
    (application) => !isTerminalApplicationStatus(application.status),
  )
  return {
    total: applications.length,
    active: active.length,
    submitted: applications.filter((application) => application.status === 'submitted')
      .length,
    interviewing: applications.filter(
      (application) => application.status === 'interview',
    ).length,
    offers: applications.filter((application) => application.status === 'offer').length,
    closed: applications.filter((application) =>
      isTerminalApplicationStatus(application.status),
    ).length,
    nextActionsDue: active.filter((application) =>
      isApplicationOverdue(application.nextActionAt, now),
    ).length,
  }
}
