export type SubmissionAuthorization =
  | { ok: true }
  | { ok: false; error: string }

export function validateSubmissionAuthorization(input: {
  authorize?: unknown
  confirmation?: unknown
}): SubmissionAuthorization {
  if (input.authorize !== true) {
    return {
      ok: false,
      error: 'Explicit submission authorization is required.',
    }
  }
  if (
    typeof input.confirmation !== 'string' ||
    input.confirmation.trim() !== 'SUBMIT'
  ) {
    return {
      ok: false,
      error: 'Type SUBMIT exactly to confirm the submission.',
    }
  }
  return { ok: true }
}

export interface SubmissionConfirmationInput {
  url: string
  title?: string
  bodyText: string
}

export interface SubmissionConfirmationResult {
  confirmed: boolean
  confirmationUrl?: string
  confirmationText?: string
  reason?: string
}

const CONFIRMATION_PHRASES = [
  /thank you for (applying|your application)/i,
  /application (has been |was )?(received|submitted)/i,
  /we (have )?received your application/i,
  /successfully applied/i,
  /your application is complete/i,
]

const CONFIRMATION_URL_PATTERN =
  /\/(thanks|thank-you|thankyou|confirmation|success|applied|application-received)(\/|$|\?)/i

/**
 * Conservative confirmation detection. A URL change alone is not enough.
 */
export function detectSubmissionConfirmation(
  input: SubmissionConfirmationInput,
): SubmissionConfirmationResult {
  const body = input.bodyText.replace(/\s+/g, ' ').trim()
  const combined = `${input.title ?? ''}\n${body}`

  const phrase = CONFIRMATION_PHRASES.find((pattern) => pattern.test(combined))
  if (phrase) {
    const match = combined.match(phrase)
    return {
      confirmed: true,
      confirmationUrl: input.url,
      confirmationText: match?.[0] ?? phrase.source,
    }
  }

  if (CONFIRMATION_URL_PATTERN.test(input.url)) {
    return {
      confirmed: true,
      confirmationUrl: input.url,
      confirmationText: 'Confirmation URL detected',
    }
  }

  return {
    confirmed: false,
    reason:
      'Submit was clicked, but a clear application confirmation could not be detected. Do not retry automatically; verify the application manually.',
  }
}

export function submissionBlockers(input: {
  requiredFieldKeys: string[]
  approvedFieldKeys: Set<string>
  requiredFileField: boolean
  hasResume: boolean
  requiredCheckboxKeys?: string[]
  approvedCheckboxValues?: Map<string, boolean>
}): string[] {
  const blockers: string[] = []
  for (const key of input.requiredFieldKeys) {
    if (!input.approvedFieldKeys.has(key)) {
      blockers.push(key)
    }
  }
  for (const key of input.requiredCheckboxKeys ?? []) {
    if (input.approvedCheckboxValues?.get(key) !== true) {
      blockers.push(key)
    }
  }
  if (input.requiredFileField && !input.hasResume) {
    blockers.push('resume')
  }
  return Array.from(new Set(blockers))
}
