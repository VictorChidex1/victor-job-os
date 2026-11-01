import { createHash } from 'node:crypto'
import type { NormalizedJob, RawJob, JobSource } from '../adapters/ats/types.js'
import { stripHtml } from './html.js'

export { stripHtml }

export function fingerprintJob(source: JobSource, sourceJobId: string, title: string): string {
  return createHash('sha256')
    .update(`${source}:${sourceJobId}:${title.trim().toLowerCase()}`)
    .digest('hex')
}

/** Lowercase, strip punctuation, collapse whitespace. */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Company + role key used to detect the same job cross-posted to multiple ATS. */
export function companyTitleKey(companyName: string, title: string): string {
  return `${normalizeText(companyName)}|${normalizeText(title)}`
}

/** Hash of the normalized description body, used as a duplicate signal. */
export function fingerprintDescription(description: string): string {
  const normalized = normalizeText(stripHtml(description)).slice(0, 2000)
  if (!normalized) {
    return ''
  }
  return createHash('sha256').update(normalized).digest('hex')
}

export function humanizeBoardSlug(slug: string): string {
  return slug
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}



/** Build a normalized token set for keyword search (array-contains). */
export function buildSearchTokens(
  ...parts: Array<string | string[] | undefined>
): string[] {
  const tokens = new Set<string>()
  for (const part of parts) {
    if (!part) continue
    const values = Array.isArray(part) ? part : [part]
    for (const value of values) {
      for (const token of normalizeText(value).split(' ')) {
        if (token.length >= 2) tokens.add(token)
      }
    }
  }
  return Array.from(tokens).slice(0, 100)
}

export function toNormalizedJob(source: JobSource, raw: RawJob): NormalizedJob {
  const companyName = stripHtml(raw.companyName ?? '')
  const title = stripHtml(raw.title ?? '')
  const description = stripHtml(raw.description ?? '')
  const location = raw.location ? stripHtml(raw.location) : undefined

  return {
    source,
    sourceJobId: raw.sourceJobId,
    companyName,
    title,
    description,
    location,
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
    fingerprint: fingerprintJob(source, raw.sourceJobId, title),
    companyTitleKey: companyTitleKey(companyName, title),
    descriptionFingerprint: fingerprintDescription(description),
  }
}
