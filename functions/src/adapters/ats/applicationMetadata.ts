import type { ApplicationMetadata, NormalizedJob } from './types.js'

/**
 * Build the metadata we can safely derive from the job-listing payload.
 * Missing requirements and questions stay absent rather than being guessed.
 */
export function baseApplicationMetadata(
  job: NormalizedJob,
  overrides: Partial<ApplicationMetadata> = {},
): ApplicationMetadata {
  return {
    source: job.source,
    sourceJobId: job.sourceJobId,
    applicationUrl: job.applicationUrl,
    completeness: 'partial',
    ...overrides,
  }
}
