import { db } from '@/services/firestore'
import { createApplicationResumeService } from '@/services/applicationResumeService'

const service = createApplicationResumeService(db)

export function attachResumeToApplication(
  uid: string,
  applicationId: string,
  resumeUrl: string,
): Promise<void> {
  return service.attach(uid, applicationId, resumeUrl)
}
