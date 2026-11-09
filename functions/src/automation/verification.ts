import type { AutomationVerificationChecklist } from './types.js'

export type VerificationValidation =
  | { ok: true; checklist: AutomationVerificationChecklist; notes?: string }
  | { ok: false; error: string }

const MAX_NOTES_LENGTH = 2000

export function validateVerificationChecklist(
  checklistInput: unknown,
  notesInput: unknown,
): VerificationValidation {
  if (!checklistInput || typeof checklistInput !== 'object') {
    return { ok: false, error: 'Complete the verification checklist first.' }
  }

  const record = checklistInput as Record<string, unknown>
  const checklist: AutomationVerificationChecklist = {
    openedApplication: record.openedApplication === true,
    reviewedPopulatedFields: record.reviewedPopulatedFields === true,
    handledManualFields: record.handledManualFields === true,
    confirmsInformationIsAccurate:
      record.confirmsInformationIsAccurate === true,
  }

  if (!Object.values(checklist).every(Boolean)) {
    return {
      ok: false,
      error: 'Every verification checklist item must be confirmed.',
    }
  }

  if (notesInput !== undefined && typeof notesInput !== 'string') {
    return { ok: false, error: 'Verification notes must be text.' }
  }

  const notes =
    typeof notesInput === 'string' ? notesInput.trim() : ''
  if (notes.length > MAX_NOTES_LENGTH) {
    return {
      ok: false,
      error: `Verification notes must be ${MAX_NOTES_LENGTH} characters or fewer.`,
    }
  }

  return {
    ok: true,
    checklist,
    ...(notes ? { notes } : {}),
  }
}
