import type { NormalizedJob } from '../adapters/ats/types.js'

/**
 * Deduplicate a batch of jobs against each other and against an existing set
 * of fingerprints already in storage. Duplicates are matched by fingerprint,
 * and secondarily by canonical application URL.
 */
export function deduplicateJobs(
  incoming: NormalizedJob[],
  existingFingerprints: Set<string>,
  existingUrls: Set<string>,
): NormalizedJob[] {
  const seenFingerprints = new Set(existingFingerprints)
  const seenUrls = new Set(existingUrls)

  const unique: NormalizedJob[] = []

  for (const job of incoming) {
    const isDuplicate = seenFingerprints.has(job.fingerprint) || seenUrls.has(job.applicationUrl)
    if (isDuplicate) {
      continue
    }
    seenFingerprints.add(job.fingerprint)
    seenUrls.add(job.applicationUrl)
    unique.push(job)
  }

  return unique
}
