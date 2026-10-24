export const SOURCE_LABELS: Record<string, string> = {
  greenhouse: 'Greenhouse',
  lever: 'Lever',
  ashby: 'Ashby',
  workable: 'Workable',
  smartrecruiters: 'SmartRecruiters',
  hn: 'Hacker News — Who is Hiring',
  remotive: 'Remotive',
  remoteok: 'Remote OK',
  arbeitnow: 'Arbeitnow',
  workday: 'Workday',
  custom: 'Custom',
}

export const BOARD_SOURCE_IDS = [
  'greenhouse',
  'lever',
  'ashby',
  'workable',
  'smartrecruiters',
] as const

export const SEARCH_SOURCE_IDS = ['hn', 'remotive', 'remoteok', 'arbeitnow'] as const

export const SELECTABLE_SOURCE_IDS = [...BOARD_SOURCE_IDS, ...SEARCH_SOURCE_IDS] as const

export function isSearchSource(id: string): boolean {
  return (SEARCH_SOURCE_IDS as readonly string[]).includes(id)
}

/** Sources that require visible attribution and a link back. */
export const SOURCE_ATTRIBUTION_URL: Record<string, string | undefined> = {
  remoteok: 'https://remoteok.com',
}
