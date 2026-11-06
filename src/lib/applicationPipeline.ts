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

export interface StageTheme {
  dotColor: string
  borderColor: string
  bgLight: string
  badgeBg: string
  badgeText: string
  description: string
}

export const STAGE_THEMES: Record<string, StageTheme> = {
  'not-started': {
    dotColor: 'bg-slate-400 dark:bg-slate-500',
    borderColor: 'border-slate-500/30',
    bgLight: 'bg-slate-500/5',
    badgeBg: 'bg-slate-500/10',
    badgeText: 'text-slate-600 dark:text-slate-400',
    description: 'Lead selected, preparation pending',
  },
  'preparing': {
    dotColor: 'bg-indigo-500',
    borderColor: 'border-indigo-500/30',
    bgLight: 'bg-indigo-500/5',
    badgeBg: 'bg-indigo-500/10',
    badgeText: 'text-indigo-600 dark:text-indigo-400',
    description: 'Drafting cover letter & notes',
  },
  'needs-review': {
    dotColor: 'bg-amber-500',
    borderColor: 'border-amber-500/30',
    bgLight: 'bg-amber-500/5',
    badgeBg: 'bg-amber-500/10',
    badgeText: 'text-amber-600 dark:text-amber-400',
    description: 'Awaiting human review & approval',
  },
  'approved': {
    dotColor: 'bg-teal-500',
    borderColor: 'border-teal-500/30',
    bgLight: 'bg-teal-500/5',
    badgeBg: 'bg-teal-500/10',
    badgeText: 'text-teal-600 dark:text-teal-400',
    description: 'Approved and ready to apply',
  },
  'submitted': {
    dotColor: 'bg-blue-500',
    borderColor: 'border-blue-500/30',
    bgLight: 'bg-blue-500/5',
    badgeBg: 'bg-blue-500/10',
    badgeText: 'text-blue-600 dark:text-blue-400',
    description: 'Application sent to employer',
  },
  'assessment': {
    dotColor: 'bg-violet-500',
    borderColor: 'border-violet-500/30',
    bgLight: 'bg-violet-500/5',
    badgeBg: 'bg-violet-500/10',
    badgeText: 'text-violet-600 dark:text-violet-400',
    description: 'Technical test or assessment',
  },
  'interview': {
    dotColor: 'bg-purple-500',
    borderColor: 'border-purple-500/30',
    bgLight: 'bg-purple-500/5',
    badgeBg: 'bg-purple-500/10',
    badgeText: 'text-purple-600 dark:text-purple-400',
    description: 'Interview rounds in progress',
  },
  'offer': {
    dotColor: 'bg-emerald-500',
    borderColor: 'border-emerald-500/30',
    bgLight: 'bg-emerald-500/5',
    badgeBg: 'bg-emerald-500/10',
    badgeText: 'text-emerald-600 dark:text-emerald-400',
    description: 'Offer received & under review',
  },
  'closed': {
    dotColor: 'bg-zinc-400 dark:bg-zinc-500',
    borderColor: 'border-zinc-500/20',
    bgLight: 'bg-zinc-500/5',
    badgeBg: 'bg-zinc-500/10',
    badgeText: 'text-zinc-600 dark:text-zinc-400',
    description: 'Concluded, rejected, or withdrawn',
  },
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
