export const collections = {
  profiles: 'profiles',
  projects: 'projects',
  settings: 'settings',
  jobSources: 'jobSources',
  jobs: 'jobs',
  companies: 'companies',
  jobAnalyses: 'jobAnalyses',
  outreach: 'outreach',
  contacts: 'contacts',
  followUps: 'followUps',
  activityLogs: 'activityLogs',
  aiRuns: 'aiRuns',
} as const

export type CollectionName = (typeof collections)[keyof typeof collections]