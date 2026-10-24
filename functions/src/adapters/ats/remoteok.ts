import type { ATSAdapter, ApplicationMetadata, NormalizedJob, RawJob } from './types.js'
import { stripHtml, toNormalizedJob } from '../../utils/normalizeJob.js'

interface RemoteOkJob {
  id?: string | number
  slug?: string
  company?: string
  position?: string
  tags?: string[]
  description?: string
  location?: string
  url?: string
  date?: string
  salary_min?: number
  salary_max?: number
}

const BASE_URL = 'https://remoteok.com/api'

function remoteOkToRaw(job: RemoteOkJob): RawJob {
  return {
    sourceJobId: String(job.id ?? job.slug ?? job.position),
    companyName: job.company ?? 'Unknown',
    title: job.position ?? 'Untitled role',
    description: stripHtml(job.description ?? ''),
    location: job.location || 'Remote',
    remote: true,
    employmentType: undefined,
    applicationUrl: job.url ?? (job.slug ? `https://remoteok.com/remote-jobs/${job.slug}` : ''),
    postedAt: job.date,
    skills: job.tags ?? [],
    sourceMetadata: { via: 'Remote OK', slug: job.slug, salaryMin: job.salary_min, salaryMax: job.salary_max },
  }
}

export const remoteOkAdapter: ATSAdapter = {
  source: 'remoteok',

  async discover(): Promise<NormalizedJob[]> {
    const response = await fetch(BASE_URL)
    if (!response.ok) {
      throw new Error(`RemoteOK discover failed (${response.status})`)
    }
    const data = (await response.json()) as RemoteOkJob[]
    // The first entry is a legal notice, not a job.
    const jobs = data.filter((job) => job && job.id && job.position)
    return jobs.map((job) => this.normalizeJob(remoteOkToRaw(job)))
  },

  async fetchJob(): Promise<NormalizedJob | null> {
    return null
  },

  normalizeJob(raw: RawJob): NormalizedJob {
    return toNormalizedJob('remoteok', raw)
  },

  getApplicationMetadata(job: NormalizedJob): ApplicationMetadata {
    return { applicationUrl: job.applicationUrl }
  },
}
