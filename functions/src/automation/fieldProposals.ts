import type {
  ApprovedFieldValue,
  AutomationFieldDescriptor,
  AutomationFieldProposal,
  AutomationFieldSource,
} from './types.js'

export interface ProposalProfile {
  fullName?: string
  headline?: string
  summary?: string
  skills?: string[]
  technologies?: string[]
  preferredRoles?: string[]
  preferredLocations?: string[]
  experienceLevel?: string
  resumeUrl?: string
  portfolioUrl?: string
  email?: string
  remotePreference?: boolean
}

export interface ProposalApplication {
  jobTitle?: string
  companyName?: string
  location?: string
  remote?: boolean
  applicationUrl?: string
  resumeUrl?: string
}

export interface ProposalPreparation {
  coverLetter?: {
    body?: string
    status?: string
  }
  answers?: Array<{
    question?: string
    answer?: string
    status?: string
  }>
  resumeUrl?: string
  resumeVariantName?: string
  resumeReviewed?: boolean
}

export interface BuildFieldProposalsInput {
  fields: AutomationFieldDescriptor[]
  profile?: ProposalProfile
  application?: ProposalApplication
  preparation?: ProposalPreparation
}

export type ApprovedFieldValidation =
  | { ok: true; values: ApprovedFieldValue[] }
  | { ok: false; error: string }

const MAX_APPROVED_FIELDS = 50
const MAX_TEXT_VALUE_LENGTH = 5000

function clean(value: string | undefined): string {
  return (value ?? '').trim()
}

export function normalizeFieldLabel(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[^a-z0-9+]+/g, ' ')
    .trim()
}

function includesAny(label: string, terms: string[]): boolean {
  return terms.some((term) => label.includes(term))
}

function isPresent(value: string | undefined): value is string {
  return Boolean(value && value.trim())
}

function proposal(
  field: AutomationFieldDescriptor,
  value: string | boolean | undefined,
  source: AutomationFieldSource,
  confidence: AutomationFieldProposal['confidence'],
  note?: string,
): AutomationFieldProposal {
  return {
    fieldKey: field.key,
    label: field.name,
    ...(field.type ? { type: field.type } : {}),
    ...(field.inputType ? { inputType: field.inputType } : {}),
    ...(field.required ? { required: true } : {}),
    ...(field.options?.length ? { options: field.options } : {}),
    ...(value !== undefined ? { proposedValue: value } : {}),
    proposedSource: source,
    confidence,
    ...(note ? { note } : {}),
  }
}

function manualProposal(
  field: AutomationFieldDescriptor,
  note: string,
): AutomationFieldProposal {
  return proposal(field, undefined, 'none', 'manual', note)
}

function selectOption(field: AutomationFieldDescriptor, value: string): string | undefined {
  const normalized = normalizeFieldLabel(value)
  return field.options?.find(
    (option) => normalizeFieldLabel(option) === normalized,
  )
}

function fullNameParts(fullName: string | undefined): {
  first?: string
  last?: string
  full?: string
} {
  const full = clean(fullName)
  if (!full) return {}
  const parts = full.split(/\s+/).filter(Boolean)
  return {
    full,
    first: parts[0],
    last: parts.length > 1 ? parts.slice(1).join(' ') : undefined,
  }
}

function approvedAnswer(
  preparation: ProposalPreparation | undefined,
  label: string,
): string | undefined {
  if (!preparation?.answers?.length) return undefined
  const normalizedLabel = normalizeFieldLabel(label)
  if (normalizedLabel.length < 4) return undefined

  const match = preparation.answers.find((answer) => {
    if (answer.status !== 'approved') return false
    const question = normalizeFieldLabel(answer.question ?? '')
    const value = clean(answer.answer)
    if (!question || !value) return false
    return (
      normalizedLabel === question ||
      normalizedLabel.includes(question) ||
      question.includes(normalizedLabel)
    )
  })

  return clean(match?.answer)
}

function sourceLabel(source: AutomationFieldSource): string {
  switch (source) {
    case 'application':
      return 'application'
    case 'profile':
      return 'profile'
    case 'preparation':
      return 'preparation'
    default:
      return 'needs input'
  }
}

function resumeSource(
  profile: ProposalProfile | undefined,
  application: ProposalApplication | undefined,
  preparation: ProposalPreparation | undefined,
): { url?: string; source: AutomationFieldSource } {
  const fromPreparation = clean(preparation?.resumeUrl)
  if (fromPreparation) return { url: fromPreparation, source: 'preparation' }

  const fromApplication = clean(application?.resumeUrl)
  if (fromApplication) return { url: fromApplication, source: 'application' }

  const fromProfile = clean(profile?.resumeUrl)
  if (fromProfile) return { url: fromProfile, source: 'profile' }

  return { source: 'none' }
}

/**
 * Deterministically proposes values for discovered fields.
 *
 * Only explicitly approved preparation content is used. No value is invented
 * when the profile/application/preparation do not contain a safe source.
 */
export function buildFieldProposals(
  input: BuildFieldProposalsInput,
): AutomationFieldProposal[] {
  const { fields, profile, application, preparation } = input
  const nameParts = fullNameParts(profile?.fullName)
  const resume = resumeSource(profile, application, preparation)
  const coverLetter =
    preparation?.coverLetter?.status === 'approved'
      ? clean(preparation.coverLetter.body)
      : ''
  const skills = [...(profile?.skills ?? []), ...(profile?.technologies ?? [])]
    .map((value) => clean(value))
    .filter(Boolean)

  return fields.map((field) => {
    const label = normalizeFieldLabel(field.name)

    if (field.type === 'file') {
      return proposal(
        field,
        resume.url,
        resume.source,
        'manual',
        resume.url
          ? `Suggested ${sourceLabel(resume.source)} resume detected. File upload is manual in item 63.`
          : 'Manual file upload required. No resume URL was found.',
      )
    }

    if (field.inputType === 'radio') {
      return manualProposal(
        field,
        'Radio groups require a manual choice. Automation will not guess.',
      )
    }

    if (field.type === 'checkbox') {
      return manualProposal(
        field,
        'Set and approve this checkbox before filling it.',
      )
    }

    if (field.type === 'select') {
      const locationOption = profile?.preferredLocations?.[0]
        ? selectOption(field, profile.preferredLocations[0])
        : undefined
      if (
        locationOption &&
        includesAny(label, ['location', 'city', 'based', 'where'])
      ) {
        return proposal(field, locationOption, 'profile', 'medium')
      }

      const experienceOption = profile?.experienceLevel
        ? selectOption(field, profile.experienceLevel)
        : undefined
      if (
        experienceOption &&
        includesAny(label, ['experience level', 'seniority', 'years of experience'])
      ) {
        return proposal(field, experienceOption, 'profile', 'medium')
      }

      return manualProposal(field, 'Choose one of the discovered options and approve it.')
    }

    if (field.type !== 'text' && field.type !== 'textarea') {
      return manualProposal(field, 'This field type requires manual input.')
    }

    if (
      includesAny(label, ['first name', 'given name', 'forename']) &&
      isPresent(nameParts.first)
    ) {
      return proposal(field, nameParts.first, 'profile', 'high')
    }

    if (
      includesAny(label, ['last name', 'surname', 'family name']) &&
      isPresent(nameParts.last)
    ) {
      return proposal(field, nameParts.last, 'profile', 'high')
    }

    const looksLikeCompanyOrJob =
      includesAny(label, [
        'company',
        'employer',
        'organization',
        'organisation',
        'job title',
        'position title',
      ]) && !includesAny(label, ['your company', 'current company'])

    if (
      !looksLikeCompanyOrJob &&
      (label === 'name' ||
        label === 'full name' ||
        includesAny(label, [
          'your name',
          'candidate name',
          'applicant name',
          'legal name',
          'full legal name',
        ])) &&
      isPresent(nameParts.full)
    ) {
      return proposal(field, nameParts.full, 'profile', 'high')
    }

    if (includesAny(label, ['email', 'e mail']) && isPresent(profile?.email)) {
      return proposal(field, profile.email, 'profile', 'high')
    }

    if (
      includesAny(label, ['portfolio', 'personal website', 'website url']) &&
      isPresent(profile?.portfolioUrl)
    ) {
      return proposal(field, profile.portfolioUrl, 'profile', 'high')
    }

    if (
      includesAny(label, ['location', 'city', 'based in', 'where are you based']) &&
      isPresent(profile?.preferredLocations?.[0])
    ) {
      return proposal(field, profile.preferredLocations[0], 'profile', 'medium')
    }

    if (
      includesAny(label, ['headline', 'professional title', 'current title', 'current role']) &&
      isPresent(profile?.headline)
    ) {
      return proposal(field, profile.headline, 'profile', 'high')
    }

    if (
      includesAny(label, ['summary', 'about you', 'bio', 'profile summary']) &&
      isPresent(profile?.summary)
    ) {
      return proposal(field, profile.summary, 'profile', 'high')
    }

    if (
      includesAny(label, ['skills', 'technologies', 'technical skills']) &&
      skills.length > 0
    ) {
      return proposal(field, skills.slice(0, 12).join(', '), 'profile', 'medium')
    }

    if (
      includesAny(label, ['experience level', 'seniority']) &&
      isPresent(profile?.experienceLevel)
    ) {
      return proposal(field, profile.experienceLevel, 'profile', 'high')
    }

    if (
      includesAny(label, ['cover letter', 'motivation letter']) &&
      isPresent(coverLetter)
    ) {
      return proposal(field, coverLetter, 'preparation', 'high')
    }

    if (
      includesAny(label, ['resume', 'curriculum vitae', 'cv']) &&
      isPresent(resume.url)
    ) {
      return proposal(
        field,
        resume.url,
        resume.source,
        'manual',
        'Resume URL detected, but file upload is manual in item 63.',
      )
    }

    if (
      includesAny(label, ['position applying', 'role applying', 'position for which']) &&
      isPresent(application?.jobTitle)
    ) {
      return proposal(field, application.jobTitle, 'application', 'high')
    }

    const answer = approvedAnswer(preparation, field.name)
    if (isPresent(answer)) {
      return proposal(field, answer, 'preparation', 'high')
    }

    return manualProposal(field, 'Needs your input. Automation will not guess.')
  })
}

/**
 * Validates client-approved values against the server-side inspection.
 * This is the trust boundary for field population.
 */
export function validateApprovedFields(
  fields: AutomationFieldDescriptor[],
  input: unknown,
): ApprovedFieldValidation {
  if (!Array.isArray(input) || input.length === 0) {
    return { ok: false, error: 'Approve at least one field value.' }
  }
  if (input.length > MAX_APPROVED_FIELDS) {
    return {
      ok: false,
      error: `A maximum of ${MAX_APPROVED_FIELDS} fields can be populated at once.`,
    }
  }

  const fieldsByKey = new Map(fields.map((field) => [field.key, field]))
  const seen = new Set<string>()
  const values: ApprovedFieldValue[] = []

  for (const entry of input) {
    if (!entry || typeof entry !== 'object') {
      return { ok: false, error: 'Approved fields must be objects.' }
    }
    const record = entry as Record<string, unknown>
    const fieldKey = typeof record.fieldKey === 'string' ? record.fieldKey.trim() : ''
    if (!fieldKey) {
      return { ok: false, error: 'Every approved field requires a fieldKey.' }
    }
    if (seen.has(fieldKey)) {
      return { ok: false, error: `Field "${fieldKey}" was approved more than once.` }
    }
    seen.add(fieldKey)

    const field = fieldsByKey.get(fieldKey)
    if (!field) {
      return {
        ok: false,
        error: 'One or more approved fields was not discovered during inspection.',
      }
    }
    if (field.inputType === 'radio') {
      return {
        ok: false,
        error: `Field "${field.name}" is a radio group and requires manual selection.`,
      }
    }

    if (field.type === 'text' || field.type === 'textarea') {
      if (typeof record.value !== 'string') {
        return { ok: false, error: `Field "${field.name}" requires a text value.` }
      }
      const value = record.value.trim()
      if (!value) {
        return { ok: false, error: `Field "${field.name}" cannot be empty.` }
      }
      if (value.length > MAX_TEXT_VALUE_LENGTH) {
        return {
          ok: false,
          error: `Field "${field.name}" exceeds ${MAX_TEXT_VALUE_LENGTH} characters.`,
        }
      }
      values.push({ fieldKey, value })
      continue
    }

    if (field.type === 'select') {
      if (typeof record.value !== 'string' || !record.value.trim()) {
        return { ok: false, error: `Field "${field.name}" requires an option.` }
      }
      if (!field.options?.length) {
        return {
          ok: false,
          error: `Field "${field.name}" has no discovered options to validate against.`,
        }
      }
      const match = selectOption(field, record.value)
      if (!match) {
        return {
          ok: false,
          error: `Field "${field.name}" must use one of its discovered options.`,
        }
      }
      values.push({ fieldKey, value: match })
      continue
    }

    if (field.type === 'checkbox') {
      if (typeof record.value !== 'boolean') {
        return {
          ok: false,
          error: `Field "${field.name}" requires a checkbox value.`,
        }
      }
      values.push({ fieldKey, value: record.value })
      continue
    }

    return {
      ok: false,
      error: `Field "${field.name}" requires manual handling and cannot be populated.`,
    }
  }

  return { ok: true, values }
}
