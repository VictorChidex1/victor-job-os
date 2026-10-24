import { createHash } from 'node:crypto'
import { buildSearchTokens, normalizeText } from './normalizeJob.js'

/** Deterministic company document id, stable across discovery and research. */
export function companyDocId(uid: string, name: string): string {
  return createHash('sha256')
    .update(`${uid}|${normalizeText(name)}`)
    .digest('hex')
    .slice(0, 24)
}

export function companySearchTokens(
  name: string,
  industry?: string | null,
  location?: string | null,
): string[] {
  return buildSearchTokens(name, industry ?? undefined, location ?? undefined)
}
