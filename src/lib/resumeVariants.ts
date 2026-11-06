import { normalizeResumeUrl } from '@/lib/resume'
import { buildSearchTokens } from '@/lib/searchTokens'
import type { ResumeVariantInput } from '@/types/resumeVariants'

export function parseCommaList(value: string): string[] {
  return uniqueList(value.split(','))
}

export function formatCommaList(values: string[]): string {
  return values.join(', ')
}

/** Searchable fields only; notes stay unindexed. */
export function resumeVariantSearchTokens(
  input: Pick<ResumeVariantInput, 'name' | 'targetRoles' | 'technologies'>,
): string[] {
  return buildSearchTokens(input.name, input.targetRoles, input.technologies)
}

function uniqueList(values: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []
  for (const value of values) {
    const trimmed = value.trim()
    if (!trimmed) continue
    const key = trimmed.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    result.push(trimmed)
  }
  return result
}

/**
 * Validates and normalizes a variant before it is written. Throws with a
 * user-facing message so the form can display the failure.
 */
export function cleanResumeVariantInput(input: ResumeVariantInput): ResumeVariantInput {
  const name = input.name.trim()
  if (!name) {
    throw new Error('Variant name is required.')
  }
  if (name.length > 80) {
    throw new Error('Variant name must be 80 characters or fewer.')
  }

  const resumeUrl = normalizeResumeUrl(input.resumeUrl)
  if (!resumeUrl) {
    throw new Error('Enter a valid resume URL.')
  }

  return {
    name,
    resumeUrl,
    targetRoles: uniqueList(input.targetRoles),
    technologies: uniqueList(input.technologies),
    notes: input.notes.trim(),
    isDefault: input.isDefault,
  }
}
