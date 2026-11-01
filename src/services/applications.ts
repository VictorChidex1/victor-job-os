import { db } from '@/services/firestore'
import { createApplicationService } from '@/services/applicationService'
import type {
  Application,
  ApplicationDetailsPatch,
  ApplicationEvent,
  ApplicationOrigin,
  ApplicationOutcome,
  ApplicationStatus,
} from '@/types/applications'
import type { CreateApplicationResult } from '@/services/applicationService'

const service = createApplicationService(db)

export function createApplicationFromJob(
  uid: string,
  jobId: string,
  origin?: ApplicationOrigin,
): Promise<CreateApplicationResult> {
  return service.createFromJob(uid, jobId, origin)
}

export function getApplication(id: string): Promise<Application | null> {
  return service.get(id)
}

export function getApplicationForJob(
  uid: string,
  jobId: string,
): Promise<Application | null> {
  return service.getForJob(uid, jobId)
}

export function listApplications(uid: string): Promise<Application[]> {
  return service.list(uid)
}

export function listApplicationsForJob(uid: string, jobId: string): Promise<Application[]> {
  return service.listForJob(uid, jobId)
}

export function listApplicationsForCompany(
  uid: string,
  companyId: string,
): Promise<Application[]> {
  return service.listForCompany(uid, companyId)
}

export function listApplicationEvents(
  uid: string,
  applicationId: string,
): Promise<ApplicationEvent[]> {
  return service.listEvents(uid, applicationId)
}

export function updateApplicationDetails(
  id: string,
  patch: ApplicationDetailsPatch,
): Promise<void> {
  return service.updateDetails(id, patch)
}

export function updateApplicationStatus(
  uid: string,
  id: string,
  next: ApplicationStatus,
  options?: { note?: string; outcome?: ApplicationOutcome },
): Promise<void> {
  return service.updateStatus(uid, id, next, options)
}

export function deleteApplication(uid: string, id: string): Promise<void> {
  return service.delete(uid, id)
}
