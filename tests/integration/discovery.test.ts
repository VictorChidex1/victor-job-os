process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081'
process.env.GCLOUD_PROJECT = 'demo-test'

import { afterAll, beforeAll, describe, expect, it } from 'vitest'

const { runDiscovery } = await import('../../functions/lib/jobs/discoverJobs.js')
const { initializeApp, getApps } = await import('firebase-admin/app')
if (getApps().length === 0) {
  initializeApp({ projectId: 'demo-test' })
}
const { getFirestore } = await import('firebase-admin/firestore')

const db = getFirestore()
const uid = 'discovery-test-user'

async function cleanup(): Promise<void> {
  for (const name of ['jobs', 'jobSources', 'companies', 'activityLogs']) {
    const snapshot = await db.collection(name).where('userId', '==', uid).get()
    if (snapshot.empty) continue
    const batch = db.batch()
    for (const document of snapshot.docs) batch.delete(document.ref)
    await batch.commit()
  }
}

beforeAll(cleanup)
afterAll(cleanup)

describe('daily discovery (integration)', () => {
  it('stores normalized jobs and materializes their companies', async () => {
    await db.collection('jobSources').add({
      userId: uid,
      source: 'workable',
      enabled: true,
      searchTerms: [],
      boardTargets: ['huggingface'],
    })

    const result = await runDiscovery(uid)

    expect(result.stored).toBeGreaterThan(0)
    expect(result.results.length).toBeGreaterThan(0)

    const jobs = await db.collection('jobs').where('userId', '==', uid).get()
    expect(jobs.size).toBe(result.stored)

    for (const job of jobs.docs) {
      const data = job.data()
      expect(data.userId).toBe(uid)
      expect(data.companyId).toBeTruthy()
      expect(data.status).toBe('new')
      expect(Array.isArray(data.searchTokens)).toBe(true)
      expect(Array.isArray(data.skills)).toBe(true)
    }

    const companies = await db.collection('companies').where('userId', '==', uid).get()
    expect(companies.size).toBeGreaterThan(0)

    const activity = await db.collection('activityLogs').where('userId', '==', uid).get()
    expect(activity.size).toBeGreaterThan(0)
  }, 120_000)
})
