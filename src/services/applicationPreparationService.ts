import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore'
import { collections } from '@/services/collections'
import { stripHtml } from '@/lib/html'
import {
  createAnswerId,
  createEmptyCoverLetter,
  preparationDocId,
} from '@/lib/applicationPreparation'
import type {
  ApplicationAnswerDraft,
  ApplicationPreparation,
  ApplicationPreparationPatch,
  CoverLetterDraft,
  PreparationItemStatus,
} from '@/types/applicationPreparation'

export interface ApplicationPreparationService {
  get(uid: string, applicationId: string): Promise<ApplicationPreparation | null>
  save(
    uid: string,
    applicationId: string,
    patch: ApplicationPreparationPatch,
  ): Promise<void>
  delete(uid: string, applicationId: string): Promise<void>
}

export function createApplicationPreparationService(
  firestore: Firestore,
): ApplicationPreparationService {
  const preparations = collection(firestore, collections.applicationPreparations)

  async function get(
    uid: string,
    applicationId: string,
  ): Promise<ApplicationPreparation | null> {
    const snapshot = await getDoc(
      doc(preparations, preparationDocId(uid, applicationId)),
    )
    return snapshot.exists()
      ? toPreparation(snapshot.id, snapshot.data())
      : null
  }

  async function save(
    uid: string,
    applicationId: string,
    patch: ApplicationPreparationPatch,
  ): Promise<void> {
    const ref = doc(preparations, preparationDocId(uid, applicationId))

    await runTransaction(firestore, async (transaction) => {
      const snapshot = await transaction.get(ref)
      const existing = snapshot.exists()
        ? toPreparation(snapshot.id, snapshot.data())
        : null

      const coverLetter = patch.coverLetter
        ? sanitizeCoverLetter(patch.coverLetter)
        : (existing?.coverLetter ?? createEmptyCoverLetter())

      const answers = patch.answers
        ? patch.answers.map(sanitizeAnswer).filter((answer) => answer.question || answer.answer)
        : (existing?.answers ?? [])

      transaction.set(ref, {
        userId: uid,
        applicationId,
        coverLetter,
        answers,
        resumeUrl:
          patch.resumeUrl !== undefined
            ? stripHtml(patch.resumeUrl).trim()
            : (existing?.resumeUrl ?? ''),
        resumeNotes:
           patch.resumeNotes !== undefined
             ? stripHtml(patch.resumeNotes).trim()
             : (existing?.resumeNotes ?? ''),
        resumeReviewed:
          patch.resumeReviewed !== undefined
            ? Boolean(patch.resumeReviewed)
            : (existing?.resumeReviewed ?? false),
        createdAt: existing?.createdAt ?? serverTimestamp(),
        updatedAt: serverTimestamp(),
      })
    })
  }

  async function remove(uid: string, applicationId: string): Promise<void> {
    await deleteDoc(doc(preparations, preparationDocId(uid, applicationId)))
  }

  return { get, save, delete: remove }
}

function normalizeStatus(value: unknown): PreparationItemStatus {
  return value === 'draft' ||
    value === 'needs-review' ||
    value === 'approved' ||
    value === 'empty'
    ? value
    : 'empty'
}

function sanitizeCoverLetter(letter: CoverLetterDraft): CoverLetterDraft {
  const status = normalizeStatus(letter.status)
  return {
    body: stripHtml(letter.body ?? '').trim(),
    draftBody: stripHtml(letter.draftBody ?? '').trim(),
    status,
    ...(letter.aiProvider ? { aiProvider: letter.aiProvider } : {}),
    ...(letter.model ? { model: letter.model } : {}),
    ...(letter.promptVersion ? { promptVersion: letter.promptVersion } : {}),
    updatedAt: Timestamp.now(),
    ...(status === 'approved'
      ? { approvedAt: letter.approvedAt ?? Timestamp.now() }
      : {}),
  }
}

function sanitizeAnswer(answer: ApplicationAnswerDraft): ApplicationAnswerDraft {
  const status = normalizeStatus(answer.status)
  return {
    id: answer.id,
    question: stripHtml(answer.question ?? '').trim(),
    answer: stripHtml(answer.answer ?? '').trim(),
    draftAnswer: stripHtml(answer.draftAnswer ?? '').trim(),
    status,
    ...(answer.aiProvider ? { aiProvider: answer.aiProvider } : {}),
    ...(answer.model ? { model: answer.model } : {}),
    ...(answer.promptVersion ? { promptVersion: answer.promptVersion } : {}),
    updatedAt: Timestamp.now(),
    ...(status === 'approved'
      ? { approvedAt: answer.approvedAt ?? Timestamp.now() }
      : {}),
  }
}

function optionalTimestamp(value: unknown): Timestamp | undefined {
  return value ? (value as Timestamp) : undefined
}

function toPreparation(
  id: string,
  data: DocumentData,
): ApplicationPreparation {
  return {
    id,
    userId: data.userId ?? '',
    applicationId: data.applicationId ?? '',
    coverLetter: toCoverLetter(data.coverLetter),
    answers: Array.isArray(data.answers)
      ? data.answers.map((answer) => toAnswer(answer as DocumentData))
      : [],
    resumeUrl: typeof data.resumeUrl === 'string' ? data.resumeUrl : '',
    resumeNotes: typeof data.resumeNotes === 'string' ? data.resumeNotes : '',
    resumeReviewed: data.resumeReviewed === true,
    createdAt: optionalTimestamp(data.createdAt),
    updatedAt: optionalTimestamp(data.updatedAt),
  }
}

function toCoverLetter(value: unknown): CoverLetterDraft {
  const data = (value ?? {}) as DocumentData
  return {
    body: typeof data.body === 'string' ? data.body : '',
    draftBody: typeof data.draftBody === 'string' ? data.draftBody : '',
    status: normalizeStatus(data.status),
    ...(typeof data.aiProvider === 'string' ? { aiProvider: data.aiProvider } : {}),
    ...(typeof data.model === 'string' ? { model: data.model } : {}),
    ...(typeof data.promptVersion === 'string'
      ? { promptVersion: data.promptVersion }
      : {}),
    ...(data.updatedAt ? { updatedAt: optionalTimestamp(data.updatedAt) } : {}),
    ...(data.approvedAt ? { approvedAt: optionalTimestamp(data.approvedAt) } : {}),
  }
}

function toAnswer(data: DocumentData): ApplicationAnswerDraft {
  return {
    id: typeof data.id === 'string' && data.id ? data.id : createAnswerId(),
    question: typeof data.question === 'string' ? data.question : '',
    answer: typeof data.answer === 'string' ? data.answer : '',
    draftAnswer: typeof data.draftAnswer === 'string' ? data.draftAnswer : '',
    status: normalizeStatus(data.status),
    ...(typeof data.aiProvider === 'string' ? { aiProvider: data.aiProvider } : {}),
    ...(typeof data.model === 'string' ? { model: data.model } : {}),
    ...(typeof data.promptVersion === 'string'
      ? { promptVersion: data.promptVersion }
      : {}),
    ...(data.updatedAt ? { updatedAt: optionalTimestamp(data.updatedAt) } : {}),
    ...(data.approvedAt ? { approvedAt: optionalTimestamp(data.approvedAt) } : {}),
  }
}
