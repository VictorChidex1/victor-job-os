import type { Timestamp } from 'firebase/firestore'
import type {
  InterviewStatus,
  InterviewType,
} from '@/types/interviews'

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  phone: 'Phone screen',
  video: 'Video interview',
  onsite: 'Onsite interview',
  technical: 'Technical interview',
  behavioral: 'Behavioral interview',
  panel: 'Panel interview',
  final: 'Final interview',
  other: 'Other',
}

export const INTERVIEW_STATUS_LABELS: Record<InterviewStatus, string> = {
  scheduled: 'Scheduled',
  completed: 'Completed',
  cancelled: 'Cancelled',
  'no-show': 'No-show',
}

export const INTERVIEW_TYPE_OPTIONS = Object.keys(
  INTERVIEW_TYPE_LABELS,
) as InterviewType[]

export const INTERVIEW_STATUS_OPTIONS = Object.keys(
  INTERVIEW_STATUS_LABELS,
) as InterviewStatus[]

export function formatInterviewDate(
  value: Timestamp | Date | undefined,
  timezone?: string,
): string {
  if (!value) return '—'
  const date = value instanceof Date ? value : value.toDate()
  try {
    return new Intl.DateTimeFormat(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      timeZone: timezone || undefined,
      timeZoneName: 'short',
    }).format(date)
  } catch {
    return date.toLocaleString()
  }
}

export function toDateTimeLocalValue(value: Date): string {
  const pad = (input: number) => String(input).padStart(2, '0')
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(
    value.getDate(),
  )}T${pad(value.getHours())}:${pad(value.getMinutes())}`
}

export function localTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
}

export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes <= 0) return '—'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const remainder = minutes % 60
  return remainder ? `${hours}h ${remainder}m` : `${hours}h`
}

export function isFutureInterview(value: Timestamp, now = new Date()): boolean {
  return value.toDate().getTime() >= now.getTime()
}
