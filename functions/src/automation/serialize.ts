/**
 * Firestore rejects `undefined` anywhere in a document value, including inside
 * nested objects and arrays. Provider inspection data is naturally sparse, so
 * remove undefined keys before every write.
 */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((entry) => entry !== undefined)
      .map((entry) => stripUndefined(entry)) as T
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, stripUndefined(entry)])
    return Object.fromEntries(entries) as T
  }

  return value
}
