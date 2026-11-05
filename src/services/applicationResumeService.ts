import {
  doc,
  runTransaction,
  serverTimestamp,
  type Firestore,
} from 'firebase/firestore'
import { collections } from '@/services/collections'
import {
  createEmptyCoverLetter,
  isPreparationReadOnly,
  preparationDocId,
} from '@/lib/applicationPreparation'
import type { ApplicationStatus } from '@/types/applications'

export interface ApplicationResumeService {
  attach(uid: string, applicationId: string, resumeUrl: string): Promise<void>
}

/**
 * Attaches a resume snapshot to both the application and its preparation
 * record. Changing the URL resets the resume review state.
 */
export function createApplicationResumeService(
  firestore: Firestore,
): ApplicationResumeService {
  async function attach(
    uid: string,
    applicationId: string,
    resumeUrl: string,
  ): Promise<void> {
    const normalized = resumeUrl.trim()
    const applicationRef = doc(firestore, collections.applications, applicationId)
    const preparationRef = doc(
      firestore,
      collections.applicationPreparations,
      preparationDocId(uid, applicationId),
    )

    await runTransaction(firestore, async (transaction) => {
      const applicationSnapshot = await transaction.get(applicationRef)
      if (!applicationSnapshot.exists()) {
        throw new Error('Application not found.')
      }
      if (applicationSnapshot.data()?.userId !== uid) {
        throw new Error('This application does not belong to you.')
      }
      const status = applicationSnapshot.data()?.status as ApplicationStatus | undefined
      if (status && isPreparationReadOnly(status)) {
        throw new Error('Preparation is locked for this application.')
      }

      const preparationSnapshot = await transaction.get(preparationRef)
      const existing = preparationSnapshot.exists()
        ? preparationSnapshot.data()
        : null
      const previousResume =
        typeof existing?.resumeUrl === 'string' ? existing.resumeUrl : ''
      const resumeChanged = previousResume !== normalized

      transaction.update(applicationRef, {
        resumeUrl: normalized,
        updatedAt: serverTimestamp(),
      })

      if (preparationSnapshot.exists()) {
        transaction.update(preparationRef, {
          resumeUrl: normalized,
          ...(resumeChanged ? { resumeReviewed: false } : {}),
          updatedAt: serverTimestamp(),
        })
      } else {
        transaction.set(preparationRef, {
          userId: uid,
          applicationId,
          coverLetter: createEmptyCoverLetter(),
          answers: [],
          resumeUrl: normalized,
          resumeNotes: '',
          resumeReviewed: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        })
      }
    })
  }

  return { attach }
}
