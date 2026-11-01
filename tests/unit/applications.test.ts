import { describe, expect, it } from 'vitest'
import {
  APPLICATION_STATUS_LABELS,
  APPLICATION_TRANSITIONS,
  applicationDocId,
  applicationStatusPatch,
  assertApplicationTransition,
  buildApplicationSeed,
  isAllowedApplicationTransition,
  isTerminalApplicationStatus,
  resolveApplicationOutcome,
} from '@/lib/applications'
import type { ApplicationStatus } from '@/types/applications'
import type { Job } from '@/types/jobs'

const timestamp = {} as Job['discoveredAt']

const job: Job = {
  id: 'job-1',
  userId: 'user-1',
  source: 'greenhouse',
  sourceJobId: 'source-job-1',
  companyId: 'company-1',
  companyName: 'Acme Corp',
  title: 'Senior React Engineer',
  description: 'Build the next generation of Acme tooling.',
  location: 'Remote (EU)',
  remote: true,
  applicationUrl: 'https://acme.example/jobs/1',
  discoveredAt: timestamp,
  skills: ['React', 'TypeScript'],
  searchTerms: ['react'],
  status: 'qualified',
  fingerprint: 'fingerprint-1',
  createdAt: timestamp,
  updatedAt: timestamp,
}

const happyPath: ApplicationStatus[] = [
  'not-started',
  'preparing',
  'needs-review',
  'approved',
  'submitted',
  'interview',
  'offer',
  'closed',
]

describe('application status machine', () => {
  it('allows the full happy path', () => {
    for (let index = 0; index < happyPath.length - 1; index += 1) {
      expect(
        isAllowedApplicationTransition(happyPath[index], happyPath[index + 1]),
      ).toBe(true)
    }
  })

  it('allows review to send work back to preparation', () => {
    expect(isAllowedApplicationTransition('needs-review', 'preparing')).toBe(true)
  })

  it('allows withdrawal or closing from every active stage', () => {
    const active: ApplicationStatus[] = [
      'not-started',
      'preparing',
      'needs-review',
      'approved',
      'submitted',
      'assessment',
      'interview',
      'offer',
    ]
    for (const status of active) {
      expect(isAllowedApplicationTransition(status, 'withdrawn')).toBe(true)
      expect(isAllowedApplicationTransition(status, 'closed')).toBe(true)
    }
  })

  it('allows an offer to be rejected or withdrawn after it is received', () => {
    expect(isAllowedApplicationTransition('offer', 'rejected')).toBe(true)
    expect(isAllowedApplicationTransition('offer', 'withdrawn')).toBe(true)
  })

  it('blocks skipped stages and backwards jumps', () => {
    expect(isAllowedApplicationTransition('not-started', 'approved')).toBe(false)
    expect(isAllowedApplicationTransition('not-started', 'offer')).toBe(false)
    expect(isAllowedApplicationTransition('approved', 'interview')).toBe(false)
    expect(isAllowedApplicationTransition('offer', 'interview')).toBe(false)
  })

  it('keeps stage shortcuts blocked while the process is strict', () => {
    expect(isAllowedApplicationTransition('submitted', 'offer')).toBe(false)
    expect(isAllowedApplicationTransition('assessment', 'offer')).toBe(false)
  })

  it('treats rejected, withdrawn, and closed as terminal', () => {
    for (const status of ['rejected', 'withdrawn', 'closed'] as const) {
      expect(isTerminalApplicationStatus(status)).toBe(true)
      expect(APPLICATION_TRANSITIONS[status]).toEqual([])
    }
    expect(isTerminalApplicationStatus('submitted')).toBe(false)
  })

  it('throws when an illegal transition is asserted', () => {
    expect(() => assertApplicationTransition('not-started', 'offer')).toThrow(
      /Cannot move/,
    )
    expect(() => assertApplicationTransition('approved', 'submitted')).not.toThrow()
  })

  it('labels every status', () => {
    for (const status of Object.keys(APPLICATION_TRANSITIONS) as ApplicationStatus[]) {
      expect(APPLICATION_STATUS_LABELS[status]).toBeTruthy()
    }
  })
})

describe('application identity and snapshots', () => {
  it('builds a deterministic id per user and job', () => {
    expect(applicationDocId('user-1', 'job-1')).toBe('user-1__job-1')
    expect(applicationDocId('user-1', 'job-1')).toBe(
      applicationDocId('user-1', 'job-1'),
    )
    expect(applicationDocId('user-2', 'job-1')).not.toBe(
      applicationDocId('user-1', 'job-1'),
    )
    expect(applicationDocId('user-1', 'job-2')).not.toBe(
      applicationDocId('user-1', 'job-1'),
    )
  })

  it('sanitizes slashes in document ids', () => {
    expect(applicationDocId('user/1', 'job/1')).toBe('user_1__job_1')
  })

  it('snapshots the opportunity fields', () => {
    const seed = buildApplicationSeed('user-1', job)

    expect(seed).toMatchObject({
      id: 'user-1__job-1',
      userId: 'user-1',
      jobId: 'job-1',
      companyId: 'company-1',
      companyName: 'Acme Corp',
      jobTitle: 'Senior React Engineer',
      jobSource: 'greenhouse',
      applicationUrl: 'https://acme.example/jobs/1',
      location: 'Remote (EU)',
      remote: true,
      status: 'not-started',
      origin: 'opportunity',
    })
  })
})

describe('application status patches', () => {
  it('records approval time only when approved', () => {
    expect(applicationStatusPatch('approved')).toMatchObject({
      status: 'approved',
      setApprovedAt: true,
      setSubmittedAt: false,
      setClosedAt: false,
    })
    expect(applicationStatusPatch('preparing').setApprovedAt).toBe(false)
  })

  it('records submission time', () => {
    expect(applicationStatusPatch('submitted')).toMatchObject({
      status: 'submitted',
      setSubmittedAt: true,
      setClosedAt: false,
    })
  })

  it('records closing time for terminal statuses', () => {
    for (const status of ['rejected', 'withdrawn', 'closed'] as const) {
      expect(applicationStatusPatch(status).setClosedAt).toBe(true)
    }
    expect(applicationStatusPatch('interview').setClosedAt).toBe(false)
  })
})

describe('application outcomes', () => {
  it('derives outcomes for rejection and withdrawal', () => {
    expect(resolveApplicationOutcome('submitted', 'rejected')).toBe('rejected')
    expect(resolveApplicationOutcome('assessment', 'withdrawn')).toBe('withdrawn')
    expect(resolveApplicationOutcome('interview', 'closed')).toBe('closed')
  })

  it('allows an offer to be accepted, declined, or closed', () => {
    expect(resolveApplicationOutcome('offer', 'closed', 'accepted')).toBe('accepted')
    expect(resolveApplicationOutcome('offer', 'closed', 'declined')).toBe('declined')
    expect(resolveApplicationOutcome('offer', 'closed')).toBe('closed')
  })

  it('derives rejection and withdrawal after an offer', () => {
    expect(resolveApplicationOutcome('offer', 'rejected')).toBe('rejected')
    expect(resolveApplicationOutcome('offer', 'withdrawn')).toBe('withdrawn')
  })

  it('rejects conflicting outcomes', () => {
    expect(() => resolveApplicationOutcome('submitted', 'rejected', 'withdrawn')).toThrow()
    expect(() => resolveApplicationOutcome('offer', 'closed', 'rejected')).toThrow()
  })

  it('rejects outcomes on non-terminal statuses', () => {
    expect(() => resolveApplicationOutcome('preparing', 'needs-review', 'rejected')).toThrow()
  })
})
