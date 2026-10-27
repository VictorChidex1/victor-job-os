import { describe, expect, it } from 'vitest'
import { deduplicateJobs, type ExistingJobKeys } from '../../functions/lib/utils/deduplicateJob.js'
import { toNormalizedJob } from '../../functions/lib/utils/normalizeJob.js'
import type { RawJob } from '../../functions/lib/adapters/ats/types.js'

function raw(overrides: Partial<RawJob> = {}): RawJob {
  return {
    sourceJobId: '1',
    companyName: 'Acme',
    title: 'React Engineer',
    description: 'Build React apps at scale.',
    remote: true,
    location: 'Remote',
    skills: ['React'],
    applicationUrl: 'https://example.com/jobs/1',
    sourceMetadata: {},
    ...overrides,
  }
}

function emptyKeys(): ExistingJobKeys {
  return {
    fingerprints: new Set(),
    urls: new Set(),
    companyTitles: new Set(),
    descriptionFingerprints: new Set(),
  }
}

describe('deduplicateJobs', () => {
  it('keeps genuinely different jobs', () => {
    const a = toNormalizedJob('greenhouse', raw({ sourceJobId: '1', title: 'React Engineer' }))
    const b = toNormalizedJob(
      'lever',
      raw({
        sourceJobId: '2',
        companyName: 'Globex',
        title: 'Backend Engineer',
        description: 'Build Node services.',
        applicationUrl: 'https://globex.dev/jobs/2',
      }),
    )
    expect(deduplicateJobs([a, b], emptyKeys())).toHaveLength(2)
  })

  it('drops same-source duplicates (fingerprint)', () => {
    const a = toNormalizedJob('greenhouse', raw())
    const b = toNormalizedJob('greenhouse', raw())
    expect(deduplicateJobs([a, b], emptyKeys())).toHaveLength(1)
  })

  it('drops duplicates by application URL across sources', () => {
    const a = toNormalizedJob('greenhouse', raw())
    const b = toNormalizedJob(
      'lever',
      raw({ sourceJobId: '9', title: 'Different Title', description: 'Different text.' }),
    )
    expect(deduplicateJobs([a, b], emptyKeys())).toHaveLength(1)
  })

  it('drops the same company + title cross-posted to another board', () => {
    const a = toNormalizedJob('greenhouse', raw())
    const b = toNormalizedJob(
      'lever',
      raw({
        sourceJobId: '2',
        description: 'A slightly different description.',
        applicationUrl: 'https://lever.co/acme/2',
      }),
    )
    expect(deduplicateJobs([a, b], emptyKeys())).toHaveLength(1)
  })

  it('drops duplicates by identical description across sources', () => {
    const a = toNormalizedJob('greenhouse', raw())
    const b = toNormalizedJob(
      'ashby',
      raw({
        sourceJobId: '3',
        companyName: 'Other Co',
        title: 'Other Role',
        applicationUrl: 'https://other.co/jobs/3',
      }),
    )
    expect(deduplicateJobs([a, b], emptyKeys())).toHaveLength(1)
  })

  it('drops jobs already present in the existing keys', () => {
    const existing = emptyKeys()
    const a = toNormalizedJob('greenhouse', raw())
    existing.fingerprints.add(a.fingerprint)
    expect(deduplicateJobs([a], existing)).toHaveLength(0)
  })

  it('does not mutate the caller’s existing sets', () => {
    const existing = emptyKeys()
    const a = toNormalizedJob('greenhouse', raw())
    deduplicateJobs([a], existing)
    expect(existing.fingerprints.size).toBe(0)
  })
})
