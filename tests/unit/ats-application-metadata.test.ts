import { describe, expect, it } from 'vitest'
import {
  completenessLabel,
  normalizeAtsMetadata,
  requirementLabel,
} from '@/lib/atsApplicationMetadata'

describe('ATS application metadata', () => {
  it('normalizes captured metadata and optional requirements', () => {
    const metadata = normalizeAtsMetadata(
      {
        source: 'lever',
        sourceJobId: 'job-1',
        applicationUrl: 'https://jobs.lever.co/acme/job-1/apply',
        requiresResume: true,
        requiresCoverLetter: false,
        questions: ['Why Acme?', ''],
        formFields: [
          { name: 'Resume', required: true, type: 'file' },
          { name: 'Website', type: 'text', options: [] },
          { missing: 'name' },
        ],
        completeness: 'complete',
      },
      { source: 'custom', applicationUrl: '' },
    )

    expect(metadata).toMatchObject({
      source: 'lever',
      sourceJobId: 'job-1',
      applicationUrl: 'https://jobs.lever.co/acme/job-1/apply',
      requiresResume: true,
      requiresCoverLetter: false,
      questions: ['Why Acme?'],
      completeness: 'complete',
    })
    expect(metadata.formFields).toHaveLength(2)
  })

  it('falls back to a partial snapshot when metadata is missing', () => {
    const metadata = normalizeAtsMetadata(
      null,
      {
        source: 'greenhouse',
        sourceJobId: 'job-2',
        applicationUrl: 'https://boards.greenhouse.io/acme/jobs/2',
      },
    )

    expect(metadata.completeness).toBe('partial')
    expect(metadata.requiresResume).toBeUndefined()
    expect(metadata.requiresCoverLetter).toBeUndefined()
    expect(metadata.source).toBe('greenhouse')
  })

  it('labels unknown requirements honestly', () => {
    expect(requirementLabel(undefined)).toBe('Not exposed by source')
    expect(requirementLabel(true)).toBe('Required')
    expect(completenessLabel('partial')).toContain('Partial')
  })
})
