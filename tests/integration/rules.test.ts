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
    storage: {
      host: '127.0.0.1',
      port: 9197,
      rules: readFileSync('storage.rules', 'utf8'),
    },
  })
})

beforeEach(async () => {
  await testEnv.clearFirestore()
  await testEnv.clearStorage()
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
      'applicationPreparations',
      'resumeVariants',
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

  it('scopes application preparation content to the owner', async () => {
    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(getDoc(doc(dbOwner, 'applicationPreparations', 'missing')))
    await assertSucceeds(
      setDoc(doc(dbOwner, 'applicationPreparations', 'prep-1'), {
        userId: owner,
        applicationId: 'a1',
        coverLetter: { body: 'Private draft', status: 'draft' },
      }),
    )

    const dbOther = testEnv.authenticatedContext(other).firestore()
    await assertFails(getDoc(doc(dbOther, 'applicationPreparations', 'prep-1')))
    await assertFails(
      updateDoc(doc(dbOther, 'applicationPreparations', 'prep-1'), {
        coverLetter: { body: 'Hacked', status: 'approved' },
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

  it('allows admins to read cross-user error logs and discovery locks', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      await setDoc(doc(firestore, 'errorLogs', 'error-admin'), {
        userId: owner,
        fn: 'client',
        message: 'boom',
      })
      await setDoc(doc(firestore, 'discoveryLocks', owner), {
        userId: owner,
        token: 'lock-token',
      })
      await setDoc(doc(firestore, 'users', 'user-admin'), {
        uid: 'user-admin',
        role: 'admin',
      })
    })

    const dbAdmin = testEnv
      .authenticatedContext('user-admin', { admin: true })
      .firestore()
    await assertSucceeds(getDoc(doc(dbAdmin, 'errorLogs', 'error-admin')))
    await assertSucceeds(getDoc(doc(dbAdmin, 'discoveryLocks', owner)))
    await assertFails(
      setDoc(doc(dbAdmin, 'discoveryLocks', owner), { userId: owner }),
    )
  })

  it('allows admins to read cross-user records but not write them', async () => {
    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(
      setDoc(doc(dbOwner, 'jobs', 'job-owner'), {
        userId: owner,
        title: 'Owner job',
      }),
    )
    await assertSucceeds(
      setDoc(doc(dbOwner, 'profiles', owner), {
        headline: 'Owner profile',
      }),
    )

    const admin = 'user-admin'
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', admin), {
        uid: admin,
        role: 'admin',
      })
    })
    const dbAdmin = testEnv
      .authenticatedContext(admin, { admin: true })
      .firestore()
    await assertSucceeds(getDoc(doc(dbAdmin, 'jobs', 'job-owner')))
    await assertSucceeds(getDoc(doc(dbAdmin, 'profiles', owner)))
    await assertFails(
      updateDoc(doc(dbAdmin, 'jobs', 'job-owner'), { title: 'Admin changed' }),
    )
  })

  it('prevents users from promoting themselves or changing their uid', async () => {
    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(
      setDoc(doc(dbOwner, 'users', owner), {
        uid: owner,
        email: 'owner@example.com',
        role: 'user',
      }),
    )
    await assertFails(
      updateDoc(doc(dbOwner, 'users', owner), { role: 'admin' }),
    )
    await assertFails(
      updateDoc(doc(dbOwner, 'users', owner), { uid: 'someone-else' }),
    )

    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), 'users', 'user-admin'), {
        uid: 'user-admin',
        role: 'admin',
      })
    })
    const dbAdmin = testEnv
      .authenticatedContext('user-admin', { admin: true })
      .firestore()
    await assertFails(
      updateDoc(doc(dbAdmin, 'users', owner), { role: 'admin' }),
    )
  })

  it('keeps automation state read-only and owner-scoped', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      await setDoc(doc(firestore, 'automationSessions', 'session-1'), {
        userId: owner,
        applicationId: 'app-1',
        status: 'active',
      })
      await setDoc(doc(firestore, 'automationRuns', 'run-1'), {
        userId: owner,
        applicationId: 'app-1',
        sessionId: 'session-1',
        status: 'completed',
      })
      await setDoc(doc(firestore, 'automationLogs', 'run-1'), {
        userId: owner,
        applicationId: 'app-1',
        runId: 'run-1',
        provider: 'mock',
        entries: [],
        truncated: false,
      })
      await setDoc(doc(firestore, 'automationArtifacts', 'run-1'), {
        userId: owner,
        applicationId: 'app-1',
        runId: 'run-1',
        artifacts: [],
      })
    })

    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(getDoc(doc(dbOwner, 'automationRuns', 'run-1')))
    await assertSucceeds(getDoc(doc(dbOwner, 'automationLogs', 'run-1')))
    await assertSucceeds(getDoc(doc(dbOwner, 'automationArtifacts', 'run-1')))
    await assertFails(
      setDoc(doc(dbOwner, 'automationRuns', 'run-2'), {
        userId: owner,
        applicationId: 'app-1',
      }),
    )
    await assertFails(
      setDoc(doc(dbOwner, 'automationLogs', 'run-2'), {
        userId: owner,
        applicationId: 'app-1',
        runId: 'run-2',
        entries: [],
        truncated: false,
      }),
    )
    await assertFails(
      setDoc(doc(dbOwner, 'automationArtifacts', 'run-2'), {
        userId: owner,
        applicationId: 'app-1',
        runId: 'run-2',
        artifacts: [],
      }),
    )

    const dbOther = testEnv.authenticatedContext(other).firestore()
    await assertFails(getDoc(doc(dbOther, 'automationSessions', 'session-1')))
    await assertFails(getDoc(doc(dbOther, 'automationLogs', 'run-1')))
    await assertFails(getDoc(doc(dbOther, 'automationArtifacts', 'run-1')))
  })

  it('keeps system budget control admin-readable and client-write-denied', async () => {
    const admin = 'user-admin-budget'
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      await setDoc(doc(firestore, 'users', admin), {
        uid: admin,
        role: 'admin',
      })
      await setDoc(doc(firestore, 'systemControl', 'budget'), {
        aiPaused: true,
        automationPaused: true,
      })
    })

    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertFails(getDoc(doc(dbOwner, 'systemControl', 'budget')))
    await assertFails(
      setDoc(doc(dbOwner, 'systemControl', 'budget'), {
        aiPaused: false,
      }),
    )

    const dbAdmin = testEnv.authenticatedContext(admin, { admin: true }).firestore()
    await assertSucceeds(getDoc(doc(dbAdmin, 'systemControl', 'budget')))
    await assertFails(
      setDoc(doc(dbAdmin, 'systemControl', 'budget'), {
        aiPaused: false,
      }),
    )
  })

  it('keeps interviews owner-managed and admin-readable', async () => {
    const admin = 'user-admin-interviews'
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      await setDoc(doc(firestore, 'users', admin), {
        uid: admin,
        role: 'admin',
      })
      await setDoc(doc(firestore, 'applications', 'app-1'), {
        userId: owner,
        status: 'submitted',
      })
      await setDoc(doc(firestore, 'applications', 'app-other'), {
        userId: other,
        status: 'submitted',
      })
      await setDoc(doc(firestore, 'interviews', 'interview-1'), {
        userId: owner,
        applicationId: 'app-1',
        companyName: 'Acme',
        jobTitle: 'Engineer',
        status: 'scheduled',
        scheduledAt: new Date(),
      })
    })

    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertSucceeds(getDoc(doc(dbOwner, 'interviews', 'interview-1')))
    await assertSucceeds(
      updateDoc(doc(dbOwner, 'interviews', 'interview-1'), {
        status: 'completed',
      }),
    )
    await assertFails(
      updateDoc(doc(dbOwner, 'interviews', 'interview-1'), {
        userId: other,
      }),
    )
    await assertFails(
      updateDoc(doc(dbOwner, 'interviews', 'interview-1'), {
        applicationId: 'app-other',
      }),
    )
    await assertSucceeds(
      setDoc(doc(dbOwner, 'interviews', 'interview-2'), {
        userId: owner,
        applicationId: 'app-1',
        companyName: 'Acme',
        jobTitle: 'Engineer',
      }),
    )
    await assertFails(
      setDoc(doc(dbOwner, 'interviews', 'interview-3'), {
        userId: owner,
        applicationId: 'app-other',
      }),
    )
    await assertFails(
      setDoc(doc(dbOwner, 'interviews', 'interview-4'), {
        userId: other,
        applicationId: 'app-1',
      }),
    )

    const dbOther = testEnv.authenticatedContext(other).firestore()
    await assertFails(getDoc(doc(dbOther, 'interviews', 'interview-1')))
    await assertFails(
      updateDoc(doc(dbOther, 'interviews', 'interview-1'), {
        status: 'cancelled',
      }),
    )

    const dbAdmin = testEnv
      .authenticatedContext(admin, { admin: true })
      .firestore()
    await assertSucceeds(getDoc(doc(dbAdmin, 'interviews', 'interview-1')))
    await assertFails(
      updateDoc(doc(dbAdmin, 'interviews', 'interview-1'), {
        status: 'cancelled',
      }),
    )
  })

  it('keeps automation screenshots owner-readable and client-write-denied', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await context
        .storage()
        .ref('automation/user-owner/run-1/screenshot.webp')
        .put(new Uint8Array([1, 2, 3]), { contentType: 'image/webp' })
        .then(() => undefined)
    })

    const ownerStorage = testEnv.authenticatedContext(owner).storage()
    await assertSucceeds(
      ownerStorage.ref('automation/user-owner/run-1/screenshot.webp').getDownloadURL(),
    )
    await assertFails(
      ownerStorage
        .ref('automation/user-owner/run-1/other.webp')
        .put(new Uint8Array([4, 5, 6]), { contentType: 'image/webp' })
        .then(() => undefined),
    )

    const otherStorage = testEnv.authenticatedContext(other).storage()
    await assertFails(
      otherStorage.ref('automation/user-owner/run-1/screenshot.webp').getDownloadURL(),
    )
  })

  it('blocks disabled accounts immediately', async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      await setDoc(doc(firestore, 'users', owner), {
        uid: owner,
        role: 'user',
        disabled: true,
      })
      await setDoc(doc(firestore, 'jobs', 'disabled-job'), {
        userId: owner,
        title: 'Should stay private',
      })
    })

    const dbOwner = testEnv.authenticatedContext(owner).firestore()
    await assertFails(getDoc(doc(dbOwner, 'jobs', 'disabled-job')))
    await assertFails(getDoc(doc(dbOwner, 'users', owner)))
  })

  it('allows admins to read audit logs but not write them', async () => {
    const admin = 'user-admin-audit'
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const firestore = context.firestore()
      await setDoc(doc(firestore, 'users', admin), {
        uid: admin,
        role: 'admin',
      })
      await setDoc(doc(firestore, 'adminAuditLogs', 'audit-1'), {
        actorUid: admin,
        targetUid: owner,
        action: 'role-changed',
      })
    })

    const dbAdmin = testEnv
      .authenticatedContext(admin, { admin: true })
      .firestore()
    await assertSucceeds(getDoc(doc(dbAdmin, 'adminAuditLogs', 'audit-1')))
    await assertFails(
      setDoc(doc(dbAdmin, 'adminAuditLogs', 'audit-2'), {
        actorUid: admin,
        targetUid: owner,
        action: 'role-changed',
      }),
    )
  })
})
