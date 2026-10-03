import type {
  ATSAdapter,
  ApplicationMetadata,
  NormalizedJob,
  RawJob,
} from './types.js'
import { humanizeBoardSlug, toNormalizedJob } from '../../utils/normalizeJob.js'

interface LeverPosting {
  id: string
  text: string
  descriptionPlain?: string
  description?: string
  categories?: {
    location?: string | null
    commitment?: string | null
    team?: string | null
    allLocations?: string[] | null
  }
  workplaceType?: string
  applyUrl?: string
  hostedUrl?: string
  createdAt?: number
}

const BASE_URL = 'https://api.lever.co/v0/postings'

function leverToRaw(posting: LeverPosting, boardTarget: string): RawJob {
  const location = posting.categories?.allLocations?.join(', ') ?? posting.categories?.location ?? undefined
  const remote = /remote/i.test(location ?? '') || /remote/i.test(posting.workplaceType ?? '')

  return {
    sourceJobId: posting.id,
    companyName: humanizeBoardSlug(boardTarget),
    title: posting.text,
    description: posting.descriptionPlain ?? posting.description ?? '',
    location,
    remote,
    employmentType: posting.categories?.commitment ?? undefined,
    seniority: posting.categories?.team ?? undefined,
    applicationUrl: posting.applyUrl ?? posting.hostedUrl ?? '',
    postedAt: posting.createdAt ? new Date(posting.createdAt).toISOString() : undefined,
    skills: [],
    sourceMetadata: {
      categories: posting.categories ?? {},
      workplaceType: posting.workplaceType,
      hostedUrl: posting.hostedUrl,
    },
  }
}

export const leverAdapter: ATSAdapter = {
  source: 'lever',

  async discover(boardTarget: string): Promise<NormalizedJob[]> {
    const url = `${BASE_URL}/${encodeURIComponent(boardTarget)}?mode=json`
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Lever discover failed (${response.status}) for company "${boardTarget}"`)
    }
    const data = (await response.json()) as LeverPosting[]
    if (!Array.isArray(data)) {
      throw new Error(`Lever returned unexpected payload for company "${boardTarget}"`)
    }
    return data.map((posting) => this.normalizeJob(leverToRaw(posting, boardTarget)))
  },

  async fetchJob(id: string): Promise<NormalizedJob | null> {
    const response = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`)
    if (!response.ok) {
      return null
    }
    const posting = (await response.json()) as LeverPosting
    return this.normalizeJob(leverToRaw(posting, ''))
  },

  normalizeJob(raw: RawJob): NormalizedJob {
    return toNormalizedJob('lever', raw)
  },

  getApplicationMetadata(job: NormalizedJob): ApplicationMetadata {
    return { applicationUrl: job.applicationUrl }
  },
}
