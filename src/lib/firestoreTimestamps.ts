import { Timestamp } from 'firebase/firestore'

/** Safely normalize Firestore timestamps, ISO strings, dates, and millis. */
export function toFirestoreTimestamp(
  value: unknown,
  fallback: Timestamp = Timestamp.fromMillis(0),
): Timestamp {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const candidate = value as { toMillis?: () => number }
    if (typeof candidate.toMillis === 'function') {
      const millis = candidate.toMillis()
      if (Number.isFinite(millis)) return Timestamp.fromMillis(millis)
    }
  }
  if (typeof value === 'string') {
    const millis = Date.parse(value)
    if (Number.isFinite(millis)) return Timestamp.fromMillis(millis)
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Timestamp.fromMillis(value)
  }
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return Timestamp.fromDate(value)
  }
  return fallback
}

export function timestampToMillis(value: unknown): number | null {
  if (value && typeof value === 'object' && 'toMillis' in value) {
    const candidate = value as { toMillis?: () => number }
    if (typeof candidate.toMillis === 'function') {
      const millis = candidate.toMillis()
      return Number.isFinite(millis) ? millis : null
    }
  }
  if (typeof value === 'string') {
    const millis = Date.parse(value)
    return Number.isFinite(millis) ? millis : null
  }
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (value instanceof Date && Number.isFinite(value.getTime())) return value.getTime()
  return null
}
