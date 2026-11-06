import { db } from '@/services/firestore'
import { createResumeVariantService } from '@/services/resumeVariantService'
import type { ResumeVariant, ResumeVariantInput } from '@/types/resumeVariants'

const service = createResumeVariantService(db)

export function listResumeVariants(uid: string): Promise<ResumeVariant[]> {
  return service.list(uid)
}

export function getResumeVariant(id: string): Promise<ResumeVariant | null> {
  return service.get(id)
}

export function createResumeVariant(
  uid: string,
  input: ResumeVariantInput,
): Promise<string> {
  return service.create(uid, input)
}

export function updateResumeVariant(
  uid: string,
  id: string,
  input: ResumeVariantInput,
): Promise<void> {
  return service.update(uid, id, input)
}

export function setDefaultResumeVariant(uid: string, id: string): Promise<void> {
  return service.setDefault(uid, id)
}

export function deleteResumeVariant(id: string): Promise<void> {
  return service.delete(id)
}
