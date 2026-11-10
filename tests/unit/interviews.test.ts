import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import {
  formatDuration,
  formatInterviewDate,
  INTERVIEW_STATUS_LABELS,
  INTERVIEW_TYPE_LABELS,
  isFutureInterview,
  toDateTimeLocalValue,
} from '@/lib/interviews'

describe('interview helpers', () => {
  it('has labels for every interview type and status', () => {
    expect(INTERVIEW_TYPE_LABELS.video).toBe('Video interview')
    expect(INTERVIEW_STATUS_LABELS['no-show']).toBe('No-show')
  })

  it('formats durations', () => {
    expect(formatDuration(45)).toBe('45 min')
    expect(formatDuration(60)).toBe('1h')
    expect(formatDuration(90)).toBe('1h 30m')
  })

  it('formats dates in the requested timezone', () => {
    const timestamp = Timestamp.fromDate(new Date('2026-11-10T10:00:00Z'))
    expect(formatInterviewDate(timestamp, 'UTC')).toContain('Nov')
    expect(formatInterviewDate(timestamp, 'UTC')).toContain('10:00')
  })

  it('creates a datetime-local value and evaluates future dates', () => {
    const date = new Date(2026, 10, 10, 14, 30)
    expect(toDateTimeLocalValue(date)).toBe('2026-11-10T14:30')
    expect(isFutureInterview(Timestamp.fromDate(date), new Date(2026, 10, 9))).toBe(
      true,
    )
  })
})
