import {
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type Firestore,
  type Timestamp,
} from 'firebase/firestore'
import { collections } from '@/services/collections'
import { stripHtml } from '@/lib/html'
import type { JobSource } from '@/types/jobs'
import type {
  Application,
  ApplicationDetailsPatch,
  ApplicationEvent,
  ApplicationEventType,
  ApplicationOrigin,
  ApplicationOutcome,
  ApplicationStatus,
} from '@/types/applications'
import {
  applicationDocId,
  applicationStatusPatch,
  assertApplicationTransition,
  buildApplicationSeed,
  resolveApplicationOutcome,
} from '@/lib/applications'

export interface CreateApplicationResult {
  id: string
  existing: boolean
}

export interface UpdateApplicationStatusOptions {
  note?: string
  outcome?: ApplicationOutcome
}

export interface ApplicationService {
  createFromJob(
    uid: string,
    jobId: string,
    origin?: ApplicationOrigin,
  ): Promise<CreateApplicationResult>
  get(id: string): Promise<Application | null>
  getForJob(uid: string, jobId: string): Promise<Application | null>
  list(uid: string): Promise<Application[]>
  listForJob(uid: string, jobId: string): Promise<Application[]>
  listForCompany(uid: string, companyId: string): Promise<Application[]>
  listEvents(uid: string, applicationId: string): Promise<ApplicationEvent[]>
  updateDetails(id: string, patch: ApplicationDetailsPatch): Promise<void>
  updateStatus(
    uid: string,
    id: string,
    next: ApplicationStatus,
    options?: UpdateApplicationStatusOptions,
  ): Promise<void>
  delete(uid: string, id: string): Promise<void>
}

/**
 * Builds the application service against a specific Firestore instance.
 * The app uses the default `db`; tests pass the emulator's Firestore.
 */
export function createApplicationService(firestore: Firestore): ApplicationService {
  const applications = collection(firestore, collections.applications)
  const events = collection(firestore, collections.applicationEvents)

  async function get(id: string): Promise<Application | null> {
    const snapshot = await getDoc(doc(applications, id))
    return snapshot.exists() ? toApplication(snapshot.id, snapshot.data()) : null
  }

  async function createFromJob(
    uid: string,
    jobId: string,
    origin: ApplicationOrigin = 'opportunity',
  ): Promise<CreateApplicationResult> {
    const appId = applicationDocId(uid, jobId)
    const appRef = doc(applications, appId)
    const jobRef = doc(firestore, collections.jobs, jobId)

    try {
      // A transaction keeps creation idempotent even if the button is
      // double-clicked: the second run sees the existing doc and adds no event.
      // The job is only read when the application does not exist, so an
      // application still opens if its source job was later removed.
      return await runTransaction(firestore, async (transaction) => {
        const applicationSnapshot = await transaction.get(appRef)
        if (applicationSnapshot.exists()) {
          return { id: appId, existing: true }
        }

        const jobSnapshot = await transaction.get(jobRef)
        if (!jobSnapshot.exists()) {
          throw new Error('Job not found.')
        }

        const jobData = jobSnapshot.data()
        if (jobData.userId !== uid) {
          throw new Error('This job does not belong to you.')
        }

        const seed = buildApplicationSeed(
          uid,
          {
            id: jobSnapshot.id,
            companyId:
              typeof jobData.companyId === 'string' ? jobData.companyId : '',
            companyName:
              typeof jobData.companyName === 'string'
                ? stripHtml(jobData.companyName)
                : '',
            title: typeof jobData.title === 'string' ? stripHtml(jobData.title) : '',
            source: (jobData.source as JobSource) ?? 'custom',
            applicationUrl:
              typeof jobData.applicationUrl === 'string'
                ? jobData.applicationUrl
                : '',
            location:
              typeof jobData.location === 'string'
                ? stripHtml(jobData.location)
                : undefined,
            remote: jobData.remote === true,
          },
          origin,
        )
        const { id: seedId, ...seedFields } = seed

        transaction.set(appRef, {
          ...seedFields,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })

        const eventRef = doc(events)
        transaction.set(eventRef, {
          userId: uid,
          applicationId: seedId,
          type: 'created' satisfies ApplicationEventType,
          toStatus: 'not-started' satisfies ApplicationStatus,
          note: 'Application created from opportunity.',
          createdAt: serverTimestamp(),
        })

        return { id: seedId, existing: false }
      })
    } catch (error) {
      if (isPermissionDenied(error)) {
        throw new Error('Job not found or you do not have access to it.')
      }
      throw error
    }
  }

  async function updateStatus(
    uid: string,
    id: string,
    next: ApplicationStatus,
    options: UpdateApplicationStatusOptions = {},
  ): Promise<void> {
    const appRef = doc(applications, id)

    await runTransaction(firestore, async (transaction) => {
      const snapshot = await transaction.get(appRef)
      if (!snapshot.exists()) {
        throw new Error('Application not found.')
      }

      const data = snapshot.data() as DocumentData
      if (data.userId !== uid) {
        throw new Error('This application does not belong to you.')
      }

      const from = (data.status as ApplicationStatus) ?? 'not-started'
      assertApplicationTransition(from, next)

      const outcome = resolveApplicationOutcome(from, next, options.outcome)
      const patch = applicationStatusPatch(next, outcome)

      const update: Record<string, unknown> = {
        status: patch.status,
        updatedAt: serverTimestamp(),
      }
      if (patch.outcome !== undefined) update.outcome = patch.outcome
      if (patch.setApprovedAt) update.approvedAt = serverTimestamp()
      if (patch.setSubmittedAt) {
        update.submittedAt = serverTimestamp()
        update.submittedManually = true
      }
      if (patch.setClosedAt) update.closedAt = serverTimestamp()

      transaction.update(appRef, update)

      const event: Record<string, unknown> = {
        userId: uid,
        applicationId: id,
        type: 'status-changed' satisfies ApplicationEventType,
        fromStatus: from,
        toStatus: next,
        createdAt: serverTimestamp(),
      }
      const note = options.note?.trim()
      if (note) event.note = note
      transaction.set(doc(events), event)
    })
  }

  async function list(uid: string): Promise<Application[]> {
    const snapshot = await getDocs(
      query(applications, where('userId', '==', uid), orderBy('updatedAt', 'desc')),
    )
    return snapshot.docs.map((document) => toApplication(document.id, document.data()))
  }

  async function listForJob(uid: string, jobId: string): Promise<Application[]> {
    const snapshot = await getDocs(
      query(
        applications,
        where('userId', '==', uid),
        where('jobId', '==', jobId),
      ),
    )
    return snapshot.docs.map((document) => toApplication(document.id, document.data()))
  }

  async function listForCompany(uid: string, companyId: string): Promise<Application[]> {
    const snapshot = await getDocs(
      query(
        applications,
        where('userId', '==', uid),
        where('companyId', '==', companyId),
        orderBy('updatedAt', 'desc'),
      ),
    )
    return snapshot.docs.map((document) => toApplication(document.id, document.data()))
  }

  async function listEvents(
    uid: string,
    applicationId: string,
  ): Promise<ApplicationEvent[]> {
    const snapshot = await getDocs(
      query(
        events,
        where('userId', '==', uid),
        where('applicationId', '==', applicationId),
        orderBy('createdAt', 'desc'),
      ),
    )
    return snapshot.docs.map((document) => toApplicationEvent(document.id, document.data()))
  }

  async function updateDetails(id: string, patch: ApplicationDetailsPatch): Promise<void> {
    const payload: Record<string, unknown> = { updatedAt: serverTimestamp() }
    for (const [key, value] of Object.entries(patch)) {
      if (value !== undefined) payload[key] = value
    }
    await updateDoc(doc(applications, id), payload)
  }

  async function remove(uid: string, id: string): Promise<void> {
    const eventSnapshot = await getDocs(
      query(
        events,
        where('userId', '==', uid),
        where('applicationId', '==', id),
        orderBy('createdAt', 'desc'),
      ),
    )

    const batch = writeBatch(firestore)
    batch.delete(doc(applications, id))
    for (const event of eventSnapshot.docs) {
      batch.delete(event.ref)
    }
    await batch.commit()
  }

  return {
    createFromJob,
    get,
    getForJob: (uid, jobId) => get(applicationDocId(uid, jobId)),
    list,
    listForJob,
    listForCompany,
    listEvents,
    updateDetails,
    updateStatus,
    delete: remove,
  }
}

function isPermissionDenied(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code
  if (code === 'permission-denied' || code === 7) {
    return true
  }
  const message = error instanceof Error ? error.message : String(error)
  return /permission[_ -]?denied/i.test(message) || /false for '(get|list)'/i.test(message)
}

function optionalTimestamp(value: unknown): Timestamp | undefined {
  return value ? (value as Timestamp) : undefined
}

function toApplication(id: string, data: DocumentData): Application {
  return {
    id,
    userId: data.userId,
    jobId: data.jobId,
    companyId: data.companyId ?? '',
    companyName: stripHtml(data.companyName ?? ''),
    jobTitle: stripHtml(data.jobTitle ?? ''),
    jobSource: data.jobSource ?? 'custom',
    applicationUrl: data.applicationUrl ?? '',
    location: data.location ? stripHtml(data.location) : undefined,
    remote: data.remote ?? false,
    status: (data.status as ApplicationStatus) ?? 'not-started',
    outcome: data.outcome,
    origin: (data.origin as ApplicationOrigin) ?? 'opportunity',
    resumeVariantId: data.resumeVariantId,
    contactId: data.contactId,
    nextAction: data.nextAction,
    nextActionAt: optionalTimestamp(data.nextActionAt),
    notes: data.notes,
    approvedAt: optionalTimestamp(data.approvedAt),
    submittedAt: optionalTimestamp(data.submittedAt),
    submittedManually: data.submittedManually,
    closedAt: optionalTimestamp(data.closedAt),
    createdAt: optionalTimestamp(data.createdAt) as Timestamp,
    updatedAt: optionalTimestamp(data.updatedAt) as Timestamp,
  }
}

function toApplicationEvent(id: string, data: DocumentData): ApplicationEvent {
  return {
    id,
    userId: data.userId,
    applicationId: data.applicationId,
    type: data.type as ApplicationEventType,
    fromStatus: data.fromStatus,
    toStatus: data.toStatus,
    note: data.note,
    createdAt: optionalTimestamp(data.createdAt) as Timestamp,
  }
}
