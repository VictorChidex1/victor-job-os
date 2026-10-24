import type { ATSAdapter, ApplicationMetadata, NormalizedJob, RawJob } from './types.js'
import { stripHtml, toNormalizedJob } from '../../utils/normalizeJob.js'

interface ArbeitnowJob {
  slug: string
  company_name: string
  title: string
  description?: string
  remote?: boolean
  url: string
  tags?: string[]
  job_types?: string[]
  location?: string
  created_at?: number
}

const BASE_URL = 'https://www.arbeitnow.com/api/job-board-api'

function arbeitnowToRaw(job: ArbeitnowJob): RawJob {
  return {
    sourceJobId: job.slug,
    companyName: job.company_name,
    title: job.title,
    description: stripHtml(job.description ?? ''),
    location: job.location,
    remote: job.remote === true,
    employmentType: job.job_types?.[0],
    applicationUrl: job.url,
    postedAt: job.created_at ? new Date(job.created_at * 1000).toISOString() : undefined,
    skills: job.tags ?? [],
    sourceMetadata: { jobTypes: job.job_types ?? [] },
  }
}

export const arbeitnowAdapter: ATSAdapter = {
  source: 'arbeitnow',

  async discover(): Promise<NormalizedJob[]> {
    const response = await fetch(BASE_URL)
    if (!response.ok) {
      throw new Error(`Arbeitnow discover failed (${response.status})`)
    }
    const data = (await response.json()) as { data?: ArbeitnowJob[] }
    return (data.data ?? []).map((job) => this.normalizeJob(arbeitnowToRaw(job)))
  },

  async fetchJob(): Promise<NormalizedJob | null> {
    return null
  },

  normalizeJob(raw: RawJob): NormalizedJob {
    return toNormalizedJob('arbeitnow', raw)
  },

  getApplicationMetadata(job: NormalizedJob): ApplicationMetadata {
    return { applicationUrl: job.applicationUrl }
  },
}
