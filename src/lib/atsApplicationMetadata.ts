import type {
  AtsApplicationField,
  AtsApplicationFieldType,
  AtsApplicationMetadata,
  JobSource,
} from '@/types/jobs'

const FIELD_TYPES = new Set<AtsApplicationFieldType>([
  'text',
  'textarea',
  'select',
  'file',
  'checkbox',
  'unknown',
])

function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value : undefined
}

function stringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const items = value.filter(
    (item): item is string => typeof item === 'string' && Boolean(item.trim()),
  )
  return items.length ? items : undefined
}

function formFields(value: unknown): AtsApplicationField[] | undefined {
  if (!Array.isArray(value)) return undefined
  const fields = value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return []
    const record = entry as Record<string, unknown>
    const name = asString(record.name)
    if (!name) return []
    const type = FIELD_TYPES.has(record.type as AtsApplicationFieldType)
      ? (record.type as AtsApplicationFieldType)
      : undefined
    return [
      {
        name,
        required: record.required === true ? true : undefined,
        type,
        options: stringArray(record.options),
      },
    ]
  })
  return fields.length ? fields : undefined
}

export function normalizeAtsMetadata(
  value: unknown,
  fallback: {
    source: JobSource
    sourceJobId?: string
    applicationUrl: string
  },
): AtsApplicationMetadata {
  const record =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  const applicationUrl =
    asString(record.applicationUrl) ?? fallback.applicationUrl
  const completeness =
    record.completeness === 'complete' ||
    record.completeness === 'partial' ||
    record.completeness === 'unknown'
      ? record.completeness
      : applicationUrl
        ? 'partial'
        : 'unknown'

  return {
    source:
      typeof record.source === 'string'
        ? (record.source as JobSource)
        : fallback.source,
    sourceJobId:
      asString(record.sourceJobId) ?? fallback.sourceJobId ?? '',
    applicationUrl,
    requiresResume:
      typeof record.requiresResume === 'boolean'
        ? record.requiresResume
        : undefined,
    requiresCoverLetter:
      typeof record.requiresCoverLetter === 'boolean'
        ? record.requiresCoverLetter
        : undefined,
    formFields: formFields(record.formFields),
    questions: stringArray(record.questions),
    completeness,
  }
}

export function requirementLabel(value: boolean | undefined): string {
  if (value === true) return 'Required'
  if (value === false) return 'Not required'
  return 'Not exposed by source'
}

export function completenessLabel(
  value: AtsApplicationMetadata['completeness'],
): string {
  if (value === 'complete') return 'Complete'
  if (value === 'partial') return 'Partial — listing data only'
  return 'Unknown'
}
