import type { ATSAdapter, ApplicationMetadata, NormalizedJob, RawJob } from './types.js'
import { humanizeBoardSlug, stripHtml, toNormalizedJob } from '../../utils/normalizeJob.js'

interface WorkableJob {
  title?: string
  shortcode?: string
  code?: string
  employment_type?: string
  telecommuting?: boolean
  department?: string
  url?: string
  shortlink?: string
  application_url?: string
  published_on?: string
  created_at?: string
  country?: string
  city?: string
  state?: string
  description?: string
}

const BASE_URL = 'https://www.workable.com/api/accounts'

function workableToRaw(job: WorkableJob, companyName: string): RawJob {
  const location = [job.city, job.state, job.country].filter(Boolean).join(', ') || undefined
  return {
    sourceJobId: job.shortcode ?? job.code ?? job.url ?? job.title ?? '',
    companyName: companyName || 'Unknown',
    title: job.title ?? 'Untitled role',
    description: stripHtml(job.description ?? ''),
    location,
    remote: job.telecommuting === true || /remote/i.test(`${job.title ?? ''} ${location ?? ''}`),
    employmentType: job.employment_type,
    applicationUrl: job.url ?? job.shortlink ?? job.application_url ?? '',
    postedAt: job.published_on ?? job.created_at,
    skills: [],
    sourceMetadata: { department: job.department, shortcode: job.shortcode },
  }
}

export const workableAdapter: ATSAdapter = {
  source: 'workable',

  async discover(boardTarget: string): Promise<NormalizedJob[]> {
    const response = await fetch(
      `${BASE_URL}/${encodeURIComponent(boardTarget)}?details=true`,
    )
    if (!response.ok) {
      throw new Error(`Workable discover failed (${response.status}) for "${boardTarget}"`)
    }
    const data = (await response.json()) as { name?: string; jobs?: WorkableJob[] }
    const companyName = data.name ?? humanizeBoardSlug(boardTarget)
    return (data.jobs ?? []).map((job) => this.normalizeJob(workableToRaw(job, companyName)))
  },

  async fetchJob(): Promise<NormalizedJob | null> {
    return null
  },

  normalizeJob(raw: RawJob): NormalizedJob {
    return toNormalizedJob('workable', raw)
  },

  getApplicationMetadata(job: NormalizedJob): ApplicationMetadata {
    return { applicationUrl: job.applicationUrl }
  },
}
