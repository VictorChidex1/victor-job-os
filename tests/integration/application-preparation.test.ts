import { readFileSync } from 'node:fs'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import { deleteDoc, doc, getDoc, setDoc, Timestamp, type Firestore } from 'firebase/firestore'
import { createApplicationService } from '@/services/applicationService'
import { createApplicationPreparationService } from '@/services/applicationPreparationService'
import { createApplicationResumeService } from '@/services/applicationResumeService'
import { preparationDocId } from '@/lib/applicationPreparation'
import type { Job } from '@/types/jobs'

let testEnv: RulesTestEnvironment
const owner = 'preparation-owner'
const other = 'preparation-other'
const jobId = 'job-preparation-1'

const job: Job = {
  id: jobId,
  userId: owner,
  source: 'greenhouse',
  sourceJobId: 'source-preparation-1',
  companyId: 'company-preparation-1',
  companyName: 'Acme Corp',
  title: 'Senior React Engineer',
  description: 'Build reliable React systems.',
  location: 'Remote',
  remote: true,
  applicationUrl: 'https://acme.example/jobs/1',
  discoveredAt: {} as Job['discoveredAt'],
  skills: ['React', 'TypeScript'],
  searchTerms: ['react'],
  status: 'qualified',
  fingerprint: 'fingerprint-preparation-1',
  createdAt: {} as Job['createdAt'],
  updatedAt: {} as Job['updatedAt'],
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
  const firestore = testEnv.authenticatedContext(owner).firestore()
  await setDoc(doc(firestore, 'jobs', jobId), {
    ...job,
    discoveredAt: Timestamp.now(),
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  })
})

afterAll(async () => {
  await testEnv.cleanup()
})

function firestoreFor(uid: string): Firestore {
  return testEnv.authenticatedContext(uid).firestore() as unknown as Firestore
}

async function createApplication() {
  const applicationService = createApplicationService(firestoreFor(owner))
  const result = await applicationService.createFromJob(owner, jobId)
  return { applicationService, applicationId: result.id }
}

describe('application preparation service', () => {
  it('saves and reads preparation content for the owner', async () => {
    const { applicationId } = await createApplication()
    const service = createApplicationPreparationService(firestoreFor(owner))

    await service.save(owner, applicationId, {
      coverLetter: {
        body: '<p>Dear team,</p>',
        draftBody: '<p>Dear team,</p>',
        status: 'needs-review',
      },
      answers: [
        {
          id: 'answer-1',
          question: 'Why this role?',
          answer: ' <p>Because of the mission.</p> ',
          draftAnswer: '<p>Because of the mission.</p>',
          status: 'approved',
        },
      ],
      resumeNotes: 'Highlight React work.',
      resumeReviewed: true,
      resumeUrl: 'https://example.com/resume.pdf',
    })

    const preparation = await service.get(owner, applicationId)
    expect(preparation?.coverLetter.body).toBe('Dear team,')
    expect(preparation?.coverLetter.status).toBe('needs-review')
    expect(preparation?.answers[0].answer).toBe('Because of the mission.')
    expect(preparation?.answers[0].status).toBe('approved')
    expect(preparation?.resumeNotes).toBe('Highlight React work.')
    expect(preparation?.resumeReviewed).toBe(true)
    expect(preparation?.resumeUrl).toBe('https://example.com/resume.pdf')
  })

  it('returns null when a preparation does not exist', async () => {
    const { applicationId } = await createApplication()
    const service = createApplicationPreparationService(firestoreFor(owner))

    await expect(service.get(owner, applicationId)).resolves.toBeNull()
  })

  it('does not expose one user preparation through another user service id', async () => {
    const { applicationId } = await createApplication()
    const ownerService = createApplicationPreparationService(firestoreFor(owner))
    await ownerService.save(owner, applicationId, {
      coverLetter: { body: 'Private', draftBody: 'Private', status: 'draft' },
    })

    const otherService = createApplicationPreparationService(firestoreFor(other))
    await expect(otherService.get(other, applicationId)).resolves.toBeNull()

    const otherDb = firestoreFor(other)
    await expect(
      getDoc(doc(otherDb, 'applicationPreparations', preparationDocId(owner, applicationId))),
    ).rejects.toThrow()
  })

  it('deletes preparation content with the application', async () => {
    const { applicationService, applicationId } = await createApplication()
    const preparationService = createApplicationPreparationService(firestoreFor(owner))

    await preparationService.save(owner, applicationId, {
      coverLetter: { body: 'Private', draftBody: 'Private', status: 'draft' },
    })

    await applicationService.delete(owner, applicationId)

    await expect(preparationService.get(owner, applicationId)).resolves.toBeNull()
  })

  it('keeps the preparation document owned and writable by the owner', async () => {
    const { applicationId } = await createApplication()
    const service = createApplicationPreparationService(firestoreFor(owner))

    await service.save(owner, applicationId, {
      resumeNotes: 'First note',
      resumeReviewed: false,
    })
    await service.save(owner, applicationId, {
      resumeNotes: 'Updated note',
      resumeReviewed: true,
    })

    const preparation = await service.get(owner, applicationId)
    expect(preparation?.resumeNotes).toBe('Updated note')
    expect(preparation?.resumeReviewed).toBe(true)
  })

  it('can delete a preparation document directly', async () => {
    const { applicationId } = await createApplication()
    const service = createApplicationPreparationService(firestoreFor(owner))
    await service.save(owner, applicationId, { resumeReviewed: true })

    const db = firestoreFor(owner)
    await deleteDoc(doc(db, 'applicationPreparations', preparationDocId(owner, applicationId)))

    await expect(service.get(owner, applicationId)).resolves.toBeNull()
  })

  it('attaches a resume snapshot to the application and creates preparation content', async () => {
    const { applicationService, applicationId } = await createApplication()
    const resumeService = createApplicationResumeService(firestoreFor(owner))
    const preparationService = createApplicationPreparationService(firestoreFor(owner))

    await resumeService.attach(owner, applicationId, { resumeUrl: 'https://example.com/resume-v1.pdf' })

    const application = await applicationService.get(applicationId)
    const preparation = await preparationService.get(owner, applicationId)
    expect(application?.resumeUrl).toBe('https://example.com/resume-v1.pdf')
    expect(preparation?.resumeUrl).toBe('https://example.com/resume-v1.pdf')
    expect(preparation?.resumeReviewed).toBe(false)
  })

  it('attaches a resume variant snapshot to the application and preparation', async () => {
    const { applicationService, applicationId } = await createApplication()
    const resumeService = createApplicationResumeService(firestoreFor(owner))
    const preparationService = createApplicationPreparationService(firestoreFor(owner))

    await resumeService.attach(owner, applicationId, {
      resumeUrl: 'https://example.com/full-stack.pdf',
      resumeVariantId: 'variant-full-stack',
      resumeVariantName: 'Full Stack',
    })

    const application = await applicationService.get(applicationId)
    const preparation = await preparationService.get(owner, applicationId)
    expect(application?.resumeVariantId).toBe('variant-full-stack')
    expect(application?.resumeVariantName).toBe('Full Stack')
    expect(application?.resumeUrl).toBe('https://example.com/full-stack.pdf')
    expect(preparation?.resumeVariantId).toBe('variant-full-stack')
    expect(preparation?.resumeVariantName).toBe('Full Stack')
    expect(preparation?.resumeUrl).toBe('https://example.com/full-stack.pdf')
    expect(preparation?.resumeReviewed).toBe(false)
  })

  it('clears the variant when attaching the plain profile resume', async () => {
    const { applicationService, applicationId } = await createApplication()
    const resumeService = createApplicationResumeService(firestoreFor(owner))

    await resumeService.attach(owner, applicationId, {
      resumeUrl: 'https://example.com/full-stack.pdf',
      resumeVariantId: 'variant-full-stack',
      resumeVariantName: 'Full Stack',
    })
    await resumeService.attach(owner, applicationId, {
      resumeUrl: 'https://example.com/profile.pdf',
    })

    const application = await applicationService.get(applicationId)
    expect(application?.resumeVariantId).toBeUndefined()
    expect(application?.resumeVariantName).toBeUndefined()
    expect(application?.resumeUrl).toBe('https://example.com/profile.pdf')
  })

  it('preserves resume review when the URL does not change and resets it when it does', async () => {
    const { applicationId } = await createApplication()
    const resumeService = createApplicationResumeService(firestoreFor(owner))
    const preparationService = createApplicationPreparationService(firestoreFor(owner))

    await resumeService.attach(owner, applicationId, { resumeUrl: 'https://example.com/resume-v1.pdf' })
    await preparationService.save(owner, applicationId, { resumeReviewed: true })

    await resumeService.attach(owner, applicationId, { resumeUrl: 'https://example.com/resume-v1.pdf' })
    expect((await preparationService.get(owner, applicationId))?.resumeReviewed).toBe(true)

    await resumeService.attach(owner, applicationId, { resumeUrl: 'https://example.com/resume-v2.pdf' })
    expect((await preparationService.get(owner, applicationId))?.resumeReviewed).toBe(false)
  })

  it('does not let another user attach a resume to someone else’s application', async () => {
    const { applicationId } = await createApplication()
    const otherResumeService = createApplicationResumeService(firestoreFor(other))

    await expect(
      otherResumeService.attach(other, applicationId, { resumeUrl: 'https://example.com/hacked.pdf' }),
    ).rejects.toThrow()
  })

  it('does not attach a resume after the application is approved', async () => {
    const { applicationService, applicationId } = await createApplication()
    for (const status of ['preparing', 'needs-review', 'approved'] as const) {
      await applicationService.updateStatus(owner, applicationId, status)
    }

    const resumeService = createApplicationResumeService(firestoreFor(owner))
    await expect(
      resumeService.attach(owner, applicationId, { resumeUrl: 'https://example.com/resume.pdf' }),
    ).rejects.toThrow('locked')
  })
})
