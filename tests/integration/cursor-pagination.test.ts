import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  collection,
  doc,
  documentId,
  getDocs,
  limit,
  orderBy,
  query,
  setDoc,
  startAfter,
  Timestamp,
} from 'firebase/firestore'

let testEnv: RulesTestEnvironment

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-test',
    firestore: { host: '127.0.0.1', port: 8081 },
  })
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('keyset cursor pagination', () => {
  it('resumes after timestamp and document id without duplicates', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      const at = Timestamp.fromMillis(1_700_000_000_000)
      for (const id of ['job-a', 'job-b', 'job-c', 'job-d']) {
        await setDoc(doc(firestore, 'jobs', id), {
          userId: 'cursor-user',
          discoveredAt: at,
          searchTokens: ['react', 'engineer'],
        })
      }

      const base = [
        orderBy('discoveredAt', 'desc'),
        orderBy(documentId(), 'asc'),
      ]
      const first = await getDocs(
        query(collection(firestore, 'jobs'), ...base, limit(2)),
      )
      expect(first.docs.map((item) => item.id)).toEqual(['job-a', 'job-b'])

      const last = first.docs[first.docs.length - 1]
      const second = await getDocs(
        query(
          collection(firestore, 'jobs'),
          ...base,
          startAfter(last.get('discoveredAt'), last.id),
          limit(2),
        ),
      )
      expect(second.docs.map((item) => item.id)).toEqual(['job-c', 'job-d'])
    })
  })
})
