import { describe, expect, it } from 'vitest'
import { validateVerificationChecklist } from '../../functions/src/automation/verification'

const completeChecklist = {
  openedApplication: true,
  reviewedPopulatedFields: true,
  handledManualFields: true,
  confirmsInformationIsAccurate: true,
}

describe('automation manual verification', () => {
  it('requires every checklist item', () => {
    const result = validateVerificationChecklist(
      { ...completeChecklist, handledManualFields: false },
      '',
    )
    expect(result.ok).toBe(false)
  })

  it('accepts a complete checklist and trims notes', () => {
    const result = validateVerificationChecklist(
      completeChecklist,
      '  Corrected the phone field manually.  ',
    )
    expect(result).toEqual({
      ok: true,
      checklist: completeChecklist,
      notes: 'Corrected the phone field manually.',
    })
  })

  it('rejects malformed and oversized notes', () => {
    expect(validateVerificationChecklist(completeChecklist, 123).ok).toBe(false)
    expect(
      validateVerificationChecklist(completeChecklist, 'x'.repeat(2001)).ok,
    ).toBe(false)
  })
})
