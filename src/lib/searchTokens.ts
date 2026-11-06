/**
 * Lowercase, strip punctuation, and collapse whitespace.
 * Kept in sync with `functions/src/utils/normalizeJob.ts`.
 */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ')
}

/** Build a bounded token set for Firestore `array-contains-any` search. */
export function buildSearchTokens(
  ...parts: Array<string | string[] | undefined>
): string[] {
  const tokens = new Set<string>()
  for (const part of parts) {
    if (!part) continue
    const values = Array.isArray(part) ? part : [part]
    for (const value of values) {
      for (const token of normalizeSearchText(value).split(' ')) {
        if (token.length >= 2) tokens.add(token)
      }
    }
  }
  return Array.from(tokens).slice(0, 100)
}

/** Reduce user input to the at-most-10 tokens accepted by an array query. */
export function searchTokensForQuery(search?: string): string[] {
  return buildSearchTokens(search ?? '').slice(0, 10)
}
