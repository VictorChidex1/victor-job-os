import type { ATSAdapter, ApplicationMetadata, NormalizedJob, RawJob } from './types.js'
import { stripHtml, toNormalizedJob } from '../../utils/normalizeJob.js'

interface RemotiveJob {
  id: number
  url: string
  title: string
  company_name: string
  category?: string
  job_type?: string
  publication_date?: string
  candidate_required_location?: string
  salary?: string
  description?: string
  tags?: string[]
}

const BASE_URL = 'https://remotive.com/api/remote-jobs'

function remotiveToRaw(job: RemotiveJob): RawJob {
  return {
    sourceJobId: String(job.id),
    companyName: job.company_name,
    title: job.title,
    description: stripHtml(job.description ?? ''),
    location: job.candidate_required_location || 'Remote',
    remote: true,
    employmentType: job.job_type,
    applicationUrl: job.url,
    postedAt: job.publication_date,
    skills: job.tags ?? [],
    sourceMetadata: { category: job.category, salary: job.salary },
  }
}

export const remotiveAdapter: ATSAdapter = {
  source: 'remotive',

  async discover(boardTarget: string): Promise<NormalizedJob[]> {
    const query = boardTarget && boardTarget !== 'all' ? boardTarget : ''
    const params = new URLSearchParams({ limit: '200' })
    if (query) params.set('search', query)
    const response = await fetch(`${BASE_URL}?${params.toString()}`)
    if (!response.ok) {
      throw new Error(`Remotive discover failed (${response.status})`)
    }
    const data = (await response.json()) as { jobs?: RemotiveJob[] }
    return (data.jobs ?? []).map((job) => this.normalizeJob(remotiveToRaw(job)))
  },

  async fetchJob(): Promise<NormalizedJob | null> {
    return null
  },

  normalizeJob(raw: RawJob): NormalizedJob {
    return toNormalizedJob('remotive', raw)
  },

  getApplicationMetadata(job: NormalizedJob): ApplicationMetadata {
    return { applicationUrl: job.applicationUrl }
  },
}
