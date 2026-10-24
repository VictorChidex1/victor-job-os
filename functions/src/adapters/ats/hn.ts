import type { ATSAdapter, ApplicationMetadata, NormalizedJob, RawJob } from './types.js'
import { stripHtml, toNormalizedJob } from '../../utils/normalizeJob.js'

const ALGOLIA = 'https://hn.algolia.com/api/v1'

interface AlgoliaItem {
  objectID: string
  id?: number
  title?: string
  created_at?: string
  text?: string
  author?: string
  children?: AlgoliaItem[]
}

function isNoise(text: string): boolean {
  if (text.length < 60) return true
  return /^(please only post|format:|if you.?re hiring|about this thread|this thread is for)/i.test(text)
}

function hnToRaw(comment: AlgoliaItem): RawJob {
  const hnId = comment.objectID ?? (comment.id != null ? String(comment.id) : '')
  const text = stripHtml(comment.text ?? '')
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
  const firstLine = lines[0] ?? 'Unknown role'
  const segments = firstLine
    .split(/\s*[|•·]\s*|\s+[-–—]\s+/)
    .map((segment) => segment.trim())
    .filter(Boolean)
  const companyName = (segments[0] || 'Unknown').slice(0, 80)
  const title = (segments[1] || firstLine).slice(0, 120)

  const urls = text.match(/https?:\/\/[^\s)>\]]+/g) ?? []
  const applicationUrl =
    urls.find((url) => !url.includes('news.ycombinator.com')) ??
    `https://news.ycombinator.com/item?id=${hnId}`

  const locationMatch = text.match(/(?:location|based in|office)\s*[:-]\s*([^\n|—–]{2,60})/i)

  return {
    sourceJobId: hnId,
    companyName,
    title,
    description: text,
    location: locationMatch?.[1]?.trim(),
    remote: /remote/i.test(text),
    applicationUrl,
    postedAt: comment.created_at,
    skills: [],
    sourceMetadata: { hnId, hnAuthor: comment.author },
  }
}

export const hnAdapter: ATSAdapter = {
  source: 'hn',

  async discover(): Promise<NormalizedJob[]> {
    const storiesResponse = await fetch(
      `${ALGOLIA}/search_by_date?tags=story,author_whoishiring&hitsPerPage=12`,
    )
    if (!storiesResponse.ok) {
      throw new Error(`HN discover failed (${storiesResponse.status})`)
    }
    const stories = (await storiesResponse.json()) as { hits?: AlgoliaItem[] }
    const story = (stories.hits ?? []).find((hit) => /who is hiring/i.test(hit.title ?? ''))
    if (!story) {
      return []
    }

    const itemsResponse = await fetch(`${ALGOLIA}/items/${story.objectID}`)
    if (!itemsResponse.ok) {
      throw new Error(`HN thread fetch failed (${itemsResponse.status})`)
    }
    const storyItem = (await itemsResponse.json()) as AlgoliaItem
    const comments = (storyItem.children ?? []).filter((child) => {
      const text = stripHtml(child.text ?? '')
      return !isNoise(text)
    })

    return comments.map((comment) => this.normalizeJob(hnToRaw(comment)))
  },

  async fetchJob(): Promise<NormalizedJob | null> {
    return null
  },

  normalizeJob(raw: RawJob): NormalizedJob {
    return toNormalizedJob('hn', raw)
  },

  getApplicationMetadata(job: NormalizedJob): ApplicationMetadata {
    return { applicationUrl: job.applicationUrl }
  },
}
