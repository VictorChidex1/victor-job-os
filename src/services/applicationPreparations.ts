import { db } from '@/services/firestore'
import { createApplicationPreparationService } from '@/services/applicationPreparationService'
import type {
  ApplicationPreparation,
  ApplicationPreparationPatch,
} from '@/types/applicationPreparation'

const service = createApplicationPreparationService(db)

export function getApplicationPreparation(
  uid: string,
  applicationId: string,
): Promise<ApplicationPreparation | null> {
  return service.get(uid, applicationId)
}

export function saveApplicationPreparation(
  uid: string,
  applicationId: string,
  patch: ApplicationPreparationPatch,
): Promise<void> {
  return service.save(uid, applicationId, patch)
}

export function deleteApplicationPreparation(
  uid: string,
  applicationId: string,
): Promise<void> {
  return service.delete(uid, applicationId)
}
