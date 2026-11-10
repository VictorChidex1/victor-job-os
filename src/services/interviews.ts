import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  type DocumentData,
} from 'firebase/firestore'
import { db } from '@/services/firestore'
import { collections } from '@/services/collections'
import { buildSearchTokens } from '@/lib/searchTokens'
import type { ApplicationStatus } from '@/types/applications'
import type {
  Interview,
  InterviewInput,
  InterviewPatch,
  InterviewStatus,
  InterviewType,
} from '@/types/interviews'

const interviews = collection(db, collections.interviews)
const applications = collection(db, collections.applications)
const events = collection(db, collections.applicationEvents)

const INTERVIEW_TYPES = new Set<InterviewType>([
  'phone',
  'video',
  'onsite',
  'technical',
  'behavioral',
  'panel',
  'final',
  'other',
])
const INTERVIEW_STATUSES = new Set<InterviewStatus>([
  'scheduled',
  'completed',
  'cancelled',
  'no-show',
])

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeMeetingUrl(value: string | undefined): string | undefined {
  const trimmed = clean(value)
  if (!trimmed) return undefined
  const url = new URL(trimmed)
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Meeting URL must use http or https.')
  }
  return url.toString()
}

function normalizeInput(input: InterviewInput): {
  type: InterviewType
  status: InterviewStatus
  scheduledAt: Timestamp
  durationMinutes: number
  timezone: string
  interviewers: string[]
  round?: string
  location?: string
  meetingUrl?: string
  notes?: string
  preparationNotes?: string
  outcomeNotes?: string
} {
  if (!INTERVIEW_TYPES.has(input.type)) throw new Error('Invalid interview type.')
  if (!INTERVIEW_STATUSES.has(input.status)) throw new Error('Invalid interview status.')
  if (!(input.scheduledAt instanceof Date) || Number.isNaN(input.scheduledAt.getTime())) {
    throw new Error('A valid interview date and time is required.')
  }
  if (
    !Number.isFinite(input.durationMinutes) ||
    input.durationMinutes < 15 ||
    input.durationMinutes > 480
  ) {
    throw new Error('Interview duration must be between 15 and 480 minutes.')
  }
  const timezone = clean(input.timezone)
  if (!timezone) throw new Error('Interview timezone is required.')
  const interviewers = input.interviewers.map((value) => value.trim()).filter(Boolean)

  return {
    type: input.type,
    status: input.status,
    scheduledAt: Timestamp.fromDate(input.scheduledAt),
    durationMinutes: Math.round(input.durationMinutes),
    timezone,
    interviewers,
    ...(clean(input.round) ? { round: clean(input.round) } : {}),
    ...(clean(input.location) ? { location: clean(input.location) } : {}),
    ...(normalizeMeetingUrl(input.meetingUrl)
      ? { meetingUrl: normalizeMeetingUrl(input.meetingUrl) }
      : {}),
    ...(clean(input.notes) ? { notes: clean(input.notes) } : {}),
    ...(clean(input.preparationNotes)
      ? { preparationNotes: clean(input.preparationNotes) }
      : {}),
    ...(clean(input.outcomeNotes)
      ? { outcomeNotes: clean(input.outcomeNotes) }
      : {}),
  }
}

function toInterview(id: string, data: DocumentData): Interview {
  return {
    id,
    userId: data.userId ?? '',
    applicationId: data.applicationId ?? '',
    companyName: data.companyName ?? '',
    jobTitle: data.jobTitle ?? '',
    type: INTERVIEW_TYPES.has(data.type) ? data.type : 'other',
    status: INTERVIEW_STATUSES.has(data.status) ? data.status : 'scheduled',
    ...(typeof data.round === 'string' && data.round ? { round: data.round } : {}),
    scheduledAt: data.scheduledAt as Timestamp,
    durationMinutes:
      typeof data.durationMinutes === 'number' ? data.durationMinutes : 60,
    timezone: typeof data.timezone === 'string' ? data.timezone : 'UTC',
    ...(typeof data.location === 'string' && data.location
      ? { location: data.location }
      : {}),
    ...(typeof data.meetingUrl === 'string' && data.meetingUrl
      ? { meetingUrl: data.meetingUrl }
      : {}),
    interviewers: Array.isArray(data.interviewers)
      ? data.interviewers.filter((value: unknown): value is string => typeof value === 'string')
      : [],
    ...(typeof data.notes === 'string' && data.notes ? { notes: data.notes } : {}),
    ...(typeof data.preparationNotes === 'string' && data.preparationNotes
      ? { preparationNotes: data.preparationNotes }
      : {}),
    ...(typeof data.outcomeNotes === 'string' && data.outcomeNotes
      ? { outcomeNotes: data.outcomeNotes }
      : {}),
    searchTokens: Array.isArray(data.searchTokens)
      ? data.searchTokens.filter((value: unknown): value is string => typeof value === 'string')
      : [],
    createdAt: data.createdAt as Timestamp,
    updatedAt: data.updatedAt as Timestamp,
  }
}

export async function createInterview(
  uid: string,
  input: InterviewInput,
  options: { moveApplicationToInterviewing?: boolean } = {},
): Promise<string> {
  const normalized = normalizeInput(input)
  const interviewRef = doc(interviews)
  const applicationRef = doc(applications, input.applicationId)

  await runTransaction(db, async (transaction) => {
    const appSnapshot = await transaction.get(applicationRef)
    if (!appSnapshot.exists()) throw new Error('Application not found.')
    const application = appSnapshot.data()
    if (application.userId !== uid) {
      throw new Error('This application does not belong to you.')
    }

    const currentStatus = String(application.status ?? '') as ApplicationStatus
    const shouldMove =
      options.moveApplicationToInterviewing === true &&
      normalized.status === 'scheduled' &&
      (currentStatus === 'submitted' || currentStatus === 'assessment')
    const searchTokens = buildSearchTokens(
      application.companyName,
      application.jobTitle,
      normalized.type,
      normalized.round,
      normalized.interviewers,
    )

    transaction.set(interviewRef, {
      userId: uid,
      applicationId: input.applicationId,
      companyName: application.companyName ?? '',
      jobTitle: application.jobTitle ?? '',
      ...normalized,
      searchTokens,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })

    if (shouldMove) {
      transaction.update(applicationRef, {
        status: 'interview',
        updatedAt: serverTimestamp(),
      })
      const eventRef = doc(events)
      transaction.set(eventRef, {
        userId: uid,
        applicationId: input.applicationId,
        type: 'status-changed',
        fromStatus: currentStatus,
        toStatus: 'interview',
        note: 'Interview scheduled',
        createdAt: serverTimestamp(),
      })
    }
  })

  return interviewRef.id
}

export async function updateInterview(
  uid: string,
  interviewId: string,
  patch: InterviewPatch,
): Promise<void> {
  const ref = doc(interviews, interviewId)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) throw new Error('Interview not found.')
  const data = snapshot.data()
  if (data.userId !== uid) throw new Error('This interview does not belong to you.')

  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() }
  if (patch.type !== undefined) {
    if (!INTERVIEW_TYPES.has(patch.type)) throw new Error('Invalid interview type.')
    payload.type = patch.type
  }
  if (patch.status !== undefined) {
    if (!INTERVIEW_STATUSES.has(patch.status)) throw new Error('Invalid interview status.')
    payload.status = patch.status
  }
  if (patch.scheduledAt !== undefined) {
    if (Number.isNaN(patch.scheduledAt.getTime())) {
      throw new Error('A valid interview date and time is required.')
    }
    payload.scheduledAt = Timestamp.fromDate(patch.scheduledAt)
  }
  if (patch.durationMinutes !== undefined) {
    if (patch.durationMinutes < 15 || patch.durationMinutes > 480) {
      throw new Error('Interview duration must be between 15 and 480 minutes.')
    }
    payload.durationMinutes = Math.round(patch.durationMinutes)
  }
  if (patch.timezone !== undefined) {
    if (!clean(patch.timezone)) throw new Error('Interview timezone is required.')
    payload.timezone = clean(patch.timezone)
  }
  if (patch.round !== undefined) payload.round = clean(patch.round) ?? null
  if (patch.location !== undefined) payload.location = clean(patch.location) ?? null
  if (patch.meetingUrl !== undefined) {
    payload.meetingUrl = normalizeMeetingUrl(patch.meetingUrl) ?? null
  }
  if (patch.interviewers !== undefined) {
    payload.interviewers = patch.interviewers.map((value) => value.trim()).filter(Boolean)
  }
  if (patch.notes !== undefined) payload.notes = clean(patch.notes) ?? null
  if (patch.preparationNotes !== undefined) {
    payload.preparationNotes = clean(patch.preparationNotes) ?? null
  }
  if (patch.outcomeNotes !== undefined) {
    payload.outcomeNotes = clean(patch.outcomeNotes) ?? null
  }

  await updateDoc(ref, payload)
}

export async function deleteInterview(uid: string, interviewId: string): Promise<void> {
  const ref = doc(interviews, interviewId)
  const snapshot = await getDoc(ref)
  if (!snapshot.exists()) return
  if (snapshot.data().userId !== uid) {
    throw new Error('This interview does not belong to you.')
  }
  await deleteDoc(ref)
}

export async function listInterviewsForApplication(
  uid: string,
  applicationId: string,
): Promise<Interview[]> {
  const snapshot = await getDocs(
    query(
      interviews,
      where('userId', '==', uid),
      where('applicationId', '==', applicationId),
      orderBy('scheduledAt', 'desc'),
    ),
  )
  return snapshot.docs.map((document) => toInterview(document.id, document.data()))
}

export async function listUpcomingInterviews(
  uid: string,
  limitCount = 5,
): Promise<Interview[]> {
  const snapshot = await getDocs(
    query(
      interviews,
      where('userId', '==', uid),
      where('status', '==', 'scheduled'),
      where('scheduledAt', '>=', Timestamp.now()),
      orderBy('scheduledAt', 'asc'),
      limit(limitCount),
    ),
  )
  return snapshot.docs.map((document) => toInterview(document.id, document.data()))
}

export function interviewFromId(id: string, data: DocumentData): Interview {
  return toInterview(id, data)
}
