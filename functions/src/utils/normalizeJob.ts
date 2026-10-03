import { createHash } from 'node:crypto'
import type { NormalizedJob, RawJob, JobSource } from '../adapters/ats/types.js'

export function fingerprintJob(source: JobSource, sourceJobId: string, title: string): string {
  return createHash('sha256')
    .update(`${source}:${sourceJobId}:${title.trim().toLowerCase()}`)
    .digest('hex')
}

export function toNormalizedJob(source: JobSource, raw: RawJob): NormalizedJob {
  return {
    source,
    sourceJobId: raw.sourceJobId,
    title: raw.title,
    description: raw.description,
    location: raw.location,
    remote: raw.remote,
    employmentType: raw.employmentType,
    seniority: raw.seniority,
    applicationUrl: raw.applicationUrl,
    postedAt: raw.postedAt,
    discoveredAt: new Date().toISOString(),
    skills: raw.skills,
    searchTerms: [],
    sourceMetadata: raw.sourceMetadata,
    status: 'new',
    fingerprint: fingerprintJob(source, raw.sourceJobId, raw.title),
  }
}
