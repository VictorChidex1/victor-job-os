import { describe, expect, it } from 'vitest'
import { Timestamp } from 'firebase/firestore'
import {
  timestampToMillis,
  toFirestoreTimestamp,
} from '@/lib/firestoreTimestamps'

describe('Firestore timestamp compatibility', () => {
  it('converts legacy ISO strings to Timestamps', () => {
    const value = toFirestoreTimestamp('2026-11-08T01:17:31.015Z')
    expect(value).toBeInstanceOf(Timestamp)
    expect(value.toMillis()).toBe(Date.parse('2026-11-08T01:17:31.015Z'))
  })

  it('reads millis from Timestamp, string, and number values', () => {
    const millis = Date.parse('2026-11-08T01:17:31.015Z')
    const timestamp = Timestamp.fromMillis(millis)
    expect(timestampToMillis(timestamp)).toBe(millis)
    expect(timestampToMillis('2026-11-08T01:17:31.015Z')).toBe(millis)
    expect(timestampToMillis(millis)).toBe(millis)
    expect(timestampToMillis('not-a-date')).toBeNull()
  })
})
