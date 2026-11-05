import { describe, expect, it } from 'vitest'
import type { Timestamp } from 'firebase/firestore'
import {
  ACTIVE_APPLICATION_STAGES,
  CLOSED_APPLICATION_STAGES,
  applicationSummary,
  filterApplications,
  formatApplicationDate,
  groupApplications,
  isApplicationOverdue,
} from '@/lib/applicationPipeline'
import type { Application, ApplicationStatus } from '@/types/applications'

function ts(value: string): Timestamp {
  return { toDate: () => new Date(value) } as unknown as Timestamp
}

function makeApplication(
  overrides: Partial<Application> & { id: string; status: ApplicationStatus },
): Application {
  return {
    userId: 'user-1',
    jobId: `job-${overrides.id}`,
    companyId: 'company-1',
    companyName: 'Acme Corp',
    jobTitle: 'Senior Engineer',
    jobSource: 'greenhouse',
    applicationUrl: 'https://example.com/jobs/1',
    location: 'Remote',
    remote: true,
    origin: 'opportunity',
    createdAt: ts('2026-10-01T10:00:00Z'),
    updatedAt: ts('2026-10-02T10:00:00Z'),
    ...overrides,
  }
}

describe('application pipeline helpers', () => {
  it('filters by role, company, and location', () => {
    const applications = [
      makeApplication({ id: '1', status: 'submitted', jobTitle: 'React Engineer' }),
      makeApplication({
        id: '2',
        status: 'interview',
        companyName: 'Globex',
        jobTitle: 'Backend Engineer',
        location: 'Berlin',
      }),
      makeApplication({
        id: '3',
        status: 'offer',
        companyName: 'Initech',
        jobTitle: 'Platform Engineer',
        location: 'Remote (EU)',
      }),
    ]

    expect(filterApplications(applications, 'react')).toHaveLength(1)
    expect(filterApplications(applications, 'globex')).toHaveLength(1)
    expect(filterApplications(applications, 'berlin')).toHaveLength(1)
    expect(filterApplications(applications, 'engineer')).toHaveLength(3)
    expect(filterApplications(applications, '  ')).toHaveLength(3)
    expect(filterApplications(applications, 'none')).toHaveLength(0)
  })

  it('groups active stages in order and combines terminal states', () => {
    const applications = [
      makeApplication({ id: 'a', status: 'not-started' }),
      makeApplication({ id: 'b', status: 'preparing' }),
      makeApplication({ id: 'c', status: 'offer' }),
      makeApplication({ id: 'd', status: 'rejected', outcome: 'rejected' }),
      makeApplication({ id: 'e', status: 'withdrawn', outcome: 'withdrawn' }),
      makeApplication({ id: 'f', status: 'closed', outcome: 'accepted' }),
    ]

    const columns = groupApplications(applications)

    expect(columns.map((column) => column.id)).toEqual([
      ...ACTIVE_APPLICATION_STAGES,
      'closed',
    ])
    expect(columns.find((column) => column.id === 'not-started')?.count).toBe(1)
    expect(columns.find((column) => column.id === 'preparing')?.count).toBe(1)
    expect(columns.find((column) => column.id === 'offer')?.count).toBe(1)

    const closed = columns.find((column) => column.id === 'closed')
    expect(closed?.statuses).toEqual(CLOSED_APPLICATION_STAGES)
    expect(closed?.count).toBe(3)
    expect(closed?.applications.map((application) => application.id).sort()).toEqual([
      'd',
      'e',
      'f',
    ])
  })

  it('sorts applications inside a column by latest update', () => {
    const older = makeApplication({
      id: 'older',
      status: 'submitted',
      updatedAt: ts('2026-10-01T10:00:00Z'),
    })
    const newer = makeApplication({
      id: 'newer',
      status: 'submitted',
      updatedAt: ts('2026-10-05T10:00:00Z'),
    })

    const column = groupApplications([older, newer]).find(
      (item) => item.id === 'submitted',
    )
    expect(column?.applications.map((application) => application.id)).toEqual([
      'newer',
      'older',
    ])
  })

  it('summarizes the pipeline and due next actions', () => {
    const now = new Date('2026-11-05T12:00:00Z')
    const applications = [
      makeApplication({ id: '1', status: 'not-started' }),
      makeApplication({ id: '2', status: 'submitted' }),
      makeApplication({ id: '3', status: 'interview' }),
      makeApplication({ id: '4', status: 'interview' }),
      makeApplication({ id: '5', status: 'offer' }),
      makeApplication({ id: '6', status: 'rejected', outcome: 'rejected' }),
      makeApplication({
        id: '7',
        status: 'preparing',
        nextActionAt: ts('2026-11-04T12:00:00Z'),
      }),
      makeApplication({
        id: '8',
        status: 'preparing',
        nextActionAt: ts('2026-11-06T12:00:00Z'),
      }),
      makeApplication({
        id: '9',
        status: 'closed',
        outcome: 'closed',
        nextActionAt: ts('2026-11-01T12:00:00Z'),
      }),
    ]

    expect(applicationSummary(applications, now)).toEqual({
      total: 9,
      active: 7,
      submitted: 1,
      interviewing: 2,
      offers: 1,
      closed: 2,
      nextActionsDue: 1,
    })
  })

  it('formats dates and detects overdue next actions', () => {
    const now = new Date('2026-11-05T12:00:00Z')

    expect(formatApplicationDate(ts('2026-11-04T12:00:00Z'))).toContain('2026')
    expect(formatApplicationDate(undefined)).toBe('—')
    expect(isApplicationOverdue(ts('2026-11-04T12:00:00Z'), now)).toBe(true)
    expect(isApplicationOverdue(ts('2026-11-06T12:00:00Z'), now)).toBe(false)
    expect(isApplicationOverdue(undefined, now)).toBe(false)
  })
})
