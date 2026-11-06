import {
  deleteField,
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

export interface ApplicationResumeAttachment {
  resumeUrl: string
  resumeVariantId?: string
  resumeVariantName?: string
}

export interface ApplicationResumeService {
  attach(
    uid: string,
    applicationId: string,
    attachment: ApplicationResumeAttachment,
  ): Promise<void>
}

/**
 * Attaches a resume snapshot to both the application and its preparation
 * record. Changing the URL or variant resets the resume review state.
 */
export function createApplicationResumeService(
  firestore: Firestore,
): ApplicationResumeService {
  async function attach(
    uid: string,
    applicationId: string,
    attachment: ApplicationResumeAttachment,
  ): Promise<void> {
    const normalized = attachment.resumeUrl.trim()
    const variantId = attachment.resumeVariantId?.trim() || undefined
    const variantName = attachment.resumeVariantName?.trim() || undefined
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
      const application = applicationSnapshot.data() ?? {}
      if (application.userId !== uid) {
        throw new Error('This application does not belong to you.')
      }
      const status = application.status as ApplicationStatus | undefined
      if (status && isPreparationReadOnly(status)) {
        throw new Error('Preparation is locked for this application.')
      }

      const preparationSnapshot = await transaction.get(preparationRef)
      const existing = preparationSnapshot.exists()
        ? preparationSnapshot.data()
        : null
      const previousResume =
        typeof existing?.resumeUrl === 'string'
          ? existing.resumeUrl
          : typeof application.resumeUrl === 'string'
            ? application.resumeUrl
            : ''
      const previousVariantId =
        typeof existing?.resumeVariantId === 'string'
          ? existing.resumeVariantId
          : typeof application.resumeVariantId === 'string'
            ? application.resumeVariantId
            : ''
      const resumeChanged =
        previousResume !== normalized || previousVariantId !== (variantId ?? '')

      transaction.update(applicationRef, {
        resumeUrl: normalized,
        ...(variantId
          ? { resumeVariantId: variantId }
          : { resumeVariantId: deleteField() }),
        ...(variantName
          ? { resumeVariantName: variantName }
          : { resumeVariantName: deleteField() }),
        updatedAt: serverTimestamp(),
      })

      if (preparationSnapshot.exists()) {
        transaction.update(preparationRef, {
          resumeUrl: normalized,
          ...(variantId
            ? { resumeVariantId: variantId }
            : { resumeVariantId: deleteField() }),
          ...(variantName
            ? { resumeVariantName: variantName }
            : { resumeVariantName: deleteField() }),
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
          ...(variantId ? { resumeVariantId: variantId } : {}),
          ...(variantName ? { resumeVariantName: variantName } : {}),
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
