import type {
  ATSAdapter,
  ApplicationMetadata,
  NormalizedJob,
  RawJob,
} from './types.js'
import { toNormalizedJob } from '../../utils/normalizeJob.js'

interface AshbyJob {
  id: string
  title: string
  department?: string
  team?: string
  employmentType?: string
  location?: string
  isRemote?: boolean
  publishedAt?: string
  jobUrl?: string
  applyUrl?: string
  descriptionPlain?: string
  descriptionHtml?: string
}

const BASE_URL = 'https://api.ashbyhq.com/posting-api/job-board'

function ashbyToRaw(job: AshbyJob): RawJob {
  return {
    sourceJobId: job.id,
    title: job.title,
    description: job.descriptionPlain ?? job.descriptionHtml ?? '',
    location: job.location,
    remote: job.isRemote ?? /remote/i.test(job.location ?? ''),
    employmentType: job.employmentType,
    seniority: job.department ?? job.team,
    applicationUrl: job.jobUrl ?? job.applyUrl ?? '',
    postedAt: job.publishedAt,
    skills: [],
    sourceMetadata: {
      department: job.department,
      team: job.team,
      applyUrl: job.applyUrl,
    },
  }
}

export const ashbyAdapter: ATSAdapter = {
  source: 'ashby',

  async discover(boardTarget: string): Promise<NormalizedJob[]> {
    const url = `${BASE_URL}/${encodeURIComponent(boardTarget)}`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Ashby discover failed (${response.status}) for board "${boardTarget}"`)
    }
    const data = (await response.json()) as { jobs: AshbyJob[] }
    return (data.jobs ?? []).map((job) => this.normalizeJob(ashbyToRaw(job)))
  },

  async fetchJob(id: string): Promise<NormalizedJob | null> {
    const response = await fetch(`https://api.ashbyhq.com/posting-api/job-board/${encodeURIComponent(id)}`)
    if (!response.ok) {
      return null
    }
    const data = (await response.json()) as { jobs: AshbyJob[] }
    const job = data.jobs?.find((j) => j.id === id)
    return job ? this.normalizeJob(ashbyToRaw(job)) : null
  },

  normalizeJob(raw: RawJob): NormalizedJob {
    return toNormalizedJob('ashby', raw)
  },

  getApplicationMetadata(job: NormalizedJob): ApplicationMetadata {
    return { applicationUrl: job.applicationUrl }
  },
}
