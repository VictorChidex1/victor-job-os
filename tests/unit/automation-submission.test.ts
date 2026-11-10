import { describe, expect, it } from 'vitest'
import {
  detectSubmissionConfirmation,
  submissionBlockers,
  validateSubmissionAuthorization,
} from '../../functions/src/automation/submission'

describe('application submission authorization', () => {
  it('requires explicit authorization and the exact confirmation text', () => {
    expect(
      validateSubmissionAuthorization({ authorize: true, confirmation: 'SUBMIT' }),
    ).toEqual({ ok: true })
    expect(
      validateSubmissionAuthorization({ authorize: false, confirmation: 'SUBMIT' }).ok,
    ).toBe(false)
    expect(
      validateSubmissionAuthorization({ authorize: true, confirmation: 'submit' }).ok,
    ).toBe(false)
    expect(
      validateSubmissionAuthorization({ authorize: true, confirmation: 'SUBMIT ' }).ok,
    ).toBe(true)
  })
})

describe('submission confirmation detection', () => {
  it('detects common confirmation phrases', () => {
    const result = detectSubmissionConfirmation({
      url: 'https://jobs.example.com/apply',
      title: 'Application received',
      bodyText: 'Thank you for applying. We have received your application.',
    })
    expect(result.confirmed).toBe(true)
  })

  it('detects confirmation URLs', () => {
    const result = detectSubmissionConfirmation({
      url: 'https://jobs.example.com/thanks',
      title: '',
      bodyText: 'Your application is complete.',
    })
    expect(result.confirmed).toBe(true)
  })

  it('does not treat an unknown page as confirmed', () => {
    const result = detectSubmissionConfirmation({
      url: 'https://jobs.example.com/apply',
      title: 'Apply',
      bodyText: 'Please complete all required fields.',
    })
    expect(result.confirmed).toBe(false)
  })
})

describe('submission precondition blockers', () => {
  it('returns missing required fields, unchecked required boxes, and missing resume', () => {
    const blockers = submissionBlockers({
      requiredFieldKeys: ['name', 'email', 'terms'],
      approvedFieldKeys: new Set(['name']),
      requiredCheckboxKeys: ['terms'],
      approvedCheckboxValues: new Map([['terms', false]]),
      requiredFileField: true,
      hasResume: false,
    })

    expect(blockers).toEqual(['email', 'terms', 'resume'])
  })

  it('returns no blockers when everything is ready', () => {
    const blockers = submissionBlockers({
      requiredFieldKeys: ['name', 'terms'],
      approvedFieldKeys: new Set(['name', 'terms']),
      requiredCheckboxKeys: ['terms'],
      approvedCheckboxValues: new Map([['terms', true]]),
      requiredFileField: true,
      hasResume: true,
    })

    expect(blockers).toEqual([])
  })
})
