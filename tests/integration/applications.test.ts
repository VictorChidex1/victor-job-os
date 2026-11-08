import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  deleteDoc,
  doc,
  setDoc,
  Timestamp,
  updateDoc,
  type Firestore,
} from 'firebase/firestore'
import { createApplicationService } from '@/services/applicationService'
import type { Job } from '@/types/jobs'

let testEnv: RulesTestEnvironment
const owner = 'application-owner'
const other = 'application-other'
const foreignJobId = 'job-application-foreign'
const missingJobId = 'job-application-missing'

const timestamp = {} as Job['discoveredAt']

const job: Job = {
  id: 'job-application-1',
  userId: owner,
  source: 'greenhouse',
  sourceJobId: 'source-job-application-1',
  companyId: 'company-application-1',
  companyName: 'Acme Corp',
  title: 'Senior React Engineer',
  description: 'Build the next generation of Acme tooling.',
  location: 'Remote (EU)',
  remote: true,
  applicationUrl: 'https://acme.example/jobs/1',
  atsMetadata: {
    source: 'greenhouse',
    sourceJobId: 'source-job-application-1',
    applicationUrl: 'https://acme.example/jobs/1',
    completeness: 'partial',
  },
  discoveredAt: timestamp,
  skills: ['React', 'TypeScript'],
  searchTerms: ['react'],
  status: 'qualified',
  fingerprint: 'fingerprint-application-1',
  createdAt: timestamp,
  updatedAt: timestamp,
}

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
  await seedJob()
})

afterAll(async () => {
  await testEnv.cleanup()
})

function serviceFor(uid: string) {
  // The rules-testing package exposes the modular Firestore instance under a
  // slightly different internal type; at runtime they are the same client.
  const firestore = testEnv
    .authenticatedContext(uid)
    .firestore() as unknown as Firestore
  return createApplicationService(firestore)
}

async function seedJob(options: {
  id?: string
  uid?: string
  overrides?: Record<string, unknown>
} = {}): Promise<void> {
  const id = options.id ?? job.id
  const uid = options.uid ?? owner
  const firestore = testEnv.authenticatedContext(uid).firestore()
  await setDoc(doc(firestore, 'jobs', id), {
    ...job,
    id,
    userId: uid,
    discoveredAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
    ...options.overrides,
  })
}

async function advanceToOffer(
  service: ReturnType<typeof serviceFor>,
  id: string,
): Promise<void> {
  for (const status of [
    'preparing',
    'needs-review',
    'approved',
    'submitted',
    'interview',
    'offer',
  ] as const) {
    await service.updateStatus(owner, id, status)
  }
}

describe('application service', () => {
  it('creates exactly one application per job and one created event', async () => {
    const service = serviceFor(owner)

    const first = await service.createFromJob(owner, job.id)
    const second = await service.createFromJob(owner, job.id)

    expect(first).toEqual({ id: `${owner}__${job.id}`, existing: false })
    expect(second).toEqual({ id: first.id, existing: true })

    const applications = await service.list(owner)
    expect(applications).toHaveLength(1)
    expect(applications[0]).toMatchObject({
      jobId: job.id,
      companyName: 'Acme Corp',
      jobTitle: 'Senior React Engineer',
      status: 'not-started',
      origin: 'opportunity',
      atsMetadata: expect.objectContaining({
        source: 'greenhouse',
        applicationUrl: 'https://acme.example/jobs/1',
        completeness: 'partial',
      }),
    })

    const byJob = await service.getForJob(owner, job.id)
    expect(byJob?.id).toBe(first.id)

    const events = await service.listEvents(owner, first.id)
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({
      type: 'created',
      toStatus: 'not-started',
    })
  })

  it('takes the snapshot from Firestore rather than trusting the client', async () => {
    const service = serviceFor(owner)
    const { id } = await service.createFromJob(owner, job.id)

    const application = await service.get(id)
    expect(application).toMatchObject({
      companyId: job.companyId,
      companyName: job.companyName,
      jobTitle: job.title,
      jobSource: job.source,
      applicationUrl: job.applicationUrl,
      location: job.location,
      remote: job.remote,
    })
  })

  it('rejects a missing job', async () => {
    await expect(
      serviceFor(owner).createFromJob(owner, missingJobId),
    ).rejects.toThrow()
  })

  it('rejects another user’s job', async () => {
    await seedJob({ id: foreignJobId, uid: other })

    await expect(
      serviceFor(owner).createFromJob(owner, foreignJobId),
    ).rejects.toThrow()
  })

  it('still returns the existing application if the job was deleted', async () => {
    const service = serviceFor(owner)
    const { id } = await service.createFromJob(owner, job.id)

    const ownerFirestore = testEnv.authenticatedContext(owner).firestore()
    await deleteDoc(doc(ownerFirestore, 'jobs', job.id))

    const again = await service.createFromJob(owner, job.id)
    expect(again).toEqual({ id, existing: true })
  })

  it('moves through the lifecycle and records each event', async () => {
    const service = serviceFor(owner)
    const { id } = await service.createFromJob(owner, job.id)

    for (const status of [
      'preparing',
      'needs-review',
      'approved',
      'submitted',
    ] as const) {
      await service.updateStatus(owner, id, status)
    }

    const application = await service.get(id)
    expect(application?.status).toBe('submitted')
    expect(application?.approvedAt).toBeTruthy()
    expect(application?.submittedAt).toBeTruthy()
    expect(application?.submittedManually).toBe(true)

    const events = await service.listEvents(owner, id)
    expect(events).toHaveLength(5)

    const statusEvents = events.filter((event) => event.type === 'status-changed')
    expect(statusEvents.every((event) => event.fromStatus && event.toStatus)).toBe(
      true,
    )
  })

  it('rejects a skipped stage without changing the application', async () => {
    const service = serviceFor(owner)
    const { id } = await service.createFromJob(owner, job.id)

    await expect(service.updateStatus(owner, id, 'offer')).rejects.toThrow(
      /Cannot move/,
    )

    const application = await service.get(id)
    expect(application?.status).toBe('not-started')
  })

  it('closes an offer with an accepted outcome', async () => {
    const service = serviceFor(owner)
    const { id } = await service.createFromJob(owner, job.id)
    await advanceToOffer(service, id)

    await service.updateStatus(owner, id, 'closed', { outcome: 'accepted' })

    const application = await service.get(id)
    expect(application?.status).toBe('closed')
    expect(application?.outcome).toBe('accepted')
    expect(application?.closedAt).toBeTruthy()
  })

  it('marks a rescinded offer as rejected', async () => {
    const service = serviceFor(owner)
    const { id } = await service.createFromJob(owner, job.id)
    await advanceToOffer(service, id)

    await service.updateStatus(owner, id, 'rejected')

    const application = await service.get(id)
    expect(application?.status).toBe('rejected')
    expect(application?.outcome).toBe('rejected')
    expect(application?.closedAt).toBeTruthy()
  })

  it('marks a withdrawn offer as withdrawn', async () => {
    const service = serviceFor(owner)
    const { id } = await service.createFromJob(owner, job.id)
    await advanceToOffer(service, id)

    await service.updateStatus(owner, id, 'withdrawn')

    const application = await service.get(id)
    expect(application?.status).toBe('withdrawn')
    expect(application?.outcome).toBe('withdrawn')
    expect(application?.closedAt).toBeTruthy()
  })

  it('keeps one user’s application invisible to another user', async () => {
    const ownerService = serviceFor(owner)
    const { id } = await ownerService.createFromJob(owner, job.id)

    const otherService = serviceFor(other)
    await expect(otherService.get(id)).rejects.toThrow()
    await expect(
      otherService.updateStatus(other, id, 'preparing'),
    ).rejects.toThrow()
  })

  it('keeps application events immutable', async () => {
    const service = serviceFor(owner)
    const { id } = await service.createFromJob(owner, job.id)
    const [event] = await service.listEvents(owner, id)

    const firestore = testEnv.authenticatedContext(owner).firestore()
    await expect(
      updateDoc(doc(firestore, 'applicationEvents', event.id), {
        note: 'edited',
      }),
    ).rejects.toThrow(/permission/i)
  })

  it('deletes the application and its events together', async () => {
    const service = serviceFor(owner)
    const { id } = await service.createFromJob(owner, job.id)
    await service.updateStatus(owner, id, 'preparing')

    await service.delete(owner, id)

    expect(await service.get(id)).toBeNull()
    expect(await service.listEvents(owner, id)).toHaveLength(0)
  })
})
