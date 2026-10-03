import type {
  ATSAdapter,
  ApplicationMetadata,
  NormalizedJob,
  RawJob,
} from './types.js'
import { toNormalizedJob } from '../../utils/normalizeJob.js'

interface GreenhouseJob {
  id: number
  title: string
  absolute_url: string
  location?: { name?: string }
  content?: string
  first_published?: string
  updated_at?: string
  metadata?: Array<{ name?: string; value?: string }>
}

const BASE_URL = 'https://boards-api.greenhouse.io/v1/boards'

function greenhouseToRaw(job: GreenhouseJob): RawJob {
  const locationName = job.location?.name ?? ''
  const content = job.content ?? ''
  const employmentType = job.metadata?.find((m) => m.name === 'Employment Type')?.value

  return {
    sourceJobId: String(job.id),
    title: job.title,
    description: content,
    location: locationName || undefined,
    remote: /remote/i.test(locationName),
    employmentType,
    applicationUrl: job.absolute_url,
    postedAt: job.first_published ?? job.updated_at,
    skills: [],
    sourceMetadata: {
      location: locationName,
      metadata: job.metadata ?? [],
      updatedAt: job.updated_at,
    },
  }
}

export const greenhouseAdapter: ATSAdapter = {
  source: 'greenhouse',

  async discover(boardTarget: string): Promise<NormalizedJob[]> {
    const url = `${BASE_URL}/${encodeURIComponent(boardTarget)}/jobs`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Greenhouse discover failed (${response.status}) for board "${boardTarget}"`)
    }
    const data = (await response.json()) as { jobs: GreenhouseJob[] }
    return (data.jobs ?? []).map((job) => this.normalizeJob(greenhouseToRaw(job)))
  },

  async fetchJob(id: string): Promise<NormalizedJob | null> {
    const response = await fetch(`https://boards-api.greenhouse.io/v1/jobs/${encodeURIComponent(id)}`)
    if (!response.ok) {
      return null
    }
    const job = (await response.json()) as GreenhouseJob
    return this.normalizeJob(greenhouseToRaw(job))
  },

  normalizeJob(raw: RawJob): NormalizedJob {
    return toNormalizedJob('greenhouse', raw)
  },

  getApplicationMetadata(job: NormalizedJob): ApplicationMetadata {
    return { applicationUrl: job.applicationUrl }
  },
}
