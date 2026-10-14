import { initializeApp } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'
import { onSchedule } from 'firebase-functions/v2/scheduler'
import { onCall, HttpsError } from 'firebase-functions/v2/https'
import { getAdapter, type JobSource, type NormalizedJob } from '../adapters/ats/index.js'
import { deduplicateJobs, type ExistingJobKeys } from '../utils/deduplicateJob.js'
import { companyTitleKey, fingerprintDescription } from '../utils/normalizeJob.js'
import { loadOpportunityFilters, jobMatchesFilters } from './filters.js'
import { qualifyPendingJobs } from './qualification.js'

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

async function loadSources(uid: string): Promise<JobSourceDoc[]> {
  const snapshot = await db.collection('jobSources').where('userId', '==', uid).get()
  return snapshot.docs
    .map((doc) => doc.data() as JobSourceDoc)
    .filter((source) => source.enabled === true)
}

async function existingJobKeys(uid: string): Promise<ExistingJobKeys> {
  const fingerprints = new Set<string>()
  const urls = new Set<string>()
  const companyTitles = new Set<string>()
  const descriptionFingerprints = new Set<string>()
  const snapshot = await db.collection('jobs').where('userId', '==', uid).get()
  for (const doc of snapshot.docs) {
    const data = doc.data()
    if (data.fingerprint) fingerprints.add(data.fingerprint as string)
    if (data.applicationUrl) urls.add(data.applicationUrl as string)
    const companyTitle =
      (data.companyTitleKey as string | undefined) ||
      companyTitleKey((data.companyName as string) ?? '', (data.title as string) ?? '')
    if (companyTitle !== '|') companyTitles.add(companyTitle)
    const descriptionFingerprint =
      (data.descriptionFingerprint as string | undefined) ||
      fingerprintDescription((data.description as string) ?? '')
    if (descriptionFingerprint) descriptionFingerprints.add(descriptionFingerprint)
  }
  return { fingerprints, urls, companyTitles, descriptionFingerprints }
}

async function storeJobs(jobs: NormalizedJob[], searchTerms: string[], uid: string): Promise<number> {
  const batch = db.batch()
  for (const job of jobs) {
    const ref = db.collection('jobs').doc()
    batch.set(ref, {
      ...stripUndefined(job),
      userId: uid,
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

function filterJobsBySearchTerms(jobs: NormalizedJob[], searchTerms: string[]): NormalizedJob[] {
  if (!searchTerms || searchTerms.length === 0) {
    return jobs
  }
  const terms = searchTerms.map((term) => term.toLowerCase())
  return jobs.filter((job) => {
    const haystack = [job.title, job.description, ...job.skills].join(' ').toLowerCase()
    return terms.some((term) => haystack.includes(term))
  })
}

async function recordActivity(uid: string, message: string, metadata: Record<string, unknown> = {}): Promise<void> {
  await db.collection('activityLogs').add({
    userId: uid,
    type: 'job-discovery',
    status: 'completed',
    message,
    metadata,
    createdAt: FieldValue.serverTimestamp(),
  })
}

export async function runDiscovery(uid: string): Promise<{ stored: number; duplicates: number; results: DiscoveryResult[] }> {
  const sources = await loadSources(uid)
  if (sources.length === 0) {
    await recordActivity(uid, 'Job discovery skipped: no enabled sources.')
    return { stored: 0, duplicates: 0, results: [] }
  }

  const filters = await loadOpportunityFilters(uid)
  const existing = await existingJobKeys(uid)
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
        const byTerms = filterJobsBySearchTerms(discovered, source.searchTerms)
        const filtered = byTerms.filter((job) => jobMatchesFilters(job, filters).ok)
        const unique = deduplicateJobs(filtered, existing)
        duplicates += byTerms.length - unique.length
        // Accumulate keys so later sources/targets in this run dedupe against these too.
        for (const job of unique) {
          existing.fingerprints.add(job.fingerprint)
          if (job.applicationUrl) existing.urls.add(job.applicationUrl)
          if (job.companyTitleKey) existing.companyTitles.add(job.companyTitleKey)
          if (job.descriptionFingerprint) existing.descriptionFingerprints.add(job.descriptionFingerprint)
        }
        const count = await storeJobs(unique, source.searchTerms, uid)
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
      uid,
      `Job discovery completed with ${errors.length} source error(s).`,
      { stored, duplicates, errors: errors.map((e) => ({ source: e.source, boardTarget: e.boardTarget, error: e.error })) },
    )
  } else {
    await recordActivity(uid, 'Job discovery completed.', { stored, duplicates, sources: results.length })
  }

  return { stored, duplicates, results }
}

async function allUserIds(): Promise<string[]> {
  const snapshot = await db.collection('users').get()
  return snapshot.docs.map((doc) => doc.id)
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
    const uids = await allUserIds()
    for (const uid of uids) {
      try {
        await runDiscovery(uid)
      } catch {
        // Keep processing other users; one user's failure must not stop the run.
      }
    }
  },
)

export const runDiscoveryNow = onCall(
  {
    memory: '256MiB',
    timeoutSeconds: 300,
    maxInstances: 1,
  },
  async (request) => {
    const uid = request.auth?.uid
    if (!uid) {
      throw new HttpsError('unauthenticated', 'Sign in required.')
    }
    try {
      const result = await runDiscovery(uid)
      let qualification
      try {
        qualification = await qualifyPendingJobs(uid, 10)
      } catch (qualifyError) {
        qualification = {
          analyzed: 0,
          results: [{
            jobId: 'batch',
            error: qualifyError instanceof Error ? qualifyError.message : 'Qualification failed.',
          }],
        }
      }
      return { ...result, qualified: qualification.analyzed, qualificationResults: qualification.results }
    } catch (error) {
      throw new HttpsError('internal', 'Discovery failed.', error instanceof Error ? error.message : undefined)
    }
  },
)
