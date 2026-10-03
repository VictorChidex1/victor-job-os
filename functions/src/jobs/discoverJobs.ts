import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { getAdapter, type JobSource, type NormalizedJob } from '../adapters/ats/index.js'
import { deduplicateJobs } from '../utils/deduplicateJob.js'

interface JobSourceDoc {
  source: JobSource
  enabled: boolean
  searchTerms: string[]
  boardTargets?: string[]
}

interface DiscoveryResult {
  source: JobSource
  boardTarget: string
  count: number
  error?: string
}

initializeApp()
const db = getFirestore()

async function loadSources(): Promise<JobSourceDoc[]> {
  const snapshot = await db.collection('jobSources').get()
  return snapshot.docs
    .map((doc) => doc.data() as JobSourceDoc)
    .filter((source) => source.enabled === true)
}

async function existingJobKeys(): Promise<{ fingerprints: Set<string>; urls: Set<string> }> {
  const fingerprints = new Set<string>()
  const urls = new Set<string>()
  const snapshot = await db.collection('jobs').get()
  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (data.fingerprint) fingerprints.add(data.fingerprint as string)
    if (data.applicationUrl) urls.add(data.applicationUrl as string)
  }
  return { fingerprints, urls }
}

async function storeJobs(jobs: NormalizedJob[], searchTerms: string[]): Promise<number> {
  const batch = db.batch()
  for (const job of jobs) {
    const ref = db.collection('jobs').doc()
    batch.set(ref, {
      ...stripUndefined(job),
      searchTerms,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })
  }
  await batch.commit()
  return jobs.length
}

function stripUndefined<T extends object>(value: T): Partial<T> {
  return Object.fromEntries(
    Object.entries(value).filter(([, fieldValue]) => fieldValue !== undefined),
  ) as Partial<T>
}

async function recordActivity(message: string, metadata: Record<string, unknown> = {}): Promise<void> {
  await db.collection('activityLogs').add({
    type: 'job-discovery',
    status: 'completed',
    message,
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  })
}

export async function runDiscovery(): Promise<{ stored: number; duplicates: number; results: DiscoveryResult[] }> {
  const sources = await loadSources()
  if (sources.length === 0) {
    await recordActivity('Job discovery skipped: no enabled sources.')
    return { stored: 0, duplicates: 0, results: [] }
  }

  const { fingerprints, urls } = await existingJobKeys()
  let stored = 0
  let duplicates = 0
  const results: DiscoveryResult[] = []

  for (const source of sources) {
    const adapter = getAdapter(source.source)
    if (!adapter) {
      continue
    }
    const targets = source.boardTargets?.length ? source.boardTargets : []
    if (targets.length === 0) {
      continue
    }

    for (const target of targets) {
      try {
        const discovered = await adapter.discover(target)
        const unique = deduplicateJobs(discovered, fingerprints, urls)
        duplicates += discovered.length - unique.length
        const count = await storeJobs(unique, source.searchTerms)
        stored += count
        results.push({ source: source.source, boardTarget: target, count: unique.length })
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        results.push({ source: source.source, boardTarget: target, count: 0, error: message })
      }
    }
  }

  const errors = results.filter((result) => result.error)
  if (errors.length > 0) {
    await recordActivity(
      `Job discovery completed with ${errors.length} source error(s).`,
      { stored, duplicates, errors: errors.map((e) => ({ source: e.source, boardTarget: e.boardTarget, error: e.error })) },
    )
  } else {
    await recordActivity('Job discovery completed.', { stored, duplicates, sources: results.length })
  }

  return { stored, duplicates, results }
}

export const discoverJobs = onSchedule(
  {
    schedule: '0 7 * * *',
    timeZone: 'UTC',
    memory: '256MiB',
    timeoutSeconds: 300,
    maxInstances: 1,
    retryCount: 1,
  },
  async () => {
    await runDiscovery()
  },
)
