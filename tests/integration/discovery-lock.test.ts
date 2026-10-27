process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8081'
process.env.GCLOUD_PROJECT = 'demo-test'

import { afterAll, beforeEach, describe, expect, it } from 'vitest'

const { acquireDiscoveryLock, releaseDiscoveryLock, DISCOVERY_LOCK_TTL_MS } = await import(
  '../../functions/lib/jobs/discoveryLock.js'
)
const { initializeApp } = await import('firebase-admin/app')
const { getApps } = await import('firebase-admin/app')
if (getApps().length === 0) {
  initializeApp({ projectId: 'demo-test' })
}
const { getFirestore, Timestamp } = await import('firebase-admin/firestore')

const db = getFirestore()
const uid = 'lock-test-user'
const ref = db.collection('discoveryLocks').doc(uid)

beforeEach(async () => {
  await ref.delete()
})

afterAll(async () => {
  await ref.delete()
})

describe('discovery lock', () => {
  it('uses a 15 minute TTL', () => {
    expect(DISCOVERY_LOCK_TTL_MS).toBe(15 * 60 * 1000)
  })

  it('lets only one run hold the lock', async () => {
    const first = await acquireDiscoveryLock(uid)
    expect(first).toBeTruthy()

    const second = await acquireDiscoveryLock(uid)
    expect(second).toBeNull()

    await releaseDiscoveryLock(uid, first as string)
  })

  it('does not release with the wrong token', async () => {
    const token = await acquireDiscoveryLock(uid)
    expect(token).toBeTruthy()

    await releaseDiscoveryLock(uid, 'wrong-token')
    expect(await acquireDiscoveryLock(uid)).toBeNull()

    await releaseDiscoveryLock(uid, token as string)
  })

  it('releases with the correct token', async () => {
    const token = await acquireDiscoveryLock(uid)
    expect(token).toBeTruthy()
    await releaseDiscoveryLock(uid, token as string)

    const next = await acquireDiscoveryLock(uid)
    expect(next).toBeTruthy()
    await releaseDiscoveryLock(uid, next as string)
  })

  it('allows acquisition after the lock expires', async () => {
    const first = await acquireDiscoveryLock(uid)
    expect(first).toBeTruthy()

    // Simulate a crashed run whose TTL has passed.
    await ref.set(
      {
        userId: uid,
        token: 'stale-token',
        expiresAt: Timestamp.fromMillis(Date.now() - 1000),
      },
      { merge: true },
    )

    const next = await acquireDiscoveryLock(uid)
    expect(next).toBeTruthy()
    await releaseDiscoveryLock(uid, next as string)
  })
})
