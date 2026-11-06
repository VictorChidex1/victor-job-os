import { db } from '@/services/firestore'
import {
  createApplicationResumeService,
  type ApplicationResumeAttachment,
} from '@/services/applicationResumeService'

const service = createApplicationResumeService(db)

export function attachResumeToApplication(
  uid: string,
  applicationId: string,
  attachment: ApplicationResumeAttachment,
): Promise<void> {
  return service.attach(uid, applicationId, attachment)
}
