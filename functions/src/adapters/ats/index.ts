import type { ATSAdapter, JobSource } from './types.js'
import { greenhouseAdapter } from './greenhouse.js'
import { leverAdapter } from './lever.js'
import { ashbyAdapter } from './ashby.js'
import { workableAdapter } from './workable.js'
import { smartRecruitersAdapter } from './smartrecruiters.js'
import { hnAdapter } from './hn.js'
import { remotiveAdapter } from './remotive.js'
import { remoteOkAdapter } from './remoteok.js'
import { arbeitnowAdapter } from './arbeitnow.js'

const adapters: Record<JobSource, ATSAdapter> = {
  greenhouse: greenhouseAdapter,
  lever: leverAdapter,
  ashby: ashbyAdapter,
  workable: workableAdapter,
  smartrecruiters: smartRecruitersAdapter,
  hn: hnAdapter,
  remotive: remotiveAdapter,
  remoteok: remoteOkAdapter,
  arbeitnow: arbeitnowAdapter,
}

/** Search-based sources are queried with search terms instead of a board slug. */
const SEARCH_SOURCES = new Set<JobSource>(['hn', 'remotive', 'remoteok', 'arbeitnow'])

export function isSearchSource(source: JobSource): boolean {
  return SEARCH_SOURCES.has(source)
}

export function getAdapter(source: JobSource): ATSAdapter | undefined {
  return adapters[source]
}

export {
  greenhouseAdapter,
  leverAdapter,
  ashbyAdapter,
  workableAdapter,
  smartRecruitersAdapter,
  hnAdapter,
  remotiveAdapter,
  remoteOkAdapter,
  arbeitnowAdapter,
}
export type { ATSAdapter, NormalizedJob, JobSource, JobSourceKind, JobStatus, RawJob } from './types.js'
