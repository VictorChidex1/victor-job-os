import type { NormalizedJob } from '../adapters/ats/types.js'

export interface ExistingJobKeys {
  fingerprints: Set<string>
  urls: Set<string>
  companyTitles: Set<string>
  descriptionFingerprints: Set<string>
}

/**
 * Deduplicate a batch of jobs against each other and against the existing
 * documents already in storage. A job is considered a duplicate when any of
 * the following match:
 *   - source-scoped fingerprint (source + source job id + title)
 *   - canonical application URL
 *   - normalized company + title (same role cross-posted to another ATS)
 *   - normalized description fingerprint
 */
export function deduplicateJobs(incoming: NormalizedJob[], existing: ExistingJobKeys): NormalizedJob[] {
  const fingerprints = new Set(existing.fingerprints)
  const urls = new Set(existing.urls)
  const companyTitles = new Set(existing.companyTitles)
  const descriptionFingerprints = new Set(existing.descriptionFingerprints)

  const unique: NormalizedJob[] = []

  for (const job of incoming) {
    const isDuplicate =
      fingerprints.has(job.fingerprint) ||
      (job.applicationUrl !== '' && urls.has(job.applicationUrl)) ||
      (job.companyTitleKey !== '' && companyTitles.has(job.companyTitleKey)) ||
      (job.descriptionFingerprint !== '' && descriptionFingerprints.has(job.descriptionFingerprint))

    if (isDuplicate) {
      continue
    }

    fingerprints.add(job.fingerprint)
    if (job.applicationUrl) urls.add(job.applicationUrl)
    if (job.companyTitleKey) companyTitles.add(job.companyTitleKey)
    if (job.descriptionFingerprint) descriptionFingerprints.add(job.descriptionFingerprint)
    unique.push(job)
  }

  return unique
}
