import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore'

let testEnv: RulesTestEnvironment
const owner = 'user-owner'
const other = 'user-other'

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId: 'demo-test',
    firestore: {
      host: '127.0.0.1',
      port: 8081,
      rules: readFileSync('firestore.rules', 'utf8'),
    },
  })
})

beforeEach(async () => {
  await testEnv.clearFirestore()
})

afterAll(async () => {
  await testEnv.cleanup()
})

describe('Firestore security rules', () => {
  it('denies unauthenticated reads', async () => {
    const db = testEnv.unauthenticatedContext().firestore()
    await assertFails(getDoc(doc(db, 'profiles', owner)))
    await assertFails(getDoc(doc(db, 'jobs', 'j1')))
    await assertFails(getDoc(doc(db, 'applications', 'missing')))
  })

  it('allows the owner to read and write their profile', async () => {
    const db = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(setDoc(doc(db, 'profiles', owner), { headline: 'Engineer' }))
    await assertSucceeds(getDoc(doc(db, 'profiles', owner)))
  })

  it('denies access to another user’s profile', async () => {
    const db = testEnv.authenticatedContext(other).firestore()
    await assertFails(getDoc(doc(db, 'profiles', owner)))
    await assertFails(setDoc(doc(db, 'profiles', owner), { headline: 'hacked' }))
  })

  it('allows owner project create and denies a spoofed userId', async () => {
    const db = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(setDoc(doc(db, 'projects', 'p1'), { userId: owner, title: 'Mine' }))
    await assertFails(setDoc(doc(db, 'projects', 'p2'), { userId: other, title: 'Spoof' }))
  })

  it('denies cross-user project reads and writes', async () => {
    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(setDoc(doc(dbOwner, 'projects', 'p1'), { userId: owner, title: 'Mine' }))

    const dbOther = testEnv.authenticatedContext(other).firestore()
    await assertFails(getDoc(doc(dbOther, 'projects', 'p1')))
    await assertFails(updateDoc(doc(dbOther, 'projects', 'p1'), { title: 'Hacked' }))
  })

  it('denies taking over a project by changing its userId', async () => {
    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(setDoc(doc(dbOwner, 'projects', 'p1'), { userId: owner, title: 'Mine' }))

    const dbOther = testEnv.authenticatedContext(other).firestore()
    await assertFails(updateDoc(doc(dbOther, 'projects', 'p1'), { userId: other }))
  })

  it('enforces ownership on every userId-scoped collection', async () => {
    const collections = [
      'jobs',
      'companies',
      'jobAnalyses',
      'outreach',
      'applications',
      'applicationEvents',
      'contacts',
      'followUps',
      'activityLogs',
    ]
    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    for (const name of collections) {
      await assertSucceeds(
        setDoc(doc(dbOwner, name, `doc-${name}`), { userId: owner, title: name }),
      )
    }

    const dbOther = testEnv.authenticatedContext(other).firestore()
    for (const name of collections) {
      await assertFails(getDoc(doc(dbOther, name, `doc-${name}`)))
    }
  })

  it('lets a signed-in user probe a missing application but not read another user’s', async () => {
    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(getDoc(doc(dbOwner, 'applications', 'missing')))
    await assertSucceeds(
      setDoc(doc(dbOwner, 'applications', 'a1'), {
        userId: owner,
        jobId: 'job-1',
        status: 'not-started',
      }),
    )

    const dbOther = testEnv.authenticatedContext(other).firestore()
    await assertFails(getDoc(doc(dbOther, 'applications', 'a1')))
    await assertFails(
      updateDoc(doc(dbOther, 'applications', 'a1'), { status: 'preparing' }),
    )
  })

  it('keeps application events immutable', async () => {
    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(
      setDoc(doc(dbOwner, 'applicationEvents', 'event-1'), {
        userId: owner,
        applicationId: 'a1',
        type: 'created',
      }),
    )
    await assertFails(
      updateDoc(doc(dbOwner, 'applicationEvents', 'event-1'), {
        type: 'status-changed',
      }),
    )
  })

  it('makes aiRuns read-only for clients', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'aiRuns', 'r1'), {
        userId: owner,
        operation: 'analyzeJob',
      })
    })

    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(getDoc(doc(dbOwner, 'aiRuns', 'r1')))
    await assertFails(setDoc(doc(dbOwner, 'aiRuns', 'r2'), { userId: owner }))
  })

  it('allows owner errorLogs create/read, denies cross-user and updates', async () => {
    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(
      setDoc(doc(dbOwner, 'errorLogs', 'e1'), { userId: owner, message: 'boom' }),
    )
    await assertSucceeds(getDoc(doc(dbOwner, 'errorLogs', 'e1')))

    const dbOther = testEnv.authenticatedContext(other).firestore()
    await assertFails(getDoc(doc(dbOther, 'errorLogs', 'e1')))
    await assertFails(updateDoc(doc(dbOwner, 'errorLogs', 'e1'), { message: 'changed' }))
  })

  it('denies client writes to discoveryLocks', async () => {
    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertFails(setDoc(doc(dbOwner, 'discoveryLocks', owner), { userId: owner }))
  })
})
