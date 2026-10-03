import type { ATSAdapter, JobSource } from './types.js'
import { greenhouseAdapter } from './greenhouse.js'
import { leverAdapter } from './lever.js'
import { ashbyAdapter } from './ashby.js'

const adapters: Record<JobSource, ATSAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  ashby: ashbyAdapter,
}

export function getAdapter(source: JobSource): ATSAdapter | undefined {
  return adapters[source]
}

export { greenhouseAdapter, leverAdapter, ashbyAdapter }
export type { ATSAdapter, NormalizedJob, JobSource, JobStatus, RawJob } from './types.js'
