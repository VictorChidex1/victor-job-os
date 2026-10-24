import type { ATSAdapter, ApplicationMetadata, NormalizedJob, RawJob } from './types.js'
import { humanizeBoardSlug, stripHtml, toNormalizedJob } from '../../utils/normalizeJob.js'
import { mapWithConcurrency } from '../../utils/concurrency.js'

interface SmartRecruitersPosting {
  id: string
  name: string
  company?: { identifier?: string; name?: string }
  releasedDate?: string
  location?: { fullLocation?: string; remote?: boolean }
  department?: { label?: string }
  typeOfEmployment?: { label?: string }
  experienceLevel?: { label?: string }
}

interface SmartRecruitersDetail {
  jobAd?: {
    sections?: {
      jobDescription?: { text?: string }
      qualifications?: { text?: string }
      additionalInformation?: { text?: string }
    }
  }
}

const BASE_URL = 'https://api.smartrecruiters.com/v1/companies'

async function fetchDescription(company: string, id: string): Promise<string> {
  try {
    const response = await fetch(
      `${BASE_URL}/${encodeURIComponent(company)}/postings/${encodeURIComponent(id)}`,
    )
    if (!response.ok) return ''
    const data = (await response.json()) as SmartRecruitersDetail
    const sections = data.jobAd?.sections
    if (!sections) return ''
    return stripHtml(
      [sections.jobDescription?.text, sections.qualifications?.text, sections.additionalInformation?.text]
        .filter(Boolean)
        .join('\n\n'),
    )
  } catch {
    return ''
  }
}

function smartRecruitersToRaw(
  posting: SmartRecruitersPosting,
  companyName: string,
  description: string,
): RawJob {
  const fallback = [
    posting.name,
    posting.department?.label ? `Department: ${posting.department.label}` : '',
    posting.location?.fullLocation ? `Location: ${posting.location.fullLocation}` : '',
  ]
    .filter(Boolean)
    .join('. ')

  return {
    sourceJobId: posting.id,
    companyName: posting.company?.name ?? companyName,
    title: posting.name,
    description: description || fallback,
    location: posting.location?.fullLocation,
    remote: posting.location?.remote === true || /remote/i.test(posting.location?.fullLocation ?? ''),
    employmentType: posting.typeOfEmployment?.label,
    seniority: posting.experienceLevel?.label,
    applicationUrl: `https://jobs.smartrecruiters.com/${encodeURIComponent(companyName)}/${encodeURIComponent(posting.id)}`,
    postedAt: posting.releasedDate,
    skills: [],
    sourceMetadata: { department: posting.department?.label },
  }
}

export const smartRecruitersAdapter: ATSAdapter = {
  source: 'smartrecruiters',

  async discover(boardTarget: string): Promise<NormalizedJob[]> {
    const response = await fetch(
      `${BASE_URL}/${encodeURIComponent(boardTarget)}/postings?limit=100`,
    )
    if (!response.ok) {
      throw new Error(`SmartRecruiters discover failed (${response.status}) for "${boardTarget}"`)
    }
    const data = (await response.json()) as { content?: SmartRecruitersPosting[] }
    const companyName = humanizeBoardSlug(boardTarget)
    const postings = (data.content ?? []).slice(0, 40)
    const enriched = await mapWithConcurrency(postings, 5, async (posting) => ({
      posting,
      description: await fetchDescription(boardTarget, posting.id),
    }))
    return enriched.map(({ posting, description }) =>
      this.normalizeJob(smartRecruitersToRaw(posting, companyName, description)),
    )
  },

  async fetchJob(): Promise<NormalizedJob | null> {
    return null
  },

  normalizeJob(raw: RawJob): NormalizedJob {
    return toNormalizedJob('smartrecruiters', raw)
  },

  getApplicationMetadata(job: NormalizedJob): ApplicationMetadata {
    return { applicationUrl: job.applicationUrl }
  },
}
